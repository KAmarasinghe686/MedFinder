import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { registerUser } from '../api';
import { isValidEmail, isValidPhone } from '../utils';

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-bold text-slate-600">
      {label}{required && <span className="ml-1 text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-emerald-100 bg-white
   ${err ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-emerald-500'}`;

const validate = (form) => {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Full name is required.';
  else if (form.name.trim().length > 100) errs.name = 'Name must be 100 characters or fewer.';

  if (!form.email.trim()) errs.email = 'Email address is required.';
  else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address.';

  if (form.phone.trim() && !isValidPhone(form.phone)) {
    errs.phone = 'Enter a valid phone number (7-10 digits).';
  }

  if (!form.address.trim()) errs.address = 'Home address is required.';
  else if (form.address.trim().length > 300) errs.address = 'Address must be 300 characters or fewer.';

  return errs;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [fieldErrs, setFieldErrs] = useState({});
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setFieldErrs((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrs(errs);
      return;
    }

    setIsBusy(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 lg:py-16">
      <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.10)] lg:grid-cols-[1fr_1.1fr]">

        {/* ── Left info panel ── */}
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_50%),linear-gradient(160deg,_#0f172a,_#111827)] p-8 text-white lg:p-10">
          <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold uppercase tracking-widest text-emerald-300">
            Patient Portal
          </span>
          <h2 className="mt-4 text-3xl font-black leading-snug">Create your account</h2>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Register once, then sign in anytime with a one-time code sent to your email — no password needed.
          </p>

          <ol className="mt-8 space-y-3">
            {[
              'Fill in your name, email, and address below.',
              'Your account is created instantly.',
              'Go to Sign In and request an OTP code.',
              'Enter the code to access your dashboard.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-xs font-black text-emerald-300">
                  {i + 1}
                </span>
                <span className="text-base text-slate-300">{text}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div>
              <p className="text-sm font-bold text-slate-400">Already have an account?</p>
              <p className="mt-0.5 text-base font-semibold text-white">Sign in with OTP</p>
            </div>
            <Link to="/login" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-400">
              Sign in
            </Link>
          </div>

        </div>

        {/* ── Right form panel ── */}
        <div className="flex flex-col justify-center bg-white p-8 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">New Patient</p>
              <h3 className="mt-1.5 text-2xl font-black text-slate-900">Create account</h3>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserPlus size={21} />
            </div>
          </div>

          {success ? (
            <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
              <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
              <h4 className="mt-4 text-xl font-black text-slate-900">Account created!</h4>
              <p className="mt-2 text-base text-slate-600">Redirecting you to sign in…</p>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <Field label="Full name" required error={fieldErrs.name}>
                <input type="text" value={form.name} onChange={set('name')}
                  placeholder="Your full name" className={inputCls(fieldErrs.name)} />
              </Field>

              <Field label="Email address" required error={fieldErrs.email}>
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="you@example.com" className={inputCls(fieldErrs.email)} />
              </Field>

              <Field label="Phone number" error={fieldErrs.phone}>
                <input type="tel" value={form.phone} onChange={set('phone')}
                  placeholder="+94 77 000 0000" className={inputCls(fieldErrs.phone)} />
              </Field>

              <Field label="Home address" required error={fieldErrs.address}>
                <textarea rows={2} value={form.address} onChange={set('address')}
                  placeholder="No. 12, Main Street, Colombo 03"
                  className={`${inputCls(fieldErrs.address)} resize-none`} />
              </Field>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isBusy}
                className="w-full rounded-xl bg-slate-900 py-3 text-base font-bold text-white transition hover:bg-slate-700 disabled:opacity-60">
                {isBusy ? 'Creating account…' : 'Create account'}
              </button>

              <p className="text-center text-base text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-emerald-700 hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
