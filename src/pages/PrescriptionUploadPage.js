import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { openFileData } from '../utils/openFileData';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileUp,
  Home,
  Pill,
  PlusCircle,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  X,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const inputCls = (err) =>
  `w-full rounded-xl border px-4 py-3 text-base outline-none transition bg-white
   focus:ring-2 focus:ring-emerald-100
   ${err ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-emerald-500'}`;

function FieldErr({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-semibold text-red-600">{msg}</p>;
}

function FulfillmentPicker({ value, onChange, address, onAddressChange, addrErr, onAddrErrClear }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-700">
        How would you like to receive your order? <span className="text-red-500">*</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { key: 'pickup',   label: 'Pharmacy Pickup',  desc: 'Collect from the pharmacy yourself.',  Icon: Store,  sel: 'border-emerald-500 bg-emerald-50', icon: 'bg-emerald-100 text-emerald-700' },
          { key: 'delivery', label: 'Home Delivery',    desc: 'We deliver to your address.',          Icon: Truck,  sel: 'border-blue-500 bg-blue-50',     icon: 'bg-blue-100 text-blue-700' },
        ].map(({ key, label, desc, Icon, sel, icon }) => (
          <button key={key} type="button" onClick={() => onChange(key)}
            className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition
              ${value === key ? sel : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${value === key ? icon : 'bg-slate-100 text-slate-500'}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </button>
        ))}
      </div>
      {value === 'delivery' && (
        <div className="mt-1">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">
            <Home size={14} /> Delivery address <span className="text-red-500">*</span>
          </label>
          <input type="text" value={address} onChange={e => { onAddressChange(e.target.value); onAddrErrClear(); }}
            placeholder="House number, street, city" className={inputCls(addrErr)} />
          <FieldErr msg={addrErr} />
        </div>
      )}
    </div>
  );
}

// ── Non-Prescription mode (multi-medicine cart) ───────────────────────────────

