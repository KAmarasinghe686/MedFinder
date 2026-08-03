import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SIENNA_SCRIPT_ID = 'medfinder-sienna-accessibility';
const SIENNA_SCRIPT_SRC =
  'https://cdn.jsdelivr.net/npm/sienna-accessibility/dist/sienna-accessibility.umd.js';
const ACCESSIBLE_ROUTES = new Set([
  '/',
  '/search',
  '/pharmacies',
  '/about',
  '/how-it-works',
  '/contact',
  '/assistant',
  '/login',
  '/register',
  '/dashboard',
  '/patient/dashboard',
]);

const isAccessibleRoute = (pathname) =>
  ACCESSIBLE_ROUTES.has(pathname) || pathname.startsWith('/pharmacies/');

export default function AccessibilityWidget() {
  const { pathname } = useLocation();

  useEffect(() => {
    const shouldShowWidget = isAccessibleRoute(pathname);

    document.documentElement.classList.toggle(
      'medfinder-sienna-enabled',
      shouldShowWidget,
    );

    if (shouldShowWidget && !document.getElementById(SIENNA_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SIENNA_SCRIPT_ID;
      script.src = SIENNA_SCRIPT_SRC;
      script.async = true;
      script.dataset.position = 'bottom-left';
      document.body.appendChild(script);
    }

    return () => {
      document.documentElement.classList.remove('medfinder-sienna-enabled');
    };
  }, [pathname]);

  return null;
}
