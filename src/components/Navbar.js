import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, UserCircle2, X } from 'lucide-react';

// Active / inactive styling for nav links
const navLinkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm font-semibold transition whitespace-nowrap
   ${isActive
     ? 'bg-emerald-600 text-white shadow-sm'
     : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`;

export default function Navbar({ authUser, onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const loginMenuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Scroll-shrink effect (like Niko template at 150px)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!loginMenuRef.current?.contains(e.target)) return;
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    navigate(q ? `/search?query=${encodeURIComponent(q)}` : '/search');
    setSearchTerm('');
  };

  const isPatient = authUser?.role === 'user';
  const isStaff   = authUser?.role === 'admin' || authUser?.role === 'pharmacy';

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? 'border-slate-200/80 bg-white shadow-lg shadow-slate-100/80'
          : 'border-white/60 bg-white/90'
      }`}
    >
      <div className={`mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>

        {/* ── Logo ── */}
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-200">
            <img src="/medfinder_logo.png" alt="MedFinder logo" className="h-16 w-16 max-w-none object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600">Medical Finder</p>
            <h1 className="text-xl font-black text-slate-900">MedFinder</h1>
          </div>
        </Link>

        {/* ── Search bar — visible only at xl+ ── */}
        <form onSubmit={handleSearch} className="hidden flex-1 xl:flex">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search medicines, pharmacies…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </form>

        {/* ── Desktop nav — visible at lg+ ── */}
        <nav className="ml-auto hidden items-center gap-0.5 lg:flex">

          {/* Search icon button — visible lg only (xl has the search form above) */}
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 xl:hidden"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <NavLink to="/search"      className={navLinkClass}>Search</NavLink>
          <NavLink to="/pharmacies"  className={navLinkClass}>Pharmacy</NavLink>

          {/* Show About + Contact only at xl (enough room) */}
          <span className="hidden xl:contents">
            <NavLink to="/about"   className={navLinkClass}>About</NavLink>
          </span>

          <NavLink to="/how-it-works" className={navLinkClass}>How It Works</NavLink>

          <span className="hidden xl:contents">
            <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
          </span>

          <NavLink to="/assistant"   className={navLinkClass}>AI Assistant</NavLink>

          {isPatient && (
            <NavLink to="/patient/dashboard" className={navLinkClass}>Dashboard</NavLink>
          )}

          {/* ── Auth area ── */}
          {isPatient || isStaff ? (
            <div className="ml-2 flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                <UserCircle2 size={15} className="shrink-0 text-emerald-700" />
                <span className="hidden xl:inline">
                  {authUser?.name || authUser?.email || (isPatient ? 'Patient' : 'Staff')}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                <LogOut size={14} />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div ref={loginMenuRef} className="ml-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Patient Login
              </Link>
            </div>
          )}
        </nav>

        {/* ── Mobile toggle (hamburger + search icon) — hidden at lg+ ── */}
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg sm:px-6 lg:hidden">
          {/* Inline search */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medicines, pharmacies…"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </form>

          <div className="grid gap-2">
            {[
              { to: '/',                label: 'Home' },
              { to: '/search',          label: 'Search' },
              { to: '/pharmacies',      label: 'Pharmacy' },
              { to: '/about',           label: 'About' },
              { to: '/how-it-works',    label: 'How It Works' },
              { to: '/contact',         label: 'Contact Us' },
              { to: '/assistant',       label: 'AI Assistant' },
            ].map(({ to, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>{label}</NavLink>
            ))}
            {isPatient && (
              <NavLink to="/patient/dashboard" className={navLinkClass}>Dashboard</NavLink>
            )}

            {/* Auth section */}
            {isPatient || isStaff ? (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <UserCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      {isPatient ? 'Logged in' : 'Staff session'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {authUser?.name || authUser?.email || (isPatient ? 'Patient' : 'Staff')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Account</p>
                <Link
                  to="/login"
                  className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-white hover:text-emerald-700"
                >
                  Patient Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
