import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    }),
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the MedFinder home page', async () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /search less.*heal faster/i }),
  ).toBeInTheDocument();
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
});
