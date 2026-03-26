import { useState, useEffect, useCallback } from 'react';
import { t, getLocale, setLocale } from '../lib/i18n';

export function useTranslation() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('locale-changed', handler);
    return () => window.removeEventListener('locale-changed', handler);
  }, []);

  return { t, locale: getLocale(), setLocale };
}
