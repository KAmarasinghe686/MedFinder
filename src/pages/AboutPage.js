import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, HeartPulse, Search, Shield, Users } from 'lucide-react';

const VALUES = [
  {
    icon: Search,
    title: 'Reliable Search',
    text: 'Check medicine availability instantly across trusted pharmacies — no phone calls needed.',
  },
  {
    icon: Shield,
    title: 'Trusted Partners',
    text: 'Only verified and licensed pharmacy partners are listed on our platform.',
  },
  {
    icon: HeartPulse,
    title: 'Patient First',
    text: 'Every feature is designed to reduce delays in finding critical medication.',
  },
  {
    icon: Users,
    title: 'Community Care',
    text: 'Serving patients, caregivers, and healthcare teams across Sri Lanka.',
  },
];

const TEAM = [
  {
    name: 'Dr. Amal Jayawardena',
    role: 'Medical Advisor',
    img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Sachini Rathnayake',
    role: 'Head of Pharmacy Operations',
    img: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Kasun Perera',
    role: 'Technology Lead',
    img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden">
        <img
          src="WhatsApp Image 2026-07-23 at 9.57.38 PM.jpeg"
          alt="Pharmacist at work"
          className="h-[420px] w-full object-cover brightness-[0.4]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p data-aos="fade-up" data-aos-delay="0"
            className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Our story</p>
          <h1 data-aos="fade-up" data-aos-delay="100"
            className="mt-3 text-5xl font-black text-white md:text-6xl">About MedFinder</h1>
          <p data-aos="fade-up" data-aos-delay="200"
            className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Built to solve a real problem — making sure everyone can find the medicine they need, when they need it most.
          </p>
        </div>
      </section>

      {/* ── Mission split ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div data-aos="fade-right" data-aos-duration="900">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Our mission</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 leading-tight">
              Connecting patients with the medicines they need
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              MedFinder was born from a simple frustration — calling ten pharmacies to find one medicine. We built a platform that lets patients search, order, and track medicines across multiple partner pharmacies in seconds.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Today MedFinder serves patients across Sri Lanka, working with verified pharmacies to bring speed, transparency, and trust to everyday healthcare.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Founded to eliminate unnecessary pharmacy trips',
                'Serving patients in 10+ cities across Sri Lanka',
                'Partnering only with fully licensed pharmacies',
                'Emergency medicine support available around the clock',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/search"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-700">
              Search medicines now <ArrowRight size={16} />
            </Link>
          </div>
          <div data-aos="fade-left" data-aos-duration="900"
            className="overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-200">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=900"
              alt="Pharmacist at counter helping patient"
              className="h-[460px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-emerald-600 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '20+',   label: 'Partner pharmacies' },
              { value: '500+',  label: 'Medicines available' },
              { value: '10+',   label: 'Cities covered' },
              { value: '1000+', label: 'Patients served' },
            ].map(({ value, label }, idx) => (
              <div key={label} data-aos="zoom-in" data-aos-delay={idx * 100} className="text-center">
                <p className="text-4xl font-black text-white">{value}</p>
                <p className="mt-1 text-sm font-semibold text-emerald-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div data-aos="fade-up" className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">What we stand for</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Our core values</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }, idx) => (
            <article key={title}
              data-aos="fade-up" data-aos-delay={idx * 100}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Icon size={26} />
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div data-aos="fade-up" className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">The people behind it</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Our team</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">Healthcare professionals and technologists united by a single goal — better medicine access for everyone.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {TEAM.map(({ name, role, img }, idx) => (
            <div key={name}
              data-aos="fade-up" data-aos-delay={idx * 120}
              className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm text-center">
              <div className="overflow-hidden">
                <img src={img} alt={name} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-lg font-black text-slate-900">{name}</p>
                <p className="mt-1 text-sm text-emerald-700 font-semibold">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative overflow-hidden">
        <img
          src="WhatsApp Image 2026-07-23 at 10.03.23 PM.jpeg"
          alt="Pharmacist helping patient"
          className="h-[360px] w-full object-cover brightness-[0.35]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <h2 data-aos="zoom-in" data-aos-duration="700"
            className="text-4xl font-black text-white">Ready to find your medicine?</h2>
          <p data-aos="fade-up" data-aos-delay="150"
            className="max-w-lg text-lg text-slate-300">Join thousands of patients who skip the phone calls and find their medicines in seconds.</p>
          <Link to="/search" data-aos="fade-up" data-aos-delay="250"
            className="rounded-2xl bg-emerald-500 px-8 py-4 text-base font-black text-white transition hover:bg-emerald-400">
            Start searching now
          </Link>
        </div>
      </section>
    </>
  );
}
