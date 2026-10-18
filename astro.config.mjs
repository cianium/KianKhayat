import { defineConfig } from "astro/config";
const language = process.env.SITE_LANG || 'en';
const sites = {en: 'https://kiankhayat.me', de: 'https://de.kiankhayat.me', fa: 'https://fa.kiankhayat.me'};
if (!(language in sites)) throw new Error(`Unsupported SITE_LANG: ${language}`);
export default defineConfig({
  site: sites[language], output: 'static', outDir: `./dist/${language}`,
  trailingSlash: 'always', build: {format: 'directory'}, devToolbar: {enabled: false},
});
