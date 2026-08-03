import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileText,
  ImagePlus,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  Package2,
  Paperclip,
  PencilLine,
  Phone,
  PlusCircle,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  ShieldX,
  Store,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { formatReservationDate, RESERVATION_STATUSES, digitCount, isValidEmail, isValidLatLng } from '../utils';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const emptyMedicineDraft = { name: '', brandName: '', category: '', price: '', quantity: 0, available: true, image: '', description: '', requiresPrescription: false };
const emptyProfileDraft  = { name: '', location: '', tel: '', open: '', days: '', lat: '', lng: '', image: '', description: '', contactEmail: '', whatsapp: '', licenseNumber: '' };

const normalizePharmacyName = (value) => String(value || '').trim().toLowerCase();
const isUnacknowledgedEmergency = (order) =>
  String(order?.status || 'Pending').trim().toLowerCase() === 'pending';

const samePharmacy = (item, authUser) => {
  const itemPharmacyId = item.pharmacyId || item.pharmacy_id;
  const userPharmacyId = authUser?.pharmacyId;
  const itemPharmacyName = item.pharmacy || item.pharmacyName || item.preferredPharmacy;
  const userPharmacyName = authUser?.pharmacyName;
  const idsMatch =
    itemPharmacyId &&
    userPharmacyId &&
    String(itemPharmacyId) === String(userPharmacyId);
  const namesMatch =
    itemPharmacyName &&
    userPharmacyName &&
    normalizePharmacyName(itemPharmacyName) === normalizePharmacyName(userPharmacyName);

  return Boolean(idsMatch || namesMatch);
};

const getDisplayName = (authUser, pharmacyProfile) =>
  pharmacyProfile?.name || authUser?.pharmacyName || 'Pharmacy';

const PHARMACY_NAV = [
  { key: 'overview',   label: 'Overview',      icon: LayoutDashboard },
  { key: 'orders',     label: 'Orders',        icon: ClipboardList },
  { key: 'catalog',    label: 'Medicine List', icon: ListChecks },
  { key: 'medicines',  label: 'Medicines',     icon: Package2 },
  { key: 'profile',    label: 'Profile',       icon: Store },
  { key: 'analytics',  label: 'Analytics',     icon: BarChart3 },
];

const ADMIN_NAV = [
  { key: 'overview',     label: 'Overview',     icon: LayoutDashboard },
  { key: 'pharmacies',   label: 'Pharmacies',   icon: Store },
  { key: 'medicines',    label: 'Medicines',    icon: Package2 },
  { key: 'reservations', label: 'Reservations', icon: ClipboardList },
  { key: 'emergency',    label: 'Emergency',    icon: Zap },
  { key: 'support',      label: 'Support Inbox', icon: MessageSquare },
];

// ── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ nav, section, setSection, displayName, role, onLogout, badges = {} }) {
  const initials = displayName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  return (
    <aside className="hidden w-56 shrink-0 flex-col bg-slate-950 lg:flex">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-base font-black text-emerald-300">
            {initials || (role === 'admin' ? 'A' : 'P')}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 capitalize">{role}</p>
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition
              ${section === key ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Icon size={16} />
            <span className="flex-1 text-left">{label}</span>
            {badges[key] > 0 && (
              <span
                aria-label={`${badges[key]} notification${badges[key] === 1 ? '' : 's'} for ${label}`}
                title={`${badges[key]} unacknowledged emergency request${badges[key] === 1 ? '' : 's'}`}
                className="inline-flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-red-400/30"
              >
                {badges[key]}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">
          <LogOut size={16} />Sign out
        </button>
      </div>
    </aside>
  );
}

function MobileTabBar({ nav, section, setSection, onLogout, badges = {} }) {
  return (
    <div className="flex overflow-x-auto border-b border-slate-200 bg-white lg:hidden">
      {nav.map(({ key, label, icon: Icon }) => (
        <button key={key} onClick={() => setSection(key)}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition
            ${section === key ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Icon size={15} />{label}
          {badges[key] > 0 && (
            <span
              aria-label={`${badges[key]} notification${badges[key] === 1 ? '' : 's'} for ${label}`}
              title={`${badges[key]} unacknowledged emergency request${badges[key] === 1 ? '' : 's'}`}
              className="inline-flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-red-400/30"
            >
              {badges[key]}
            </span>
          )}
        </button>
      ))}
      <button onClick={onLogout} className="ml-auto flex shrink-0 items-center gap-1.5 px-4 py-3 text-sm text-slate-400 hover:text-slate-600">
        <LogOut size={15} />
      </button>
    </div>
  );
}

// ── Prescription viewer modal ────────────────────────────────────────────────

function PrescriptionModal({ data, fileName, onClose }) {
  if (!data) return null;
  const isImage = data.startsWith('data:image/');
  const isPdf   = data.startsWith('data:application/pdf');
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Prescription</p>
            <p className="mt-0.5 text-base font-bold text-slate-900 truncate max-w-sm">{fileName || 'Uploaded file'}</p>
          </div>
          <div className="flex gap-2">
            <a href={data} download={fileName || 'prescription'} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Download size={16} />
            </a>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isImage && <img src={data} alt="Prescription" className="mx-auto max-w-full rounded-xl" />}
          {isPdf && <iframe src={data} title="Prescription PDF" className="h-[60vh] w-full rounded-xl border border-slate-200" />}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <Paperclip size={40} className="text-slate-300" />
              <p className="text-base font-bold text-slate-700">Cannot preview this file type</p>
              <a href={data} download={fileName || 'prescription'} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Image upload box ─────────────────────────────────────────────────────────

function ImageUploadBox({ value, onChange, label = 'Upload photo', height = 'h-36' }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div
        onClick={() => inputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 transition hover:border-emerald-400 ${height}`}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 opacity-0 transition group-hover:opacity-100">
                Change photo
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-slate-400 transition group-hover:text-emerald-500">
            <ImagePlus size={24} />
            <p className="text-center text-xs font-semibold leading-tight">{label}</p>
          </div>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
          className="mt-1 text-xs font-semibold text-red-500 hover:underline"
        >
          Remove
        </button>
      )}
    </div>
  );
}

// ── Pharmacy sections ────────────────────────────────────────────────────────

function PharmacyOverview({ analytics, medicineCount, displayName }) {
  const stats = [
    { label: 'Medicine catalog', value: medicineCount,           hint: 'Items you manage',     icon: Package2 },
    { label: 'Orders received',  value: analytics.totalOrders,   hint: 'Patient reservations', icon: BellRing },
    { label: 'Available stock',  value: analytics.totalQuantity, hint: 'Units across items',   icon: ClipboardList },
    { label: 'Low stock items',  value: analytics.lowStockCount, hint: 'Needs refill soon',    icon: AlertTriangle },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Pharmacy workspace</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">{displayName}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{hint}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-5 py-4">
        <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-bold text-white">Verified pharmacy access</p>
          <p className="text-xs text-slate-400">Authenticated with OTP</p>
        </div>
      </div>
    </div>
  );
}

function PharmacyOrders({
  sortedReservations,
  emergencyOrders = [],
  onReservationStatusChange,
  onReservationRemove,
  onEmergencyOrderUpdate,
  displayName,
}) {
  const [tab, setTab]                   = useState('orders');
  const [prescriptionView, setPrescriptionView] = useState(null); // { data, fileName }
  const [rejectingId, setRejectingId]   = useState(null);
  const [rejectNote, setRejectNote]     = useState('');
  const [actionMsg, setActionMsg]       = useState('');

  const handleApprove = async (id) => {
    setActionMsg('');
    await onReservationStatusChange(id, 'Approved');
    setActionMsg('Order approved — reference number generated.');
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleReject = async (id) => {
    if (!rejectNote.trim()) return;
    setActionMsg('');
    await onReservationStatusChange(id, 'Rejected', { rejectionNote: rejectNote.trim() });
    setRejectingId(null);
    setRejectNote('');
    setActionMsg('Order rejected with note sent to patient.');
    setTimeout(() => setActionMsg(''), 3000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Orders & Requests</h2>
        <p className="mt-1 text-sm text-slate-500">Review prescriptions, approve or reject patient orders.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {[
          { key: 'orders',    label: `Patient Orders (${sortedReservations.length})` },
          { key: 'emergency', label: `Emergency Requests (${emergencyOrders.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition
              ${tab === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {key === 'emergency' && emergencyOrders.filter(e => e.status === 'Pending').length > 0 && (
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                {emergencyOrders.filter(e => e.status === 'Pending').length}
              </span>
            )}
            {label}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={15} /> {actionMsg}
        </div>
      )}

      {tab === 'orders' && (
        sortedReservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-base font-bold text-slate-700">No reservations yet</p>
            <p className="mt-1 text-sm text-slate-500">New patient orders will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReservations.map((r) => (
              <article key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{r.medicineName}</h3>
                    <p className="text-sm text-slate-500">{r.customerName} · {r.customerPhone}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatReservationDate(r.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={r.status}
                      onChange={(e) => onReservationStatusChange(r.id, e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900 outline-none"
                    >
                      {RESERVATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => onReservationRemove(r.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      Remove
                    </button>
                  </div>
                </div>

                {/* Reference number / rejection note */}
                {r.referenceNumber && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2">
                    <span className="text-xs font-bold text-sky-600 uppercase">Ref</span>
                    <span className="font-black text-sky-900">{r.referenceNumber}</span>
                    <span className="ml-auto text-xs text-sky-600">Share this with the patient</span>
                  </div>
                )}
                {r.status === 'Rejected' && r.rejectionNote && (
                  <div className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
                    <span className="font-bold">Rejection note:</span> {r.rejectionNote}
                  </div>
                )}

                {/* Notes */}
                {r.notes && (
                  <div className="mt-3 rounded-xl bg-white px-4 py-2 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">Patient notes:</span> {r.notes}
                  </div>
                )}

                {/* Action row */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                  {/* Prescription view */}
                  {r.prescriptionData ? (
                    <button
                      onClick={() => setPrescriptionView({ data: r.prescriptionData, fileName: r.prescriptionFileName })}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      <Paperclip size={13} /> View Prescription
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No prescription</span>
                  )}

                  {/* Approve / Reject (only for Pending) */}
                  {r.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button
                        onClick={() => { setRejectingId(r.id); setRejectNote(''); }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                      >
                        <X size={13} /> Reject
                      </button>
                    </>
                  )}
                </div>

                {/* Rejection note input */}
                {rejectingId === r.id && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={2}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Reason for rejection (shown to patient)…"
                      className="w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                    <div className="flex gap-2">
                      <button
                        disabled={!rejectNote.trim()}
                        onClick={() => handleReject(r.id)}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        Confirm rejection
                      </button>
                      <button onClick={() => setRejectingId(null)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )
      )}

      {tab === 'emergency' && (
        emergencyOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <Zap size={32} className="mx-auto text-slate-300" />
            <p className="mt-4 text-base font-bold text-slate-700">No emergency requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emergencyOrders.map((e) => (
              <article key={e._id} className={`rounded-2xl border p-5 ${e.status === 'Pending' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">
                        <Zap size={11} /> EMERGENCY
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold
                        ${e.status === 'Pending' ? 'bg-amber-100 text-amber-800' : e.status === 'Acknowledged' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'}`}>
                        {e.status}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-black text-slate-900">{e.medicineName}</h3>
                    <p className="text-sm text-slate-600">{e.contactName} · {e.contactPhone}</p>
                    <p className="text-sm text-slate-500">{e.deliveryAddress}</p>
                    {e.preferredPharmacy && <p className="text-xs text-emerald-700 font-semibold">Prefers: {e.preferredPharmacy}</p>}
                    {e.notes && <p className="mt-1 text-sm text-slate-500">Notes: {e.notes}</p>}
                    <p className="mt-1 text-xs text-slate-400">{formatReservationDate(e.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {e.status === 'Pending' && (
                      <button
                        onClick={() => onEmergencyOrderUpdate(e._id, { status: 'Acknowledged', acknowledgedBy: displayName })}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                      >
                        Acknowledge
                      </button>
                    )}
                    {e.status === 'Acknowledged' && (
                      <button
                        onClick={() => onEmergencyOrderUpdate(e._id, { status: 'Fulfilled' })}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        Mark Fulfilled
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {prescriptionView && (
        <PrescriptionModal data={prescriptionView.data} fileName={prescriptionView.fileName} onClose={() => setPrescriptionView(null)} />
      )}
    </div>
  );
}

const MEDICINE_SUCCESS_MESSAGES = new Set(['Medicine created successfully.', 'Medicine removed.']);

const validateMedicineDraft = (d) => {
  if (!String(d.name || '').trim()) return 'Medicine name is required.';
  if (String(d.name).trim().length > 150) return 'Medicine name must be 150 characters or fewer.';
  if (!String(d.price || '').trim()) return 'Price is required.';
  const qty = Number(d.quantity);
  if (!Number.isFinite(qty) || qty < 0) return 'Quantity must be zero or greater.';
  return null;
};

function PharmacyMedicines({
  pharmacyMedicines, medicineDraft, setMedicineDraft,
  medicineEdits, setMedicineEdits,
  medicineMessage, setMedicineMessage,
  cardSaveState, setCardSaveState,
  selectedDeleteId, onMedicineCreate, onMedicineUpdate, onToggleAvailability, onMedicineDelete,
}) {
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('All');
  const [inventoryStatus, setInventoryStatus] = useState('All');

  const inventoryCategories = useMemo(
    () => [...new Set(pharmacyMedicines.map((medicine) => medicine.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [pharmacyMedicines],
  );

  const filteredInventory = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();

    return pharmacyMedicines.filter((medicine) => {
      const quantity = Number(medicine.quantity || 0);
      const stockStatus = quantity <= 0
        ? 'Out of Stock'
        : !medicine.available
          ? 'Hidden'
          : quantity <= 5
            ? 'Low Stock'
            : 'In Stock';
      const searchable = [
        medicine.name,
        medicine.brandName,
        medicine.category,
        medicine.productForm,
        stockStatus,
      ].filter(Boolean).join(' ').toLowerCase();

      return (
        (!query || searchable.includes(query))
        && (inventoryCategory === 'All' || medicine.category === inventoryCategory)
        && (inventoryStatus === 'All' || stockStatus === inventoryStatus)
      );
    });
  }, [inventoryCategory, inventorySearch, inventoryStatus, pharmacyMedicines]);

  const inventoryFiltersActive = Boolean(
    inventorySearch || inventoryCategory !== 'All' || inventoryStatus !== 'All',
  );
  const clearInventoryFilters = () => {
    setInventorySearch('');
    setInventoryCategory('All');
    setInventoryStatus('All');
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setMedicineMessage('');
    const validationError = validateMedicineDraft(medicineDraft);
    if (validationError) { setMedicineMessage(validationError); return; }
    const ok = await onMedicineCreate(medicineDraft);
    if (ok) { setMedicineDraft(emptyMedicineDraft); setMedicineMessage('Medicine created successfully.'); }
    else setMedicineMessage('Unable to create medicine.');
  };
  const handleSave = async (med) => {
    const draft = medicineEdits[med.id] || med;
    const validationError = validateMedicineDraft(draft);
    if (validationError) { setMedicineMessage(validationError); return; }
    setCardSaveState(prev => ({ ...prev, [med.id]: 'saving' }));
    const ok = await onMedicineUpdate(med.id, {
      name: draft.name, brandName: draft.brandName || '',
      category: draft.category, price: draft.price,
      quantity: Number(draft.quantity || 0), available: Boolean(draft.available),
      image: draft.image || '', description: draft.description || '',
      requiresPrescription: Boolean(draft.requiresPrescription),
    });
    setCardSaveState(prev => ({ ...prev, [med.id]: ok ? 'saved' : 'error' }));
    if (ok) {
      setTimeout(() => setCardSaveState(prev => { const n = {...prev}; delete n[med.id]; return n; }), 3500);
    }
  };
  const handleRemove = async (id) => {
    setMedicineMessage('');
    const ok = await onMedicineDelete(id);
    setMedicineMessage(ok ? 'Medicine removed.' : 'Unable to remove.');
  };

  return (
    <div className="space-y-8">

      {/* ── Create form ── */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Add stock</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Create a new medicine</h2>
          </div>
          <PlusCircle className="text-emerald-500" size={22} />
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Image upload for new medicine */}
            <div className="shrink-0 sm:w-36">
              <p className="mb-1.5 text-xs font-bold text-slate-500">Medicine Photo</p>
              <ImageUploadBox
                value={medicineDraft.image}
                onChange={(v) => setMedicineDraft(p => ({ ...p, image: v }))}
                label="Upload photo"
                height="h-36"
              />
            </div>

            {/* Basic fields */}
            <div className="flex-1 space-y-3">
              {/* Medicine name + Brand name side by side */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500">
                    Medicine name <span className="text-red-500">*</span>
                    <span className="ml-1 font-normal text-slate-400">(generic / scientific)</span>
                  </label>
                  <input value={medicineDraft.name}
                    onChange={(e)=>setMedicineDraft(p=>({...p,name:e.target.value}))}
                    placeholder="e.g. Paracetamol 500mg"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500">
                    Brand name
                    <span className="ml-1 font-normal text-slate-400">(commercial / trade)</span>
                  </label>
                  <input value={medicineDraft.brandName}
                    onChange={(e)=>setMedicineDraft(p=>({...p,brandName:e.target.value}))}
                    placeholder="e.g. Panadol, Calpol"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[{k:'category',p:'Category'},{k:'price',p:'Price (e.g. Rs. 150)'}].map(({k,p})=>(
                  <input key={k} value={medicineDraft[k]} onChange={(e)=>setMedicineDraft(prev=>({...prev,[k]:e.target.value}))} placeholder={p}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500" />
                ))}
                <input type="number" min="0" value={medicineDraft.quantity}
                  onChange={(e)=>setMedicineDraft(p=>({...p,quantity:Number(e.target.value)}))} placeholder="Quantity"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="mb-1.5 text-xs font-bold text-slate-500">Description</p>
            <textarea rows={3} value={medicineDraft.description}
              onChange={(e) => setMedicineDraft(p => ({ ...p, description: e.target.value }))}
              placeholder="Short description shown to patients..."
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500" />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={medicineDraft.available} onChange={(e)=>setMedicineDraft(p=>({...p,available:e.target.checked}))} />
              Available in store
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <input type="checkbox" checked={medicineDraft.requiresPrescription} onChange={(e)=>setMedicineDraft(p=>({...p,requiresPrescription:e.target.checked}))} />
              Requires prescription
            </label>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500">
              <PlusCircle size={16} /> Create medicine
            </button>
            {medicineMessage && (
              <span className={`flex items-center gap-1.5 text-sm font-medium ${MEDICINE_SUCCESS_MESSAGES.has(medicineMessage) ? 'text-slate-700' : 'text-red-600'}`}>
                {MEDICINE_SUCCESS_MESSAGES.has(medicineMessage)
                  ? <CheckCircle2 size={15} className="text-emerald-500" />
                  : <AlertTriangle size={15} />}
                {medicineMessage}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Inventory cards ── */}
      <div>
        <h2 className="text-xl font-black text-slate-900">Manage inventory</h2>
        <p className="mt-1 text-sm text-slate-500">{pharmacyMedicines.length} items in your catalog.</p>

        {pharmacyMedicines.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
            No medicines linked to this pharmacy yet.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={inventorySearch}
                  onChange={(event) => setInventorySearch(event.target.value)}
                  placeholder="Search medicine, brand..."
                  aria-label="Search pharmacy inventory"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>
              <select
                value={inventoryCategory}
                onChange={(event) => setInventoryCategory(event.target.value)}
                aria-label="Filter pharmacy inventory by category"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500"
              >
                <option value="All">All categories</option>
                {inventoryCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={inventoryStatus}
                onChange={(event) => setInventoryStatus(event.target.value)}
                aria-label="Filter pharmacy inventory by stock status"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500"
              >
                <option value="All">All stock statuses</option>
                <option value="In Stock">In stock</option>
                <option value="Low Stock">Low stock</option>
                <option value="Out of Stock">Out of stock</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">
                Showing {filteredInventory.length} of {pharmacyMedicines.length} medicines
              </p>
              {inventoryFiltersActive && (
                <button
                  type="button"
                  onClick={clearInventoryFilters}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              )}
            </div>

            {filteredInventory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Search size={30} className="mx-auto text-slate-300" />
                <p className="mt-3 text-base font-bold text-slate-700">No medicines match these filters</p>
                <p className="mt-1 text-sm text-slate-500">Try another name, category, or stock status.</p>
              </div>
            ) : filteredInventory.map((med) => {
              const draft = medicineEdits[med.id] || med;
              const updateDraft = (key, value) =>
                setMedicineEdits((prev) => ({ ...prev, [med.id]: { ...draft, [key]: value } }));

              return (
                <article key={med.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-5 sm:flex-row">

                    {/* ── Image upload box ── */}
                    <div className="shrink-0 sm:w-36">
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">Medicine Photo</p>
                      <ImageUploadBox
                        value={draft.image || ''}
                        onChange={(v) => updateDraft('image', v)}
                        label="Upload photo"
                        height="h-36"
                      />
                    </div>

                    {/* ── Fields ── */}
                    <div className="flex-1 space-y-3">
                      {/* Medicine name + Brand name */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-500">
                            Medicine name
                            <span className="ml-1 font-normal text-slate-400">(generic)</span>
                          </label>
                          <input value={draft.name || ''} onChange={(e) => updateDraft('name', e.target.value)}
                            placeholder="e.g. Paracetamol 500mg"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-500">
                            Brand name
                            <span className="ml-1 font-normal text-slate-400">(trade)</span>
                          </label>
                          <input value={draft.brandName || ''} onChange={(e) => updateDraft('brandName', e.target.value)}
                            placeholder="e.g. Panadol, Calpol"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-500">Category</label>
                          <input value={draft.category || ''} onChange={(e) => updateDraft('category', e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-500">Price</label>
                          <input value={draft.price || ''} onChange={(e) => updateDraft('price', e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-500">Quantity</label>
                          <input type="number" min="0" value={draft.quantity ?? 0}
                            onChange={(e) => updateDraft('quantity', Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
                        </div>
                      </div>

                      {/* ── Description box ── */}
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                        <textarea rows={3} value={draft.description || ''}
                          onChange={(e) => updateDraft('description', e.target.value)}
                          placeholder="Short description shown to patients in the detail view..."
                          className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
                      </div>

                      {/* ── Status + actions ── */}
                      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={Boolean(draft.available)}
                            onChange={(e) => updateDraft('available', e.target.checked)} />
                          {draft.available ? 'Visible to patients' : 'Hidden from patients'}
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                          <input type="checkbox" checked={Boolean(draft.requiresPrescription)}
                            onChange={(e) => updateDraft('requiresPrescription', e.target.checked)} />
                          Requires prescription
                        </label>
                        <div className="ml-auto flex flex-wrap items-center gap-2">
                          {cardSaveState[med.id] === 'saving' && (
                            <span className="text-xs font-semibold text-slate-500">Saving…</span>
                          )}
                          {cardSaveState[med.id] === 'saved' && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <CheckCircle2 size={13} /> Saved
                            </span>
                          )}
                          {cardSaveState[med.id] === 'error' && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                              <AlertTriangle size={13} /> Save failed
                            </span>
                          )}
                          <button onClick={() => onToggleAvailability(med)}
                            className={`rounded-xl px-3 py-2 text-xs font-bold ${med.available ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {med.available ? 'Hide' : 'Show'}
                          </button>
                          <button
                            disabled={cardSaveState[med.id] === 'saving'}
                            onClick={() => handleSave(med)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                            <PencilLine size={13} /> Save changes
                          </button>
                          <button disabled={selectedDeleteId === med.id} onClick={() => handleRemove(med.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function validateProfile(d) {
  const e = {};
  if (!d.name.trim()) e.name = 'Pharmacy name is required.';
  if (d.tel && digitCount(d.tel) > 10)
    e.tel = 'Phone number must not exceed 10 digits.';
  if (d.whatsapp && digitCount(d.whatsapp) > 10)
    e.whatsapp = 'WhatsApp number must not exceed 10 digits.';
  if (d.contactEmail && d.contactEmail.trim() && !isValidEmail(d.contactEmail))
    e.contactEmail = 'Enter a valid email address.';
  if ((d.lat !== '' || d.lng !== '') && !isValidLatLng(d.lat || 0, d.lng || 0)) {
    e.lat = 'Latitude must be -90 to 90 and longitude -180 to 180.';
  }
  return e;
}

function ProfileField({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-600">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function PharmacyProfile({ profileDraft, setProfileDraft, profileMessage, profileBusy, onProfileSubmit }) {
  const [profileErrs, setProfileErrs] = useState({});

  const set = (k) => (e) => {
    const v = e.target.value;
    setProfileDraft((p) => ({ ...p, [k]: v }));
    setProfileErrs((p) => { const n = { ...p }; delete n[k]; return n; });
  };

  const fieldCls = (k) =>
    `w-full rounded-xl border px-4 py-3 text-base outline-none transition bg-white
     focus:ring-2 focus:ring-emerald-100
     ${profileErrs[k] ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-emerald-500'}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateProfile(profileDraft);
    if (Object.keys(errs).length > 0) { setProfileErrs(errs); return; }
    setProfileErrs({});
    onProfileSubmit(e);
  };

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Branch details</h2>
        <p className="mt-1 text-sm text-slate-500">Update your pharmacy's public-facing information.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>

        {/* Basic info */}
        <ProfileField label="Pharmacy name" error={profileErrs.name}>
          <input value={profileDraft.name} onChange={set('name')}
            placeholder="MedFinder Colombo 03" className={fieldCls('name')} />
        </ProfileField>

        <ProfileField label="Address">
          <input value={profileDraft.location} onChange={set('location')}
            placeholder="No. 12, Main Street, Colombo 03" className={fieldCls('location')} />
        </ProfileField>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Latitude" error={profileErrs.lat}>
            <input type="number" step="any" value={profileDraft.lat} onChange={set('lat')}
              placeholder="6.9271" className={fieldCls('lat')} />
          </ProfileField>
          <ProfileField label="Longitude">
            <input type="number" step="any" value={profileDraft.lng} onChange={set('lng')}
              placeholder="79.8612" className={fieldCls('lng')} />
          </ProfileField>
        </div>
        <p className="-mt-3 text-xs text-slate-400">Map coordinates used to calculate patient distance. Find them by right-clicking your location on Google Maps.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Days open">
            <input value={profileDraft.days} onChange={set('days')}
              placeholder="Mon – Sun" className={fieldCls('days')} />
          </ProfileField>
          <ProfileField label="Opening hours">
            <input value={profileDraft.open} onChange={set('open')}
              placeholder="8.00 AM – 10.00 PM" className={fieldCls('open')} />
          </ProfileField>
        </div>

        {/* License */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">License</p>
          <ProfileField label="License number" error={profileErrs.licenseNumber}>
            <input value={profileDraft.licenseNumber} onChange={set('licenseNumber')}
              placeholder="PHA-2024-001234" className={fieldCls('licenseNumber')} />
          </ProfileField>
        </div>

        {/* Description */}
        <ProfileField label="About this pharmacy">
          <textarea rows={3} value={profileDraft.description} onChange={set('description')}
            placeholder="Brief description shown to patients — services, specialties, etc."
            className={`${fieldCls('description')} resize-none`} />
        </ProfileField>

        {/* Contact */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Contact info (public)</p>

          <ProfileField label="Phone number" error={profileErrs.tel}>
            <input type="tel" value={profileDraft.tel} onChange={set('tel')}
              placeholder="0711234567" maxLength={15} className={fieldCls('tel')} />
            <p className="mt-0.5 text-xs text-slate-400">Digits only, max 10.</p>
          </ProfileField>

          <ProfileField label="WhatsApp number" error={profileErrs.whatsapp}>
            <input type="tel" value={profileDraft.whatsapp} onChange={set('whatsapp')}
              placeholder="0771234567" maxLength={15} className={fieldCls('whatsapp')} />
            <p className="mt-0.5 text-xs text-slate-400">Digits only, max 10.</p>
          </ProfileField>

          <ProfileField label="Contact email (Gmail or other)" error={profileErrs.contactEmail}>
            <input type="email" value={profileDraft.contactEmail} onChange={set('contactEmail')}
              placeholder="contact@yourpharmacy.lk" className={fieldCls('contactEmail')} />
          </ProfileField>
        </div>

        {/* Photo */}
        <ProfileField label="Pharmacy photo">
          <ImageUploadBox
            value={profileDraft.image}
            onChange={(v) => setProfileDraft((p) => ({ ...p, image: v }))}
            label="Click to upload a pharmacy photo"
            height="h-44"
          />
        </ProfileField>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={profileBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60">
            <RefreshCcw size={16} className={profileBusy ? 'animate-spin' : ''} />
            {profileBusy ? 'Saving…' : 'Save profile'}
          </button>
          {profileMessage && (
            <span className={`flex items-center gap-1.5 text-sm font-medium ${profileMessage.startsWith('Unable') ? 'text-red-600' : 'text-emerald-700'}`}>
              {profileMessage.startsWith('Unable')
                ? <AlertTriangle size={15} />
                : <CheckCircle2 size={15} />}
              {profileMessage}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function PharmacyCatalog({ pharmacyMedicines }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const categories = useMemo(() => {
    const cats = pharmacyMedicines.map(m => m.category).filter(Boolean);
    return [...new Set(cats)].sort((a, b) => a.localeCompare(b));
  }, [pharmacyMedicines]);

  const rows = useMemo(() => {
    return pharmacyMedicines.filter(m => {
      const query = search.trim().toLowerCase();
      const status = m.available ? 'Visible' : 'Hidden';
      const searchable = [
        m.name,
        m.brandName,
        m.category,
        m.productForm,
        status,
      ].filter(Boolean).join(' ').toLowerCase();

      return (
        (!query || searchable.includes(query))
        && (categoryFilter === 'All' || m.category === categoryFilter)
        && (statusFilter === 'All' || status === statusFilter)
      );
    });
  }, [categoryFilter, pharmacyMedicines, search, statusFilter]);

  const filtersActive = Boolean(
    search || categoryFilter !== 'All' || statusFilter !== 'All',
  );
  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Quick view</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">Medicine List</h2>
        <p className="mt-1 text-sm text-slate-500">{pharmacyMedicines.length} items in your catalog.</p>
      </div>

      {/* Filter bar */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search pharmacy medicine list"
            placeholder="Search medicine, brand..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter medicine list by category"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500"
        >
          <option value="All">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter medicine list by status"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500"
        >
          <option value="All">All statuses</option>
          <option value="Visible">Visible</option>
          <option value="Hidden">Hidden</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          Showing {rows.length} of {pharmacyMedicines.length} medicines
        </p>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
          No medicines match your filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3 w-14">Photo</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map(med => {
                const qty = Number(med.quantity || 0);
                const qtyColor =
                  qty === 0 ? 'text-red-600 font-black'
                  : qty <= 5 ? 'text-amber-600 font-black'
                  : 'text-slate-900 font-semibold';

                return (
                  <tr key={med.id} className="hover:bg-slate-50 transition">
                    {/* Photo */}
                    <td className="px-4 py-3">
                      {med.image ? (
                        <img src={med.image} alt={med.name}
                          className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg">
                          💊
                        </div>
                      )}
                    </td>
                    {/* Name + brand + description */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{med.name}</p>
                      {med.brandName && (
                        <p className="mt-0.5 text-xs font-semibold text-emerald-700">{med.brandName}</p>
                      )}
                      {med.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{med.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{med.category || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{med.price || '—'}</td>
                    <td className={`px-4 py-3 text-center ${qtyColor}`}>{qty}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold
                        ${med.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {med.available ? 'In Stock' : 'Hidden'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  Pending:          '#f59e0b',
  Approved:         '#3b82f6',
  Packing:          '#8b5cf6',
  'Ready for Pickup': '#10b981',
  Delivered:        '#22c55e',
  Rejected:         '#ef4444',
  Cancelled:        '#94a3b8',
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{subtitle}</p>
      <h3 className="mt-0.5 text-base font-black text-slate-900">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function PharmacyAnalytics({ analytics, reservations = [], pharmacyMedicines = [] }) {

  // ── Last 6 months order trend ──────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const orders = reservations.filter(r => {
        const rd = new Date(r.createdAt);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      }).length;
      return { month: label, orders };
    });
  }, [reservations]);

  // ── Top medicines by reservation count ────────────────────────────────────
  const topMedicines = useMemo(() => {
    const counts = {};
    reservations.forEach(r => { if (r.medicineName) counts[r.medicineName] = (counts[r.medicineName] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, orders]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, orders }));
  }, [reservations]);

  // ── Order status breakdown ─────────────────────────────────────────────────
  const statusData = useMemo(() => {
    const counts = {};
    reservations.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: status,
      value,
      fill: STATUS_COLORS[status] || '#94a3b8',
    }));
  }, [reservations]);

  // ── Stock levels per medicine ─────────────────────────────────────────────
  const stockData = useMemo(() =>
    [...pharmacyMedicines]
      .sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))
      .slice(0, 8)
      .map(m => ({
        name: m.name.length > 12 ? m.name.slice(0, 12) + '…' : m.name,
        qty: Number(m.quantity || 0),
        fill: Number(m.quantity || 0) === 0 ? '#ef4444'
            : Number(m.quantity || 0) <= 5   ? '#f59e0b'
            : '#10b981',
      })),
  [pharmacyMedicines]);

  const tiles = [
    { label: 'Total orders',      value: analytics.totalOrders },
    { label: 'Pending',           value: analytics.pendingOrders },
    { label: 'Approved',          value: analytics.approvedOrders },
    { label: 'Ready for pickup',  value: analytics.readyOrders },
    { label: 'Visible medicines', value: analytics.visibleCount },
    { label: 'Hidden medicines',  value: analytics.hiddenCount },
    { label: 'Total stock units', value: analytics.totalQuantity },
    { label: 'Low stock items',   value: analytics.lowStockCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Insights</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">Sales trends and stock overview for your branch.</p>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Monthly orders trend (full width) ── */}
      <ChartCard title="Monthly Orders" subtitle="Sales trend">
        {monthlyData.every(d => d.orders === 0) ? (
          <p className="py-10 text-center text-sm text-slate-400">No order data yet — trend will appear once orders come in.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                formatter={(v) => [v, 'Orders']}
              />
              <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2.5} fill="url(#ordersGrad)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Middle row: top medicines + status breakdown ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Top medicines */}
        <ChartCard title="Top Medicines" subtitle="By reservation count">
          {topMedicines.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No reservations yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMedicines} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                  formatter={(v) => [v, 'Orders']}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Order status breakdown */}
        <ChartCard title="Order Status" subtitle="Current breakdown">
          {statusData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                  formatter={(v, name) => [v, name]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Stock levels ── */}
      <ChartCard title="Current Stock Levels" subtitle="Inventory per medicine">
        {stockData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No medicines in inventory.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stockData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                formatter={(v) => [v, 'Units']}
              />
              <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                {stockData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

// ── Admin sections ────────────────────────────────────────────────────────────

function AdminOverview({ totalPharmacies, pendingPharmacyCount, reservationCount, activeMedicines, pendingEmergencyCount, unreadContactCount }) {
  const panels = [
    {title:'Registered pharmacies',    value:String(totalPharmacies),           meta:'Total registered',            description:'All pharmacy registrations. Check the Pharmacies tab to approve pending applications.'},
    {title:'Pending approval',         value:String(pendingPharmacyCount),      meta:'Awaiting review',             description:'New pharmacy registrations waiting for license verification and admin approval.'},
    {title:'Total reservations',       value:String(reservationCount),          meta:'Patient reservation records', description:'Monitor reservation volume, statuses, and prescription uploads.'},
    {title:'Visible medicines',        value:String(activeMedicines),           meta:'Currently live on platform',  description:'Medicines shown to patients in search results across all branches.'},
    {title:'Emergency requests',       value:String(pendingEmergencyCount),     meta:'Pending admin action',        description:'Urgent medicine requests awaiting pharmacy assignment or patient contact.'},
    {title:'Unread support messages',  value:String(unreadContactCount),        meta:'From Contact Support form',   description:'Patient and visitor enquiries submitted via the Contact Support page.'},
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Admin Dashboard</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">Platform overview</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {panels.map(({title,value,meta,description})=>(
          <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-emerald-600">{meta}</p>
            <p className="mt-3 text-sm text-slate-600">{description}</p>
          </article>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-5 py-4">
        <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-bold text-white">Admin access — verified</p>
          <p className="text-xs text-slate-400">Full platform management capabilities enabled</p>
        </div>
      </div>
    </div>
  );
}

function AdminMedicines({ medicines, onToggleAvailability }) {
  const [search, setSearch] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const pharmacies = useMemo(
    () => [...new Set(medicines.map((m) => m.pharmacy || m.pharmacyName).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [medicines],
  );
  const categories = useMemo(
    () => [...new Set(medicines.map((m) => m.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [medicines],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medicines.filter((medicine) => {
      const pharmacy = medicine.pharmacy || medicine.pharmacyName || '';
      const status = medicine.available ? 'Visible' : 'Hidden';
      const searchable = [
        medicine.name,
        medicine.brandName,
        pharmacy,
        medicine.category,
        status,
      ].filter(Boolean).join(' ').toLowerCase();

      return (
        (!query || searchable.includes(query))
        && (pharmacyFilter === 'All' || pharmacy === pharmacyFilter)
        && (categoryFilter === 'All' || medicine.category === categoryFilter)
        && (statusFilter === 'All' || status === statusFilter)
      );
    });
  }, [categoryFilter, medicines, pharmacyFilter, search, statusFilter]);

  const filtersActive = Boolean(
    search || pharmacyFilter !== 'All' || categoryFilter !== 'All' || statusFilter !== 'All',
  );
  const clearFilters = () => {
    setSearch('');
    setPharmacyFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
  };
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">All medicines</h2>
        <p className="mt-1 text-sm text-slate-500">{medicines.length} medicines across all pharmacies.</p>
      </div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search medicine, pharmacy..."
          aria-label="Search medicines"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500"
        />
        <select
          value={pharmacyFilter}
          onChange={(event) => setPharmacyFilter(event.target.value)}
          aria-label="Filter by pharmacy"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500"
        >
          <option value="All">All pharmacies</option>
          {pharmacies.map((pharmacy) => <option key={pharmacy} value={pharmacy}>{pharmacy}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter by category"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500"
        >
          <option value="All">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500"
        >
          <option value="All">All statuses</option>
          <option value="Visible">Visible</option>
          <option value="Hidden">Hidden</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          Showing {filtered.length} of {medicines.length} medicines
        </p>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Search size={30} className="mx-auto text-slate-300" />
          <p className="mt-3 font-bold text-slate-700">No medicines match these filters</p>
          <button type="button" onClick={clearFilters} className="mt-3 text-sm font-bold text-emerald-700 hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
            <tr>{['Name / Brand','Pharmacy','Category','Price','Qty','Status','Toggle'].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.map((med)=>(
              <tr key={med.id}>
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900">{med.name}</p>
                  {med.brandName && <p className="text-xs font-semibold text-emerald-700">{med.brandName}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{med.pharmacy}</td>
                <td className="px-4 py-3 text-slate-600">{med.category}</td>
                <td className="px-4 py-3 text-slate-600">{med.price}</td>
                <td className="px-4 py-3 text-slate-600">{med.quantity}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${med.available?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500'}`}>
                    {med.available?'Visible':'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={()=>onToggleAvailability(med)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                    {med.available?'Hide':'Show'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

function AdminReservations({ reservations, onReservationStatusChange, onReservationRemove }) {
  const [prescriptionView, setPrescriptionView] = useState(null);
  const sorted = useMemo(()=>[...reservations].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),[reservations]);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">All reservations</h2>
        <p className="mt-1 text-sm text-slate-500">{sorted.length} reservations across all pharmacies.</p>
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-base font-bold text-slate-700">No reservations yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
              <tr>{['Medicine','Pharmacy','Customer','Phone','Status','Date','Prescription','Action'].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sorted.map((r)=>(
                <tr key={r.id}>
                  <td className="px-4 py-4"><p className="font-bold text-slate-900">{r.medicineName}</p><p className="text-xs text-slate-400">{r.price}</p></td>
                  <td className="px-4 py-4 text-slate-600">{r.pharmacyName||r.pharmacy}</td>
                  <td className="px-4 py-4 text-slate-700">{r.customerName}</td>
                  <td className="px-4 py-4 text-slate-700">{r.customerPhone}</td>
                  <td className="px-4 py-4">
                    <select value={r.status} onChange={(e)=>onReservationStatusChange(r.id,e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900 outline-none">
                      {RESERVATION_STATUSES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{formatReservationDate(r.createdAt)}</td>
                  <td className="px-4 py-4">
                    {r.prescriptionData ? (
                      <button onClick={()=>setPrescriptionView({data:r.prescriptionData,fileName:r.prescriptionFileName})}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700">
                        <Paperclip size={12}/> View
                      </button>
                    ) : <span className="text-xs text-slate-400">None</span>}
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={()=>onReservationRemove(r.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {prescriptionView && <PrescriptionModal data={prescriptionView.data} fileName={prescriptionView.fileName} onClose={()=>setPrescriptionView(null)} />}
    </div>
  );
}

// ── Admin Emergency Centre ────────────────────────────────────────────────────

const EMERGENCY_STATUS_STYLES = {
  Pending:      'bg-amber-100 text-amber-800 border-amber-200',
  Acknowledged: 'bg-sky-100 text-sky-800 border-sky-200',
  Fulfilled:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled:    'bg-slate-100 text-slate-600 border-slate-200',
};

function AdminEmergency({
  emergencyOrders,
  medicines,
  onEmergencyOrderUpdate,
  emergencyOrdersLoading = false,
  emergencyOrdersError = '',
}) {
  const [filterStatus, setFilterStatus]   = useState('All');
  const [expandedId, setExpandedId]       = useState(null);
  const [messageInputs, setMessageInputs] = useState({});
  const [medSearches, setMedSearches]     = useState({});
  const [busy, setBusy]                   = useState({});

  const pendingCount = emergencyOrders.filter(o => o.status === 'Pending').length;

  const filtered = useMemo(() => {
    const sorted = [...emergencyOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filterStatus === 'All' ? sorted : sorted.filter(o => o.status === filterStatus);
  }, [emergencyOrders, filterStatus]);

  const getMatchingPharmacies = (orderId, medicineName) => {
    const q = (medSearches[orderId] !== undefined ? medSearches[orderId] : medicineName).toLowerCase();
    const seen = new Set();
    const results = [];
    medicines.forEach(m => {
      const pname = m.pharmacy || m.pharmacyName;
      if (!pname || seen.has(pname)) return;
      if (m.name.toLowerCase().includes(q) && m.available && Number(m.quantity || 0) > 0) {
        seen.add(pname);
        results.push({ pharmacyName: pname, medicine: m });
      }
    });
    return results;
  };

  const act = async (key, fn) => {
    setBusy(b => ({ ...b, [key]: true }));
    await fn();
    setBusy(b => ({ ...b, [key]: false }));
  };

  const handleStatusChange = (id, status) =>
    act(`status-${id}`, () => onEmergencyOrderUpdate(id, { status }));

  const handleAssign = (id, pharmacyName) =>
    act(`assign-${id}`, () => onEmergencyOrderUpdate(id, { preferredPharmacy: pharmacyName }));

  const handleSendMessage = async (id) => {
    const text = (messageInputs[id] || '').trim();
    if (!text) return;
    await act(`msg-${id}`, () => onEmergencyOrderUpdate(id, { adminMessage: text }));
    setMessageInputs(p => ({ ...p, [id]: '' }));
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">Admin — Emergency Centre</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Emergency Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            {emergencyOrders.length} total · {pendingCount} pending action
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            <RefreshCcw size={13} className={emergencyOrdersLoading ? 'animate-spin' : ''} />
            {emergencyOrdersLoading ? 'Checking for requests' : 'Live updates on'}
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
              <Zap size={15} className="text-red-600" />
              <span className="text-sm font-bold text-red-700">{pendingCount} request{pendingCount > 1 ? 's' : ''} need attention</span>
            </div>
          )}
        </div>
      </div>

      {emergencyOrdersError && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Emergency requests could not be refreshed.</p>
            <p className="mt-0.5">{emergencyOrdersError}</p>
          </div>
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Pending', 'Acknowledged', 'Fulfilled', 'Cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition
              ${filterStatus === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s === 'All' ? `All (${emergencyOrders.length})` : `${s} (${emergencyOrders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {emergencyOrdersLoading && emergencyOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
          <RefreshCcw size={30} className="mx-auto animate-spin text-emerald-600" />
          <p className="mt-4 text-base font-bold text-slate-700">Loading emergency requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Zap size={32} className="mx-auto text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-700">No emergency requests</p>
          <p className="mt-1 text-sm text-slate-500">Patient emergency requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const id         = order._id || order.id;
            const isExpanded = expandedId === id;
            const isPending  = order.status === 'Pending';
            const isFulfilled = order.status === 'Fulfilled';
            const msgInput   = messageInputs[id] || '';
            const matchingPharmacies = getMatchingPharmacies(id, order.medicineName);
            const medSearchVal = medSearches[id] !== undefined ? medSearches[id] : order.medicineName;

            return (
              <article key={id}
                className={`rounded-2xl border p-5 transition-all ${isPending ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>

                {/* ── Order header ── */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">
                        <Zap size={11} /> EMERGENCY
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${EMERGENCY_STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {order.status}
                      </span>
                      {isFulfilled && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-black text-white">
                          <CheckCircle2 size={11} /> Delivered to patient
                        </span>
                      )}
                      {order.acknowledgedBy && (
                        <span className="text-xs text-slate-500">Handled by: <span className="font-semibold">{order.acknowledgedBy}</span></span>
                      )}
                    </div>

                    <h3 className="mt-2 text-lg font-black text-slate-900">{order.medicineName}</h3>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><Phone size={13} /> {order.contactName}</span>
                      <a href={`tel:${order.contactPhone}`} className="font-bold text-slate-800 hover:underline">{order.contactPhone}</a>
                    </div>
                    <p className="text-sm text-slate-500">{order.deliveryAddress}</p>

                    {order.preferredPharmacy && (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        Assigned / Preferred pharmacy: {order.preferredPharmacy}
                      </p>
                    )}
                    {order.notes && (
                      <p className="mt-1 text-sm text-slate-500">Patient notes: {order.notes}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">{formatReservationDate(order.createdAt)}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-end gap-2">
                    <select
                      value={order.status}
                      disabled={busy[`status-${id}`]}
                      onChange={(e) => handleStatusChange(id, e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900 outline-none"
                    >
                      {['Pending','Acknowledged','Fulfilled','Cancelled'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition
                        ${isExpanded ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                      <MessageSquare size={12} />
                      {isExpanded ? 'Collapse' : 'Take Action'}
                    </button>
                  </div>
                </div>

                {/* ── Admin messages log ── */}
                {order.adminMessages?.length > 0 && (
                  <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-3 space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-sky-600">Admin findings / messages</p>
                    {order.adminMessages.map((msg, i) => (
                      <div key={i} className="flex gap-2 text-sm text-slate-700">
                        {msg.sentAt && (
                          <span className="shrink-0 text-xs text-slate-400 pt-0.5">
                            {new Date(msg.sentAt).toLocaleString()}
                          </span>
                        )}
                        <span>{msg.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Expanded action panel ── */}
                {isExpanded && (
                  <div className="mt-4 space-y-5 border-t border-slate-200 pt-5">

                    {/* Medicine search → find pharmacies */}
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                        Find registered pharmacies with this medicine
                      </p>
                      <div className="relative mb-3 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={medSearchVal}
                          onChange={e => setMedSearches(p => ({ ...p, [id]: e.target.value }))}
                          placeholder="Search medicine name…"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-4 text-sm outline-none focus:border-emerald-500"
                        />
                      </div>

                      {matchingPharmacies.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                          <p className="text-sm font-semibold text-slate-600">No registered pharmacy has this medicine in stock.</p>
                          <p className="mt-1 text-xs text-slate-400">Use the message panel below to inform the patient.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {matchingPharmacies.map(({ pharmacyName, medicine }) => {
                            const isAssigned = normalizePharmacyName(order.preferredPharmacy) === normalizePharmacyName(pharmacyName);
                            return (
                              <div key={pharmacyName} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                                <div>
                                  <p className="font-bold text-slate-900">{pharmacyName}</p>
                                  <p className="text-xs text-slate-500">
                                    {medicine.name} · {medicine.price} · Qty: {medicine.quantity}
                                  </p>
                                </div>
                                <button
                                  disabled={busy[`assign-${id}`]}
                                  onClick={() => handleAssign(id, pharmacyName)}
                                  className={`rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50
                                    ${isAssigned
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
                                  {isAssigned ? 'Assigned ✓' : 'Assign & Request'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Message patient */}
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                        Record findings / message for patient
                      </p>
                      <p className="mb-2 text-xs text-slate-400">
                        Contact the patient directly at{' '}
                        <a href={`tel:${order.contactPhone}`} className="font-bold text-slate-700 hover:underline">
                          {order.contactPhone}
                        </a>{' '}
                        — reference this note.
                      </p>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={msgInput}
                          onChange={e => setMessageInputs(p => ({ ...p, [id]: e.target.value }))}
                          placeholder={`e.g. "Found at MedFinder Colombo — please call +94 11 …" or "Could not locate this medicine in our network."`}
                          className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                        />
                        <button
                          disabled={!msgInput.trim() || busy[`msg-${id}`]}
                          onClick={() => handleSendMessage(id)}
                          className="self-end inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                          <Send size={13} /> Save
                        </button>
                      </div>
                    </div>
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

// ── Admin: Support Inbox ─────────────────────────────────────────────────────

function AdminContact({ contactMessages, onContactMarkRead }) {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState('All');

  const unread = contactMessages.filter(m => !m.read).length;

  const filtered = useMemo(() => {
    if (filter === 'Unread') return contactMessages.filter(m => !m.read);
    if (filter === 'Read')   return contactMessages.filter(m =>  m.read);
    return contactMessages;
  }, [contactMessages, filter]);

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleExpand = (id) => {
    setExpanded(prev => (prev === id ? null : id));
    const msg = contactMessages.find(m => m._id === id);
    if (msg && !msg.read) onContactMarkRead(id);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Support Inbox</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {unread > 0 ? `${unread} unread message${unread > 1 ? 's' : ''}` : 'All messages read'}
          </p>
        </div>
        <div className="flex gap-2">
          {['All', 'Unread', 'Read'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 py-16 text-center text-sm text-slate-400">
          No messages found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(msg => {
            const isOpen = expanded === msg._id;
            return (
              <div key={msg._id}
                className={`rounded-2xl border transition ${
                  msg.read ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50'
                }`}>
                <button className="flex w-full items-start gap-4 p-5 text-left"
                  onClick={() => handleExpand(msg._id)}>
                  {/* Unread dot */}
                  <div className="mt-1 shrink-0">
                    {msg.read
                      ? <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      : <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{msg.name || '—'}</span>
                      <span className="text-xs text-slate-400">{msg.email}</span>
                      {!msg.read && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">New</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">
                      {msg.subject || '(no subject)'}
                    </p>
                    {!isOpen && (
                      <p className="mt-0.5 truncate text-xs text-slate-400">{msg.message}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{fmtDate(msg.createdAt)}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                    <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span><span className="font-bold text-slate-700">From:</span> {msg.name} &lt;{msg.email}&gt;</span>
                      <span><span className="font-bold text-slate-700">Subject:</span> {msg.subject || '—'}</span>
                      <span><span className="font-bold text-slate-700">Received:</span> {fmtDate(msg.createdAt)}</span>
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800">
                      {msg.message}
                    </div>
                    <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Your MedFinder Enquiry')}`}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500">
                      <Send size={14} /> Reply via email
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Admin: Pharmacy License Review ───────────────────────────────────────────

const APPROVAL_STYLES = {
  pending:  'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

function LicenseModal({ pharmacy, onClose }) {
  const data = pharmacy.licenseDocument || '';
  const isImage = data.startsWith('data:image/');
  const isPdf   = data.startsWith('data:application/pdf');
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">License Document</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">{pharmacy.name}</p>
            <p className="text-xs text-slate-500">License: {pharmacy.licenseNumber || '—'}</p>
          </div>
          <div className="flex gap-2">
            {data && (
              <a href={data} download={`license-${pharmacy.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
                <Download size={16} />
              </a>
            )}
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {!data ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <FileText size={40} className="text-slate-300" />
              <p className="text-base font-bold text-slate-700">No document uploaded</p>
            </div>
          ) : isImage ? (
            <img src={data} alt="License" className="mx-auto max-w-full rounded-xl" />
          ) : isPdf ? (
            <iframe src={data} title="License PDF" className="h-[60vh] w-full rounded-xl border border-slate-200" />
          ) : (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <FileText size={40} className="text-slate-300" />
              <p className="text-base font-bold text-slate-700">Cannot preview this file type</p>
              <a href={data} download={`license-${pharmacy.name}`} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminPharmacies({ allPharmaciesAdmin, onApprovePharmacy, onEditPharmacy, onDeletePharmacy }) {
  const [filter, setFilter]     = useState('pending');
  const [licenseView, setLicenseView] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [busy, setBusy]         = useState({});
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const counts = useMemo(() => ({
    all:      allPharmaciesAdmin.length,
    pending:  allPharmaciesAdmin.filter(p => p.approvalStatus === 'pending' || !p.approvalStatus).length,
    approved: allPharmaciesAdmin.filter(p => p.approvalStatus === 'approved').length,
    rejected: allPharmaciesAdmin.filter(p => p.approvalStatus === 'rejected').length,
  }), [allPharmaciesAdmin]);

  const filtered = useMemo(() => {
    const sorted = [...allPharmaciesAdmin].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (filter === 'all') return sorted;
    if (filter === 'pending') return sorted.filter(p => p.approvalStatus === 'pending' || !p.approvalStatus);
    return sorted.filter(p => p.approvalStatus === filter);
  }, [allPharmaciesAdmin, filter]);

  const act = (id, fn) => {
    setBusy(b => ({ ...b, [id]: true }));
    fn().finally(() => setBusy(b => ({ ...b, [id]: false })));
  };

  const handleApprove = (id) =>
    act(id, () => onApprovePharmacy(id, { approvalStatus: 'approved', approvalNote: '' }));

  const handleReject = (id) => {
    act(id, () => onApprovePharmacy(id, { approvalStatus: 'rejected', approvalNote: rejectNote.trim() }));
    setRejectId(null);
    setRejectNote('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin — Pharmacy Registry</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Pharmacy Approvals</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review license documents and approve or reject new pharmacy registrations.
          </p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <ShieldCheck size={15} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{counts.pending} pending review</span>
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'pending',  label: `Pending (${counts.pending})` },
          { key: 'approved', label: `Approved (${counts.approved})` },
          { key: 'rejected', label: `Rejected (${counts.rejected})` },
          { key: 'all',      label: `All (${counts.all})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition
              ${filter === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Store size={32} className="mx-auto text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-700">No pharmacies in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((pharmacy) => {
            const id      = pharmacy._id;
            const status  = pharmacy.approvalStatus || 'pending';
            const isPend  = status === 'pending';

            return (
              <article key={id}
                className={`rounded-2xl border p-5 ${isPend ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${APPROVAL_STYLES[status] || APPROVAL_STYLES.pending}`}>
                        {status}
                      </span>
                      {isPend && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-black text-amber-900">
                          Needs review
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900">{pharmacy.name}</h3>
                    <p className="text-sm text-slate-600">{pharmacy.location || '—'}</p>
                    {pharmacy.licenseNumber && (
                      <p className="text-xs font-semibold text-slate-500">
                        License no: <span className="font-black text-slate-800">{pharmacy.licenseNumber}</span>
                      </p>
                    )}
                    {pharmacy.tel && (
                      <p className="text-xs text-slate-500">Phone: {pharmacy.tel}</p>
                    )}
                    {pharmacy.approvalNote && status === 'rejected' && (
                      <div className="mt-1 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-800">
                        Rejection reason: {pharmacy.approvalNote}
                      </div>
                    )}
                    <p className="text-xs text-slate-400">
                      Registered: {new Date(pharmacy.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => setLicenseView(pharmacy)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      <Eye size={13} /> View License
                    </button>

                    <button
                      onClick={() => setEditingPharmacy(pharmacy)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      <PencilLine size={13} /> Edit
                    </button>

                    {status !== 'approved' && (
                      <button
                        disabled={busy[id]}
                        onClick={() => handleApprove(id)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                        <ShieldCheck size={13} /> Approve
                      </button>
                    )}

                    {status !== 'rejected' && rejectId !== id && (
                      <button
                        onClick={() => { setRejectId(id); setRejectNote(''); }}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100">
                        <ShieldX size={13} /> Reject
                      </button>
                    )}

                    {rejectId === id && (
                      <div className="mt-1 w-64 space-y-2">
                        <textarea
                          rows={2}
                          value={rejectNote}
                          onChange={e => setRejectNote(e.target.value)}
                          placeholder="Reason for rejection (optional)"
                          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-red-400"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={busy[id]}
                            onClick={() => handleReject(id)}
                            className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                            Confirm reject
                          </button>
                          <button
                            onClick={() => setRejectId(null)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {deleteConfirmId !== id ? (
                      <button
                        onClick={() => { setDeleteConfirmId(id); setDeleteMessage(''); }}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50">
                        <Trash2 size={13} /> Delete
                      </button>
                    ) : (
                      <div className="mt-1 w-64 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-xs font-semibold text-red-800">
                          Delete this pharmacy and all of its medicines? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            disabled={busy[id]}
                            onClick={async () => {
                              setBusy(b => ({ ...b, [id]: true }));
                              const ok = await onDeletePharmacy(id);
                              setBusy(b => ({ ...b, [id]: false }));
                              setDeleteConfirmId(null);
                              setDeleteMessage(ok ? '' : 'Unable to delete pharmacy.');
                            }}
                            className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                            Confirm delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {deleteMessage && (
        <p className="text-sm font-semibold text-red-600">{deleteMessage}</p>
      )}

      {licenseView && (
        <LicenseModal pharmacy={licenseView} onClose={() => setLicenseView(null)} />
      )}

      {editingPharmacy && (
        <EditPharmacyModal
          pharmacy={editingPharmacy}
          onClose={() => setEditingPharmacy(null)}
          onSave={onEditPharmacy}
        />
      )}
    </div>
  );
}

function EditPharmacyModal({ pharmacy, onClose, onSave }) {
  const [draft, setDraft] = useState({
    name:          pharmacy.name          || '',
    location:      pharmacy.location      || '',
    tel:           pharmacy.tel           || '',
    open:          pharmacy.open          || '',
    days:          pharmacy.days          || '',
    lat:           pharmacy.lat ?? '',
    lng:           pharmacy.lng ?? '',
    description:   pharmacy.description   || '',
    contactEmail:  pharmacy.contactEmail  || '',
    whatsapp:      pharmacy.whatsapp      || '',
    licenseNumber: pharmacy.licenseNumber || '',
  });
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setDraft((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    if (!draft.name.trim()) return 'Pharmacy name is required.';
    if (!draft.location.trim()) return 'Address is required.';
    if ((draft.lat !== '' || draft.lng !== '') && !isValidLatLng(draft.lat || 0, draft.lng || 0)) {
      return 'Latitude must be -90 to 90 and longitude -180 to 180.';
    }
    if (draft.tel && digitCount(draft.tel) > 10) return 'Phone number must not exceed 10 digits.';
    if (draft.whatsapp && digitCount(draft.whatsapp) > 10) return 'WhatsApp number must not exceed 10 digits.';
    if (draft.contactEmail.trim() && !isValidEmail(draft.contactEmail)) return 'Enter a valid contact email address.';
    return null;
  };

  const handleSave = async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setBusy(true);
    const payload = {
      ...draft,
      lat: draft.lat === '' ? undefined : Number(draft.lat),
      lng: draft.lng === '' ? undefined : Number(draft.lng),
    };
    const ok = await onSave(pharmacy._id, payload);
    setBusy(false);
    if (ok) onClose();
    else setError('Unable to save changes.');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-base font-bold text-slate-900">Edit pharmacy</p>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-auto p-5">
          <input value={draft.name} onChange={set('name')} placeholder="Pharmacy name"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <input value={draft.location} onChange={set('location')} placeholder="Address"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="any" value={draft.lat} onChange={set('lat')} placeholder="Latitude"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
            <input type="number" step="any" value={draft.lng} onChange={set('lng')} placeholder="Longitude"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          </div>
          <p className="-mt-1.5 text-xs text-slate-400">Map coordinates used to calculate patient distance. Find them by right-clicking the location on Google Maps.</p>
          <div className="grid grid-cols-2 gap-3">
            <input value={draft.days} onChange={set('days')} placeholder="Days open"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
            <input value={draft.open} onChange={set('open')} placeholder="Opening hours"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          </div>
          <input value={draft.licenseNumber} onChange={set('licenseNumber')} placeholder="License number"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <textarea rows={3} value={draft.description} onChange={set('description')} placeholder="About this pharmacy"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <input value={draft.tel} onChange={set('tel')} placeholder="Phone number"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <input value={draft.whatsapp} onChange={set('whatsapp')} placeholder="WhatsApp number"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <input value={draft.contactEmail} onChange={set('contactEmail')} placeholder="Contact email"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button disabled={busy} onClick={handleSave}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage({
  medicines, reservations, emergencyOrders = [], contactMessages = [],
  emergencyOrdersLoading = false, emergencyOrdersError = '',
  allPharmaciesAdmin = [], authUser, pharmacyProfile,
  onToggleAvailability, onMedicineUpdate, onMedicineCreate, onMedicineDelete,
  onPharmacyProfileSave, onReservationStatusChange, onReservationRemove,
  onEmergencyOrderUpdate, onContactMarkRead, onApprovePharmacy,
  onEditPharmacy, onDeletePharmacy, onLogout,
}) {
  const isAdmin    = authUser?.role === 'admin';
  const isPharmacy = authUser?.role === 'pharmacy';

  const [section, setSection]             = useState('overview');
  const [profileDraft, setProfileDraft]   = useState(emptyProfileDraft);
  const [medicineDraft, setMedicineDraft] = useState(emptyMedicineDraft);
  const [medicineEdits, setMedicineEdits] = useState({});
  const [profileMessage, setProfileMessage] = useState('');
  const [profileBusy, setProfileBusy]       = useState(false);
  const [medicineMessage, setMedicineMessage] = useState('');
  const [cardSaveState, setCardSaveState]   = useState({});
  const [selectedDeleteId, setSelectedDeleteId] = useState('');

  const pharmacyMedicines = useMemo(
    ()=>medicines.filter(item=>isAdmin?true:samePharmacy(item,authUser)),
    [authUser,isAdmin,medicines]
  );
  const pharmacyReservations = useMemo(
    () => isAdmin ? [] : reservations.filter(item=>samePharmacy(item,authUser)),
    [authUser,isAdmin,reservations]
  );
  const pharmacyEmergencyOrders = useMemo(
    () => isAdmin ? emergencyOrders : emergencyOrders.filter(item=>!item.preferredPharmacy || samePharmacy(item,authUser)),
    [authUser,emergencyOrders,isAdmin]
  );
  const sortedPharmacyReservations = useMemo(
    ()=>[...pharmacyReservations].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),
    [pharmacyReservations]
  );
  const totalPharmacies  = useMemo(()=>new Set(medicines.map(m=>m.pharmacy).filter(Boolean)).size,[medicines]);
  const activeMedicines  = useMemo(()=>medicines.filter(m=>m.available).length,[medicines]);

  const analytics = useMemo(()=>{
    const totalQuantity   = pharmacyMedicines.reduce((s,m)=>s+Number(m.quantity||0),0);
    const visibleCount    = pharmacyMedicines.filter(m=>m.available).length;
    const lowStockCount   = pharmacyMedicines.filter(m=>Number(m.quantity||0)<=5).length;
    const pendingOrders   = sortedPharmacyReservations.filter(r=>r.status==='Pending').length;
    const approvedOrders  = sortedPharmacyReservations.filter(r=>r.status==='Approved').length;
    const readyOrders     = sortedPharmacyReservations.filter(r=>r.status==='Ready for Pickup').length;
    return { totalQuantity, visibleCount, hiddenCount:pharmacyMedicines.length-visibleCount, lowStockCount,
      pendingOrders, approvedOrders, readyOrders, totalOrders:sortedPharmacyReservations.length };
  },[pharmacyMedicines,sortedPharmacyReservations]);

  useEffect(()=>{
    if(pharmacyProfile){
      setProfileDraft({
        name:          pharmacyProfile.name          || '',
        location:      pharmacyProfile.location      || '',
        tel:           pharmacyProfile.tel           || '',
        open:          pharmacyProfile.open          || '',
        days:          pharmacyProfile.days          || '',
        lat:           pharmacyProfile.lat ?? '',
        lng:           pharmacyProfile.lng ?? '',
        image:         pharmacyProfile.image         || '',
        description:   pharmacyProfile.description   || '',
        contactEmail:  pharmacyProfile.contactEmail  || '',
        whatsapp:      pharmacyProfile.whatsapp      || '',
        licenseNumber: pharmacyProfile.licenseNumber || '',
      });
    } else {
      setProfileDraft(emptyProfileDraft);
    }
  },[pharmacyProfile]);

  useEffect(()=>{
    setMedicineEdits(cur=>{
      const next={...cur};
      pharmacyMedicines.forEach(med=>{
        if(!next[med.id]) next[med.id]={name:med.name||'',brandName:med.brandName||'',category:med.category||'',price:med.price||'',quantity:Number(med.quantity||0),available:Boolean(med.available),image:med.image||'',description:med.description||'',requiresPrescription:Boolean(med.requiresPrescription)};
      });
      Object.keys(next).forEach(id=>{if(!pharmacyMedicines.some(m=>String(m.id)===String(id)))delete next[id];});
      return next;
    });
  },[pharmacyMedicines]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileBusy(true);
    const payload = {
      ...profileDraft,
      lat: profileDraft.lat === '' ? undefined : Number(profileDraft.lat),
      lng: profileDraft.lng === '' ? undefined : Number(profileDraft.lng),
    };
    const ok = await onPharmacyProfileSave(payload);
    setProfileBusy(false);
    setProfileMessage(ok ? 'Profile saved successfully.' : 'Unable to save — please try again.');
  };

  const displayName = getDisplayName(authUser, pharmacyProfile);
  const nav = isAdmin ? ADMIN_NAV : PHARMACY_NAV;
  const navBadges = isAdmin
    ? {
      pharmacies: allPharmaciesAdmin.filter(
        (pharmacy) =>
          pharmacy.approvalStatus === 'pending' || !pharmacy.approvalStatus,
      ).length,
      emergency: emergencyOrders.filter((order) => order.status === 'Pending').length,
      support: contactMessages.filter((message) => !message.read).length,
    }
    : {
      orders: pharmacyEmergencyOrders.filter(
        isUnacknowledgedEmergency,
      ).length,
    };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
      <div className="flex min-h-[620px] overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
        <Sidebar nav={nav} section={section} setSection={setSection}
          displayName={isAdmin?'Admin':displayName} role={authUser?.role||'pharmacy'} onLogout={onLogout}
          badges={navBadges} />

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <MobileTabBar
            nav={nav}
            section={section}
            setSection={setSection}
            onLogout={onLogout}
            badges={navBadges}
          />

          <div className="flex-1 overflow-auto p-6 lg:p-8">
            {isPharmacy && (
              <>
                {section==='overview' && <PharmacyOverview analytics={analytics} medicineCount={pharmacyMedicines.length} displayName={displayName} />}
                {section==='orders' && (
                  <PharmacyOrders
                    sortedReservations={sortedPharmacyReservations}
                    emergencyOrders={pharmacyEmergencyOrders}
                    onReservationStatusChange={onReservationStatusChange}
                    onReservationRemove={onReservationRemove}
                    onEmergencyOrderUpdate={onEmergencyOrderUpdate}
                    displayName={displayName}
                  />
                )}
                {section==='medicines' && (
                  <PharmacyMedicines
                    pharmacyMedicines={pharmacyMedicines}
                    medicineDraft={medicineDraft} setMedicineDraft={setMedicineDraft}
                    medicineEdits={medicineEdits} setMedicineEdits={setMedicineEdits}
                    medicineMessage={medicineMessage} setMedicineMessage={setMedicineMessage}
                    cardSaveState={cardSaveState} setCardSaveState={setCardSaveState}
                    selectedDeleteId={selectedDeleteId}
                    onMedicineCreate={onMedicineCreate} onMedicineUpdate={onMedicineUpdate}
                    onToggleAvailability={onToggleAvailability}
                    onMedicineDelete={id=>{setSelectedDeleteId(id);onMedicineDelete(id).then(ok=>{setMedicineMessage(ok?'Medicine removed.':'Unable to remove.');setSelectedDeleteId('');});}}
                  />
                )}
                {section==='catalog' && <PharmacyCatalog pharmacyMedicines={pharmacyMedicines} />}
                {section==='profile' && <PharmacyProfile profileDraft={profileDraft} setProfileDraft={setProfileDraft} profileMessage={profileMessage} profileBusy={profileBusy} onProfileSubmit={handleProfileSubmit} />}
                {section==='analytics' && (
                  <PharmacyAnalytics
                    analytics={analytics}
                    reservations={sortedPharmacyReservations}
                    pharmacyMedicines={pharmacyMedicines}
                  />
                )}
              </>
            )}
            {isAdmin && (
              <>
                {section==='overview' && <AdminOverview
                  totalPharmacies={totalPharmacies}
                  pendingPharmacyCount={allPharmaciesAdmin.filter(p => p.approvalStatus === 'pending' || !p.approvalStatus).length}
                  reservationCount={reservations.length}
                  activeMedicines={activeMedicines}
                  pendingEmergencyCount={emergencyOrders.filter(o=>o.status==='Pending').length}
                  unreadContactCount={contactMessages.filter(m=>!m.read).length}
                />}
                {section==='pharmacies' && (
                  <AdminPharmacies
                    allPharmaciesAdmin={allPharmaciesAdmin}
                    onApprovePharmacy={onApprovePharmacy}
                    onEditPharmacy={onEditPharmacy}
                    onDeletePharmacy={onDeletePharmacy}
                  />
                )}
                {section==='medicines' && <AdminMedicines medicines={medicines} onToggleAvailability={onToggleAvailability} />}
                {section==='reservations' && <AdminReservations reservations={reservations} onReservationStatusChange={onReservationStatusChange} onReservationRemove={onReservationRemove} />}
                {section==='emergency' && (
                  <AdminEmergency
                    emergencyOrders={emergencyOrders}
                    medicines={medicines}
                    onEmergencyOrderUpdate={onEmergencyOrderUpdate}
                    emergencyOrdersLoading={emergencyOrdersLoading}
                    emergencyOrdersError={emergencyOrdersError}
                  />
                )}
                {section==='support'   && <AdminContact contactMessages={contactMessages} onContactMarkRead={onContactMarkRead} />}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
