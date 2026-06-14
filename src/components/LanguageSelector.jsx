import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LOCALES } from '../lib/i18n';

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = SUPPORTED_LOCALES.find(l => l.code === locale) || SUPPORTED_LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center text-lg"
        aria-label={`Language: ${current.name}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={`Language: ${current.name}`}
      >
        {current.flag}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          role="listbox"
          aria-label="Select language"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc.code}
              role="option"
              aria-selected={locale === loc.code}
              onClick={() => {
                setLocale(loc.code);
                setOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
                locale === loc.code
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">{loc.flag}</span>
              <span>{loc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
