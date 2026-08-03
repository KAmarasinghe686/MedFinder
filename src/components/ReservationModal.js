import React, { useEffect, useRef, useState } from 'react';
import { Check, MapPin, Navigation, Paperclip, Store, X } from 'lucide-react';
import { calculateDistanceKm, isValidPhone } from '../utils';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ReservationModal({
  selectedMed,
  authUser,
  onClose,
  showSuccess,
  setShowSuccess,
  onCreateReservation,
  pharmacies = [],
}) {
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [prescription, setPrescription] = useState(null); // { file, base64, preview }
  const [userLoc, setUserLoc] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const pharmacy = pharmacies.find((p) => p.name === selectedMed?.pharmacy) || null;
  const distanceKm =
    userLoc && pharmacy ? calculateDistanceKm(userLoc, pharmacy) : null;

  // Try to get location silently when modal opens
  useEffect(() => {
    if (!selectedMed) return;
    setForm({
      name: authUser?.name || '',
      phone: authUser?.phone || '',
      notes: '',
    });
    setPrescription(null);
    setError('');
    setIsSubmitting(false);
    setShowSuccess(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, [selectedMed, setShowSuccess, authUser?.name, authUser?.phone]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 8000 }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Prescription must be an image (JPG/PNG) or PDF file.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Prescription file must be under 5 MB.');
      e.target.value = '';
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPrescription({
        file,
        base64: ev.target.result,
        preview: file.type.startsWith('image/') ? ev.target.result : null,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prescription) {
      setError('Please upload your prescription before confirming.');
      return;
    }
    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Enter a valid phone number (7-10 digits).');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const ok = await onCreateReservation({
      items: [{
        medicineId: selectedMed.id,
        quantity: Number(selectedMed.requestedQuantity) || 1,
      }],
      customerName: form.name.trim(),
      customerPhone: form.phone.trim(),
      notes: form.notes.trim(),
      prescriptionData: prescription.base64,
      prescriptionFileName: prescription.file.name,
    });

    setIsSubmitting(false);
    if (!ok) {
      setError('Unable to place reservation. Please try again.');
      return;
    }
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); onClose(); }, 2400);
  };

  if (!selectedMed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 py-6 sm:items-center sm:px-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">New Reservation</p>
            <h3 className="mt-0.5 text-xl font-black text-slate-900">{selectedMed.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={17} />
          </button>
        </div>

        {showSuccess ? (
          <div className="px-6 py-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={30} />
            </span>
            <h3 className="mt-5 text-2xl font-black text-slate-900">Reservation confirmed!</h3>
            <p className="mt-2 text-base text-slate-500">
              Your reservation is held for the next 2 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto" noValidate>
            <div className="space-y-5 px-6 py-5">

              {/* ── Pharmacy verification ── */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Store size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pharmacy</p>
                    <p className="mt-0.5 text-lg font-black text-slate-900 truncate">
                      {selectedMed.pharmacy}
                    </p>
                    {pharmacy?.location && (
                      <p className="mt-0.5 text-sm text-slate-500">{pharmacy.location}</p>
                    )}
                    {pharmacy?.tel && (
                      <p className="mt-0.5 text-sm text-slate-500">{pharmacy.tel}</p>
                    )}
                  </div>
                </div>

                {/* Distance row */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                  {distanceKm !== null ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">
                        <MapPin size={13} />
                        {distanceKm.toFixed(1)} km from your location
                      </span>
                      {pharmacy?.lat && pharmacy?.lng && userLoc && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${pharmacy.lat},${pharmacy.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          Get directions →
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locLoading}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Navigation size={13} />
                      {locLoading ? 'Getting location…' : 'Check distance from me'}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Prescription upload ── */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Prescription <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-slate-400">JPG, PNG or PDF · max 5 MB</span>
                </label>

                {prescription ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    {prescription.preview ? (
                      <img
                        src={prescription.preview}
                        alt="Prescription preview"
                        className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-emerald-200"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <Paperclip size={22} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-emerald-800 truncate">{prescription.file.name}</p>
                      <p className="text-xs text-emerald-600">
                        {(prescription.file.size / 1024).toFixed(0)} KB
                      </p>
                      <button
                        type="button"
                        onClick={() => { setPrescription(null); fileInputRef.current.value = ''; }}
                        className="mt-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <Check size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-base font-semibold text-slate-500 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Paperclip size={18} />
                    Click to upload prescription
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* ── Patient details ── */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Your name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+94 77 000 0000"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Notes <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any special instructions for the pharmacy"
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="border-t border-slate-100 px-6 py-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting…' : 'Confirm Reservation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
