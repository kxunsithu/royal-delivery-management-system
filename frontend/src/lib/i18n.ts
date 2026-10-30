import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/locales/en.json';
import my from '@/locales/my.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      my: { translation: my },
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'royal_myawaddy_language',
    },
    react: {
      useSuspense: false,
    },
  });

const applyLanguage = (lng: string) => {
  const isMyanmar = lng === 'my' || (lng || '').startsWith('my');
  document.documentElement.lang = isMyanmar ? 'my' : 'en';
  document.documentElement.classList.toggle('lang-my', isMyanmar);
};

applyLanguage(i18n.language);
i18n.on('languageChanged', applyLanguage);

export default i18n;
