import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { requestOtp, verifyOtp } from '../api';
import OtpLoginPage from './OtpLoginPage';

jest.mock('../api', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
}));

const renderLogin = (props = {}) => {
  const onAuthSuccess = jest.fn();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <OtpLoginPage
        role="user"
        pharmacies={[]}
        onAuthSuccess={onAuthSuccess}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onAuthSuccess };
};

beforeEach(() => {
  requestOtp.mockReset();
  verifyOtp.mockReset();
});

test('shows field validation and does not request an OTP for an invalid email', () => {
  renderLogin();

  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'invalid-email' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

  expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
  expect(requestOtp).not.toHaveBeenCalled();
});

test('requires a registered pharmacy selection for pharmacy login', () => {
  renderLogin({
    role: 'pharmacy',
    pharmacies: [{ name: 'City Pharmacy' }],
  });

  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'pharmacist@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

  expect(
    screen.getByText('Select or enter your registered pharmacy.'),
  ).toBeInTheDocument();
  expect(requestOtp).not.toHaveBeenCalled();
});

test('normalizes email and validates the six-digit OTP before login', async () => {
  requestOtp.mockResolvedValue({ message: 'OTP sent.' });
  verifyOtp.mockResolvedValue({
    token: 'token',
    user: { id: 'user-1', role: 'user', email: 'patient@example.com' },
  });
  const { onAuthSuccess } = renderLogin();

  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: '  Patient@Example.COM ' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

  await waitFor(() => expect(requestOtp).toHaveBeenCalledWith({
    email: 'patient@example.com',
    role: 'user',
    pharmacyName: undefined,
  }));

  const otpInput = await screen.findByLabelText('6-digit code');
  fireEvent.change(otpInput, { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: /verify/i }));
  expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();
  expect(verifyOtp).not.toHaveBeenCalled();

  fireEvent.change(otpInput, { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: /verify/i }));

  await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith({
    email: 'patient@example.com',
    role: 'user',
    otp: '123456',
    pharmacyName: undefined,
  }));
  expect(onAuthSuccess).toHaveBeenCalledWith({
    token: 'token',
    user: { id: 'user-1', role: 'user', email: 'patient@example.com' },
  });
});
