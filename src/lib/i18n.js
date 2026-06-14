import en from '../locales/en.json';
import es from '../locales/es.json';

const translations = { en, es };
let currentLocale = localStorage.getItem('venn_locale') || 'en';

export function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale;
    localStorage.setItem('venn_locale', locale);
    window.dispatchEvent(new Event('locale-changed'));
  }
}

export function getLocale() {
  return currentLocale;
}

export function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations[currentLocale];
  for (const k of keys) {
    value = value?.[k];
  }
  if (typeof value !== 'string') {
    // Fallback to English
    value = translations.en;
    for (const k of keys) {
      value = value?.[k];
    }
  }
  if (typeof value !== 'string') return key;
  // Simple interpolation: {{name}} -> params.name
  return value.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? `{{${k}}}`);
}

export function registerLocale(locale, strings) {
  translations[locale] = strings;
}

export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'es', name: 'Espa\u00F1ol', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'pt', name: 'Portugu\u00EAs', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'fr', name: 'Fran\u00E7ais', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'ja', name: '\u65E5\u672C\u8A9E', flag: '\u{1F1EF}\u{1F1F5}' },
];
