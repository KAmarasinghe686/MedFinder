import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, ClipboardList, HeartPulse, MapPin, Phone, Search, Star, Zap } from 'lucide-react';
import { isValidPhone } from '../utils';
import { createEmergencyOrder } from '../api';
import FadeIn from '../components/FadeIn';

const emptyEmergencyForm = {
  medicineName: '', contactName: '', contactPhone: '',
  deliveryAddress: '', preferredPharmacy: '', notes: '',
};

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search your medicine',
    desc: 'Type the medicine name and instantly see which nearby pharmacies have it in stock — before leaving home.',
    img: 'https://images.theconversation.com/files/593017/original/file-20240508-19-ydah5v.jpg?ixlib=rb-4.1.0&q=45&auto=format&w=754&fit=clip',
    alt: 'Person searching medicine on laptop',
  },
  {
    step: '02',
    title: 'Upload your prescription',
    desc: 'Send a photo of your prescription directly to the pharmacy online. A pharmacist reviews and approves it.',
    img: 'https://zarameds.co.uk/wp-content/uploads/2025/11/Upload-Prescription-4.png',
    alt: 'Pharmacist reviewing prescription',
  },
  {
    step: '03',
    title: 'Collect or get delivered',
    desc: 'Pick up at the pharmacy counter when ready, or arrange home delivery. Track every step in real time.',
    img: 'collectdelivery.png',
    alt: 'Pharmacist handing medicine at counter',
  },
];

