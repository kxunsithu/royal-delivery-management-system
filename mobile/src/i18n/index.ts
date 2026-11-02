import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import my from './my.json';

const LANGUAGE_KEY = 'royal_myawaddy_language';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    my: { translation: my },
  },
  lng: 'my',
  fallbackLng: 'my',
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Load persisted language
AsyncStorage.getItem(LANGUAGE_KEY).then((lng) => {
  if (lng) i18n.changeLanguage(lng);
});

i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LANGUAGE_KEY, lng);
});

export const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
export default i18n;
