import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccessibilityWidget from './AccessibilityWidget';

const SCRIPT_SELECTOR = '#medfinder-sienna-accessibility';

afterEach(() => {
  document.querySelector(SCRIPT_SELECTOR)?.remove();
  document.documentElement.classList.remove('medfinder-sienna-enabled');
});

test.each([
  '/',
  '/search',
  '/pharmacies',
  '/pharmacies/city-pharmacy',
  '/about',
  '/how-it-works',
  '/contact',
  '/assistant',
  '/login',
  '/register',
  '/dashboard',
  '/patient/dashboard',
])(
  'loads the bottom-left accessibility widget on %s',
  (route) => {
    render(
      <MemoryRouter
        initialEntries={[route]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AccessibilityWidget />
      </MemoryRouter>,
    );

    const script = document.querySelector(SCRIPT_SELECTOR);

    expect(document.documentElement).toHaveClass('medfinder-sienna-enabled');
    expect(script).toHaveAttribute(
      'src',
      'https://cdn.jsdelivr.net/npm/sienna-accessibility/dist/sienna-accessibility.umd.js',
    );
    expect(script).toHaveAttribute('data-position', 'bottom-left');
    expect(script.async).toBe(true);
  },
);

test.each(['/pharmacy/dashboard', '/admin/dashboard', '/admin/login'])(
  'does not load the accessibility widget on staff page %s',
  (route) => {
  render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AccessibilityWidget />
    </MemoryRouter>,
  );

  expect(document.documentElement).not.toHaveClass('medfinder-sienna-enabled');
  expect(document.querySelector(SCRIPT_SELECTOR)).not.toBeInTheDocument();
  },
);