function NonPrescriptionForm({ pharmacies, medicines, authUser, onCreatePrescriptionOrder, onDone }) {
  const [pharmacy, setPharmacy]           = useState(pharmacies[0]?.name || '');
  const [pickId, setPickId]               = useState('');
  const [cart, setCart]                   = useState([]);  // [{id, name, price, qty}]
  const [name, setName]                   = useState(() => authUser?.name || '');
  const [phone, setPhone]                 = useState(() => authUser?.phone || '');
  const [notes, setNotes]                 = useState('');
  const [fulfillmentType, setFulfillment] = useState('pickup');
  const [deliveryAddress, setDelivAddr]   = useState('');
  const [errs, setErrs]                   = useState({});
  const [busy, setBusy]                   = useState(false);
  const [apiErr, setApiErr]               = useState('');

  useEffect(() => {
    setName((current) => current || authUser?.name || '');
    setPhone((current) => current || authUser?.phone || '');
  }, [authUser?.name, authUser?.phone]);

  // OTC medicines at selected pharmacy, excluding already-in-cart items
  const otcMedicines = useMemo(() =>
    medicines.filter(
      m => !m.requiresPrescription && m.available && m.quantity > 0 &&
        (m.pharmacy === pharmacy || m.pharmacyName === pharmacy)
    ),
    [medicines, pharmacy]
  );

  // Clear cart and selection when pharmacy changes
  useEffect(() => { setPickId(''); setCart([]); }, [pharmacy]);

  const pickedMed = useMemo(
    () => otcMedicines.find(m => (m.id || m._id) === pickId) || null,
    [otcMedicines, pickId]
  );

  const addToCart = () => {
    if (!pickedMed) return;
    const id = pickedMed.id || pickedMed._id;
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id, name: pickedMed.name, price: pickedMed.price || '', qty: 1 }];
    });
    setPickId('');
    setErrs(p => { const n = {...p}; delete n.cart; return n; });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const updateCartQty = (id, qty) =>
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));

  const validate = () => {
    const e = {};
    if (!pharmacy)    e.pharmacy = 'Please select a pharmacy.';
    if (cart.length === 0) e.cart = 'Add at least one medicine to your order.';
    if (!name.trim()) e.name     = 'Your name is required.';
    if (!phone.trim()) e.phone   = 'Contact number is required.';
    if (fulfillmentType === 'delivery' && !deliveryAddress.trim())
      e.deliveryAddress = 'Please enter your delivery address.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setApiErr('');
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }

    setBusy(true);
    const medicineLine = cart.map(item => `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}`).join(', ');
    const result = await onCreatePrescriptionOrder({
      items: cart.map((item) => ({
        medicineId: item.id,
        quantity: item.qty,
      })),
      customerName:    name.trim(),
      customerPhone:   phone.trim(),
      notes:           notes.trim(),
      fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() : '',
    });
    setBusy(false);

    if (!result || result.error) {
      setApiErr(result?.error || 'Unable to place your order. Please try again.');
      return;
    }
    onDone({ reference: result.referenceNumber, medicine: medicineLine, pharmacy });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Pharmacy */}
      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-600">
          Pharmacy <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select value={pharmacy} onChange={e => setPharmacy(e.target.value)}
            className={`${inputCls(errs.pharmacy)} appearance-none pr-10`}>
            {pharmacies.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <FieldErr msg={errs.pharmacy} />
      </div>

      {/* Medicine picker + cart */}
      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-600">
          Add medicines <span className="text-red-500">*</span>
        </label>
        {otcMedicines.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle size={16} className="shrink-0" />
            No non-prescription medicines in stock at {pharmacy} right now.
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select value={pickId} onChange={e => setPickId(e.target.value)}
                className={`${inputCls(false)} appearance-none pr-10`}>
                <option value="">-- Choose a medicine --</option>
                {otcMedicines.map(m => (
                  <option key={m.id || m._id} value={m.id || m._id}>
                    {m.name}{m.price ? ` — ${m.price}` : ''}{` (${m.quantity} in stock)`}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button type="button" onClick={addToCart} disabled={!pickId}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-40">
              <PlusCircle size={16} /> Add
            </button>
          </div>
        )}
        <FieldErr msg={errs.cart} />

        {/* Cart list */}
        {cart.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Your order ({cart.length} item{cart.length > 1 ? 's' : ''})</p>
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <Pill size={15} className="shrink-0 text-emerald-600" />
                <span className="flex-1 text-sm font-bold text-emerald-900">{item.name}</span>
                {item.price && <span className="text-sm font-semibold text-emerald-700">{item.price}</span>}
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateCartQty(item.id, item.qty - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-bold">−</button>
                  <span className="w-6 text-center text-sm font-bold text-slate-900">{item.qty}</span>
                  <button type="button" onClick={() => updateCartQty(item.id, item.qty + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-bold">+</button>
                </div>
                <button type="button" onClick={() => removeFromCart(item.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-600">
            Your name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={name} onChange={e => { setName(e.target.value); setErrs(p => ({...p, name: ''})); }}
            placeholder="Full name" className={inputCls(errs.name)} />
          <FieldErr msg={errs.name} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-600">
            Contact number <span className="text-red-500">*</span>
          </label>
          <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setErrs(p => ({...p, phone: ''})); }}
            placeholder="0771234567" className={inputCls(errs.phone)} />
          <FieldErr msg={errs.phone} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-600">Notes (optional)</label>
        <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any special instructions..."
          className={`${inputCls(false)} resize-none`} />
      </div>

      <FulfillmentPicker
        value={fulfillmentType}
        onChange={v => { setFulfillment(v); setErrs(p => ({ ...p, deliveryAddress: '' })); }}
        address={deliveryAddress}
        onAddressChange={setDelivAddr}
        addrErr={errs.deliveryAddress}
        onAddrErrClear={() => setErrs(p => ({ ...p, deliveryAddress: '' }))}
      />

      {apiErr && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{apiErr}</div>
      )}

      <button type="submit" disabled={busy || otcMedicines.length === 0}
        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60">
        <ShoppingCart size={16} /> {busy ? 'Placing order…' : `Place order${cart.length > 1 ? ` (${cart.length} items)` : ''}`}
      </button>
    </form>
  );
}

// ── Prescription mode (multi-medicine list) ────────────────────────────────────

function PrescriptionForm({ pharmacies, authUser, onCreatePrescriptionOrder, onDone }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    patientName: authUser?.name || '', phone: authUser?.phone || '', branch: pharmacies[0]?.name || '',
    notes: '', fileName: '', fileData: '',
  });
  // List of medicine name entries
  const [medEntries, setMedEntries] = useState([{ key: 0, name: '' }]);
  const [nextKey, setNextKey]         = useState(1);
  const [fulfillmentType, setFulfillment] = useState('pickup');
  const [deliveryAddress, setDelivAddr]   = useState('');
  const [errs, setErrs]       = useState({});
  const [busy, setBusy]       = useState(false);
  const [apiErr, setApiErr]   = useState('');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      patientName: current.patientName || authUser?.name || '',
      phone: current.phone || authUser?.phone || '',
    }));
  }, [authUser?.name, authUser?.phone]);

  useEffect(() => {
    if (!form.branch && pharmacies[0]?.name) {
      setForm(p => ({ ...p, branch: pharmacies[0].name }));
    }
  }, [form.branch, pharmacies]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, [field]: val }));
    setErrs(p => { const n = { ...p }; delete n[field]; return n; });
  };

  const setMedName = (key, val) => {
    setMedEntries(prev => prev.map(m => m.key === key ? { ...m, name: val } : m));
    setErrs(p => { const n = { ...p }; delete n.medicine; return n; });
  };
  const addMedEntry = () => {
    setMedEntries(prev => [...prev, { key: nextKey, name: '' }]);
    setNextKey(k => k + 1);
  };
  const removeMedEntry = (key) => setMedEntries(prev => prev.filter(m => m.key !== key));

  const validate = () => {
    const e = {};
    if (!form.patientName.trim()) e.patientName = 'Your name is required.';
    if (!form.phone.trim())       e.phone       = 'Contact number is required.';
    if (!form.branch)             e.branch      = 'Please select a pharmacy.';
    const filled = medEntries.filter(m => m.name.trim());
    if (filled.length === 0)      e.medicine    = 'Enter at least one medicine or treatment name.';
    if (!form.fileData)           e.fileData    = 'Please upload your prescription.';
    if (fulfillmentType === 'delivery' && !deliveryAddress.trim())
      e.deliveryAddress = 'Please enter your delivery address.';
    return e;
  };

  const handleFile = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrs(p => ({ ...p, fileData: 'File must be an image (JPG/PNG) or PDF.' }));
      ev.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrs(p => ({ ...p, fileData: 'File must be 5 MB or smaller.' }));
      ev.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(p => ({ ...p, fileName: file.name, fileData: String(reader.result || '') }));
      setErrs(p => { const n = { ...p }; delete n.fileData; return n; });
    };
    reader.onerror = () => setErrs(p => ({ ...p, fileData: 'Unable to read file.' }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setApiErr('');
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }

    const filled = medEntries.filter(m => m.name.trim());
    const medicineLine = filled.map(m => m.name.trim()).join(', ');

    setBusy(true);
    const result = await onCreatePrescriptionOrder({
      medicineName:         medicineLine,
      pharmacyName:         form.branch,
      customerName:         form.patientName.trim(),
      customerPhone:        form.phone.trim(),
      notes:                form.notes.trim(),
      prescriptionData:     form.fileData,
      prescriptionFileName: form.fileName,
      fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() : '',
    });
    setBusy(false);

    if (!result || result.error) {
      setApiErr(result?.error || 'Unable to submit prescription. Please try again.');
      return;
    }
    onDone({ reference: result.referenceNumber, medicine: medicineLine, pharmacy: form.branch });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-600">
            Your name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={form.patientName} onChange={set('patientName')}
            placeholder="Full name" className={inputCls(errs.patientName)} />
          <FieldErr msg={errs.patientName} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-600">
            Contact number <span className="text-red-500">*</span>
          </label>
          <input type="tel" value={form.phone} onChange={set('phone')}
            placeholder="0771234567" className={inputCls(errs.phone)} />
          <FieldErr msg={errs.phone} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-600">
          Pharmacy <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select value={form.branch} onChange={set('branch')}
            className={`${inputCls(errs.branch)} appearance-none pr-10`}>
            {pharmacies.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <FieldErr msg={errs.branch} />
      </div>

      {/* Multi-medicine entries */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-bold text-slate-600">
            Medicines / treatments <span className="text-red-500">*</span>
          </label>
          <button type="button" onClick={addMedEntry}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
            <PlusCircle size={12} /> Add another
          </button>
        </div>
        <div className="space-y-2">
          {medEntries.map((m, i) => (
            <div key={m.key} className="flex items-center gap-2">
              <input type="text" value={m.name}
                onChange={e => setMedName(m.key, e.target.value)}
                placeholder={i === 0 ? 'e.g. Amoxicillin 500mg' : 'e.g. Paracetamol 500mg'}
                className={`flex-1 ${inputCls(i === 0 && errs.medicine)}`} />
              {medEntries.length > 1 && (
                <button type="button" onClick={() => removeMedEntry(m.key)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500">
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <FieldErr msg={errs.medicine} />
        <p className="mt-1 text-xs text-slate-400">Add each medicine on a separate line. The pharmacist will verify against your prescription.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-600">Notes (optional)</label>
        <textarea rows={2} value={form.notes} onChange={set('notes')}
          placeholder="Doctor instructions, quantity, or other notes"
          className={`${inputCls(false)} resize-none`} />
      </div>

      {/* File upload */}
      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-600">
          Prescription document <span className="text-red-500">*</span>
        </label>
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
        <button type="button" onClick={() => fileRef.current?.click()}
          className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition
            ${errs.fileData
              ? 'border-red-300 bg-red-50 text-red-500'
              : form.fileData
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-emerald-400 hover:text-emerald-600'}`}>
          <FileUp size={20} className="shrink-0" />
          <span className="text-sm font-semibold">
            {form.fileName || 'Click to attach prescription (image or PDF, max 5 MB)'}
          </span>
          {form.fileData && <CheckCircle2 size={16} className="ml-auto shrink-0 text-emerald-600" />}
        </button>
        {form.fileData && (
          <button
            type="button"
            onClick={() => openFileData(form.fileData, form.fileName)}
            className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            View file
          </button>
        )}
        <FieldErr msg={errs.fileData} />
      </div>

      <FulfillmentPicker
        value={fulfillmentType}
        onChange={v => { setFulfillment(v); setErrs(p => ({ ...p, deliveryAddress: '' })); }}
        address={deliveryAddress}
        onAddressChange={setDelivAddr}
        addrErr={errs.deliveryAddress}
        onAddrErrClear={() => setErrs(p => ({ ...p, deliveryAddress: '' }))}
      />

      {apiErr && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{apiErr}</div>
      )}

      <button type="submit" disabled={busy}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60">
        <ShieldCheck size={16} /> {busy ? 'Submitting…' : 'Submit prescription'}
      </button>
    </form>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ reference, medicine, pharmacy, mode, onReset }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <CheckCircle2 size={56} className="text-emerald-500" />
      <h3 className="mt-4 text-2xl font-black text-slate-900">
        {mode === 'prescription' ? 'Prescription submitted!' : 'Order placed!'}
      </h3>
      <p className="mt-2 text-base text-slate-600">
        {mode === 'prescription'
          ? 'A pharmacist will review your prescription and prepare your medicine.'
          : `Your order for ${medicine} has been sent to ${pharmacy}.`}
      </p>
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Reference number</p>
        <p className="mt-1 text-2xl font-black tracking-wide text-slate-900">{reference}</p>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={() => navigate(`/track-order?reference=${encodeURIComponent(reference)}`)}
          className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700">
          Track this order
        </button>
        <button onClick={onReset}
          className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
          Place another order
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PrescriptionUploadPage({
  pharmacies = [],
  medicines  = [],
  authUser,
  onCreatePrescriptionOrder,
}) {
  const [mode, setMode]       = useState(null);   // null | 'prescription' | 'otc'
  const [done, setDone]       = useState(null);   // { reference, medicine, pharmacy } | null

  const handleDone = (info) => setDone(info);
  const handleReset = () => { setDone(null); setMode(null); };

  return (
    <section className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Medicine Ordering</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">Order your medicine</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Select whether your medicine needs a doctor's prescription or can be bought over the counter.
        </p>
      </div>

      {/* ── Payment note ── */}
      {!done && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <span className="mt-0.5 shrink-0 text-lg">💳</span>
          <p className="text-sm text-emerald-900">
            <span className="font-black">Payment:</span> No advance payment needed.
            Pay when you collect at the pharmacy counter, or pay cash to the delivery person at your door.
          </p>
        </div>
      )}

      {/* ── Mode selector ── */}
      {!done && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {/* Non-prescription card */}
          <button onClick={() => setMode('otc')}
            className={`group rounded-[2rem] border-2 p-6 text-left transition
              ${mode === 'otc'
                ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'}`}>
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition
              ${mode === 'otc' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200'}`}>
              <ShoppingCart size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Non-Prescription Medicine</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Over-the-counter medicines available without a doctor's prescription. Pick from the live stock list.
            </p>
            {mode === 'otc' && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={13} /> Selected
              </span>
            )}
          </button>

          {/* Prescription card */}
          <button onClick={() => setMode('prescription')}
            className={`group rounded-[2rem] border-2 p-6 text-left transition
              ${mode === 'prescription'
                ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-100'
                : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'}`}>
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition
              ${mode === 'prescription' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 group-hover:bg-amber-200'}`}>
              <ClipboardList size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Prescription Medicine</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Medicines that require a valid doctor's prescription. Upload your prescription to order.
            </p>
            {mode === 'prescription' && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <CheckCircle2 size={13} /> Selected
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Form panel ── */}
      {(mode || done) && (
        <div className="rounded-[2rem] bg-white p-8 shadow-md lg:p-10">
          {done ? (
            <SuccessScreen
              reference={done.reference}
              medicine={done.medicine}
              pharmacy={done.pharmacy}
              mode={mode}
              onReset={handleReset}
            />
          ) : mode === 'otc' ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Order non-prescription medicine</h2>
                  <p className="text-sm text-slate-500">Choose from medicines available without a prescription</p>
                </div>
              </div>
              <NonPrescriptionForm
                pharmacies={pharmacies}
                medicines={medicines}
                authUser={authUser}
                onCreatePrescriptionOrder={onCreatePrescriptionOrder}
                onDone={handleDone}
              />
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Upload your prescription</h2>
                  <p className="text-sm text-slate-500">A pharmacist will review and prepare your medicine</p>
                </div>
              </div>
              <PrescriptionForm
                pharmacies={pharmacies}
                authUser={authUser}
                onCreatePrescriptionOrder={onCreatePrescriptionOrder}
                onDone={handleDone}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}
