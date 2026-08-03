import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

const SCRIPT_SELECTOR = '#medfinder-gtranslate';
const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

afterEach(() => {
  document.querySelector(SCRIPT_SELECTOR)?.remove();
  delete window.gtranslateSettings;
});

test.each(['/', '/login', '/register', '/search', '/pharmacies', '/patient/dashboard', '/patient/dashboard/orders'])(
  'shows the language switcher on %s',
  (route) => {
    const { container } = render(
      <MemoryRouter initialEntries={[route]} future={routerFuture}>
        <LanguageSwitcher />
      </MemoryRouter>,
    );

    expect(
      container.querySelector('.medfinder-language-switcher'),
    ).toHaveClass('medfinder-language-switcher--visible');
    expect(container.querySelector('.gtranslate_wrapper')).toBeInTheDocument();
    expect(window.gtranslateSettings).toEqual({
      default_language: 'en',
      languages: ['en', 'si', 'ta'],
      wrapper_selector: '.gtranslate_wrapper',
    });

    const script = document.querySelector(SCRIPT_SELECTOR);
    expect(script).toHaveAttribute(
      'src',
      'https://cdn.gtranslate.net/widgets/latest/ln.js',
    );
    expect(script.defer).toBe(true);
  },
);

test('keeps the language switcher available on staff and dashboard routes', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/admin/dashboard']} future={routerFuture}>
      <LanguageSwitcher />
    </MemoryRouter>,
  );

  expect(container.querySelector('.medfinder-language-switcher')).toHaveClass(
    'medfinder-language-switcher--visible',
  );
});
