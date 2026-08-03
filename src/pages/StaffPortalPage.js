import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Store, UserCog, UserPlus } from 'lucide-react';

const staffLinks = [
  {
    title: 'Pharmacy Login',
    description: 'Manage your pharmacy profile, medicines, stock, and patient orders.',
    to: '/pharmacy/login',
    icon: Store,
    cta: 'Open pharmacy login',
    emoji: '💊',
    accent: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-200 group-hover:ring-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700',
    label: 'Pharmacist',
  },
  {
    title: 'Admin Login',
    description: 'Access platform-level tools for medicines, reservations, and operations.',
    to: '/admin/login',
    icon: UserCog,
    cta: 'Open admin login',
    emoji: '🛡️',
    accent: 'from-indigo-500 to-violet-500',
    ring: 'ring-indigo-200 group-hover:ring-indigo-400',
    badge: 'bg-indigo-50 text-indigo-700',
    label: 'Administrator',
  },
  {
    title: 'Register Pharmacy',
    description: 'Create a new pharmacy account before signing in to the pharmacy portal.',
    to: '/pharmacy/register',
    icon: UserPlus,
    cta: 'Register pharmacy',
    emoji: '🏪',
    accent: 'from-amber-400 to-orange-500',
    ring: 'ring-amber-200 group-hover:ring-amber-400',
    badge: 'bg-amber-50 text-amber-700',
    label: 'New pharmacy',
  },
];

export default function StaffPortalPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 lg:py-20">
      <div className="mb-12 max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">
          <ShieldCheck size={16} />
          Staff Portal
        </p>
        <h1 className="mt-5 text-4xl font-black leading-tight text-slate-900 lg:text-5xl">
          Pharmacy and admin access
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          These pages are separate from the customer view. Use the correct login for your role to access protected staff tools.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {staffLinks.map(({ title, description, to, icon: Icon, cta, emoji, accent, ring, badge, label }) => (
          <Link
            key={title}
            to={to}
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1.5 hover:shadow-2xl"
          >
            {/* Illustrated banner */}
            <div className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${accent} overflow-hidden`}>
              {/* Decorative rings */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="h-48 w-48 rounded-full border-4 border-white" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="h-64 w-64 rounded-full border-4 border-white" />
              </div>

              {/* Central image area */}
              <div className={`relative flex flex-col items-center justify-center gap-2 rounded-3xl bg-white/20 px-8 py-4 ring-2 ${ring} backdrop-blur-sm transition`}>
                <span className="text-5xl leading-none">{emoji}</span>
                <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-1">
                  <Icon size={13} className="text-white" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">{label}</span>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="flex flex-1 flex-col p-6">
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${badge}`}>{label}</span>
              <h2 className="mt-3 text-xl font-black text-slate-900">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-slate-600">{description}</p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition group-hover:gap-3">
                {cta} <ArrowRight size={16} />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
