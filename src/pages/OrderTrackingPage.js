import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  CircleDashed,
  Home,
  Loader2,
  Package2,
  Search,
  Store,
  Truck,
  XCircle,
} from 'lucide-react';
import { getTimelineSteps } from '../utils';
import { trackOrderByRef, trackEmergencyByRef } from '../api';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CLS = {
  Pending:            'bg-amber-100 text-amber-800',
  Approved:           'bg-sky-100 text-sky-800',
  Packing:            'bg-violet-100 text-violet-800',
  'Ready for Pickup': 'bg-emerald-100 text-emerald-800',
  Delivered:          'bg-slate-200 text-slate-800',
  Cancelled:          'bg-rose-100 text-rose-800',
  Rejected:           'bg-red-100 text-red-800',
};

function StatusBadge({ status }) {
  const cls = STATUS_CLS[status] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      {status}
    </span>
  );
}

// ── Progress stepper ──────────────────────────────────────────────────────────

function Stepper({ fulfillmentType, currentStatus }) {
  const steps = getTimelineSteps(fulfillmentType);
  const currentIdx = steps.findIndex(s => s.status === currentStatus);

  return (
    <div>
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Order progress</p>
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-start gap-0">
          {steps.map(({ status, label }, i) => {
            const done    = i < currentIdx;
            const current = i === currentIdx;
            return (
              <React.Fragment key={status}>
                <div className="flex w-24 flex-col items-center">
                  {/* Circle */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition
                    ${done    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : current ? 'bg-slate-900 text-white shadow-md'
                    :           'bg-slate-100 text-slate-400'}`}>
                    {done ? <CheckCircle2 size={18} /> : <span>{i + 1}</span>}
                  </div>
                  {/* Label */}
                  <p className={`mt-2 w-full text-center text-[11px] leading-tight
                    ${done    ? 'font-semibold text-emerald-700'
                    : current ? 'font-black text-slate-900'
                    :           'text-slate-400'}`}>
                    {label}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className={`mt-5 h-0.5 w-8 shrink-0 rounded-full transition ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ order }) {
  const { status, fulfillmentType = 'pickup' } = order;
  const isCancelled = status === 'Cancelled';
  const isRejected  = status === 'Rejected';
  const showStepper = !isCancelled && !isRejected;
  const isDelivery  = fulfillmentType === 'delivery';

  return (
    <div className="space-y-6 rounded-2xl bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {order.pharmacyName}
          </p>
          <h3 className="mt-1 text-2xl font-black text-slate-900">{order.medicineName}</h3>
          <p className="mt-0.5 text-sm font-bold text-sky-700">{order.referenceNumber}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Fulfillment type chip */}
      <div className={`flex items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-semibold
        ${isDelivery ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
        {isDelivery ? <Truck size={15} /> : <Store size={15} />}
        {isDelivery ? 'Home delivery' : 'Pharmacy pickup'}
      </div>

      {/* Delivery address */}
      {isDelivery && order.deliveryAddress && (
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm">
          <Home size={15} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="font-bold text-blue-900">Delivery address</p>
            <p className="mt-0.5 text-blue-800">{order.deliveryAddress}</p>
          </div>
        </div>
      )}

      {/* Cancelled / Rejected notices */}
      {isCancelled && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          This order was cancelled.
        </div>
      )}
      {isRejected && order.rejectionNote && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm">
          <p className="font-bold text-red-700">Rejected — reason from pharmacy:</p>
          <p className="mt-1 text-red-800">{order.rejectionNote}</p>
        </div>
      )}

      {/* Stepper */}
      {showStepper && (
        <div className="rounded-xl bg-white p-4">
          <Stepper fulfillmentType={fulfillmentType} currentStatus={status} />
        </div>
      )}

      {/* Meta */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Patient</p>
          <p className="mt-1 font-semibold text-slate-800">{order.customerName}</p>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Placed</p>
          <p className="mt-1 font-semibold text-slate-800">
            {new Date(order.createdAt).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Status guide ──────────────────────────────────────────────────────────────

const PICKUP_GUIDE = [
  {
    status: 'Order Placed',
    icon: Package2,
    color: 'bg-amber-100 text-amber-700',
    what: 'Your order has been received by the pharmacy.',
    next: 'Wait for the pharmacist to review and approve it.',
  },
  {
    status: 'Approved',
    icon: CheckCircle2,
    color: 'bg-sky-100 text-sky-700',
    what: 'The pharmacy has confirmed your order.',
    next: 'They will begin gathering and packing your medicine.',
  },
  {
    status: 'Packing',
    icon: Package2,
    color: 'bg-violet-100 text-violet-700',
    what: 'Your medicine is being prepared and packed.',
    next: 'You will be notified when it is ready to collect.',
  },
  {
    status: 'Ready for Pickup',
    icon: Store,
    color: 'bg-emerald-100 text-emerald-700',
    what: 'Your medicine is ready and waiting at the pharmacy counter.',
    next: 'Visit the pharmacy to collect your order. Bring your reference number.',
  },
  {
    status: 'Collected',
    icon: CheckCircle2,
    color: 'bg-slate-100 text-slate-700',
    what: 'You have successfully collected your medicine.',
    next: 'Your order is complete.',
  },
];

const DELIVERY_GUIDE = [
  {
    status: 'Order Placed',
    icon: Package2,
    color: 'bg-amber-100 text-amber-700',
    what: 'Your order has been received by the pharmacy.',
    next: 'Wait for the pharmacist to review and approve it.',
  },
  {
    status: 'Approved',
    icon: CheckCircle2,
    color: 'bg-sky-100 text-sky-700',
    what: 'The pharmacy has confirmed your delivery order.',
    next: 'They will begin preparing your medicine.',
  },
  {
    status: 'Packing',
    icon: Package2,
    color: 'bg-violet-100 text-violet-700',
    what: 'Your medicine is being prepared and packed for delivery.',
    next: 'A delivery will be arranged to your address.',
  },
  {
    status: 'Out for Delivery',
    icon: Truck,
    color: 'bg-blue-100 text-blue-700',
    what: 'Your medicine is on its way to your delivery address.',
    next: 'Stay available to receive it. Check the address you provided.',
  },
  {
    status: 'Delivered',
    icon: Home,
    color: 'bg-slate-100 text-slate-700',
    what: 'Your medicine has been delivered successfully.',
    next: 'Your order is complete.',
  },
];

function StatusGuide({ mode }) {
  const guide = mode === 'delivery' ? DELIVERY_GUIDE : PICKUP_GUIDE;
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Package2 size={16} className="text-emerald-600" />
        <p className="text-sm font-bold uppercase tracking-wider text-slate-700">What each status means</p>
      </div>
      <div className="space-y-4">
        {guide.map(({ status, icon: Icon, color, what, next }) => (
          <div key={status} className="flex gap-3">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon size={15} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{status}</p>
              <p className="mt-0.5 text-sm text-slate-600">{what}</p>
              <p className="mt-0.5 text-xs text-slate-400">{next}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// ── Emergency result card ─────────────────────────────────────────────────────

const EMERGENCY_STATUS_CLS = {
  Pending:      'bg-amber-100 text-amber-800',
  Acknowledged: 'bg-sky-100 text-sky-800',
  Fulfilled:    'bg-emerald-100 text-emerald-800',
  Cancelled:    'bg-rose-100 text-rose-800',
};

const EMERGENCY_STEPS = [
  { status: 'Pending',      label: 'Request Sent',   desc: 'Your emergency request has been received.' },
  { status: 'Acknowledged', label: 'Acknowledged',   desc: 'A pharmacy or admin is handling your request.' },
  { status: 'Fulfilled',    label: 'Fulfilled',       desc: 'Your medicine has been arranged and delivered.' },
];

function EmergencyResultCard({ order }) {
  const isCancelled = order.status === 'Cancelled';
  const currentIdx  = EMERGENCY_STEPS.findIndex(s => s.status === order.status);
  const displaySteps = isCancelled ? [] : EMERGENCY_STEPS;

  return (
    <div className="space-y-5 rounded-2xl bg-red-50 p-6 border border-red-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">
            ⚡ EMERGENCY
          </span>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{order.medicineName}</h3>
          <p className="mt-0.5 text-sm font-bold text-red-700">{order.referenceNumber}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ${EMERGENCY_STATUS_CLS[order.status] || 'bg-slate-100 text-slate-700'}`}>
          {order.status}
        </span>
      </div>

      {isCancelled && (
        <div className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-800">
          This emergency request was cancelled.
        </div>
      )}

      {!isCancelled && (
        <div className="rounded-xl bg-white p-4">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Request progress</p>
          <div className="flex items-start gap-0">
            {displaySteps.map(({ status, label }, i) => {
              const done    = i < currentIdx;
              const current = i === currentIdx;
              return (
                <React.Fragment key={status}>
                  <div className="flex w-24 flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition
                      ${done    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : current ? 'bg-red-600 text-white shadow-md'
                      :           'bg-slate-100 text-slate-400'}`}>
                      {done ? <CheckCircle2 size={18} /> : <span>{i + 1}</span>}
                    </div>
                    <p className={`mt-2 w-full text-center text-[11px] leading-tight
                      ${done    ? 'font-semibold text-emerald-700'
                      : current ? 'font-black text-red-700'
                      :           'text-slate-400'}`}>
                      {label}
                    </p>
                  </div>
                  {i < displaySteps.length - 1 && (
                    <div className={`mt-5 h-0.5 w-8 shrink-0 rounded-full ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin messages */}
      {order.adminMessages?.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-700">Updates from our team</p>
          {order.adminMessages.map((msg, i) => (
            <div key={i} className="text-sm text-slate-700">
              <span className="text-xs text-slate-400 mr-2">{new Date(msg.sentAt).toLocaleString()}</span>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {order.acknowledgedBy && (
        <div className="text-sm text-slate-500">
          Handled by: <span className="font-semibold text-slate-700">{order.acknowledgedBy}</span>
          {order.preferredPharmacy && <> · Pharmacy: <span className="font-semibold text-slate-700">{order.preferredPharmacy}</span></>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Patient</p>
          <p className="mt-1 font-semibold text-slate-800">{order.contactName}</p>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Placed</p>
          <p className="mt-1 font-semibold text-slate-800">
            {new Date(order.createdAt).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const [reference,    setReference] = useState('');
  const [searched,     setSearched]  = useState(false);
  const [loading,      setLoading]   = useState(false);
  const [order,        setOrder]     = useState(null);
  const [emergency,    setEmergency] = useState(null); // emergency order result
  const [notFound,     setNotFound]  = useState(false);
  const [guideMode,    setGuideMode] = useState('pickup');

  const isEmergencyRef = (ref) => ref.trim().toUpperCase().startsWith('EMG-');

  const doSearch = async (ref) => {
    const clean = (ref || reference).trim();
    if (!clean) return;
    setLoading(true);
    setSearched(true);
    setOrder(null);
    setEmergency(null);
    setNotFound(false);
    try {
      if (isEmergencyRef(clean)) {
        const data = await trackEmergencyByRef(clean);
        setEmergency(data);
      } else {
        const data = await trackOrderByRef(clean);
        setOrder(data);
        if (data?.fulfillmentType) setGuideMode(data.fulfillmentType);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if reference is in URL
  useEffect(() => {
    const r = searchParams.get('reference') || '';
    if (r) {
      setReference(r);
      doSearch(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch();
  };

  const handleClear = () => {
    setReference('');
    setSearched(false);
    setOrder(null);
    setEmergency(null);
    setNotFound(false);
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">No login required</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">Track your order</h1>
        <p className="mx-auto mt-3 max-w-lg text-slate-600">
          Enter your reference number to see the live status of your medicine order. You do not need an account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">

        {/* ── Search + result ── */}
        <div className="space-y-5">
          <div className="rounded-[2rem] bg-white p-6 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Reference number
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. MF-ABC123 or EMG-ABC123"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Medicine orders start with <strong>MF-</strong>, emergency requests start with <strong>EMG-</strong>.
                </p>
                {reference.trim() && !/^(MF|EMG)-/i.test(reference.trim()) && (
                  <p className="mt-1 text-xs font-semibold text-amber-600">
                    That doesn't look like a MedFinder reference number, but you can still search.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={!reference.trim() || loading}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-50">
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Searching…</>
                    : <><Search size={15} /> Track Order</>}
                </button>
                {searched && (
                  <button type="button" onClick={handleClear}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Result */}
          {!searched && (
            <div className="rounded-2xl bg-slate-50 py-12 text-center text-sm text-slate-400">
              Enter a reference number above to track your order.
            </div>
          )}

          {searched && loading && (
            <div className="rounded-2xl bg-slate-50 py-12 text-center text-sm text-slate-500">
              <Loader2 size={24} className="mx-auto animate-spin text-emerald-500" />
              <p className="mt-3">Looking up your order…</p>
            </div>
          )}

          {searched && !loading && notFound && (
            <div className="rounded-2xl bg-red-50 py-10 text-center">
              <XCircle size={40} className="mx-auto text-red-300" />
              <p className="mt-3 text-base font-bold text-red-700">Order not found</p>
              <p className="mt-1 text-sm text-red-600">
                Double-check the reference number and try again.
                <br />
                Reference numbers look like <span className="font-bold">MF-A1B2C3</span>.
              </p>
            </div>
          )}

          {order     && !loading && <ResultCard order={order} />}
          {emergency && !loading && <EmergencyResultCard order={emergency} />}
        </div>

        {/* ── Guide panel ── */}
        <div className="space-y-4">
          {/* Pickup / Delivery toggle for guide */}
          <div className="flex gap-2 rounded-2xl bg-white p-3 shadow-sm">
            {[
              { key: 'pickup',   label: 'Pickup guide',   icon: Store },
              { key: 'delivery', label: 'Delivery guide', icon: Truck },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setGuideMode(key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition
                  ${guideMode === key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-50'}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          <StatusGuide mode={guideMode} />

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-700">Where is my reference number?</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <CircleDashed size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>Shown on the confirmation screen immediately after you placed your order.</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <CircleDashed size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>Listed in <strong>My Orders</strong> inside your patient dashboard if you have an account.</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <CircleDashed size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>Starts with <strong>MF-</strong> followed by letters and numbers (e.g. MF-A1B2C3).</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
