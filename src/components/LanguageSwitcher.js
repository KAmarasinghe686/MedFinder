import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { installGoogleTranslateDomCompatibility } from '../googleTranslateDomCompatibility';

const GTRANSLATE_SCRIPT_ID = 'medfinder-gtranslate';
const GTRANSLATE_SCRIPT_SRC =
  'https://cdn.gtranslate.net/widgets/latest/ln.js';
const WIDGET_CONTAINER_ID = 'medfinder-language-switcher';

const isPortalRoute = (pathname) =>
  /^\/(?:patient\/dashboard|pharmacy(?:\/|$)|admin(?:\/|$))/.test(pathname);

export default function LanguageSwitcher() {
  const { pathname } = useLocation();
  const hasStaticWidget = typeof document !== 'undefined'
    && Boolean(document.getElementById(WIDGET_CONTAINER_ID));

  useEffect(() => {
    installGoogleTranslateDomCompatibility();

    window.gtranslateSettings = window.gtranslateSettings || {
      default_language: 'en',
      languages: ['en', 'si', 'ta'],
      wrapper_selector: '.gtranslate_wrapper',
    };

    if (!document.getElementById(GTRANSLATE_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = GTRANSLATE_SCRIPT_ID;
      script.src = GTRANSLATE_SCRIPT_SRC;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  // React replaces the routed page without a full browser reload. Give the
  // translator a chance to process newly mounted dashboard/public content.
  useEffect(() => {
    const widget = document.getElementById(WIDGET_CONTAINER_ID);
    if (widget) {
      widget.classList.add('medfinder-language-switcher--visible');
      widget.classList.toggle('medfinder-language-switcher--portal', isPortalRoute(pathname));
      widget.classList.toggle('medfinder-language-switcher--public', !isPortalRoute(pathname));
    }

    const refresh = () => {
      try {
        if (typeof window.gtranslateRefresh === 'function') {
          window.gtranslateRefresh();
        }
        if (typeof window.gtranslateInit === 'function') {
          window.gtranslateInit();
        }
      } catch {
        // The third-party widget may not expose either hook on every version.
      }
    };

    const timer = window.setTimeout(refresh, 150);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (hasStaticWidget) return null;

  return (
    <div
      id={WIDGET_CONTAINER_ID}
      className={`medfinder-language-switcher medfinder-language-switcher--visible ${isPortalRoute(pathname) ? 'medfinder-language-switcher--portal' : 'medfinder-language-switcher--public'}`}
      role="group"
      aria-label="Choose website language"
    >
      <div className="gtranslate_wrapper notranslate" />
    </div>
  );
}
