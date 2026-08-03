import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from './SearchPage';

test('opens medicine details in a document-level modal', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SearchPage
        medicines={[{
          id: 'medicine-1',
          name: 'Paracetamol 500mg',
          pharmacy: 'City Pharmacy',
          quantity: 25,
          price: 'LKR 120',
          available: true,
          category: 'Pain Relief',
          productForm: 'Tablet',
          description: 'Fast-acting pain relief and fever reducer.',
        }]}
        pharmacies={[{ name: 'City Pharmacy', location: 'Colombo' }]}
        searchTerm=""
        setSearchTerm={jest.fn()}
        onReserve={jest.fn()}
        canReserve
        onRequireLogin={jest.fn()}
      />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Details' }));

  const dialog = screen.getByRole('dialog', { name: 'Paracetamol 500mg' });
  expect(dialog).toBeInTheDocument();
  expect(dialog.parentElement).toBe(document.body);

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('sorts medicines alphabetically and switches between grid and list views', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SearchPage
        medicines={[
          {
            id: 'medicine-z',
            name: 'Zinc Tablets',
            pharmacy: 'City Pharmacy',
            quantity: 10,
            price: 'LKR 300',
            available: true,
            category: 'Supplements',
          },
          {
            id: 'medicine-a',
            name: 'Amlodipine 5mg',
            pharmacy: 'City Pharmacy',
            quantity: 10,
            price: 'LKR 360',
            available: true,
            category: 'Cardiovascular',
          },
        ]}
        pharmacies={[{ name: 'City Pharmacy' }]}
        searchTerm=""
        setSearchTerm={jest.fn()}
        onReserve={jest.fn()}
        canReserve
        onRequireLogin={jest.fn()}
      />
    </MemoryRouter>,
  );

  expect(screen.getAllByTestId('medicine-name').map((node) => node.textContent)).toEqual([
    'Amlodipine 5mg',
    'Zinc Tablets',
  ]);

  fireEvent.change(screen.getByRole('combobox', { name: 'Sort medicines' }), {
    target: { value: 'Name: Z to A' },
  });
  expect(screen.getAllByTestId('medicine-name').map((node) => node.textContent)).toEqual([
    'Zinc Tablets',
    'Amlodipine 5mg',
  ]);

  fireEvent.click(screen.getByRole('button', { name: 'List view' }));
  expect(screen.getByTestId('medicine-results')).toHaveAttribute('data-view', 'list');
  expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
});
