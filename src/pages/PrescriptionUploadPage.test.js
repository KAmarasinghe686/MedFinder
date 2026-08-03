import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrescriptionUploadPage from './PrescriptionUploadPage';

test('shows the server reference number on the order confirmation', async () => {
  const onCreatePrescriptionOrder = jest.fn().mockResolvedValue({
    _id: 'reservation-1',
    referenceNumber: 'MF-SERVER1',
  });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PrescriptionUploadPage
        pharmacies={[{ name: 'HealthCare Pharmacy' }]}
        medicines={[{
          id: 'medicine-1',
          name: 'Paracetamol',
          pharmacy: 'HealthCare Pharmacy',
          quantity: 10,
          available: true,
          requiresPrescription: false,
        }]}
        onCreatePrescriptionOrder={onCreatePrescriptionOrder}
      />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: /non-prescription medicine/i }));

  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[1], { target: { value: 'medicine-1' } });
  fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
  fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Test Patient' } });
  fireEvent.change(screen.getByPlaceholderText('0771234567'), { target: { value: '0771234567' } });
  fireEvent.click(screen.getByRole('button', { name: /^place order$/i }));

  expect(await screen.findByText('MF-SERVER1')).toBeInTheDocument();
  await waitFor(() => expect(onCreatePrescriptionOrder).toHaveBeenCalledTimes(1));
  expect(onCreatePrescriptionOrder.mock.calls[0][0]).toMatchObject({
    items: [{ medicineId: 'medicine-1', quantity: 1 }],
  });
  expect(onCreatePrescriptionOrder.mock.calls[0][0]).not.toHaveProperty('medicineId');
  expect(onCreatePrescriptionOrder.mock.calls[0][0]).not.toHaveProperty('referenceNumber');
});
