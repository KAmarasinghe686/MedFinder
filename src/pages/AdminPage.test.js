import { fireEvent, render, screen } from '@testing-library/react';
import AdminPage from './AdminPage';

const medicines = [
  {
    id: 'medicine-1',
    name: 'Paracetamol 500mg',
    pharmacy: 'City Pharmacy',
    category: 'Pain Relief',
    price: 'LKR 120',
    quantity: 20,
    available: true,
  },
  {
    id: 'medicine-2',
    name: 'Amoxicillin 500mg',
    pharmacy: 'HealthCare Pharmacy',
    category: 'Antibiotic',
    price: 'LKR 650',
    quantity: 10,
    available: true,
  },
  {
    id: 'medicine-3',
    name: 'Antiseptic Cream',
    pharmacy: 'City Pharmacy',
    category: 'First Aid',
    price: 'LKR 480',
    quantity: 0,
    available: false,
  },
];

test('admin can combine pharmacy, category and status medicine filters', () => {
  render(
    <AdminPage
      medicines={medicines}
      reservations={[]}
      emergencyOrders={[]}
      contactMessages={[]}
      allPharmaciesAdmin={[]}
      authUser={{ role: 'admin', name: 'Admin' }}
      onToggleAvailability={jest.fn()}
      onMedicineUpdate={jest.fn()}
      onMedicineCreate={jest.fn()}
      onMedicineDelete={jest.fn()}
      onPharmacyProfileSave={jest.fn()}
      onReservationStatusChange={jest.fn()}
      onReservationRemove={jest.fn()}
      onEmergencyOrderUpdate={jest.fn()}
      onContactMarkRead={jest.fn()}
      onApprovePharmacy={jest.fn()}
      onEditPharmacy={jest.fn()}
      onDeletePharmacy={jest.fn()}
      onLogout={jest.fn()}
    />,
  );

  fireEvent.click(screen.getAllByRole('button', { name: 'Medicines' })[0]);

  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by pharmacy' }), {
    target: { value: 'City Pharmacy' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by category' }), {
    target: { value: 'First Aid' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by status' }), {
    target: { value: 'Hidden' },
  });

  expect(screen.getByText('Antiseptic Cream')).toBeInTheDocument();
  expect(screen.queryByText('Paracetamol 500mg')).not.toBeInTheDocument();
  expect(screen.queryByText('Amoxicillin 500mg')).not.toBeInTheDocument();
  expect(screen.getByText('Showing 1 of 3 medicines')).toBeInTheDocument();
});

test('admin medicine search also matches pharmacy, category and status text', () => {
  render(
    <AdminPage
      medicines={medicines}
      reservations={[]}
      authUser={{ role: 'admin' }}
      onToggleAvailability={jest.fn()}
      onLogout={jest.fn()}
    />,
  );

  fireEvent.click(screen.getAllByRole('button', { name: 'Medicines' })[0]);
  fireEvent.change(screen.getByRole('textbox', { name: 'Search medicines' }), {
    target: { value: 'HealthCare Pharmacy' },
  });

  expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
  expect(screen.queryByText('Paracetamol 500mg')).not.toBeInTheDocument();
});

test('pharmacy menus show a red notification badge only for pending emergency orders', () => {
  const baseProps = {
    medicines: [],
    reservations: [],
    contactMessages: [],
    allPharmaciesAdmin: [],
    authUser: {
      role: 'pharmacy',
      pharmacyId: 'pharmacy-1',
      pharmacyName: 'City Pharmacy',
    },
    pharmacyProfile: {
      id: 'pharmacy-1',
      name: 'City Pharmacy',
    },
    onToggleAvailability: jest.fn(),
    onMedicineUpdate: jest.fn(),
    onMedicineCreate: jest.fn(),
    onMedicineDelete: jest.fn(),
    onPharmacyProfileSave: jest.fn(),
    onReservationStatusChange: jest.fn(),
    onReservationRemove: jest.fn(),
    onEmergencyOrderUpdate: jest.fn(),
    onLogout: jest.fn(),
  };
  const emergencyOrder = {
    id: 'emergency-1',
    status: 'pending',
    preferredPharmacy: '',
    medicineName: 'Urgent medicine',
  };

  const { rerender } = render(
    <AdminPage {...baseProps} emergencyOrders={[emergencyOrder]} />,
  );

  expect(
    screen.getAllByLabelText('1 notification for Orders'),
  ).toHaveLength(2);

  rerender(
    <AdminPage
      {...baseProps}
      emergencyOrders={[{ ...emergencyOrder, status: 'Acknowledged' }]}
    />,
  );

  expect(
    screen.queryByLabelText('1 notification for Orders'),
  ).not.toBeInTheDocument();
});

