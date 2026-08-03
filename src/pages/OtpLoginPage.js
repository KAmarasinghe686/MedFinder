import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BellRing, CalendarClock, FileText, ShieldCheck, UserCircle2, UserPlus } from 'lucide-react';
import { requestOtp, verifyOtp } from '../api';
import { isValidEmail } from '../utils';

const MAX_EMAIL_LENGTH = 254;
const MAX_PHARMACY_NAME_LENGTH = 120;

const fieldClass = (hasError, extra = '') =>
  `w-full rounded-xl border bg-slate-50 px-4 py-3 text-base outline-none transition focus:bg-white focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100'
  } ${extra}`;

export default function OtpLoginPage({ role, pharmacies = [], onAuthSuccess }) {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const isPharmacyRole = role === 'pharmacy';
  const registerPath = role === 'pharmacy' ? '/pharmacy/register' : '/register';

  const title =
    role === 'admin' ? 'Admin Login' :
    role === 'pharmacy' ? 'Pharmacy Login' :
    'Patient Login';

  const description =
    role === 'admin'
      ? 'Use your admin email to access the dashboard.'
      : role === 'pharmacy'
      ? 'Sign in with your pharmacy email to manage stock and reservations.'
      : 'Sign in to view your profile, track orders, and manage prescriptions.';

  const highlights = useMemo(
    () => [
      { title: 'Profile', description: 'Name, contact info, and account activity.', icon: UserCircle2 },
      { title: 'Orders', description: 'Reserved, ready, collected, or cancelled.', icon: BellRing },
      { title: 'Prescriptions', description: 'Uploaded files and request history.', icon: FileText },
      { title: 'Live tracking', description: 'Follow order progress in real time.', icon: CalendarClock },
    ],
    []
  );

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (isBusy) return;
    setError('');
    setNeedsRegistration(false);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPharmacyName = pharmacyName.trim();
    const nextErrors = {};
    if (!normalizedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (
      normalizedEmail.length > MAX_EMAIL_LENGTH
      || !isValidEmail(normalizedEmail)
    ) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (isPharmacyRole && !normalizedPharmacyName) {
      nextErrors.pharmacyName = 'Select or enter your registered pharmacy.';
    } else if (
      isPharmacyRole
      && normalizedPharmacyName.length > MAX_PHARMACY_NAME_LENGTH
    ) {
      nextErrors.pharmacyName =
        `Pharmacy name must be ${MAX_PHARMACY_NAME_LENGTH} characters or fewer.`;
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsBusy(true);
    try {
      await requestOtp({
        email: normalizedEmail,
        role,
        pharmacyName: isPharmacyRole ? normalizedPharmacyName : undefined,
      });
      setEmail(normalizedEmail);
      if (isPharmacyRole) setPharmacyName(normalizedPharmacyName);
      setOtp('');
      setIsOtpSent(true);
    } catch (err) {
      if (err.status === 404 && role === 'user') setNeedsRegistration(true);
      setError(err.message || 'Unable to send OTP.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isBusy) return;
    setError('');

    if (!/^\d{6}$/.test(otp.trim())) {
      setFieldErrors({ otp: 'Enter the 6-digit code sent to your email.' });
      return;
    }
    setFieldErrors({});

    setIsBusy(true);
    try {
      const response = await verifyOtp({
        email: email.trim(),
        role,
        otp: otp.trim(),
        pharmacyName: isPharmacyRole ? pharmacyName.trim() : undefined,
      });
      onAuthSuccess(response);
    } catch (err) {
      setError(err.message || 'Unable to verify OTP.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 lg:py-16">
      <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.10)] lg:grid-cols-[1fr_1fr]">

        {/* ── Left: info panel ── */}
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_50%),linear-gradient(160deg,_#0f172a,_#111827)] p-8 text-white lg:p-10">
          <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold uppercase tracking-widest text-emerald-300">
            Secure Access
          </span>
          <h2 className="mt-4 text-3xl font-black leading-snug lg:text-4xl">{title}</h2>
          <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {highlights.map(({ title: t, description: d, icon: Icon }) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <Icon size={17} />
                </div>
                <p className="mt-3 text-base font-bold text-white">{t}</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">{d}</p>
              </div>
            ))}
          </div>

          {role !== 'admin' && (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <UserPlus size={16} className="shrink-0 text-emerald-300" />
              <p className="text-base text-slate-300">
                {role === 'pharmacy' ? 'New pharmacy?' : 'New patient?'}{' '}
                <Link to={registerPath} className="font-bold text-emerald-300 underline-offset-2 hover:underline">
                  {role === 'pharmacy' ? 'Register your pharmacy' : 'Create a free account'}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* ── Right: form panel ── */}
        <div className="flex flex-col justify-center bg-white p-8 lg:p-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
                {isOtpSent ? 'Step 2 of 2' : 'Step 1 of 2'}
              </p>
              <h3 className="mt-1.5 text-2xl font-black text-slate-900">
                {isOtpSent ? 'Enter your code' : 'Sign in with email'}
              </h3>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="mt-6">
            {role === 'user' && location.state?.message && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base font-medium text-amber-800">
                {location.state.message}
              </div>
            )}
            {!isOtpSent ? (
              /* ── Step 1: request OTP ── */
              <form className="space-y-4" onSubmit={handleRequestOtp} noValidate>
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold text-slate-600">Email address</label>
                  <input
                    id="login-email"
                    type="email" value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.slice(0, MAX_EMAIL_LENGTH));
                      setFieldErrors((current) => ({ ...current, email: undefined }));
                      setError('');
                    }}
                    onBlur={() => setEmail((current) => current.trim().toLowerCase())}
                    placeholder="you@example.com"
                    maxLength={MAX_EMAIL_LENGTH}
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                    className={fieldClass(Boolean(fieldErrors.email))}
                  />
                  {fieldErrors.email && (
                    <p id="login-email-error" className="mt-1.5 text-sm font-semibold text-red-600">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {isPharmacyRole && (
                  <div>
                    <label htmlFor="login-pharmacy" className="mb-1.5 block text-sm font-bold text-slate-600">Pharmacy</label>
                    {pharmacies.length > 0 ? (
                      <select
                        id="login-pharmacy"
                        required value={pharmacyName}
                        onChange={(e) => {
                          setPharmacyName(e.target.value);
                          setFieldErrors((current) => ({ ...current, pharmacyName: undefined }));
                          setError('');
                        }}
                        aria-invalid={Boolean(fieldErrors.pharmacyName)}
                        aria-describedby={fieldErrors.pharmacyName ? 'login-pharmacy-error' : undefined}
                        className={fieldClass(Boolean(fieldErrors.pharmacyName))}
                      >
                        <option value="">Select your pharmacy</option>
                        {pharmacies.map((shop) => (
                          <option key={shop.name} value={shop.name}>{shop.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="login-pharmacy"
                        type="text" value={pharmacyName}
                        onChange={(e) => {
                          setPharmacyName(e.target.value.slice(0, MAX_PHARMACY_NAME_LENGTH));
                          setFieldErrors((current) => ({ ...current, pharmacyName: undefined }));
                          setError('');
                        }}
                        placeholder="Pharmacy name"
                        maxLength={MAX_PHARMACY_NAME_LENGTH}
                        autoComplete="organization"
                        aria-invalid={Boolean(fieldErrors.pharmacyName)}
                        aria-describedby={fieldErrors.pharmacyName ? 'login-pharmacy-error' : undefined}
                        className={fieldClass(Boolean(fieldErrors.pharmacyName))}
                      />
                    )}
                    {fieldErrors.pharmacyName && (
                      <p id="login-pharmacy-error" className="mt-1.5 text-sm font-semibold text-red-600">
                        {fieldErrors.pharmacyName}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className={`rounded-xl px-4 py-3 text-base font-medium ${needsRegistration ? 'border border-amber-200 bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'}`}>
                    {error}
                    {needsRegistration && (
                      <span> <Link to={registerPath} className="font-bold underline underline-offset-2 hover:text-amber-900">Register now →</Link></span>
                    )}
                  </div>
                )}

                <button type="submit" disabled={isBusy}
                  className="w-full rounded-xl bg-slate-900 py-3 text-base font-bold text-white transition hover:bg-slate-700 disabled:opacity-60">
                  {isBusy ? 'Sending code…' : 'Send OTP to my email'}
                </button>

                {role !== 'admin' && (
                  <p className="text-center text-base text-slate-500">
                    No account?{' '}
                    <Link to={registerPath} className="font-bold text-emerald-700 hover:underline">
                      {role === 'pharmacy' ? 'Register pharmacy' : 'Register for free'}
                    </Link>
                  </p>
                )}
              </form>
            ) : (
              /* ── Step 2: verify OTP ── */
              <form className="space-y-4" onSubmit={handleVerifyOtp} noValidate>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-base text-emerald-800">
                  We sent a 6-digit code to <span className="font-bold">{email}</span>. Check your inbox.
                </div>

                <div>
                  <label htmlFor="login-otp" className="mb-1.5 block text-sm font-bold text-slate-600">6-digit code</label>
                  <input
                    id="login-otp"
                    type="text" inputMode="numeric" maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setFieldErrors((current) => ({ ...current, otp: undefined }));
                      setError('');
                    }}
                    placeholder="_ _ _ _ _ _"
                    autoComplete="one-time-code"
                    aria-invalid={Boolean(fieldErrors.otp)}
                    aria-describedby={fieldErrors.otp ? 'login-otp-error' : undefined}
                    className={fieldClass(Boolean(fieldErrors.otp), 'text-center text-xl font-bold tracking-[0.5em]')}
                  />
                  {fieldErrors.otp && (
                    <p id="login-otp-error" className="mt-1.5 text-sm font-semibold text-red-600">
                      {fieldErrors.otp}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-700">{error}</div>
                )}

                <button type="submit" disabled={isBusy}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-base font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                  {isBusy ? 'Verifying…' : 'Verify & Sign in'}
                </button>

                <button type="button" onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                  setFieldErrors({});
                  setError('');
                }}
                  className="w-full rounded-xl border border-slate-200 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-50">
                  ← Use a different email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
