const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');

const router = express.Router();
const EARTH_RADIUS_KM = 6371;
const LOCATION_QUERY_PATTERN =
  /\b(near me|nearby|nearest|closest|distance|directions?|around me|open now)\b/i;

const toRad = (value) => (value * Math.PI) / 180;

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeCoordinate = (value, min, max) => {
  if (value === '' || value === null || typeof value === 'undefined') {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max
    ? coordinate
    : null;
};

const hasValidCoordinates = (pharmacy) => {
  const latitude = Number(pharmacy.lat);
  const longitude = Number(pharmacy.lng);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  );
};

const rankPharmacies = (pharmacies, latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return pharmacies;
  }

  return [...pharmacies].sort(
    (a, b) =>
      haversineKm(latitude, longitude, Number(a.lat), Number(a.lng)) -
      haversineKm(latitude, longitude, Number(b.lat), Number(b.lng)),
  );
};

const parseTimeToMinutes = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }

  const time = timeString.trim();
  const twentyFourHour = time.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]);
  }

  const twelveHour = time.match(
    /^(\d{1,2})(?:[.:](\d{2}))?\s*(AM|PM)?$/i,
  );
  if (!twelveHour) {
    return null;
  }

  let hour = Number(twelveHour[1]);
  const minute = Number(twelveHour[2] || 0);
  const period = twelveHour[3]?.toLowerCase();
  if (period === 'pm' && hour !== 12) {
    hour += 12;
  }
  if (period === 'am' && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minute;
};

const getSriLankaMinutesNow = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  return hour * 60 + minute;
};

const isPharmacyOpen = (openText) => {
  if (!openText || typeof openText !== 'string') {
    return false;
  }

  const normalized = openText.trim().toLowerCase();
  if (
    normalized.includes('24/7') ||
    normalized.includes('open 24') ||
    normalized === '24 hours'
  ) {
    return true;
  }

  const range = openText.match(
    /([\d:.\sAPMapm]+)\s*(?:-|–|—|to)\s*([\d:.\sAPMapm]+)/i,
  );
  if (!range) {
    return false;
  }

  const start = parseTimeToMinutes(range[1]);
  const end = parseTimeToMinutes(range[2]);
  if (start === null || end === null) {
    return false;
  }

  const current = getSriLankaMinutesNow();
  return start <= end
    ? current >= start && current <= end
    : current >= start || current <= end;
};