test('pharmacy can search and filter its medicine inventory', () => {
  const pharmacyMedicines = [
    {
      id: 'pharmacy-med-1',
      name: 'Paracetamol 500mg',
      brandName: 'Panadol',
      pharmacy: 'City Pharmacy',
      pharmacyId: 'pharmacy-1',
      category: 'Pain Relief',
      price: 'LKR 120',
      quantity: 20,
      available: true,
    },
    {
      id: 'pharmacy-med-2',
      name: 'Vitamin C',
      brandName: 'Xon-Ce',
      pharmacy: 'City Pharmacy',
      pharmacyId: 'pharmacy-1',
      category: 'Supplements',
      price: 'LKR 350',
      quantity: 4,
      available: true,
    },
  ];

  render(
    <AdminPage
      medicines={pharmacyMedicines}
      reservations={[]}
      emergencyOrders={[]}
      authUser={{
        role: 'pharmacy',
        pharmacyId: 'pharmacy-1',
        pharmacyName: 'City Pharmacy',
      }}
      pharmacyProfile={{ id: 'pharmacy-1', name: 'City Pharmacy' }}
      onToggleAvailability={jest.fn()}
      onMedicineUpdate={jest.fn()}
      onMedicineCreate={jest.fn()}
      onMedicineDelete={jest.fn()}
      onPharmacyProfileSave={jest.fn()}
      onReservationStatusChange={jest.fn()}
      onReservationRemove={jest.fn()}
      onEmergencyOrderUpdate={jest.fn()}
      onLogout={jest.fn()}
    />,
  );

  fireEvent.click(screen.getAllByRole('button', { name: 'Medicines' })[0]);

  fireEvent.change(
    screen.getByRole('textbox', { name: 'Search pharmacy inventory' }),
    { target: { value: 'Panadol' } },
  );

  expect(screen.getByDisplayValue('Paracetamol 500mg')).toBeInTheDocument();
  expect(screen.queryByDisplayValue('Vitamin C')).not.toBeInTheDocument();
  expect(screen.getByText('Showing 1 of 2 medicines')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Filter pharmacy inventory by category' }),
    { target: { value: 'Supplements' } },
  );
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Filter pharmacy inventory by stock status' }),
    { target: { value: 'Low Stock' } },
  );

  expect(screen.getByDisplayValue('Vitamin C')).toBeInTheDocument();
  expect(screen.queryByDisplayValue('Paracetamol 500mg')).not.toBeInTheDocument();
});

test('pharmacy Medicine List uses admin-style search, category and status filters', () => {
  const catalogMedicines = [
    {
      id: 'catalog-med-1',
      name: 'Paracetamol 500mg',
      brandName: 'Panadol',
      pharmacy: 'City Pharmacy',
      pharmacyId: 'pharmacy-1',
      category: 'Pain Relief',
      price: 'LKR 120',
      quantity: 20,
      available: true,
    },
    {
      id: 'catalog-med-2',
      name: 'Antiseptic Cream',
      brandName: 'Betadine',
      pharmacy: 'City Pharmacy',
      pharmacyId: 'pharmacy-1',
      category: 'First Aid',
      price: 'LKR 480',
      quantity: 8,
      available: false,
    },
  ];

  render(
    <AdminPage
      medicines={catalogMedicines}
      reservations={[]}
      emergencyOrders={[]}
      authUser={{
        role: 'pharmacy',
        pharmacyId: 'pharmacy-1',
        pharmacyName: 'City Pharmacy',
      }}
      pharmacyProfile={{ id: 'pharmacy-1', name: 'City Pharmacy' }}
      onToggleAvailability={jest.fn()}
      onMedicineUpdate={jest.fn()}
      onMedicineCreate={jest.fn()}
      onMedicineDelete={jest.fn()}
      onPharmacyProfileSave={jest.fn()}
      onReservationStatusChange={jest.fn()}
      onReservationRemove={jest.fn()}
      onEmergencyOrderUpdate={jest.fn()}
      onLogout={jest.fn()}
    />,
  );

  fireEvent.click(screen.getAllByRole('button', { name: 'Medicine List' })[0]);
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Search pharmacy medicine list' }),
    { target: { value: 'Betadine' } },
  );

  expect(screen.getByText('Antiseptic Cream')).toBeInTheDocument();
  expect(screen.queryByText('Paracetamol 500mg')).not.toBeInTheDocument();
  expect(screen.getByText('Showing 1 of 2 medicines')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Filter medicine list by category' }),
    { target: { value: 'First Aid' } },
  );
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Filter medicine list by status' }),
    { target: { value: 'Hidden' } },
  );

  expect(screen.getByText('Antiseptic Cream')).toBeInTheDocument();
  expect(screen.queryByText('Paracetamol 500mg')).not.toBeInTheDocument();
});
