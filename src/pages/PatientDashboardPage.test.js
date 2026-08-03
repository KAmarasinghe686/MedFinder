import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatientDashboardPage from './PatientDashboardPage';
import { openFileData } from '../utils/openFileData';

jest.mock('../utils/openFileData', () => ({
  openFileData: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
});

test('lets a patient confirm receipt when an order is ready', async () => {
  const onConfirmReservationReceived = jest.fn().mockResolvedValue(true);

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PatientDashboardPage
        authUser={{ role: 'user', name: 'Test Patient', email: 'patient@example.com' }}
        authToken="token"
        reservations={[{
          id: 'reservation-1',
          medicineName: 'Paracetamol 500mg',
          pharmacyName: 'City Pharmacy',
          status: 'Ready for Pickup',
          referenceNumber: 'MF-READY1',
          fulfillmentType: 'pickup',
          createdAt: new Date().toISOString(),
        }]}
        onLogout={jest.fn()}
        onProfileUpdate={jest.fn()}
        onCancelReservation={jest.fn()}
        onConfirmReservationReceived={onConfirmReservationReceived}
        onCreatePrescriptionOrder={jest.fn()}
      />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getAllByRole('button', { name: /my orders/i })[0]);
  fireEvent.click(screen.getByRole('button', { name: /confirm received/i }));

  await waitFor(() => {
    expect(onConfirmReservationReceived).toHaveBeenCalledWith('reservation-1');
  });
});

test('shows the signed-in patient prescription uploads from reservation history', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PatientDashboardPage
        authUser={{ id: 'patient-1', role: 'user', name: 'Test Patient', email: 'patient@example.com' }}
        authToken="token"
        reservations={[{
          id: 'reservation-2',
          medicineName: 'Amoxicillin 500mg',
          pharmacyName: 'Kandy Pharmacy',
          customerName: 'Test Patient',
          status: 'Pending',
          referenceNumber: 'MF-RX1234',
          prescriptionData: 'data:application/pdf;base64,JVBERi0xLjQ=',
          prescriptionFileName: 'doctor-prescription.pdf',
          createdAt: '2026-07-24T08:00:00.000Z',
        }]}
        onLogout={jest.fn()}
        onProfileUpdate={jest.fn()}
        onCancelReservation={jest.fn()}
        onConfirmReservationReceived={jest.fn()}
        onCreatePrescriptionOrder={jest.fn()}
      />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getAllByRole('button', { name: /prescriptions/i })[0]);

  expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
  expect(screen.getByText('MF-RX1234')).toBeInTheDocument();
  expect(screen.getByText('doctor-prescription.pdf')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /view file/i }));
  expect(openFileData).toHaveBeenCalledWith(
    'data:application/pdf;base64,JVBERi0xLjQ=',
    'doctor-prescription.pdf',
  );
});