const enrichWithGooglePlace = async (pharmacy, latitude, longitude) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return pharmacy;
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const keyword = encodeURIComponent(
      `${pharmacy.name} ${pharmacy.location || ''}`,
    );
    const nearbyUrl =
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json' +
      `?location=${latitude},${longitude}&radius=25000&type=pharmacy` +
      `&keyword=${keyword}&key=${apiKey}`;
    const nearbyResponse = await fetch(nearbyUrl);
    const nearbyData = await nearbyResponse.json();
    const place = nearbyData.results?.[0];

    if (!place?.place_id) {
      return pharmacy;
    }

    const detailsUrl =
      'https://maps.googleapis.com/maps/api/place/details/json' +
      `?place_id=${place.place_id}` +
      '&fields=name,formatted_address,formatted_phone_number,opening_hours,website,rating' +
      `&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const details = (await detailsResponse.json())?.result;

    return details
      ? {
          ...pharmacy,
          google: {
            placeId: place.place_id,
            name: details.name,
            address: details.formatted_address,
            phone: details.formatted_phone_number,
            website: details.website,
            rating: details.rating,
            openingHours: details.opening_hours || null,
          },
        }
      : pharmacy;
  } catch (error) {
    return pharmacy;
  }
};

const buildContext = async (latitude, longitude) => {
  const [pharmacies, medicines] = await Promise.all([
    Pharmacy.find({
      $or: [
        { approvalStatus: 'approved' },
        { approvalStatus: { $exists: false } },
      ],
    }).lean(),
    Medicine.find().lean(),
  ]);

  const rankedPharmacies = rankPharmacies(
    pharmacies.filter(hasValidCoordinates),
    latitude,
    longitude,
  );

  let pharmacyContext = rankedPharmacies.map((pharmacy) => ({
    name: pharmacy.name,
    location: pharmacy.location,
    open: pharmacy.open,
    openNow: isPharmacyOpen(pharmacy.open),
    tel: pharmacy.tel,
    lat: Number(pharmacy.lat),
    lng: Number(pharmacy.lng),
    distanceKm:
      typeof latitude === 'number' && typeof longitude === 'number'
        ? Number(
            haversineKm(
              latitude,
              longitude,
              Number(pharmacy.lat),
              Number(pharmacy.lng),
            ).toFixed(2),
          )
        : null,
  }));

  if (
    process.env.GOOGLE_MAPS_API_KEY &&
    typeof latitude === 'number' &&
    typeof longitude === 'number'
  ) {
    const enrichedNearest = await Promise.all(
      pharmacyContext
        .slice(0, 5)
        .map((pharmacy) =>
          enrichWithGooglePlace(pharmacy, latitude, longitude),
        ),
    );
    pharmacyContext = [
      ...enrichedNearest,
      ...pharmacyContext.slice(enrichedNearest.length),
    ];
  }

  return {
    pharmacies: pharmacyContext,
    medicines: medicines.map((medicine) => ({
      name: medicine.name,
      pharmacyName: medicine.pharmacyName,
      category: medicine.category,
      price: medicine.price,
      available: medicine.available,
      quantity: medicine.quantity,
    })),
  };
};

const MEDICINE_FORM_WORDS = new Set([
  'tablet',
  'tablets',
  'capsule',
  'capsules',
  'cream',
  'drops',
  'gel',
  'inhaler',
  'injection',
  'ointment',
  'solution',
  'spray',
  'suspension',
]);

const medicineMatchesQuery = (medicineName, query) => {
  const queryWords = new Set(
    String(query || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
  const medicineWords = String(medicineName || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(
      (word) =>
        word.length >= 3 &&
        !MEDICINE_FORM_WORDS.has(word) &&
        !/^\d/.test(word),
    );

  return medicineWords.some((word) => queryWords.has(word));
};

const buildNearbyAnswer = (query, context) => {
  const pharmacyByName = new Map(
    context.pharmacies.map((pharmacy) => [pharmacy.name, pharmacy]),
  );
  const matchingMedicines = context.medicines
    .filter(
      (medicine) =>
        medicine.available &&
        Number(medicine.quantity || 0) > 0 &&
        medicineMatchesQuery(medicine.name, query),
    )
    .map((medicine) => ({
      ...medicine,
      pharmacy: pharmacyByName.get(medicine.pharmacyName),
    }))
    .filter((medicine) => Number.isFinite(medicine.pharmacy?.distanceKm))
    .sort((a, b) => a.pharmacy.distanceKm - b.pharmacy.distanceKm)
    .slice(0, 5);

  if (matchingMedicines.length > 0) {
    const medicineName = matchingMedicines[0].name;
    const lines = matchingMedicines.map(
      (medicine, index) =>
        `${index + 1}. ${medicine.pharmacy.name} — ${medicine.pharmacy.distanceKm.toFixed(2)} km — ${medicine.pharmacy.location} — ${medicine.price}`,
    );
    return `Nearest pharmacies with ${medicineName} in stock:\n${lines.join('\n')}`;
  }

  const onlyOpen = /\bopen(?:\s+now)?\b/i.test(query);
  const nearby = context.pharmacies
    .filter(
      (pharmacy) =>
        Number.isFinite(pharmacy.distanceKm) &&
        (!onlyOpen || pharmacy.openNow),
    )
    .slice(0, 5);

  if (nearby.length === 0) {
    return onlyOpen
      ? 'No currently open approved pharmacies with valid map coordinates were found near your location.'
      : 'No approved pharmacies with valid map coordinates were found.';
  }

  const heading = onlyOpen
    ? 'Nearest pharmacies currently open:'
    : 'Nearest pharmacies to your current location:';
  const lines = nearby.map(
    (pharmacy, index) =>
      `${index + 1}. ${pharmacy.name} — ${pharmacy.distanceKm.toFixed(2)} km — ${pharmacy.location}${pharmacy.open ? ` — ${pharmacy.open}` : ''}`,
  );

  return `${heading}\n${lines.join('\n')}`;
};

const systemInstruction = `You are MedFinder AI assistant.
Answer only with data from the provided pharmacy and medicine context.
If information is missing, say that clearly and ask a short follow-up question.
For availability questions, prefer medicines where available=true and quantity>0.
For nearest pharmacy questions, prioritize the smallest numeric distanceKm.
Keep responses concise and customer-friendly.`;

const readDifyStreamingResponse = async (response) => {
  if (!response.body) {
    return { answer: '', conversationId: null };
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = '';
  let answer = '';
  let conversationId = null;

  const consumeEvent = (eventText) => {
    const dataLines = eventText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());

    if (dataLines.length === 0) {
      return;
    }

    const rawPayload = dataLines.join('\n');
    if (!rawPayload || rawPayload === '[DONE]') {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawPayload);
    } catch (error) {
      return;
    }

    if (payload?.conversation_id) {
      conversationId = payload.conversation_id;
    }
    if (payload?.event === 'error') {
      throw new Error(payload?.message || 'AI request failed.');
    }
    if (typeof payload?.answer === 'string') {
      answer += payload.answer;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex !== -1) {
      consumeEvent(buffer.slice(0, separatorIndex));
      buffer = buffer.slice(separatorIndex + 2);
      separatorIndex = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) {
    consumeEvent(buffer);
  }

  return {
    answer: answer.trim(),
    conversationId,
  };
};

router.post('/ask', async (req, res) => {
  try {
    const { query, latitude, longitude, conversationId } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Query is required.' });
    }

    const normalizedLatitude = normalizeCoordinate(latitude, -90, 90);
    const normalizedLongitude = normalizeCoordinate(longitude, -180, 180);
    const hasLocation =
      normalizedLatitude !== null && normalizedLongitude !== null;
    const needsLocation = LOCATION_QUERY_PATTERN.test(query);

    if (needsLocation && !hasLocation) {
      return res.status(400).json({
        message:
          'Your current location is required for a nearby pharmacy search. Allow location access and try again.',
      });
    }

    const context = await buildContext(
      hasLocation ? normalizedLatitude : null,
      hasLocation ? normalizedLongitude : null,
    );

    if (needsLocation) {
      return res.json({
        answer: buildNearbyAnswer(query, context),
        conversationId: null,
        locationUsed: {
          latitude: normalizedLatitude,
          longitude: normalizedLongitude,
        },
        nearbyPharmacies: context.pharmacies.slice(0, 5),
        contextCount: {
          pharmacies: context.pharmacies.length,
          medicines: context.medicines.length,
        },
      });
    }

    if (!process.env.DIFY_API_KEY) {
      return res.status(500).json({
        message: 'DIFY_API_KEY is not configured on the server.',
      });
    }

    const difyApiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';
    const difyResponse = await fetch(`${difyApiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          app_context: JSON.stringify(context),
          system_instruction: systemInstruction,
        },
        query,
        response_mode: 'streaming',
        conversation_id: conversationId || undefined,
        user: 'medfinder-web',
      }),
    });

    if (!difyResponse.ok) {
      let errorMessage = 'AI request failed.';
      try {
        const errorBody = await difyResponse.json();
        if (errorBody?.message) {
          errorMessage = errorBody.message;
        }
      } catch (error) {
        // Return the default upstream error message.
      }

      return res.status(502).json({ message: errorMessage });
    }

    const data = await readDifyStreamingResponse(difyResponse);
    return res.json({
      answer: data.answer || 'No response available.',
      conversationId: data.conversationId || null,
      contextCount: {
        pharmacies: context.pharmacies.length,
        medicines: context.medicines.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to process AI request.' });
  }
});

module.exports = router;
module.exports._test = {
  buildNearbyAnswer,
  haversineKm,
  normalizeCoordinate,
};
