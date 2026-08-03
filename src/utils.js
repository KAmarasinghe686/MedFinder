export const RESERVATION_STATUSES = [
  'Pending', 'Approved', 'Packing', 'Ready for Pickup', 'Delivered', 'Cancelled', 'Rejected',
];

export const ORDER_TIMELINE = ['Pending', 'Approved', 'Packing', 'Ready for Pickup', 'Delivered'];

// Timeline step labels by fulfillment type (statuses stay the same on the server)
export const PICKUP_STEPS = [
  { status: 'Pending',          label: 'Order Placed' },
  { status: 'Approved',         label: 'Approved' },
  { status: 'Packing',          label: 'Packing' },
  { status: 'Ready for Pickup', label: 'Ready for Pickup' },
  { status: 'Delivered',        label: 'Collected' },
];
export const DELIVERY_STEPS = [
  { status: 'Pending',          label: 'Order Placed' },
  { status: 'Approved',         label: 'Approved' },
  { status: 'Packing',          label: 'Packing' },
  { status: 'Ready for Pickup', label: 'Out for Delivery' },
  { status: 'Delivered',        label: 'Delivered' },
];
export const getTimelineSteps = (fulfillmentType) =>
  fulfillmentType === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;

export const CANCEL_WINDOW_HOURS = 2;

export const canCancelOrder = (reservation) => {
  if (!['Pending', 'Approved'].includes(reservation.status)) return false;
  const diffHours = (Date.now() - new Date(reservation.createdAt)) / (1000 * 60 * 60);
  return diffHours <= CANCEL_WINDOW_HOURS;
};

export const cancelTimeLeft = (reservation) => {
  const diffMs = CANCEL_WINDOW_HOURS * 60 * 60 * 1000 - (Date.now() - new Date(reservation.createdAt));
  if (diffMs <= 0) return null;
  const h = Math.floor(diffMs / (1000 * 60 * 60));
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const formatDistance = (distanceKm, isApprox = false) => {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return 'Distance unknown';
  return `${isApprox ? '~' : ''}${distanceKm.toFixed(1)} km away`;
};
export const formatReservationDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleString();
};
export const toRadians = (value) => (value * Math.PI) / 180;
export const calculateDistanceKm = (from, to) => {
  if (!from || !to) return null;

  const lat1 = Number(from.lat);
  const lng1 = Number(from.lng);
  const lat2 = Number(to.lat);
  const lng2 = Number(to.lng);

  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;

  const radiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radiusKm * c;
};

// ── Shared field validation ─────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => EMAIL_RE.test(String(value || '').trim());

export const digitCount = (value) => String(value || '').replace(/\D/g, '').length;

export const isValidPhone = (value) => {
  const d = digitCount(value);
  return d >= 7 && d <= 10;
};

export const isValidLatLng = (lat, lng) => {
  const la = Number(lat);
  const lo = Number(lng);
  return Number.isFinite(la) && la >= -90 && la <= 90 && Number.isFinite(lo) && lo >= -180 && lo <= 180;
};
