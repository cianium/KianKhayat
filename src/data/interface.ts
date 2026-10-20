import type {Language} from './sites';
const labels = {
  featured: {en:'Featured',de:'Im Fokus',fa:'برگزیده‌ها'},
  details: {en:'Project details',de:'Projektdetails',fa:'جزئیات پروژه'},
  documentation: {en:'Documentation',de:'Dokumentation',fa:'مستندات'},
  live: {en:'Live Demo',de:'Live-Demo',fa:'دموی زنده'},
  github: {en:'Source Code',de:'Quellcode',fa:'کد منبع'},
  back: {en:'All projects',de:'Alle Projekte',fa:'همهٔ پروژه‌ها'},
  technologies: {en:'Technologies',de:'Technologien',fa:'فناوری‌ها'},
  project: {en:'Project',de:'Projekt',fa:'پروژه'},
  certificate: {en:'Certificate',de:'Zertifikat',fa:'مدرک'},
  article: {en:'Article',de:'Artikel',fa:'مقاله'},
  allArticles: {en:'All articles',de:'Alle Artikel',fa:'همهٔ مقاله‌ها'},
  quickRead: {en:'Quick read',de:'Schnell lesen',fa:'مطالعهٔ سریع'},
  articleBody: {en:'Article text',de:'Artikeltext',fa:'متن مقاله'},
  feed: {en:'Subscribe via RSS',de:'Per RSS abonnieren',fa:'دنبال‌کردن خوراک مقاله‌ها'},
  moreArticles: {en:'More articles',de:'Weitere Artikel',fa:'مقاله‌های دیگر'},
  openFile: {en:'Open file',de:'Datei öffnen',fa:'بازکردن فایل'},
  downloadImage: {en:'Download image',de:'Bild herunterladen',fa:'دانلود تصویر'},
  downloadPDF: {en:'Download PDF',de:'PDF herunterladen',fa:'دانلود پی‌دی‌اف'},
  credential: {en:'Verify credential',de:'Zertifikat prüfen',fa:'بررسی اعتبار مدرک'},
  unavailable: {en:'Preview unavailable. Open the file to view it.',de:'Vorschau nicht verfügbar. Öffne die Datei, um sie anzusehen.',fa:'پیش‌نمایش در دسترس نیست. برای مشاهده، فایل را باز کنید.'},
};
export const ui = (key: keyof typeof labels, language: Language) => labels[key][language];
