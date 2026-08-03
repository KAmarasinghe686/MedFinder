import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, Navigation, Phone, XCircle } from 'lucide-react';
import { calculateDistanceKm, slugify } from '../utils';

// ── Same helpers as PharmaciesPage ────────────────────────────────────────────

const parseTimeMins = (s) => {
  if (!s) return null;
  const t = s.trim();
  let m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return +m[1] * 60 + +m[2];
  m = t.match(/^(\d{1,2})(?:[.:](\d{2}))?\s*(AM|PM|am|pm)?$/i);
  if (!m) return null;
  let h = +m[1];
  const min = +(m[2] || 0);
  const ampm = (m[3] || '').toLowerCase();
  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return h * 60 + min;
};

const getOpenStatus = (openText) => {
  if (!openText) return null;
  const raw = openText.toLowerCase().trim();
  if (raw.includes('24') || raw.includes('always')) return true;
  const match = openText.match(/([\d:.\sAPMapm]+)\s*[-–—to]{1,3}\s*([\d:.\sAPMapm]+)/i);
  if (!match) return null;
  const start = parseTimeMins(match[1]);
  const end   = parseTimeMins(match[2]);
  if (start === null || end === null) return null;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PharmacyDetailPage({ medicines, pharmacies }) {
  const { slug } = useParams();
  const pharmacy = pharmacies.find((item) => slugify(item.name) === slug);

  const [userLoc,    setUserLoc]    = useState(null);
  const [locStatus,  setLocStatus]  = useState('idle');

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('ok');
      },
      () => setLocStatus('denied'),
      { timeout: 8000, maximumAge: 120000 },
    );
  }, []);

  if (!pharmacy) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-3xl font-black text-slate-900">Pharmacy Not Found</h2>
        <Link to="/pharmacies" className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
          Back to Directory
        </Link>
      </section>
    );
  }

  const realDist    = userLoc ? calculateDistanceKm(userLoc, { lat: pharmacy.lat, lng: pharmacy.lng }) : null;
  const distLabel   = realDist !== null
    ? (realDist < 1 ? `${Math.round(realDist * 1000)} m away` : `${realDist.toFixed(1)} km away`)
    : null;
  const openStatus  = getOpenStatus(pharmacy.open);
  const inventory   = medicines.filter((item) => item.pharmacy === pharmacy.name || item.pharmacyName === pharmacy.name);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pharmacy.lat + ',' + pharmacy.lng)}&travelmode=driving`;

  const openBadge = openStatus === true  ? { label: 'Open Now', cls: 'bg-emerald-500 text-white' }
                  : openStatus === false ? { label: 'Closed',   cls: 'bg-red-500 text-white' }
                  : { label: 'Hours N/A', cls: 'bg-slate-600 text-white' };

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <Link to="/pharmacies" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
        ← Back to Directory
      </Link>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-100">

        {/* Hero image */}
        <div className="relative overflow-hidden">
          <img src={pharmacy.image} alt={pharmacy.name} className="h-64 w-full object-cover" />
          <span className={`absolute right-4 top-4 rounded-full px-4 py-1.5 text-sm font-black shadow-lg ${openBadge.cls}`}>
            {openBadge.label}
          </span>
          {distLabel && (
            <span className="absolute left-4 top-4 rounded-full bg-slate-900/75 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
              {distLabel}
            </span>
          )}
          {locStatus === 'loading' && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
              <Loader2 size={13} className="animate-spin" /> Locating…
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid gap-6 border-b border-slate-100 p-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Name + address */}
          <div>
            <h2 className="text-3xl font-black text-slate-900">{pharmacy.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={15} className="shrink-0 text-slate-400" />
              {pharmacy.location}
            </p>

            {/* Location status */}
            {locStatus === 'ok' && distLabel && (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={14} /> {distLabel} from your location
              </p>
            )}
            {locStatus === 'denied' && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-600">
                <XCircle size={13} /> Enable location to see distance
              </p>
            )}
          </div>

          {/* Hours */}
          <div className="flex flex-col gap-1">
            {pharmacy.days && (
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <CalendarDays size={15} className="shrink-0 text-slate-400" />
                {pharmacy.days}
              </p>
            )}
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <Clock3 size={15} className="shrink-0 text-slate-400" />
              {pharmacy.open || 'Hours not listed'}
            </p>
          </div>

          {/* Contact + directions */}
          <div className="flex flex-col gap-3">
            {pharmacy.tel && (
              <a href={`tel:${pharmacy.tel}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                <Phone size={15} className="shrink-0 text-slate-400" /> {pharmacy.tel}
              </a>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 w-fit"
            >
              <Navigation size={15} /> Get Directions
            </a>
          </div>
        </div>

        {/* Inventory */}
        <div className="p-8">
          <h3 className="text-2xl font-black text-slate-900">Store Inventory</h3>
          {inventory.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No medicines listed for this pharmacy yet.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {inventory.map((med) => (
                <div key={med.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900">{med.name}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">{med.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{med.price}</p>
                    <p className={`text-xs font-bold ${med.available ? 'text-emerald-600' : 'text-red-500'}`}>
                      {med.available ? 'AVAILABLE' : 'OUT OF STOCK'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
