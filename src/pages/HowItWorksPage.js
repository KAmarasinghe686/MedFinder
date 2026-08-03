import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  HeartPulse,
  Package2,
  Search,
  Shield,
  Zap,
} from 'lucide-react';

// ── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    title: 'Search for your medicine',
    body: 'Head to the Search page and type the name of the medicine you need. MedFinder instantly shows you every partner pharmacy that has it in stock right now — including price, quantity, and branch location.',
    bullets: [
      'See live stock across all partner pharmacies',
      'Filter by medicine name, category, or pharmacy',
      'Check price and available quantity instantly',
      'View pharmacy location and opening hours',
    ],
    cta: { label: 'Search medicines', to: '/search' },
    img: 'https://media.licdn.com/dms/image/v2/D4E22AQHsL9v5wZ_F_g/feedshare-shrink_800/B4EZeicZDVGwAg-/0/1750777043923?e=2147483647&v=beta&t=j-ZdCsoAyeOvvfCzmEmHXUHgNu7-CjGalswycfwPo4s',
    alt: 'Person searching for medicine on a laptop',
    imgRight: true,
  },
  {
    n: '2',
    title: 'Place your order or upload a prescription',
    body: "Found your medicine? Reserve it directly from the search results. If you have a doctor's prescription, upload a photo through your dashboard. A licensed pharmacist at your chosen branch will review and approve it.",
    bullets: [
      'Reserve medicine with one tap from search results',
      'Upload a prescription photo from your phone',
      'Pharmacist reviews and approves your order',
      'Receive a unique reference number for tracking',
    ],
    cta: { label: 'Register to order', to: '/register' },
    img: 'https://png.pngtree.com/thumb_back/fh260/background/20220716/pngtree-online-registration-form-for-modish-form-filling-registration-school-college-photo-image_47583834.jpg',
    alt: 'Pharmacist reviewing an uploaded prescription',
    imgRight: false,
  },
  {
    n: '3',
    title: 'Track your order and collect',
    body: 'Once approved, track your order in real time through every stage. When your medicine is ready, collect it from the pharmacy counter or arrange delivery. Every status change is reflected instantly in your dashboard.',
    bullets: [
      'Live 5-stage tracking: Pending → Approved → Packing → Ready → Delivered',
      'Cancel within 2 hours if your plans change',
      'Reference number lets anyone track an order',
      'Rejection notes shown if a pharmacy cannot fulfil',
    ],
    cta: { label: 'Track an order', to: '/track-order' },
    img: 'https://d6xcmfyh68wv8.cloudfront.net/learn-content/uploads/2020/12/Order-tracking-.png',
    alt: 'Pharmacist handing medicine to a patient at the counter',
    imgRight: true,
  },
];

const FEATURES = [
  {
    icon: Search,
    title: 'Medicine search',
    desc: 'Search across all partner pharmacies instantly. See live stock, prices, and locations before leaving home.',
    link: '/search',
    cta: 'Search now',
    img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=600',
  },
  {
    icon: FileText,
    title: 'Prescription upload',
    desc: 'Send a photo of your prescription online. No more carrying paper — a pharmacist reviews it digitally.',
    link: '/order-your-prescription',
    cta: 'Upload prescription',
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
  },
  {
    icon: Package2,
    title: 'Order tracking',
    desc: 'Track every order in real time through 5 clear stages. Know exactly where your medicine is at all times.',
    link: '/track-order',
    cta: 'Track an order',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600',
  },
  {
    icon: Zap,
    title: 'Emergency requests',
    desc: 'Need medicine urgently? No account needed. Your request reaches all partner pharmacies at once.',
    link: '/#emergency',
    cta: 'Learn more',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVirxdX-xJNrg7pi8RP0-FBRo-T33wqRuXyQ&s',
  },
];

// Each WHY_US card gets its own tinted background — avoids the "white box on white page" look
const WHY_US = [
  { icon: Search,     title: 'Real-time availability',   desc: 'See live stock before leaving home. No more wasted trips to an empty shelf.',  iconCls: 'bg-emerald-100 text-emerald-700', cardCls: 'bg-emerald-50' },
  { icon: Shield,     title: 'Verified pharmacies only',  desc: 'Every pharmacy listed on MedFinder is licensed, verified, and trusted.',       iconCls: 'bg-sky-100 text-sky-700',         cardCls: 'bg-sky-50'     },
  { icon: HeartPulse, title: 'Secure health data',        desc: 'Your prescriptions and personal details are encrypted and never shared.',       iconCls: 'bg-violet-100 text-violet-700',   cardCls: 'bg-violet-50'  },
  { icon: Clock3,     title: 'Save time, every time',     desc: 'What used to take hours of phone calls now takes seconds on MedFinder.',       iconCls: 'bg-amber-100 text-amber-700',     cardCls: 'bg-amber-50'   },
];

