import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <h3 className="text-2xl font-black">MedFinder</h3>
          <p className="mt-4 text-sm text-slate-400">
            Helping patients in Colombo find the right medicine quickly through connected pharmacy inventory.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Explore</p>
          <div className="flex flex-col gap-2 text-sm text-slate-400">
            <Link to="/search" className="hover:text-white">
              Find Medicine
            </Link>
            <Link to="/pharmacies" className="hover:text-white">
              Pharmacy Directory
            </Link>
            <Link to="/contact" className="hover:text-white">
              Contact Team
            </Link>
            <Link
              to="/staff"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-600/40 hover:text-emerald-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Staff Portal
            </Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Support</p>
          <p className="text-sm text-slate-400">info@medfinder.lk</p>
          <p className="text-sm text-slate-400">+94 11 234 5678</p>
        </div>
      </div>
    </footer>
  );
}
