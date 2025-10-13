import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import language files
import no from './locales/no.json';
import en from './locales/en.json';
import sv from './locales/sv.json';
import da from './locales/da.json';

const resources = {
  no: { translation: no },
  en: { translation: en },
  sv: { translation: sv },
  da: { translation: da },
};

// Auto-detect language, fallback to Norwegian
const getDeviceLanguage = (): string => {
  const deviceLocale = Localization.locale || 'no';
  const languageCode = deviceLocale.split('-')[0];
  const supportedLanguages = ['no', 'en', 'sv', 'da'];
  
  // Map 'nb' (Norwegian Bokmål) to 'no'
  if (languageCode === 'nb') {
    return 'no';
  }
  
  return supportedLanguages.includes(languageCode) ? languageCode : 'no';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'no',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
  });

export default i18n;
