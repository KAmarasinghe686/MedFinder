const test = require('node:test');
const assert = require('node:assert/strict');
const Medicine = require('../src/models/Medicine');
const reservationsRoute = require('../src/routes/reservations');

const {
  formatOrderPrice,
  normalizeRequestedItems,
  reserveMedicineStock,
} = reservationsRoute._test;

test('normalizes and combines duplicate structured order items', () => {
  const medicineId = '507f1f77bcf86cd799439011';
  assert.deepEqual(
    normalizeRequestedItems({
      items: [
        { medicineId, quantity: 2 },
        { medicineId, quantity: 3 },
      ],
    }),
    [{ medicineId, quantity: 5 }],
  );
});

test('rejects invalid or excessive item quantities', () => {
  const medicineId = '507f1f77bcf86cd799439011';
  assert.throws(
    () => normalizeRequestedItems({ items: [{ medicineId, quantity: 0 }] }),
    /between 1 and 100/,
  );
  assert.throws(
    () => normalizeRequestedItems({ items: [{ medicineId, quantity: 101 }] }),
    /between 1 and 100/,
  );
});

test('calculates the server-side total from inventory prices', () => {
  assert.equal(
    formatOrderPrice([
      { medicine: { price: 'LKR 120' }, quantity: 2 },
      { medicine: { price: 'LKR 75.50' }, quantity: 1 },
    ]),
    'LKR 315.50',
  );
});

test('uses a conditional stock update and restores earlier items on shortage', async (t) => {
  const originalFindOneAndUpdate = Medicine.findOneAndUpdate;
  const originalUpdateOne = Medicine.updateOne;
  const stockQueries = [];
  const restorations = [];
  let updateAttempt = 0;

  t.after(() => {
    Medicine.findOneAndUpdate = originalFindOneAndUpdate;
    Medicine.updateOne = originalUpdateOne;
  });

  Medicine.findOneAndUpdate = async (query) => {
    stockQueries.push(query);
    updateAttempt += 1;
    return updateAttempt === 1 ? { quantity: 3 } : null;
  };
  Medicine.updateOne = async (...args) => {
    restorations.push(args);
    return { matchedCount: 1 };
  };

  await assert.rejects(
    reserveMedicineStock([
      {
        medicine: {
          _id: '507f1f77bcf86cd799439011',
          pharmacyId: '507f1f77bcf86cd799439021',
          name: 'Medicine A',
        },
        quantity: 2,
      },
      {
        medicine: {
          _id: '507f1f77bcf86cd799439012',
          pharmacyId: '507f1f77bcf86cd799439021',
          name: 'Medicine B',
        },
        quantity: 5,
      },
    ]),
    /does not have enough stock/,
  );

  assert.deepEqual(stockQueries[0].quantity, { $gte: 2 });
  assert.equal(stockQueries[0].available, true);
  assert.equal(restorations.length, 1);
  assert.equal(String(restorations[0][0]._id), '507f1f77bcf86cd799439011');
});
