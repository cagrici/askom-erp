import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import translationENG from "../lang/en.json";
import translationTR from "../lang/tr.json";

// the translations
const resources = {
  en: {
    translation: translationENG,
  },
  tr: {
    translation: translationTR,
  },
};

const language = localStorage.getItem("I18N_LANGUAGE") || "tr";
if (!localStorage.getItem("I18N_LANGUAGE")) {
  localStorage.setItem("I18N_LANGUAGE", "tr");
}

// Force set the language to Turkish
localStorage.setItem("I18N_LANGUAGE", "tr");

i18n
  .use(detector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "tr", // Force Turkish
    fallbackLng: "en", // use en if detected lng is not available
    debug: false, // Disable debug mode
    saveMissing: false, // Don't save missing keys
    
    keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false, // react already safes from xss
    },

    // Silent missing key handler
    missingKeyHandler: false,
  });

export default i18n;
