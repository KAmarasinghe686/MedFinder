import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, Store, UploadCloud, X } from 'lucide-react';
import { registerPharmacy } from '../api';
import { digitCount, isValidEmail } from '../utils';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputCls = (err) =>
  `w-full rounded-xl border px-4 py-3 text-base outline-none transition
   focus:ring-2 focus:ring-emerald-100 bg-white
   ${err ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-emerald-500'}`;

const Field = ({ label, required, hint, error, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-bold text-slate-600">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      {hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
  </div>
);

// ── Validation ────────────────────────────────────────────────────────────────

function validate(form) {
  const errs = {};

  if (!form.pharmacyName.trim())    errs.pharmacyName   = 'Pharmacy name is required.';
  if (!form.managerName.trim())     errs.managerName    = 'Manager name is required.';

  if (!form.email.trim())           errs.email          = 'Email address is required.';
  else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address.';

  if (form.phone.trim()) {
    const d = digitCount(form.phone);
    if (d === 0)   errs.phone = 'Enter digits only (e.g. 0771234567).';
    else if (d > 10) errs.phone = 'Phone number must not exceed 10 digits.';
  }

  if (!form.address.trim())         errs.address        = 'Pharmacy address is required.';

  if (!form.licenseNumber.trim())   errs.licenseNumber  = 'License number is required.';

  if (!form.licenseDocument)        errs.licenseDocument = 'Please upload your license document.';

  return errs;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PharmacyRegisterPage() {
  const fileRef    = useRef(null);

  const [form, setForm] = useState({
    pharmacyName: '', managerName: '', email: '',
    phone: '', address: '', licenseNumber: '', licenseDocument: '',
  });
  const [docName,  setDocName]  = useState('');
  const [fieldErrs, setFieldErrs] = useState({});
  const [isBusy,   setIsBusy]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    // clear that field's error as the user types
    setFieldErrs((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setFieldErrs((p) => ({ ...p, licenseDocument: 'File must be an image (JPG/PNG) or PDF.' }));
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFieldErrs((p) => ({ ...p, licenseDocument: 'File must be under 5 MB.' }));
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((p) => ({ ...p, licenseDocument: ev.target.result }));
      setDocName(file.name);
      setFieldErrs((p) => { const n = { ...p }; delete n.licenseDocument; return n; });
    };
    reader.readAsDataURL(file);
  };

  const clearDoc = () => {
    setForm((p) => ({ ...p, licenseDocument: '' }));
    setDocName('');
    if (fileRef.current) fileRef.current.value = '';
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
      await registerPharmacy({
        ...form,
        pharmacyName: form.pharmacyName.trim(),
        managerName: form.managerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        licenseNumber: form.licenseNumber.trim(),
      });
      setSuccess(true);
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
            Pharmacy Portal
          </span>
          <h2 className="mt-4 text-3xl font-black leading-snug">Register your pharmacy</h2>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Join the MedFinder network. Upload your license document to verify your pharmacy before accessing the staff dashboard.
          </p>

          <ol className="mt-8 space-y-3">
            {[
              'Enter your pharmacy name and address.',
              "Provide the manager's name and login email.",
              'Enter your pharmacy license number.',
              'Upload a document proving your license (image or PDF).',
              'Sign in with OTP to access the pharmacy dashboard.',
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
              <p className="text-sm font-bold text-slate-400">Already registered?</p>
              <p className="mt-0.5 text-base font-semibold text-white">Sign in with OTP</p>
            </div>
            <Link to="/pharmacy/login" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-400">
              Sign in
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div>
              <p className="text-sm font-bold text-slate-400">Are you a patient?</p>
              <p className="mt-0.5 text-base font-semibold text-white">Use the patient form</p>
            </div>
            <Link to="/register" className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-white/10">
              Patient →
            </Link>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex flex-col justify-center bg-white p-8 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">New Pharmacy</p>
              <h3 className="mt-1.5 text-2xl font-black text-slate-900">Register pharmacy</h3>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Store size={21} />
            </div>
          </div>

          {success ? (
            <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center space-y-3">
              <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
              <h4 className="text-xl font-black text-slate-900">Registration submitted!</h4>
              <p className="text-base text-slate-700 font-semibold">Your application is pending admin approval.</p>
              <p className="text-sm text-slate-600">
                An admin will review your license document and approve your account.
                You will be able to sign in once approved.
              </p>
              <Link to="/" className="inline-block mt-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                Back to home
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>

              {/* Pharmacy name */}
              <Field label="Pharmacy name" required error={fieldErrs.pharmacyName}>
                <input type="text" value={form.pharmacyName} onChange={set('pharmacyName')}
                  placeholder="e.g. City Pharmacy" className={inputCls(fieldErrs.pharmacyName)} />
              </Field>

              {/* Manager */}
              <Field label="Manager / contact name" required error={fieldErrs.managerName}>
                <input type="text" value={form.managerName} onChange={set('managerName')}
                  placeholder="Full name of the manager" className={inputCls(fieldErrs.managerName)} />
              </Field>

              {/* Email */}
              <Field label="Email address" required hint="used for OTP sign-in" error={fieldErrs.email}>
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="pharmacy@example.com" className={inputCls(fieldErrs.email)} />
                <p className="mt-1 text-xs text-slate-400">Each pharmacy must use a unique email. This address cannot be shared with another pharmacy account.</p>
              </Field>

              {/* Phone */}
              <Field label="Phone number" hint="max 10 digits" error={fieldErrs.phone}>
                <input type="tel" value={form.phone} onChange={set('phone')}
                  placeholder="0711234567" maxLength={15} className={inputCls(fieldErrs.phone)} />
              </Field>

              {/* Address */}
              <Field label="Pharmacy address" required error={fieldErrs.address}>
                <textarea rows={2} value={form.address} onChange={set('address')}
                  placeholder="No. 45, Hospital Road, Colombo 07"
                  className={`${inputCls(fieldErrs.address)} resize-none`} />
              </Field>

              {/* ── License section ── */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">License verification</p>

                {/* License number */}
                <Field label="License number" required error={fieldErrs.licenseNumber}>
                  <input type="text" value={form.licenseNumber} onChange={set('licenseNumber')}
                    placeholder="e.g. PHA-2024-001234"
                    className={inputCls(fieldErrs.licenseNumber)} />
                </Field>

                {/* License document upload */}
                <Field label="License document" required hint="image or PDF" error={fieldErrs.licenseDocument}>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />

                  {form.licenseDocument ? (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <FileText size={18} className="shrink-0 text-emerald-600" />
                      <span className="flex-1 truncate text-sm font-semibold text-emerald-800">{docName}</span>
                      <button type="button" onClick={clearDoc}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 hover:bg-red-100 hover:text-red-600">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition
                        ${fieldErrs.licenseDocument
                          ? 'border-red-300 bg-red-50 text-red-500 hover:border-red-400'
                          : 'border-slate-300 bg-white text-slate-500 hover:border-emerald-400 hover:text-emerald-600'}`}>
                      <UploadCloud size={20} className="shrink-0" />
                      <span className="text-sm font-semibold">Click to upload document</span>
                    </button>
                  )}
                </Field>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isBusy}
                className="w-full rounded-xl bg-slate-900 py-3 text-base font-bold text-white transition hover:bg-slate-700 disabled:opacity-60">
                {isBusy ? 'Registering…' : 'Register pharmacy'}
              </button>

              <p className="text-center text-base text-slate-500">
                Already registered?{' '}
                <Link to="/pharmacy/login" className="font-bold text-emerald-700 hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
