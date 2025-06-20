import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en/translation.json";
import frTranslation from "./locales/fr/translation.json";
import esTranslation from "./locales/es/translation.json";
import deTranslation from "./locales/de/translation.json";
import ptTranslation from "./locales/pt/translation.json";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      fr: {
        translation: frTranslation,
      },
      es: {
        translation: esTranslation,
      },
      de: {
        translation: deTranslation,
      },
      pt: {
        translation: ptTranslation,
      },
    },
    fallbackLng: "en", // fallback language is English
    lng: "en", // default language
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  }, (err, t) => {
    if (err) return console.log('something went wrong loading', err);
    console.log('i18n is initialized and ready!');
    console.log('Initial language:', i18n.language);
    console.log('Resources for current language:', i18n.getDataByLanguage(i18n.language));
  });

export default i18n; 