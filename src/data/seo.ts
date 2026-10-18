import {siteLanguage} from './sites';

const metadata = {
  en: {
    name: 'Kian Khayat', locale: 'en_US',
    home: ['Kian Khayat | Python & Artificial Intelligence', 'Kian Khayat: Python developer and self-directed learner exploring artificial intelligence, software engineering, and German. Projects, skills, and articles.'],
    work: ['Projects & Certificates | Kian Khayat', 'Explore Kian Khayat\'s software projects, technical skills, and certificates in programming, web development, Linux, and German.'],
    articles: ['Articles | Kian Khayat', 'Read Kian Khayat\'s articles on programming, artificial intelligence, learning German, discipline, and building in public.'],
    contact: ['Contact | Kian Khayat', 'Contact Kian Khayat about collaboration, mentorship, or software projects. Find the contact form, email address, and social profiles.'],
    privacy: ['Privacy Policy | Kian Khayat', 'Privacy information for Kian Khayat\'s personal website, including contact form data, third-party links, and your rights.'],
    '404': ['Page Not Found | Kian Khayat', 'The requested page could not be found. Return to Kian Khayat\'s homepage or contact page.'],
  },
  de: {
    name: 'Kian Khayat', locale: 'de_DE',
    home: ['Kian Khayat | Python & Künstliche Intelligenz', 'Kian Khayat: Python-Entwickler und Autodidakt mit Interesse an künstlicher Intelligenz, Softwareentwicklung und Deutsch. Projekte, Fähigkeiten und Artikel.'],
    work: ['Projekte & Zertifikate | Kian Khayat', 'Entdecke die Softwareprojekte und Zertifikate von Kian Khayat in Programmierung, Webentwicklung, Linux und Deutsch.'],
    articles: ['Artikel | Kian Khayat', 'Artikel von Kian Khayat über Programmierung, künstliche Intelligenz, Deutschlernen, Disziplin und öffentlich dokumentierte Projekte.'],
    contact: ['Kontakt | Kian Khayat', 'Kontaktiere Kian Khayat für Zusammenarbeit, Mentoring oder Softwareprojekte. Hier findest du das Kontaktformular, die E-Mail-Adresse und soziale Profile.'],
    privacy: ['Datenschutz | Kian Khayat', 'Datenschutzinformationen zur persönlichen Website von Kian Khayat: Kontaktformulardaten, externe Links und deine Rechte.'],
    '404': ['Seite nicht gefunden | Kian Khayat', 'Die gesuchte Seite wurde nicht gefunden. Zurück zur Startseite oder zur Kontaktseite von Kian Khayat.'],
  },
  fa: {
    name: 'کیان خیاط', locale: 'fa_IR',
    home: ['کیان خیاط | پایتون و هوش مصنوعی', 'کیان خیاط، توسعه‌دهندهٔ پایتون و یادگیرندهٔ خودآموز در زمینهٔ هوش مصنوعی، مهندسی نرم‌افزار و زبان آلمانی. پروژه‌ها، مهارت‌ها و نوشته‌های من را ببینید.'],
    work: ['پروژه‌ها و گواهینامه‌ها | کیان خیاط', 'پروژه‌های نرم‌افزاری و گواهینامه‌های کیان خیاط در برنامه‌نویسی، توسعهٔ وب، لینوکس و زبان آلمانی را ببینید.'],
    articles: ['مقاله‌ها | کیان خیاط', 'نوشته‌های کیان خیاط دربارهٔ برنامه‌نویسی، هوش مصنوعی، یادگیری زبان آلمانی، انضباط فردی و به‌اشتراک‌گذاری مسیر ساخت پروژه‌ها.'],
    contact: ['تماس با کیان خیاط', 'برای همکاری، راهنمایی یا گفت‌وگو دربارهٔ پروژه‌های نرم‌افزاری با کیان خیاط در تماس باشید. فرم تماس، نشانی ایمیل و شبکه‌های اجتماعی.'],
    privacy: ['حریم خصوصی | کیان خیاط', 'اطلاعات حریم خصوصی وب‌سایت شخصی کیان خیاط، شامل داده‌های فرم تماس، پیوندهای بیرونی و حقوق شما.'],
    '404': ['صفحه پیدا نشد | کیان خیاط', 'صفحهٔ درخواستی پیدا نشد. به صفحهٔ اصلی یا صفحهٔ تماس کیان خیاط برگردید.'],
  },
};
export type Page = 'home' | 'work' | 'articles' | 'contact' | 'privacy' | '404';
export const seo = metadata[siteLanguage];
