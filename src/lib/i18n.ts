import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Supported languages configuration
export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;
export const SUPPORTED_LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Namespaces for organized translations
export const NAMESPACES = [
  'common',        // Common UI elements, buttons, etc.
  'navigation',    // Header, footer, navigation
  'auth',         // Login, registration, verification
  'dashboard',    // Dashboard content
  'jobs',         // Job posting, job management
  'candidates',   // Candidate management
  'organizations',// Organization management
  'forms',        // Form labels, validation messages
  'errors',       // Error messages
  'success',      // Success messages
] as const;

export type Namespace = typeof NAMESPACES[number];

// i18n configuration
const isProduction = import.meta.env.PROD;

i18n
  // Load translations using http backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    
    // Supported languages
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    
    // Debug mode (disable in production)
    debug: !isProduction,
    
    // Namespaces
    ns: NAMESPACES,
    defaultNS: 'common',
    
    // Language detection settings
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Backend settings for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
    },
    
    // React i18next specific options
    react: {
      useSuspense: false, // Disable suspense for better UX
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
    },
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already does escaping
      formatSeparator: ',',
    },
    
    // Resource loading settings
    load: 'languageOnly', // Load only 'en' instead of 'en-US'
    preload: [DEFAULT_LANGUAGE],
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Performance optimizations
    initImmediate: false,
    
    // Callback after initialization
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
    
    // Key separator and nesting
    keySeparator: '.',
    nsSeparator: ':',
    
    // Missing key handling
    saveMissing: !isProduction,
    missingKeyHandler: !isProduction ? (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation key: ${lng}:${ns}:${key}`);
    } : undefined,
  });

// Helper functions
export const changeLanguage = (language: SupportedLanguage) => {
  return i18n.changeLanguage(language);
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language || DEFAULT_LANGUAGE) as SupportedLanguage;
};

export const getLanguageInfo = (code: SupportedLanguage) => {
  return SUPPORTED_LANGUAGES[code];
};

export const isRTL = (language: SupportedLanguage): boolean => {
  // Add RTL languages if needed in the future
  const rtlLanguages: SupportedLanguage[] = [];
  return rtlLanguages.includes(language);
};

export default i18n; 