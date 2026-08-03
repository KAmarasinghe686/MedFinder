import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, Loader2, MapPin, Navigation, Phone, ToggleLeft, ToggleRight, XCircle } from 'lucide-react';
import { calculateDistanceKm, slugify } from '../utils';

// ── Open-status helpers (mirrors backend logic) ───────────────────────────────

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

// Returns true (open), false (closed), null (unknown)
const getOpenStatus = (openText) => {
  if (!openText) return null;
  const raw = openText.toLowerCase().trim();
  if (raw.includes('24') || raw.includes('always')) return true;
  const match = openText.match(/([\d:.\sAPMapm]+)\s*[-–—to]{1,3}\s*([\d:.\sAPMapm]+)/i);
  if (!match) return null;
  const start = parseTimeMins(match[1]);
  const end = parseTimeMins(match[2]);
  if (start === null || end === null) return null;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end;
};

const fmtDist = (km) => {
  if (km === null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

// ── Hook: browser geolocation ─────────────────────────────────────────────────

function useUserLocation() {
  const [loc, setLoc]       = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ok | denied
  const [error, setError]   = useState('');

  const request = () => {
    if (!navigator.geolocation) {
      setStatus('denied');
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('ok');
        setError('');
      },
      () => {
        setStatus('denied');
        setError('Location access was denied. Enable it in your browser to see real distances.');
      },
      { timeout: 10000, maximumAge: 120000 },
    );
  };

  // Auto-request on first render
  useEffect(() => { request(); }, []); // eslint-disable-line

  return { loc, status, error, request };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PharmaciesPage({ pharmacies, maxDistance, setMaxDistance }) {
  const { loc, status, error, request } = useUserLocation();
  const [openOnly, setOpenOnly] = useState(false);

  // Enrich each pharmacy with real distance + open status
  const enriched = useMemo(() => {
    return pharmacies.map((shop) => ({
      ...shop,
      realDist: loc ? calculateDistanceKm(loc, { lat: shop.lat, lng: shop.lng }) : null,
      openStatus: getOpenStatus(shop.open),
    }));
  }, [pharmacies, loc]);

  // Filter + sort
  const visible = useMemo(() => {
    let list = enriched;

    if (openOnly) list = list.filter((s) => s.openStatus === true);

    const maxKm = parseFloat(maxDistance);
    if (isFinite(maxKm) && loc) list = list.filter((s) => s.realDist !== null && s.realDist <= maxKm);

    // Sort: closest first when we have location, otherwise preserve DB order
    if (loc) list = [...list].sort((a, b) => (a.realDist ?? 999) - (b.realDist ?? 999));

    return list;
  }, [enriched, openOnly, maxDistance, loc]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-14">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900">Pharmacy Directory</h2>
          <p className="mt-1 text-slate-600">
            {pharmacies.length} partner {pharmacies.length === 1 ? 'pharmacy' : 'pharmacies'} across Sri Lanka — live open status, real distances.
          </p>
        </div>

        {/* Locate button */}
        <button
          type="button"
          onClick={request}
          disabled={status === 'loading'}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
        >
          {status === 'loading'
            ? <><Loader2 size={15} className="animate-spin" /> Locating…</>
            : <><Navigation size={15} /> {status === 'ok' ? 'Re-locate Me' : 'Use My Location'}</>}
        </button>
      </div>

      {/* ── Location status banner ── */}
      {status === 'ok' && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={15} className="shrink-0" />
          Location found — distances are accurate and sorted nearest first.
        </div>
      )}
      {status === 'denied' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <XCircle size={15} className="shrink-0" />
            {error}
          </div>
          <button type="button" onClick={request} className="font-bold underline">Try again</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="mt-6 flex flex-wrap items-center gap-4">

        {/* Open-now toggle */}
        <button
          type="button"
          onClick={() => setOpenOnly((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
            openOnly
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {openOnly ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          Open Now Only
        </button>

        {/* Distance filter */}
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapPin size={14} className="text-slate-400" />
          Within
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder="—"
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
            disabled={status !== 'ok'}
            className="w-20 rounded-xl border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          />
          km
          {maxDistance && (
            <button type="button" onClick={() => setMaxDistance('')} className="text-xs text-slate-400 hover:text-red-500">✕</button>
          )}
        </label>

        {visible.length !== pharmacies.length && (
          <span className="text-xs text-slate-500">{visible.length} of {pharmacies.length} shown</span>
        )}
      </div>

      {/* ── Cards ── */}
      {visible.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-slate-500">No pharmacies match your current filters.</p>
          <button type="button" onClick={() => { setOpenOnly(false); setMaxDistance(''); }} className="mt-3 text-sm font-bold text-emerald-600 underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {visible.map((shop) => {
            const distLabel  = fmtDist(shop.realDist);
            const openBadge  = shop.openStatus === true ? { label: 'Open Now', cls: 'bg-emerald-500 text-white' }
                             : shop.openStatus === false ? { label: 'Closed',   cls: 'bg-red-500 text-white' }
                             : { label: 'Hours N/A', cls: 'bg-slate-600 text-white' };

            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.lat + ',' + shop.lng)}&travelmode=driving`;

            return (
              <div key={shop.name} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-100 transition hover:shadow-xl">

                {/* Image + badges */}
                <div className="relative overflow-hidden">
                  <img
                    src={shop.image}
                    alt={shop.name}
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  {/* Open/closed badge */}
                  <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-black shadow ${openBadge.cls}`}>
                    {openBadge.label}
                  </span>

                  {/* Distance badge */}
                  {distLabel && (
                    <span className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      {distLabel} away
                    </span>
                  )}
                  {status === 'loading' && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      <Loader2 size={11} className="animate-spin" /> Locating…
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5">
                  <Link to={`/pharmacies/${slugify(shop.name)}`}>
                    <h3 className="text-xl font-black text-slate-900 transition group-hover:text-emerald-700">{shop.name}</h3>
                  </Link>

                  {/* Hours */}
                  <div className="mt-3 flex items-start gap-2 text-sm">
                    <Clock3 size={15} className="mt-0.5 shrink-0 text-slate-400" />
                    <div className="text-slate-600">
                      {shop.days && <p className="font-semibold text-slate-800">{shop.days}</p>}
                      <p>{shop.open || 'Hours not listed'}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={14} className="shrink-0" /> {shop.location}
                  </p>

                  {/* Phone */}
                  {shop.tel && (
                    <a href={`tel:${shop.tel}`} className="mt-1 flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700">
                      <Phone size={14} className="shrink-0" /> {shop.tel}
                    </a>
                  )}

                  {/* CTA row */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/pharmacies/${slugify(shop.name)}`}
                      className="flex-1 rounded-xl bg-slate-900 py-2.5 text-center text-sm font-bold text-white transition hover:bg-slate-700"
                    >
                      View Inventory
                    </Link>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Navigation size={14} /> Directions
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
