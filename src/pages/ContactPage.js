import React, { useState } from 'react';
import { CheckCircle2, Clock3, HeartPulse, MapPin, Phone } from 'lucide-react';
import { submitContact } from '../api';
import { isValidEmail } from '../utils';

const inputCls = 'w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy]     = useState(false);
  const [sent, setSent]     = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name    = 'Your name is required.';
    else if (form.name.trim().length > 100) errs.name = 'Name must be 100 characters or fewer.';

    if (!form.email.trim())   errs.email   = 'Email address is required.';
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address.';

    if (form.subject.trim().length > 150) errs.subject = 'Subject must be 150 characters or fewer.';

    if (!form.message.trim()) errs.message = 'Please write a message.';
    else if (form.message.trim().length > 2000) errs.message = 'Message must be 2000 characters or fewer.';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setBusy(true);
    try {
      await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSent(true);
    } catch (err) {
      setApiError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden">
        <img
          src="https://mei.net.in/wp-content/uploads/2024/08/contact-banner.webp"
          alt="Person getting help"
          className="h-[300px] w-full object-cover brightness-[0.4]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">We're here for you</p>
          <h1 className="mt-3 text-5xl font-black text-white">Contact Support</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            For medicine lookup help, prescription questions, or pharmacy partner enquiries — our team responds every day.
          </p>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">

          {/* Info panel */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800"
                alt="Inside a pharmacy"
                className="h-52 w-full object-cover"
              />
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <HeartPulse size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Support Centre</p>
                  <p className="text-lg font-black text-slate-900">MedFinder Help</p>
                </div>
              </div>

              <div className="mt-6 space-y-5 text-sm text-slate-700">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <Phone size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-900">Phone</p>
                    <p className="mt-0.5 text-slate-600">+94 11 234 5678</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-900">Location</p>
                    <p className="mt-0.5 text-slate-600">Colombo Service Centre, Sri Lanka</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <Clock3 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-900">Hours</p>
                    <p className="mt-0.5 text-slate-600">6:00 AM – 11:00 PM, every day</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form / success */}
          <div className="rounded-[2rem] bg-white p-8 shadow-md">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 size={52} className="text-emerald-500" />
                <h2 className="mt-4 text-2xl font-black text-slate-900">Message sent!</h2>
                <p className="mt-2 text-base text-slate-600">Our support team will get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Send a message</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">How can we help?</h2>
                <p className="mt-2 text-sm text-slate-500">Fill in the form and our support team will get back to you as soon as possible.</p>

                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-600">
                        Your name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.name} onChange={set('name')}
                        placeholder="Full name" className={inputCls} />
                      {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-600">
                        Email address <span className="text-red-500">*</span>
                      </label>
                      <input type="email" value={form.email} onChange={set('email')}
                        placeholder="you@email.com" className={inputCls} />
                      {errors.email && <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-600">Subject</label>
                    <input type="text" value={form.subject} onChange={set('subject')}
                      placeholder="What is your enquiry about?" className={inputCls} />
                    {errors.subject && <p className="mt-1 text-xs font-semibold text-red-600">{errors.subject}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-600">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea rows={5} value={form.message} onChange={set('message')}
                      placeholder="Describe how we can help you…"
                      className={`${inputCls} resize-none`} />
                    {errors.message && <p className="mt-1 text-xs font-semibold text-red-600">{errors.message}</p>}
                  </div>
                </div>

                {apiError && (
                  <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {apiError}
                  </div>
                )}

                <button type="submit" disabled={busy}
                  className="mt-6 w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60">
                  {busy ? 'Sending…' : 'Submit Request'}
                </button>

                <p className="mt-4 text-center text-xs text-slate-400">We typically respond within a few hours during operating hours.</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
