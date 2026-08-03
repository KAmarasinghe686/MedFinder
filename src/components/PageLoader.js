import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [phase, setPhase] = useState('visible'); // visible → fading → gone

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fading'), 1300);
    const t2 = setTimeout(() => setPhase('gone'),   1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950"
      style={{
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
        pointerEvents: phase === 'fading' ? 'none' : 'all',
      }}
    >
      {/* Pulsing ring */}
      <div className="relative flex items-center justify-center">
        <span
          className="absolute inline-block rounded-full bg-emerald-500/20"
          style={{ width: 88, height: 88, animation: 'loaderRing 1.4s ease-out infinite' }}
        />
        <span
          className="absolute inline-block rounded-full bg-emerald-500/10"
          style={{ width: 112, height: 112, animation: 'loaderRing 1.4s ease-out 0.3s infinite' }}
        />

        {/* Logo card */}
        <div
          className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-xl shadow-emerald-500/40"
          style={{ animation: 'loaderBounce 1s ease-in-out infinite alternate' }}
        >
          <img src="/medfinder_logo.png" alt="MedFinder" className="h-10 w-10 object-contain" />
        </div>
      </div>

      {/* Brand text */}
      <p
        className="mt-7 text-sm font-black uppercase tracking-[0.35em] text-white"
        style={{ animation: 'loaderFade 0.8s ease-out both' }}
      >
        MedFinder
      </p>
      <p
        className="mt-1 text-xs tracking-widest text-slate-500"
        style={{ animation: 'loaderFade 0.8s 0.2s ease-out both' }}
      >
        Your medicine, found faster
      </p>

      {/* Progress bar */}
      <div className="mt-8 h-0.5 w-32 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
          style={{ animation: 'loaderBar 1.2s ease-out forwards' }}
        />
      </div>

      {/* Keyframes injected inline so they don't depend on index.css load order */}
      <style>{`
        @keyframes loaderRing {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes loaderBounce {
          from { transform: translateY(0px); }
          to   { transform: translateY(-6px); }
        }
        @keyframes loaderFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loaderBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
