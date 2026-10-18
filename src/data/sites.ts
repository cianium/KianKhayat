export const languages = ['en', 'de', 'fa'] as const;
export type Language = typeof languages[number];
export const origins: Record<Language, string> = {
  en: 'https://kiankhayat.me',
  de: 'https://de.kiankhayat.me',
  fa: 'https://fa.kiankhayat.me',
};
export const routes = ['/', '/work/', '/articles/', '/contact/', '/privacy/'];
export const siteLanguage = languages.find(lang => origins[lang] === import.meta.env.SITE?.replace(/\/$/, '')) ?? 'en';
export const siteOrigin = origins[siteLanguage];
export const languageURL = (language: Language, path: string) => new URL(path, origins[language]).href;
