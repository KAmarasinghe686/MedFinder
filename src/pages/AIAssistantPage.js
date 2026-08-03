import React, { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { askAssistant } from '../api';
import {
  getCurrentBrowserLocation,
  queryNeedsLocation,
} from '../geolocation';

const STARTER_PROMPTS = [
  'Which pharmacies near me are open now?',
  'Is Paracetamol available near me?',
  'Which pharmacy has Metformin in stock?',
];

const toRad = (value) => (value * Math.PI) / 180;

const distanceKm = (from, to) => {
  const EARTH_RADIUS_KM = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function AIAssistantPage({ pharmacies = [], medicines = [] }) {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  // conversationId removed — each Dify call is independent to prevent token accumulation
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');

  const nearbyPharmacies = useMemo(() => {
    if (!userLocation) {
      return [];
    }

    return pharmacies
      .map((shop) => ({
        ...shop,
        lat: Number(shop.lat),
        lng: Number(shop.lng),
      }))
      .filter(
        (shop) =>
          Number.isFinite(shop.lat) &&
          Number.isFinite(shop.lng) &&
          !(shop.lat === 0 && shop.lng === 0),
      )
      .map((shop) => ({
        ...shop,
        distanceKm: distanceKm(userLocation, { lat: shop.lat, lng: shop.lng }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 4);
  }, [pharmacies, userLocation]);

  const nearbyMedicineSuggestions = useMemo(() => {
    if (!userLocation || nearbyPharmacies.length === 0) {
      return [];
    }

    const nearbyPharmacyNames = new Set(nearbyPharmacies.map((item) => item.name));

    return medicines
      .filter((medicine) => nearbyPharmacyNames.has(medicine.pharmacy) && medicine.available && Number(medicine.quantity || 0) > 0)
      .slice(0, 8);
  }, [medicines, nearbyPharmacies, userLocation]);

  const canSend = useMemo(() => query.trim().length > 0 && !isBusy, [query, isBusy]);

  const mapEmbedUrl = useMemo(() => {
    if (!userLocation) {
      return 'https://www.google.com/maps?output=embed';
    }

    return `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=13&output=embed`;
  }, [userLocation]);

  const getLocation = async () => {
    setLocationStatus('loading');
    setLocationError('');

    try {
      const location = await getCurrentBrowserLocation();
      setUserLocation({
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
      });
      setLocationStatus('ready');
      return location;
    } catch (locationRequestError) {
      setLocationStatus('error');
      setLocationError(locationRequestError.message);
      throw locationRequestError;
    }
  };

  const sendQuery = async (question) => {
    const nextQuery = question.trim();
    if (!nextQuery) {
      return;
    }

    setError('');
    setIsBusy(true);
    setMessages((prev) => [...prev, { role: 'user', content: nextQuery }]);
    setQuery('');

    try {
      let location = userLocation
        ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            accuracy: userLocation.accuracy,
          }
        : {};

      if (!userLocation && queryNeedsLocation(nextQuery)) {
        location = await getLocation();
      }

      const response = await askAssistant({
        query: nextQuery,
        history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        ...location,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response?.answer || 'I could not find a response.',
        },
      ]);
    } catch (requestError) {
      const message = requestError?.message || 'Unable to get a response right now. Please try again.';
      setError(message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: message },
      ]);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendQuery(query);
  };

  const handleUseMyLocation = async () => {
    try {
      await getLocation();
    } catch (error) {
      // The actionable message is displayed in the nearby finder.
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-xl shadow-emerald-100">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.24em]">MedFinder AI</p>
          <h2 className="mt-2 text-3xl font-black">Medicine & Pharmacy Assistant</h2>
          <p className="mt-2 max-w-2xl text-sm text-emerald-100">
            Ask medicine availability and nearby pharmacy questions. Responses are grounded on your current MedFinder database.
          </p>
        </div>

        <div className="px-6 py-6 md:px-8">
          <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Nearby Finder</p>
                <p className="mt-1 text-sm text-slate-700">Use your location to discover nearby pharmacies and available medicines.</p>
              </div>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locationStatus === 'loading'}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800"
              >
                {locationStatus === 'loading' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <MapPin size={14} />
                )}
                {locationStatus === 'loading'
                  ? 'Finding Location...'
                  : userLocation
                    ? 'Refresh My Location'
                    : 'Use My Location'}
              </button>
            </div>

            {locationError && <p className="mt-3 text-sm font-semibold text-red-600">{locationError}</p>}

            {userLocation ? (
              <>
                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} />
                  Location found
                  {userLocation.accuracy
                    ? ` (approximately ${Math.round(userLocation.accuracy)} m accuracy)`
                    : ''}
                </p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <iframe title="Your current location map" src={mapEmbedUrl} className="h-56 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </>
            ) : (
              <div className="mt-4 flex h-40 items-center justify-center rounded-2xl border border-dashed border-cyan-300 bg-white text-center text-sm text-slate-500">
                Allow location access to calculate accurate nearby pharmacy distances.
              </div>
            )}

            {nearbyPharmacies.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {nearbyPharmacies.map((shop) => {
                  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${shop.lat},${shop.lng}&travelmode=driving`;

                  return (
                    <div key={shop.name} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-bold text-slate-900">{shop.name}</p>
                      <p className="text-xs text-slate-500">{shop.location}</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-700">{shop.distanceKm.toFixed(2)} km away</p>
                      <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-cyan-700 underline">
                        Open Directions in Google Maps
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {nearbyMedicineSuggestions.length > 0 && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Nearby Available Medicines</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {nearbyMedicineSuggestions.map((item) => (
                    <span key={`${item.id || item.name}-${item.pharmacy}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.name} - {item.pharmacy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendQuery(prompt)}
                disabled={isBusy}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">
                Start with a question like: <span className="font-semibold">Is Paracetamol available near me?</span>
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === 'user'
                        ? 'ml-auto bg-slate-900 text-white'
                        : 'bg-white text-slate-800 shadow-sm'
                    }`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {message.content}
                  </div>
                ))}
                {isBusy && <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">AI is thinking...</p>}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask about medicine availability or nearby pharmacies"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? 'Sending...' : 'Ask AI'}
            </button>
          </form>

          {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}
