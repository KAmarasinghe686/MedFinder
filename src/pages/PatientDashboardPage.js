import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Copy,
  FileText,
  LayoutDashboard,
  LogOut,
  Package2,
  Paperclip,
  ShieldCheck,
  ShoppingCart,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { canCancelOrder, cancelTimeLeft, formatReservationDate, ORDER_TIMELINE } from '../utils';
import { updateProfile } from '../api';
import PrescriptionUploadPage from './PrescriptionUploadPage';
import { openFileData } from '../utils/openFileData';

const prescriptionStorageKey = 'medfinder_prescriptions';

const loadStoredPrescriptions = () => {
  try {
    const stored = localStorage.getItem(prescriptionStorageKey);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const getPrescriptionStatus = (status) => {
  if (status === 'Pending') return 'Received';
  if (['Approved', 'Packing'].includes(status)) return 'Under Review';
  if (['Ready for Pickup', 'Delivered'].includes(status)) return 'Ready for Pickup';
  return status || 'Received';
};

const STATUS_TONE = {
  Pending:          'bg-amber-100 text-amber-800 ring-amber-200',
  Approved:         'bg-sky-100 text-sky-800 ring-sky-200',
  Packing:          'bg-violet-100 text-violet-800 ring-violet-200',
  'Ready for Pickup':'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Delivered:        'bg-slate-200 text-slate-800 ring-slate-300',
  Cancelled:        'bg-rose-100 text-rose-800 ring-rose-200',
  Rejected:         'bg-red-100 text-red-800 ring-red-200',
};

const PRESCRIPTION_STATUS_TONE = {
  Received:          'bg-sky-100 text-sky-800 ring-sky-200',
  'Under Review':    'bg-amber-100 text-amber-800 ring-amber-200',
  'Ready for Pickup':'bg-emerald-100 text-emerald-800 ring-emerald-200',
};

const ORDER_FILTERS = ['All', 'Pending', 'Approved', 'Packing', 'Ready for Pickup', 'Delivered', 'Cancelled', 'Rejected'];

const getInitials = (v) =>
  v ? v.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') : 'P';

const getName = (authUser) => authUser?.name || authUser?.email || 'Patient';

const NAV = [
  { key: 'overview',      label: 'Overview',       icon: LayoutDashboard },
  { key: 'order-medicine', label: 'Order Medicine', icon: ShoppingCart },
  { key: 'orders',        label: 'My Orders',       icon: Package2 },
  { key: 'prescriptions', label: 'Prescriptions',   icon: FileText },
  { key: 'profile',       label: 'Profile',         icon: UserCircle2 },
];

// ─────────────────────────── Overview ──────────────────────────────────────

function SectionOverview({ authUser, patientName, initials, reservations, prescriptions }) {
  const activeOrders = reservations.filter((r) => !['Delivered', 'Cancelled', 'Rejected'].includes(r.status));
  const readyOrders  = reservations.filter((r) => r.status === 'Ready for Pickup');

  const stats = [
    { label: 'Open orders',           value: activeOrders.length, hint: 'In progress',          icon: Package2 },
    { label: 'Ready for pickup',       value: readyOrders.length,  hint: 'Go collect now',       icon: BellRing },
    { label: 'Prescriptions uploaded', value: prescriptions.length,hint: 'From your order history', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-black text-emerald-700">
          {initials}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Patient Dashboard</p>
          <h1 className="text-2xl font-black text-slate-900">Welcome back, {patientName}</h1>
          <p className="text-sm text-slate-500">{authUser?.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{hint}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick actions</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              to: '/search',
              label: 'Search medicines',
              hint: 'Check live stock at nearby pharmacies.',
              img: 'https://blog.ipleaders.in/wp-content/uploads/2020/08/Online-pharmacy-1200x600-1.jpg',
              accent: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100',
            },
            {
              to: '/track-order',
              label: 'Track order',
              hint: 'Follow your order status in real time.',
              img: 'https://media.lordicon.com/icons/wired/outline/1352-track-order.svg',
              accent: 'bg-sky-50 border-sky-200 hover:border-sky-400 hover:bg-sky-100',
            },
            {
              to: '/order-your-prescription',
              label: 'Order medicine',
              hint: 'OTC or upload a prescription to order.',
              img: 'https://www.vrinthehealthcare.com/wp-content/uploads/2025/02/img-main.png',
              accent: 'bg-violet-50 border-violet-200 hover:border-violet-400 hover:bg-violet-100',
            },
            {
              to: '/contact',
              label: 'Get support',
              hint: 'Send a message to our support team.',
              img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=160&q=70',
              accent: 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100',
            },
          ].map(({ to, label, hint, img, accent }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-4 rounded-xl border p-3.5 transition ${accent}`}>
              <img
                src={img}
                alt={label}
                className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">{hint}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-5 py-4">
        <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-bold text-white">Verified patient login</p>
          <p className="text-xs text-slate-400">Your session is secured with OTP</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Orders ────────────────────────────────────────

function SectionOrders({
  reservations,
  onCancelReservation,
  onCancelPrescriptionOrder,
  onConfirmReservationReceived,
}) {
  const [filter, setFilter] = useState('All');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [cancelledIds, setCancelledIds] = useState(new Set());
  const [receivingId, setReceivingId] = useState(null);
  const [receiveError, setReceiveError] = useState('');
  const [copiedRef, setCopiedRef] = useState('');

  const filtered = useMemo(
    () => filter === 'All' ? reservations : reservations.filter((r) => r.status === filter),
    [reservations, filter]
  );

  const handleCancel = async (id) => {
    setCancellingId(id);
    setCancelError('');
    const order = reservations.find((item) => item.id === id);
    const result = order?.isPrescriptionOrder
      ? onCancelPrescriptionOrder(id)
      : await onCancelReservation(id);
    setCancellingId(null);
    if (result === true) {
      setCancelledIds((prev) => new Set([...prev, id]));
    } else {
      setCancelError(result || 'Could not cancel. Please try again.');
    }
  };

  const copyRef = (ref) => {
    navigator.clipboard?.writeText(ref).catch(() => {});
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(''), 2000);
  };

  const handleConfirmReceived = async (id) => {
    setReceivingId(id);
    setReceiveError('');
    const result = await onConfirmReservationReceived(id);
    setReceivingId(null);
    if (result !== true) {
      setReceiveError(result || 'Could not confirm receipt. Please try again.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">My Orders</h2>
        <p className="mt-1 text-sm text-slate-500">Track all your medicine reservations.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ORDER_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition
              ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {cancelError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={15} /> {cancelError}
        </div>
      )}
      {receiveError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={15} /> {receiveError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-base font-bold text-slate-700">No {filter !== 'All' ? filter.toLowerCase() : ''} orders</p>
          <p className="mt-1 text-sm text-slate-500">
            {filter === 'All' ? 'Search for medicine and make a reservation.' : 'Try a different filter.'}
          </p>
          {filter === 'All' && (
            <Link to="/search" className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700">
              Search medicines
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const statusCls = STATUS_TONE[r.status] || 'bg-slate-100 text-slate-700 ring-slate-200';
            const timeLeft  = canCancelOrder(r) ? cancelTimeLeft(r) : null;
            const isActive  = ORDER_TIMELINE.includes(r.status);
            const stepIdx   = ORDER_TIMELINE.indexOf(r.status);
            const canConfirmReceived = !r.isPrescriptionOrder && r.status === 'Ready for Pickup';
            const showConfirmReceived = !r.isPrescriptionOrder
              && ['Pending', 'Approved', 'Packing', 'Ready for Pickup'].includes(r.status);

            return (
              <article key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {r.pharmacyName || r.pharmacy}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">{r.medicineName}</h3>
                    <p className="text-sm text-slate-500">{formatReservationDate(r.createdAt)}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusCls}`}>
                    {r.status}
                  </span>
                </div>

                {/* Reference number */}
                {r.referenceNumber && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5">
                    <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Ref</span>
                    <span className="font-black text-sky-900">{r.referenceNumber}</span>
                    <button
                      onClick={() => copyRef(r.referenceNumber)}
                      className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                    >
                      <Copy size={12} />
                      {copiedRef === r.referenceNumber ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}

                {/* Rejection note */}
                {r.status === 'Rejected' && r.rejectionNote && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3">
                    <XCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
                    <div>
                      <p className="text-xs font-bold text-red-700">Rejection reason</p>
                      <p className="mt-0.5 text-sm text-red-800">{r.rejectionNote}</p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {isActive && (
                  <div className="mt-4 rounded-xl bg-white p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Order progress</p>
                    <div className="overflow-x-auto pb-1">
                      <div className="flex min-w-max items-start">
                        {ORDER_TIMELINE.map((step, i) => {
                          const done    = i < stepIdx;   // fully completed steps
                          const current = i === stepIdx; // step patient is on now
                          return (
                            <React.Fragment key={step}>
                              {/* Step node */}
                              <div className="flex w-[4.5rem] flex-col items-center">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ring-2 ring-offset-1 transition
                                  ${done    ? 'bg-emerald-500 text-white ring-emerald-300'
                                  : current ? 'bg-slate-900 text-white ring-slate-300'
                                  :           'bg-slate-100 text-slate-400 ring-slate-100'}`}
                                >
                                  {done ? '✓' : i + 1}
                                </div>
                                <p className={`mt-1.5 w-full text-center text-[10px] leading-tight transition
                                  ${done    ? 'font-semibold text-emerald-700'
                                  : current ? 'font-black text-slate-900'
                                  :           'font-medium text-slate-400'}`}
                                >
                                  {step}
                                </p>
                              </div>
                              {/* Connector line — green only when the step before it is done */}
                              {i < ORDER_TIMELINE.length - 1 && (
                                <div className={`mt-3.5 h-0.5 w-6 shrink-0 rounded-full transition
                                  ${done ? 'bg-emerald-400' : 'bg-slate-200'}`}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Price', value: r.price || 'See pharmacy' },
                    { label: 'Phone', value: r.customerPhone },
                    { label: 'Notes', value: r.notes || 'No notes' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Cancel button */}
                {r.status !== 'Cancelled' && !cancelledIds.has(r.id) && (r.isPrescriptionOrder || timeLeft) && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {!r.isPrescriptionOrder && (
                      <span className="text-xs text-slate-500">Cancel window: {timeLeft} remaining</span>
                    )}
                    <button
                      disabled={cancellingId === r.id}
                      onClick={() => handleCancel(r.id)}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {cancellingId === r.id ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                  </div>
                )}
                {cancelledIds.has(r.id) && (
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 size={15} /> Order cancelled
                  </div>
                )}

                {showConfirmReceived && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      disabled={!canConfirmReceived || receivingId === r.id}
                      onClick={() => handleConfirmReceived(r.id)}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {receivingId === r.id ? 'Confirming...' : 'Confirm received'}
                    </button>
                    {!canConfirmReceived && (
                      <span className="text-xs text-slate-500">
                        Available when the order is ready.
                      </span>
                    )}
                  </div>
                )}

                {r.status === 'Delivered' && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <CheckCircle2 size={16} />
                    Order received
                    {r.patientConfirmedReceivedAt && (
                      <span className="font-medium text-emerald-600">
                        · Confirmed {formatReservationDate(r.patientConfirmedReceivedAt)}
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Prescriptions ─────────────────────────────────

function SectionPrescriptions({ prescriptions }) {
  const timeline = ['Received', 'Under Review', 'Ready for Pickup'];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Uploaded Prescriptions</h2>
        <p className="mt-1 text-sm text-slate-500">Prescription files you have submitted with your orders.</p>
      </div>
      {prescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Paperclip size={32} className="mx-auto text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-700">No prescriptions yet</p>
          <Link to="/order-your-prescription" className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700">
            Upload prescription
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((item) => {
            const tone = PRESCRIPTION_STATUS_TONE[item.status] || 'bg-slate-100 text-slate-700 ring-slate-200';
            const stepIdx = timeline.indexOf(item.status);
            return (
              <article key={item.reference} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.reference}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">{item.medicine}</h3>
                    <p className="text-sm text-slate-500">{item.branch} · {item.patientName}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${tone}`}>{item.status}</span>
                </div>
                {item.fileName && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <Paperclip size={17} className="shrink-0 text-emerald-600" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                      {item.fileName}
                    </span>
                    {item.fileData && (
                      <button
                        type="button"
                        onClick={() => openFileData(item.fileData, item.fileName)}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        View file
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {timeline.map((step, i) => {
                    const isDone = i <= stepIdx;
                    return (
                      <React.Fragment key={step}>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold
                          ${i === stepIdx ? 'bg-slate-900 text-white' : isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {step}
                        </span>
                        {i < timeline.length - 1 && <span className={`text-xs ${isDone ? 'text-emerald-400' : 'text-slate-300'}`}>→</span>}
                      </React.Fragment>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-400">{formatReservationDate(item.createdAt)}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Profile ───────────────────────────────────────

function SectionProfile({ authUser, authToken, onProfileUpdate }) {
  const [form, setForm] = useState({
    name:    authUser?.name    || '',
    phone:   authUser?.phone   || '',
    address: authUser?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [saved, setSaved]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSaved(false); setSaving(true);
    try {
      const data = await updateProfile(form, authToken);
      if (onProfileUpdate) onProfileUpdate(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Edit Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Update your name, phone number, and address.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Email address</p>
        <p className="mt-1 text-base font-semibold text-slate-800">{authUser?.email}</p>
        <p className="mt-0.5 text-xs text-slate-400">Email cannot be changed</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Full name',    field: 'name',  type: 'text', placeholder: 'Your full name',  required: true },
          { label: 'Phone number', field: 'phone', type: 'tel',  placeholder: '+94 77 000 0000', required: false },
        ].map(({ label, field, type, placeholder, required }) => (
          <div key={field}>
            <label className="mb-1.5 block text-sm font-bold text-slate-600">
              {label}{required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <input
              required={required} type={type}
              value={form[field]}
              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
              placeholder={placeholder}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        ))}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-600">Home address <span className="ml-1 text-red-500">*</span></label>
          <textarea required rows={2} value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="No. 12, Main Street, Colombo 03"
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} /> Profile saved successfully
          </div>
        )}
        <button type="submit" disabled={saving}
          className="w-full rounded-xl bg-slate-900 py-3 text-base font-bold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────── Main ──────────────────────────────────────────

export default function PatientDashboardPage({
  authUser,
  authToken,
  pharmacies = [],
  medicines = [],
  reservations = [],
  onLogout,
  onProfileUpdate,
  onCancelReservation,
  onConfirmReservationReceived,
  onCreatePrescriptionOrder,
}) {
  const [section, setSection] = useState('overview');
  const [prescriptions, setPrescriptions] = useState(() => loadStoredPrescriptions());
  const patientName   = getName(authUser);
  const initials      = getInitials(patientName);

  const legacyPrescriptions = useMemo(() => {
    const userId = String(authUser?.id || authUser?._id || '').trim();
    const email = String(authUser?.email || '').trim().toLowerCase();
    const name = String(authUser?.name || '').trim().toLowerCase();

    return prescriptions.filter((item) => {
      const itemUserId = String(item.userId || '').trim();
      const itemEmail = String(item.email || item.patientEmail || '').trim().toLowerCase();
      const itemName = String(item.patientName || '').trim().toLowerCase();

      if (itemUserId && userId) return itemUserId === userId;
      if (itemEmail && email) return itemEmail === email;
      return Boolean(itemName && name && itemName === name);
    });
  }, [authUser, prescriptions]);

  const uploadedPrescriptions = useMemo(() => {
    const byReference = new Map();

    legacyPrescriptions.forEach((item) => {
      const reference = item.reference || item.referenceNumber || item.id;
      if (!reference) return;
      byReference.set(String(reference), {
        ...item,
        reference,
        fileName: item.fileName || item.prescriptionFileName || '',
        fileData: item.fileData || item.prescriptionData || '',
        status: getPrescriptionStatus(item.status),
      });
    });

    reservations
      .filter((reservation) => reservation.prescriptionData || reservation.prescriptionFileName)
      .forEach((reservation) => {
        const reference = reservation.referenceNumber || reservation.id || reservation._id;
        if (!reference) return;
        byReference.set(String(reference), {
          id: reservation.id || reservation._id || reference,
          reference,
          medicine: reservation.medicineName || 'Prescription order',
          branch: reservation.pharmacyName || reservation.pharmacy || 'Selected pharmacy',
          patientName: reservation.customerName || patientName,
          status: getPrescriptionStatus(reservation.status),
          createdAt: reservation.createdAt,
          fileName: reservation.prescriptionFileName || 'Uploaded prescription',
          fileData: reservation.prescriptionData || '',
          source: 'server',
        });
      });

    return [...byReference.values()]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [legacyPrescriptions, patientName, reservations]);

  // Reservations are already server-filtered by userId — use directly
  const prescriptionOrders = useMemo(
    () => legacyPrescriptions
      .filter((item) => !reservations.some((reservation) => reservation.referenceNumber === item.reference))
      .map((item) => ({
      id: item.id || item.reference,
      referenceNumber: item.reference,
      pharmacyName: item.branch,
      medicineName: item.medicine,
      customerPhone: item.phone,
      notes: item.notes,
      status: item.status === 'Received' ? 'Pending' : item.status,
      createdAt: item.createdAt,
      isPrescriptionOrder: true,
      })),
    [legacyPrescriptions, reservations]
  );
  const sortedReservations = useMemo(
    () => [...reservations, ...prescriptionOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [prescriptionOrders, reservations]
  );


  const handleCancelPrescriptionOrder = (id) => {
    const nextPrescriptions = prescriptions.map((item) =>
      (item.id || item.reference) === id ? { ...item, status: 'Cancelled' } : item
    );
    localStorage.setItem(prescriptionStorageKey, JSON.stringify(nextPrescriptions));
    setPrescriptions(nextPrescriptions);
    return true;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
      <div className="flex min-h-[620px] overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">

        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col bg-slate-950 lg:flex">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-base font-black text-emerald-300">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400">Patient</p>
                <p className="truncate text-sm font-bold text-white">{patientName}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 p-3">
            {NAV.map(({ key, label, icon: Icon, to }) => (
              to ? (
                <Link key={key} to={to}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
                  <Icon size={16} />{label}
                </Link>
              ) : (
                <button key={key} onClick={() => setSection(key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition
                    ${section === key ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon size={16} />{label}
                </button>
              )
            ))}
          </nav>
          <div className="border-t border-white/10 p-3">
            <button onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">
              <LogOut size={16} />Sign out
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col bg-white">
          {/* Mobile tabs */}
          <div className="flex overflow-x-auto border-b border-slate-200 lg:hidden">
            {NAV.map(({ key, label, icon: Icon, to }) => (
              to ? (
                <Link key={key} to={to}
                  className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-emerald-700">
                  <Icon size={15} />{label}
                </Link>
              ) : (
                <button key={key} onClick={() => setSection(key)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition
                    ${section === key ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  <Icon size={15} />{label}
                </button>
              )
            ))}
            <button onClick={onLogout} className="ml-auto flex shrink-0 items-center gap-1.5 px-4 py-3 text-sm text-slate-400 hover:text-slate-600">
              <LogOut size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 lg:p-8">
            {section === 'overview' && (
              <SectionOverview authUser={authUser} patientName={patientName} initials={initials}
                reservations={sortedReservations} prescriptions={uploadedPrescriptions} />
            )}
            {section === 'orders' && (
              <SectionOrders
                reservations={sortedReservations}
                onCancelReservation={onCancelReservation}
                onCancelPrescriptionOrder={handleCancelPrescriptionOrder}
                onConfirmReservationReceived={onConfirmReservationReceived}
              />
            )}
            {section === 'order-medicine' && (
              <PrescriptionUploadPage
                pharmacies={pharmacies}
                medicines={medicines}
                authUser={authUser}
                onCreatePrescriptionOrder={onCreatePrescriptionOrder}
              />
            )}
            {section === 'prescriptions' && <SectionPrescriptions prescriptions={uploadedPrescriptions} />}
            {section === 'profile' && (
              <SectionProfile authUser={authUser} authToken={authToken} onProfileUpdate={onProfileUpdate} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