const TESTIMONIALS = [
  {
    name: 'Nimali Perera',
    location: 'Colombo',
    text: 'I found my mother\'s heart medication in under 2 minutes. This used to take me half a day of phone calls.',
    stars: 5,
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200',
  },
  {
    name: 'Ruwan Silva',
    location: 'Kandy',
    text: 'The emergency request feature is incredible. A pharmacist called me within 10 minutes. Lifesaving service.',
    stars: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
  {
    name: 'Dilani Fernando',
    location: 'Galle',
    text: 'Uploading a prescription and getting it approved online saved me so much time. Very easy to use.',
    stars: 5,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  },
];

// ── Stats bar with IntersectionObserver ──────────────────────────────────────

const STATS = [
  { target: 20,  suffix: '+', label: 'Partner pharmacies' },
  { target: 500, suffix: '+', label: 'Medicines listed' },
  { target: 10,  suffix: '+', label: 'Cities covered' },
  { target: null, fixed: '24/7', label: 'Emergency support' },
];

function StatsBar() {
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="border-y border-emerald-100 bg-emerald-50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map(({ target, suffix, fixed, label }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-black text-emerald-700">
                {fixed
                  ? fixed
                  : <CountUp target={target} suffix={suffix} active={active} />}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────

function CountUp({ target, suffix = '', duration = 1800, active }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let rafId;
    let startTime = null;

    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [active, target, duration]);

  return <>{count.toLocaleString()}{suffix}</>;
}

// ── Typewriter hero tagline ───────────────────────────────────────────────────

const HERO_TEXTS = [
  'Find your medicine in seconds.',
  'Real-time stock across Sri Lanka.',
  'Trusted pharmacies. Fast results.',
  '24/7 emergency medicine support.',
];

function TypeWriter() {
  const [idx, setIdx]         = useState(0);
  const [char, setChar]       = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = HERO_TEXTS[idx];
    if (!deleting && char < current.length) {
      const t = setTimeout(() => setChar(c => c + 1), 58);
      return () => clearTimeout(t);
    }
    if (!deleting && char === current.length) {
      const t = setTimeout(() => setDeleting(true), 2400);
      return () => clearTimeout(t);
    }
    if (deleting && char > 0) {
      const t = setTimeout(() => setChar(c => c - 1), 32);
      return () => clearTimeout(t);
    }
    // finished deleting → next text
    setDeleting(false);
    setIdx(i => (i + 1) % HERO_TEXTS.length);
  }, [char, deleting, idx]);

  return (
    <span className="text-emerald-600">
      {HERO_TEXTS[idx].slice(0, char)}
      <span
        className="ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 bg-emerald-500"
        style={{ animation: 'typewriterBlink 0.8s step-end infinite' }}
      />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage({ pharmacies }) {
  const navigate = useNavigate();
  const [emergencyForm, setEmergencyForm]   = useState(emptyEmergencyForm);
  const [emergencyState, setEmergencyState] = useState('idle');
  const [emergencyError, setEmergencyError] = useState('');
  const [emergencyRef, setEmergencyRef]     = useState('');

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setEmergencyError('');

    if (!emergencyForm.medicineName.trim() || !emergencyForm.contactName.trim() || !emergencyForm.deliveryAddress.trim()) {
      setEmergencyError('Medicine name, your name, and address are required.');
      setEmergencyState('error');
      return;
    }
    if (!isValidPhone(emergencyForm.contactPhone)) {
      setEmergencyError('Enter a valid phone number (7-10 digits).');
      setEmergencyState('error');
      return;
    }

    setEmergencyState('submitting');
    try {
      const order = await createEmergencyOrder({
        ...emergencyForm,
        medicineName: emergencyForm.medicineName.trim(),
        contactName: emergencyForm.contactName.trim(),
        contactPhone: emergencyForm.contactPhone.trim(),
        deliveryAddress: emergencyForm.deliveryAddress.trim(),
        notes: emergencyForm.notes.trim(),
      });
      setEmergencyRef(order?.referenceNumber || '');
      setEmergencyState('success');
      setEmergencyForm(emptyEmergencyForm);
    } catch (err) {
      setEmergencyError(err.message || 'Failed to submit. Please try again.');
      setEmergencyState('error');
    }
  };

  const quickPages = [
    { to: '/search',      title: 'Search Medicines',  description: 'Find available medicines in seconds before leaving home.',       icon: Search },
    { to: '/track-order', title: 'Track Order',        description: 'Enter your MF- or EMG- reference number to follow your order.', icon: ClipboardList },
    { to: '/pharmacies',  title: 'Browse Pharmacies', description: 'Check open hours, contacts, and available inventory.',           icon: MapPin },
    { to: '/contact',     title: 'Get Support',       description: 'Reach our team for urgent medicine assistance.',                 icon: HeartPulse },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-12 sm:pt-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_#bbf7d0,_transparent_42%),radial-gradient(circle_at_bottom_right,_#99f6e4,_transparent_45%),linear-gradient(180deg,_#f0fdf4_0%,_#ecfdf5_48%,_#f8fafc_100%)]" />
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Hero left — fade up */}
            <FadeIn direction="up" duration={700}>
              <div className="max-w-xl">
                <p className="mb-4 inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  Islandwide Medicine Network
                </p>
                <h1 className="bg-gradient-to-r from-emerald-950 via-emerald-700 to-teal-600 bg-clip-text text-4xl font-black leading-tight text-transparent md:text-6xl">
                  Search less. <br /> Heal faster.
                </h1>
                <p className="mt-3 min-h-[1.6em] text-lg font-semibold">
                  <TypeWriter />
                </p>
                <p className="mt-3 text-base leading-7 text-slate-600 md:text-lg">
                  MedFinder puts everything you need in one simple place so you can quickly find the right medicine without stress or confusion.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link to="/search" className="rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500">
                    Start Medicine Search
                  </Link>
                  <a href="#emergency" className="rounded-2xl border border-red-300 bg-red-50 px-6 py-4 text-sm font-bold text-red-700 transition hover:bg-red-100">
                    Emergency Request
                  </a>
                </div>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
                  {['Fast search', 'Nearby pharmacies', 'Prescription support'].map(t => (
                    <div key={t} className="rounded-full bg-emerald-50/90 px-4 py-2 font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100">{t}</div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Hero right — fade from right + gentle float */}
            <FadeIn direction="right" duration={800} delay={150}>
              <div className="relative animate-float-slow">
                <div className="absolute -left-6 -top-6 hidden h-24 w-24 rounded-full bg-emerald-200/60 blur-2xl sm:block" />
                <div className="absolute -bottom-8 right-6 hidden h-28 w-28 rounded-full bg-teal-200/70 blur-2xl sm:block" />
                <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_30px_80px_rgba(16,185,129,0.16)]">
                  <img src="https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=1200"
                    alt="Assorted medicines" className="h-[420px] w-full object-cover sm:h-[520px]" />
                  <div className="grid gap-4 bg-white p-5 sm:grid-cols-2">
                    {[
                      { title: 'Simple search',    description: 'Quickly locate medicines across all partner pharmacies.', icon: Search },
                      { title: 'Trusted branches', description: 'Browse verified pharmacies with hours and contact info.', icon: MapPin },
                    ].map(({ title, description, icon: Icon }) => (
                      <div key={title} className="rounded-2xl bg-emerald-50 p-4">
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <Icon size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Stats bar (animated) ── */}
      <StatsBar />

      {/* ── How it works ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Simple process</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">How MedFinder works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Three simple steps to get your medicines without the hassle of calling every pharmacy one by one.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, title, desc, img, alt }, idx) => (
            <FadeIn key={step} direction="up" delay={idx * 120} duration={650}>
              <div className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="overflow-hidden">
                  <img src={img} alt={alt} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Step {step}</span>
                  <h3 className="mt-3 text-xl font-black text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Emergency Medicine Request ── */}
      <section id="emergency" className="mx-auto max-w-7xl px-6 py-10">
        <div className="overflow-hidden rounded-[2.5rem] border-2 border-red-200 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 shadow-[0_20px_60px_rgba(220,38,38,0.10)]">
          <div className="grid gap-0 lg:grid-cols-[0.42fr_0.58fr]">
            {/* Left panel */}
            <div className="flex flex-col justify-between bg-red-600 p-8 text-white lg:rounded-[2rem]">
              <div>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  <Zap size={28} className="text-white" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-200">Urgent help</p>
                <h2 className="mt-3 text-3xl font-black leading-tight">Emergency Medicine Request</h2>
                <p className="mt-4 text-base leading-7 text-red-100">
                  Need medicine immediately? Submit a request and our partner pharmacies will respond as fast as possible.
                </p>
              </div>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Zap,           text: 'Request goes directly to all partner pharmacies' },
                  { icon: Phone,         text: 'A pharmacist will call you to confirm' },
                  { icon: Zap,           text: 'Average response time under 15 minutes' },
                  { icon: AlertTriangle, text: 'For genuine emergencies only' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
                      <Icon size={14} className="text-red-100" />
                    </div>
                    <p className="text-sm text-red-100">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="p-8">
              {emergencyState === 'success' ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Request sent!</h3>
                  <p className="max-w-sm text-base text-slate-600">
                    Your emergency request has been broadcast to our partner pharmacies. Someone will contact you shortly.
                  </p>
                  {emergencyRef && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Your reference number</p>
                      <p className="mt-1 text-2xl font-black tracking-wide text-slate-900">{emergencyRef}</p>
                      <p className="mt-1 text-xs text-slate-500">Save this to track your request status anytime.</p>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-center gap-3 mt-1">
                    {emergencyRef && (
                      <button
                        onClick={() => navigate(`/track-order?reference=${encodeURIComponent(emergencyRef)}`)}
                        className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                        Track request status
                      </button>
                    )}
                    <button onClick={() => { setEmergencyState('idle'); setEmergencyRef(''); }}
                      className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      Submit another request
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600">Fill in the details below</p>
                  <h3 className="mt-2 text-xl font-black text-slate-900">Tell us what you need</h3>

                  {/* tracking hint */}
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <ClipboardList size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                    <p className="text-sm text-emerald-800">
                      After submitting you'll receive an <span className="font-bold">EMG-XXXXXX reference number</span>.
                      Use it on the <button type="button" onClick={() => navigate('/track-order')}
                        className="font-bold underline underline-offset-2 hover:text-emerald-700">Track Order</button> page anytime to follow your request status — no login needed.
                    </p>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={handleEmergencySubmit} noValidate>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Medicine needed <span className="text-red-500">*</span></label>
                        <input required value={emergencyForm.medicineName}
                          onChange={(e) => setEmergencyForm(p => ({ ...p, medicineName: e.target.value }))}
                          placeholder="e.g. Paracetamol 500mg"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Your name <span className="text-red-500">*</span></label>
                        <input required value={emergencyForm.contactName}
                          onChange={(e) => setEmergencyForm(p => ({ ...p, contactName: e.target.value }))}
                          placeholder="Full name"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Phone number <span className="text-red-500">*</span></label>
                        <input required type="tel" value={emergencyForm.contactPhone}
                          onChange={(e) => setEmergencyForm(p => ({ ...p, contactPhone: e.target.value }))}
                          placeholder="+94 77 000 0000"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Preferred pharmacy <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                        <select value={emergencyForm.preferredPharmacy}
                          onChange={(e) => setEmergencyForm(p => ({ ...p, preferredPharmacy: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-red-400">
                          <option value="">Any nearby pharmacy</option>
                          {pharmacies.map(ph => <option key={ph.name} value={ph.name}>{ph.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Delivery / pickup address <span className="text-red-500">*</span></label>
                      <textarea required rows={2} value={emergencyForm.deliveryAddress}
                        onChange={(e) => setEmergencyForm(p => ({ ...p, deliveryAddress: e.target.value }))}
                        placeholder="Full address where you need the medicine delivered or where you can be reached"
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Additional notes <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                      <textarea rows={2} value={emergencyForm.notes}
                        onChange={(e) => setEmergencyForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Any other details — dosage, allergies, urgency level…"
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                    </div>
                    {emergencyState === 'error' && (
                      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{emergencyError}</div>
                    )}
                    <button type="submit" disabled={emergencyState === 'submitting'}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-base font-black text-white transition hover:bg-red-700 disabled:opacity-60">
                      <Zap size={18} />
                      {emergencyState === 'submitting' ? 'Sending request…' : 'Send Emergency Request'}
                    </button>
                    <p className="text-center text-xs text-slate-400">
                      By submitting, you confirm this is a genuine medical need. Misuse may affect service availability.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick access ── */}
      <section className="relative overflow-hidden px-6 py-20">
        {/* layered gradient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_rgba(16,185,129,0.18),_transparent),radial-gradient(ellipse_60%_50%_at_80%_100%,_rgba(139,92,246,0.12),_transparent),linear-gradient(180deg,_#f0fdf4_0%,_#eff6ff_50%,_#fdf4ff_100%)]" />

        {/* decorative sparkle dots */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {[
            { cls: 'top-8 left-[10%] h-2 w-2 bg-emerald-400',    delay: '0s' },
            { cls: 'top-16 left-[30%] h-1.5 w-1.5 bg-violet-400', delay: '0.4s' },
            { cls: 'top-6 right-[20%] h-2.5 w-2.5 bg-sky-400',    delay: '0.8s' },
            { cls: 'top-20 right-[8%] h-1.5 w-1.5 bg-emerald-300',delay: '0.2s' },
            { cls: 'bottom-10 left-[15%] h-2 w-2 bg-amber-400',   delay: '1s' },
            { cls: 'bottom-6 left-[45%] h-1.5 w-1.5 bg-violet-300',delay:'0.6s' },
            { cls: 'bottom-14 right-[18%] h-2 w-2 bg-sky-300',    delay: '1.2s' },
            { cls: 'top-1/2 left-[5%] h-1.5 w-1.5 bg-emerald-500',delay: '0.3s' },
            { cls: 'top-1/3 right-[4%] h-2 w-2 bg-pink-400',      delay: '0.9s' },
          ].map(({ cls, delay }, i) => (
            <span key={i} className={`absolute animate-pulse rounded-full opacity-60 ${cls}`}
              style={{ animationDelay: delay }} />
          ))}
        </div>

        <div className="mx-auto max-w-7xl">
          {/* heading */}
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
              ✦ Quick access ✦
            </span>
            <h2 className="mt-4 text-4xl font-black text-slate-900">Everything you need, one tap away</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-500">
              Jump straight to the tools that matter most — no sign-in needed.
            </p>
          </div>

          {/* cards */}
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {quickPages.map(({ to, title, description, icon: Icon, accent }, idx) => (
              <FadeIn key={to} direction="up" delay={idx * 110} duration={620}>
                <Link to={to}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(16,185,129,0.18)]">

                  {/* glow blob behind icon */}
                  <div className="absolute -top-6 -left-6 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl transition duration-500 group-hover:bg-emerald-400/40" />

                  {/* top-right corner sparkle */}
                  <span className="absolute right-4 top-4 text-lg opacity-0 transition duration-300 group-hover:opacity-100">✦</span>

                  {/* icon */}
                  <div className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200 transition duration-300 group-hover:scale-110 group-hover:shadow-emerald-300">
                    <Icon size={22} />
                  </div>

                  <p className="text-lg font-black text-slate-900">{title}</p>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-600 transition group-hover:gap-3">
                    Open <ArrowRight size={15} />
                  </span>

                  {/* bottom shine line */}
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 group-hover:w-full" />
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why trust MedFinder ── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <FadeIn direction="up" duration={700}>
          <div className="overflow-hidden rounded-[2.5rem] bg-slate-950">
            <div className="grid lg:grid-cols-2">
              <div className="flex flex-col justify-center p-10 lg:p-14">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Why patients trust us</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white">Healthcare help, whenever you need it</h2>
                <p className="mt-4 text-base leading-7 text-slate-400">
                  MedFinder was built to solve a real problem — spending hours calling pharmacies. Now patients across Sri Lanka find, order, and track their medicines in minutes.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Verified, licensed partner pharmacies only',
                    'Prescription orders handled securely',
                    'Real-time stock availability',
                    'Emergency requests sent to all branches instantly',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/search"
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-emerald-400">
                  Start searching <ArrowRight size={16} />
                </Link>
              </div>

              <div className="relative hidden overflow-hidden lg:block">
                <img
                  src="/homepage.png"
                  alt="Pharmacist helping a patient"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 to-transparent" />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Patient stories</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Trusted by patients across Sri Lanka</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ name, location, text, stars, avatar }, idx) => (
            <FadeIn key={name} direction="up" delay={idx * 110} duration={600}>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">"{text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-black text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">{location}</p>
                </div>
              </div>
            </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── AI Assistant floating button ── */}
      <Link to="/assistant" aria-label="Open AI Assistant"
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-300 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-200">
        <Bot size={24} />
      </Link>
    </>
  );
}
