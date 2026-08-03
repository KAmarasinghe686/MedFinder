import { MEDICINE_SEED, PHARMACY_SEED } from './demoCatalog';

test('includes five pharmacies across Kuliyapitiya and Kurunegala', () => {
  const northWesternPharmacies = PHARMACY_SEED.filter((pharmacy) =>
    /kuliyapitiya|kurunegala/i.test(pharmacy.location),
  );

  expect(northWesternPharmacies).toHaveLength(5);
});

test('includes representative pharmacy coverage across Sri Lanka', () => {
  const locations = PHARMACY_SEED.map((pharmacy) => pharmacy.location).join(' ');

  ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Anuradhapura', 'Batticaloa'].forEach(
    (city) => expect(locations).toContain(city),
  );
});

test('includes medicine forms beyond tablets and links every item to a pharmacy', () => {
  const forms = new Set(MEDICINE_SEED.map((medicine) => medicine.productForm));
  const pharmacyNames = new Set(PHARMACY_SEED.map((pharmacy) => pharmacy.name));

  ['Oral suspension', 'Cream', 'Eye drops', 'Inhaler', 'Powder sachet', 'Gel', 'Nasal spray', 'Injection', 'Ointment']
    .forEach((form) => expect(forms).toContain(form));

  MEDICINE_SEED.forEach((medicine) => {
    expect(pharmacyNames).toContain(medicine.pharmacy);
    expect(medicine.image).toMatch(/^\/images\/medicines\/.+\.png$/);
  });
});

test('uses a dedicated Vitamin C product image', () => {
  const vitaminC = MEDICINE_SEED.find((medicine) => /vitamin\s*c/i.test(medicine.name));

  expect(vitaminC).toBeDefined();
  expect(vitaminC.image).toBe('/images/medicines/vitamin-c-xonce-red.png');
});

test('uses dedicated Clotrimazole and Amlodipine product images', () => {
  const clotrimazole = MEDICINE_SEED.find((medicine) => /clotrimazole\s*1\s*%/i.test(medicine.name));
  const amlodipine = MEDICINE_SEED.find((medicine) => /amlodipine\s*5\s*mg/i.test(medicine.name));

  expect(clotrimazole?.image).toBe('/images/medicines/clotrimazole-cream-1-percent.png');
  expect(amlodipine?.image).toBe('/images/medicines/amlodipine-5mg-teva.png');
  expect(amlodipine?.requiresPrescription).toBe(true);
});

test('includes prescription-only Amoxicillin 500mg with its product image', () => {
  const amoxicillin = MEDICINE_SEED.find((medicine) =>
    /amoxicillin\s*500\s*mg/i.test(medicine.name),
  );

  expect(amoxicillin?.image).toBe('/images/medicines/amoxicillin-500mg-exeter.png');
  expect(amoxicillin?.requiresPrescription).toBe(true);
  expect(amoxicillin?.productForm).toBe('Capsule');
});

test('includes Antiseptic Cream with a dedicated product image', () => {
  const antisepticCream = MEDICINE_SEED.find((medicine) =>
    /antiseptic\s*cream/i.test(medicine.name),
  );

  expect(antisepticCream?.image).toBe('/images/medicines/antiseptic-cream-betadine.png');
  expect(antisepticCream?.productForm).toBe('Cream');
  expect(antisepticCream?.requiresPrescription).not.toBe(true);
});
