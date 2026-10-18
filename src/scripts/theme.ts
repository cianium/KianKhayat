import {t} from './i18n';
export function syncTheme() {
  const dark=document.documentElement.dataset.theme==='dark';
  const checkbox=document.getElementById('theme-checkbox') as HTMLInputElement;
  checkbox.checked=!dark;checkbox.setAttribute('aria-label',t(dark?'Switch to light mode':'Switch to dark mode'));
  const picture=document.getElementById('hero-photo');if(!picture) return;
  const name=dark?'hero-dark':'hero-light';
  picture.querySelector('source')!.srcset=`/images/${name}-360.avif 360w, /images/${name}-720.avif 720w`;
  const img=picture.querySelector('img')!;
  img.srcset=`/images/${name}-360.webp 360w, /images/${name}-720.webp 720w`;
  img.src=`/images/${name}-720.webp`;
}
export function initTheme() {
  syncTheme();
  document.getElementById('theme-checkbox')?.addEventListener('change',()=>{
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next;
    try {localStorage.setItem('theme',next)} catch {}
    syncTheme();
  });
  document.addEventListener('portfolio:language',syncTheme);
}
