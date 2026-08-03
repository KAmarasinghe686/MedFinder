import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '../utils';

function Accordion({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-black text-slate-900">{title}</span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-emerald-600" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="pb-5 text-sm leading-7 text-slate-600">{children}</div>
      )}
    </div>
  );
}

export default function MedicineDetailsModal({
  med,
  onClose,
  onReserve,
  onRequireLogin,
  canReserve,
}) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
  }, [med?.id]);

  useEffect(() => {
    if (!med) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [med, onClose]);

  if (!med) {
    return null;
  }

  const pharmacyName = med.pharmacy || med.pharmacyName;
  const details = med.description || med.usage;
  const inStock = Boolean(med.available && Number(med.quantity) > 0);

  const handleReserve = () => {
    if (!inStock) {
      return;
    }

    if (!canReserve) {
      onClose();
      onRequireLogin?.();
      return;
    }

    onReserve?.({ ...med, requestedQuantity: qty });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicine-details-title"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close medicine details"
        style={{ transform: 'none' }}
      />

      <div className="relative grid max-h-[95vh] w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem] lg:max-h-[88vh] lg:grid-cols-[44%_56%] lg:grid-rows-1">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
          aria-label="Close medicine details"
        >
          <X size={21} />
        </button>

        <div className="relative h-64 overflow-hidden bg-slate-100 lg:h-auto lg:min-h-[680px]">
          {med.image ? (
            <img
              src={med.image}
              alt={med.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-cyan-100">
              <ShoppingCart size={72} className="text-emerald-200" />
            </div>
          )}

          <span
            className={`absolute left-5 top-5 rounded-full px-4 py-2 text-xs font-black shadow-lg ${
              inStock
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>

          {inStock && (
            <span className="absolute bottom-5 left-5 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-700 shadow-lg backdrop-blur-sm">
              {med.quantity} units available
            </span>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto p-6 sm:p-8 lg:p-10">
          <div className="pr-12">
            <div className="flex flex-wrap gap-2">
              {med.category && (
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  {med.category}
                </span>
              )}
              {med.size && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {med.size}
                </span>
              )}
              {med.productForm && (
                <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
                  {med.productForm}
                </span>
              )}
              {med.requiresPrescription && (
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                  Prescription required
                </span>
              )}
            </div>

            <h2
              id="medicine-details-title"
              className="mt-4 text-3xl font-black leading-tight text-slate-950"
            >
              {med.name}
            </h2>
          </div>

          {pharmacyName && (
            <Link
              to={`/pharmacies/${slugify(pharmacyName)}`}
              onClick={onClose}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-emerald-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
            >
              <MapPin size={15} />
              {pharmacyName}
            </Link>
          )}

          <p className="mt-5 text-3xl font-black text-slate-950">{med.price}</p>

          {details && (
            <p className="mt-3 text-base leading-7 text-slate-600">{details}</p>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-[130px_1fr]">
            <div className="grid h-12 grid-cols-3 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setQty((current) => Math.max(1, current - 1))}
                className="flex h-full items-center justify-center text-slate-500 hover:bg-slate-50"
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span className="text-center text-base font-black text-slate-900">
                {qty}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQty((current) =>
                    Math.min(Number(med.quantity) || current + 1, current + 1),
                  )
                }
                className="flex h-full items-center justify-center text-slate-500 hover:bg-slate-50"
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleReserve}
              disabled={!inStock}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${
                !inStock
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : canReserve
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingCart size={17} />
              {!inStock
                ? 'Out of Stock'
                : canReserve
                  ? 'Reserve Medicine'
                  : 'Login to Reserve'}
            </button>
          </div>

          <div className="mt-7">
            {details && (
              <Accordion title="Details">
                <p>{details}</p>
              </Accordion>
            )}
            {med.dose && (
              <Accordion title="How to Use">
                <p>{med.dose}</p>
              </Accordion>
            )}
            {med.ingredients && (
              <Accordion title="Ingredients">
                <p>{med.ingredients}</p>
              </Accordion>
            )}
            {med.ageLimit && (
              <Accordion title="Age Limit &amp; Suitability">
                <p>{med.ageLimit}</p>
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
