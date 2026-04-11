/**
 * react-i18next bootstrap — Wave 3 growth scaffold.
 *
 * STATUS (scaffold):
 *  - Done: initialize i18next with the React bindings + browser language
 *    detector, inline English resources loaded from ./locales/en.json, and
 *    a sensible fallback chain (detected → en). The singleton is safe to
 *    import from main.jsx before React renders.
 *  - NOT done: other locales (es, pt, fr, ja — see SUPPORTED_LOCALES in
 *    src/lib/i18n.js), lazy resource loading, ICU-style pluralization, and
 *    a full conversion of every hardcoded string. Only a single component
 *    (App.jsx's LoadingFallback) has been flipped to useTranslation so far —
 *    enough to prove the wiring is live.
 *
 * COEXISTENCE with the existing src/lib/i18n.js helper:
 *  - The legacy `src/lib/i18n.js` tiny runtime is still used by most of the
 *    app (Lobby, LobbyNav, ProfileForm, etc.). We intentionally did NOT rip
 *    it out — both can run side-by-side while we migrate strings one
 *    component at a time. The react-i18next singleton is the forward path;
 *    prefer it for any new UI.
 *
 * HOW TO ADD MORE TRANSLATIONS LATER:
 *  1. Drop a new JSON file into `src/i18n/locales/<code>.json` with the
 *     same key shape as en.json.
 *  2. Import it below and register it in the `resources` map:
 *       import es from './locales/es.json';
 *       resources: { en: { translation: en }, es: { translation: es } }
 *  3. Call `useTranslation()` in the component and use `t('key.path')`.
 *  4. For a new key, add it to `en.json` first (source of truth) so the
 *     fallback chain keeps working while other locales catch up.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';

// Guard against re-initialization during HMR. i18next throws if init() runs
// twice against the same instance; importing this module more than once from
// a fast-refresh boundary would otherwise spam the console.
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
      },
      fallbackLng: 'en',
      supportedLngs: ['en'],
      // We don't need HTML escaping — React already escapes interpolated
      // values before rendering them, so this avoids double-escaping.
      interpolation: { escapeValue: false },
      detection: {
        order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      // Keep the bundle small during tests / SSR: don't sit on a suspense
      // boundary waiting for resources that are already baked in above.
      react: { useSuspense: false },
    });
}

export default i18n;
