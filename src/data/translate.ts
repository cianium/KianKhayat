import dictionaries from './translations.json';
import type {Language} from './sites';

export function displayName(value: string, language: Language) {
  return language === 'fa' ? value.replaceAll('کیان خیاط', 'Kian Khayat').replaceAll('کیان', 'Kian') : value;
}

export function translateText(source: string, language: Language): string {
  if (language === 'en') return source;
  const dictionary = dictionaries[language] as Record<string, string>;
  const normalized = source.replace(/\s+/g, ' ').trim();
  return displayName(dictionary[normalized] ?? source, language);
}
