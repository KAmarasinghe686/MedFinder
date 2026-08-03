const test = require('node:test');
const assert = require('node:assert/strict');
const aiRouter = require('../src/routes/ai');

const { buildNearbyAnswer, haversineKm, normalizeCoordinate } =
  aiRouter._test;

test('normalizes valid coordinates and rejects invalid values', () => {
  assert.equal(normalizeCoordinate('7.4697', -90, 90), 7.4697);
  assert.equal(normalizeCoordinate('80.0402', -180, 180), 80.0402);
  assert.equal(normalizeCoordinate('not-a-number', -90, 90), null);
  assert.equal(normalizeCoordinate(200, -180, 180), null);
});

test('haversine distance is zero for identical coordinates', () => {
  assert.equal(haversineKm(7.4697, 80.0402, 7.4697, 80.0402), 0);
});

test('nearby answers rank matching in-stock medicine by distance', () => {
  const answer = buildNearbyAnswer('Is Paracetamol available near me?', {
    pharmacies: [
      {
        name: 'Far Pharmacy',
        location: 'Kurunegala',
        distanceKm: 8.4,
        openNow: true,
      },
      {
        name: 'Near Pharmacy',
        location: 'Kuliyapitiya',
        distanceKm: 1.2,
        openNow: true,
      },
    ],
    medicines: [
      {
        name: 'Paracetamol 500mg',
        pharmacyName: 'Far Pharmacy',
        available: true,
        quantity: 20,
        price: 'LKR 120',
      },
      {
        name: 'Paracetamol Oral Suspension',
        pharmacyName: 'Near Pharmacy',
        available: true,
        quantity: 10,
        price: 'LKR 280',
      },
    ],
  });

  assert.ok(answer.indexOf('Near Pharmacy') < answer.indexOf('Far Pharmacy'));
  assert.match(answer, /1\.20 km/);
});