const FAQS = [
  { q: 'Is MedFinder right for me?',
    a: "MedFinder is for anyone who needs to find or order medicines in Sri Lanka — patients, caregivers, or anyone in an urgent situation. If you've ever spent time calling multiple pharmacies to find one medicine, MedFinder was built for you." },
  { q: 'How do I find out if a medicine is available?',
    a: 'Go to the Search page and type the medicine name. MedFinder shows you every partner pharmacy that has it in stock right now, along with price, quantity, location, and opening hours.' },
  { q: 'Can I upload a prescription online?',
    a: 'Yes. Once registered as a patient, go to "Order Medicine" in your dashboard, take a photo of your prescription, choose a pharmacy, and submit. A pharmacist reviews and approves your order before it is processed.' },
  { q: 'How does order tracking work?',
    a: 'Every order gets a unique reference number (e.g. MF-ABC123). Go to the Track Order page, enter your reference number to see the live status: Pending → Approved → Packing → Ready for Pickup → Delivered.' },
  { q: 'Is my health information safe?',
    a: 'Absolutely. MedFinder stores all prescription images and personal data securely. Your information is never shared with any party outside your chosen pharmacy.' },
  { q: 'What is the Emergency Request feature?',
    a: 'The Emergency Request on the home page lets anyone — even without an account — submit an urgent medicine need. It is sent simultaneously to all partner pharmacies. A pharmacist will call you back as fast as possible.' },
  { q: 'Can I cancel an order?',
    a: 'Yes, within 2 hours of placing it and before it has started being packed. Go to "My Orders" in your patient dashboard and tap Cancel Order. After 2 hours the cancellation window closes.' },
  { q: 'Do I need to register to use MedFinder?',
    a: "You can browse medicines and pharmacies without an account. To place an order, upload a prescription, or track a real-time order, you'll need a free patient account — registration takes under a minute." },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="text-base font-bold text-slate-900">{q}</span>
        {open
          ? <ChevronUp  size={18} className="shrink-0 text-emerald-600" />
          : <ChevronDown size={18} className="shrink-0 text-slate-400" />}
      </button>
      {open && <p className="pb-5 text-sm leading-7 text-slate-600">{a}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      {/* Single soft glow — no intersecting radial gradients that create patches */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-start justify-center">
          <div className="h-[480px] w-[900px] rounded-full bg-emerald-200/25 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <p data-aos="fade-up"
            className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            Simple guide
          </p>
          <h1 data-aos="fade-up" data-aos-delay="100"
            className="mt-5 text-5xl font-black leading-tight text-slate-900 md:text-6xl">
            Get to know MedFinder
          </h1>
          <p data-aos="fade-up" data-aos-delay="200"
            className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            From searching for your medicine to receiving it — here is exactly how MedFinder works and everything you can do with it.
          </p>
          <div data-aos="fade-up" data-aos-delay="300"
            className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register"
              className="rounded-2xl bg-slate-900 px-7 py-4 text-sm font-bold text-white transition hover:bg-slate-700">
              Get started free
            </Link>
            <Link to="/search"
              className="rounded-2xl border border-slate-300 bg-white px-7 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              Search medicines
            </Link>
          </div>
        </div>
      </section>

      {/* ── Step-by-step ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Step by step</p>
          <h2 className="mt-2 text-4xl font-black text-slate-900">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">Three clear steps, from search to medicine in hand.</p>
        </div>

        <div className="space-y-28">
          {STEPS.map(({ n, title, body, bullets, cta, img, alt, imgRight }) => (
            <div key={n} className="grid items-center gap-12 lg:grid-cols-2">
              <div
                data-aos={imgRight ? 'fade-right' : 'fade-left'}
                data-aos-duration="850"
                className={imgRight ? 'order-2 lg:order-1' : 'order-2'}>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white shadow-lg shadow-emerald-200">
                  {n}
                </div>
                <h3 className="text-3xl font-black text-slate-900">{title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-600">{body}</p>
                <ul className="mt-6 space-y-3">
                  {bullets.map(b => (
                    <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link to={cta.to}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500">
                  {cta.label} <ArrowRight size={16} />
                </Link>
              </div>
              <div
                data-aos={imgRight ? 'fade-left' : 'fade-right'}
                data-aos-duration="850"
                className={`overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-200 ${imgRight ? 'order-1 lg:order-2' : 'order-1'}`}>
                <img src={img} alt={alt} className="h-[400px] w-full object-cover" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Everything in one place</p>
            <h2 className="mt-2 text-4xl font-black text-slate-900">Your pharmacy, made easier</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Search, order, track, and get emergency help — all from one platform, on any device.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc, link, cta, img }, idx) => (
              <div key={title}
                data-aos="fade-up" data-aos-delay={idx * 100}
                className="group overflow-hidden rounded-[2rem] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
                <div className="overflow-hidden">
                  <img src={img} alt={title} className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{desc}</p>
                  <Link to={link} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-500">
                    {cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why MedFinder ────────────────────────────────────────────────────── */}
      {/* Cards have their own tinted background — no thin border on white page  */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">The MedFinder difference</p>
            <h2 className="mt-2 text-4xl font-black text-slate-900">Why patients choose MedFinder</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map(({ icon: Icon, title, desc, iconCls, cardCls }, idx) => (
              <div key={title}
                data-aos="zoom-in" data-aos-delay={idx * 80}
                className={`rounded-[2rem] ${cardCls} p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md`}>
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconCls}`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-base font-black text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── You're in good hands ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-950/40">
              <img
                src="https://www.rheumatologyadvisor.com/wp-content/uploads/sites/18/2019/02/pharmacisttalkingonphoneg_1527425.jpg"
                alt="Pharmacist ready to help"
                className="h-[480px] w-full object-cover brightness-95"
              />
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Expert support</p>
                <h2 className="mt-3 text-4xl font-black leading-tight text-white">You're in good hands</h2>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  Every pharmacy on MedFinder is staffed by licensed, qualified pharmacists. They are available to help with your prescription, advise on dosage and side effects, and respond to urgent requests as fast as possible.
                </p>
              </div>

              {/* Left-border accent list — no box outlines over the dark gradient */}
              <ul className="space-y-3">
                {[
                  'Guidance on how to store your medication safely',
                  'Advice on potential side effects to watch for',
                  'Help managing your prescription routine',
                  'When to contact a doctor versus the pharmacy',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 border-l-2 border-emerald-400 pl-4 text-sm font-semibold text-slate-200">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>

              <blockquote className="rounded-2xl border-l-4 border-emerald-400 bg-slate-800/60 px-5 py-4">
                <p className="text-base italic leading-7 text-slate-200">
                  "I know the work we're doing can help people manage their medications more seamlessly, and that inspires me every day."
                </p>
                <footer className="mt-3 text-sm font-bold text-emerald-300">— Kasun, Pharmacist-in-Charge, Colombo</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── Emergency highlight ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-600 to-orange-600">
          <div className="grid items-center lg:grid-cols-2">
            <div className="p-10 lg:p-14">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <Zap size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-black leading-tight text-white">Emergency medicine, fast</h2>
              <p className="mt-4 text-base leading-7 text-red-100">
                MedFinder has a built-in Emergency Request feature — no account needed. Submit from the home page and every partner pharmacy is notified instantly. A pharmacist will call you within minutes.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'No registration required',
                  'Request reaches all partner pharmacies at once',
                  'Average pharmacist callback under 15 minutes',
                  'Available 24 hours a day, every day',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold text-white">
                    <CheckCircle2 size={15} className="shrink-0 text-white/80" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/#emergency"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-red-600 transition hover:bg-red-50">
                <Zap size={16} /> Go to Emergency Request
              </a>
            </div>
            <div className="relative hidden overflow-hidden lg:block">
              <img
                src="https://www.asterhospitals.in/sites/default/files/2024-12/Emergency%20Medicine%20mobile.jpg"
                alt="Emergency medical support team"
                className="h-[460px] w-full object-cover opacity-60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Common questions</p>
          <h2 className="mt-2 text-4xl font-black text-slate-900">You may be wondering…</h2>
        </div>
        <div data-aos="fade-up" className="rounded-[2rem] bg-white px-8 py-2 shadow-md">
          {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-md">
          <div className="grid lg:grid-cols-2">
            <div className="relative hidden overflow-hidden lg:block">
              <img
                src="https://media.licdn.com/dms/image/v2/D4E12AQFZf7EnQtF5MA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1672765307194?e=2147483647&v=beta&t=0N7mrAvOBoV5iWWEMqqm1OQCUTRHDs5yZ_NuJMR1u_g"
                alt="Pharmacist helping patient"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-10 lg:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Ready to start?</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900">Find your medicine in seconds</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Join thousands of patients across Sri Lanka who use MedFinder to skip the phone calls and find their medicines quickly and safely.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register"
                  className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-700">
                  Register for free
                </Link>
                <Link to="/search"
                  className="rounded-2xl border border-slate-300 px-6 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  Search medicines
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
