import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import pt from '../locales/pt.json';
import en from '../locales/en.json';
import es from '../locales/es.json';

const LANGUAGE_KEY = 'user-language';

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
};

const getDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const langCode = locales[0].languageCode;
      if (langCode && ['pt', 'en', 'es'].includes(langCode)) {
        return langCode;
      }
    }
  } catch (e) {
    console.warn('Failed to detect device language, using fallback:', e);
  }
  return 'pt';
};

const defaultLanguage = getDeviceLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'pt',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language preference asynchronously and update i18n
AsyncStorage.getItem(LANGUAGE_KEY).then((savedLanguage) => {
  if (savedLanguage && savedLanguage !== i18n.language) {
    i18n.changeLanguage(savedLanguage);
  }
}).catch((err) => {
  console.warn('Error loading language preference:', err);
});

export default i18n;
export { LANGUAGE_KEY };
