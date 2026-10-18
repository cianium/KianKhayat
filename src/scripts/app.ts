import {initLanguage} from './i18n';
import {initTheme} from './theme';
import {initModals} from './modals';
import {initContact} from './contact';
import {initWork} from './work';
import {loadActivityHeatmap} from './heatmap';

initLanguage();initTheme();initModals();initContact();initWork();
void loadActivityHeatmap();
const page=document.body.dataset.page;
document.querySelectorAll<HTMLElement>('.nav-link[data-nav]').forEach(link=>{
  const active=link.dataset.nav===page;link.classList.toggle('active',active);
  if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
});
document.querySelectorAll<HTMLButtonElement>('button[data-nav]').forEach(button=>button.addEventListener('click',()=>{
  location.href=button.dataset.nav==='home'?'/':`/${button.dataset.nav}/`;
}));
const menu=document.getElementById('mobile-menu')!;
const hamburger=document.getElementById('ham-btn')!;
hamburger.addEventListener('click',()=>{hamburger.setAttribute('aria-expanded',String(menu.classList.toggle('open')))});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && menu.classList.contains('open')){menu.classList.remove('open');hamburger.setAttribute('aria-expanded','false');hamburger.focus()}});
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('motion-ready');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}
  }),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.fade-up').forEach(el=>observer.observe(el));
}
const track=document.getElementById('skills-grid'),wrap=document.getElementById('skills-track-wrap');
if(track && wrap) {
  const update=()=>wrap.classList.toggle('at-end',Math.abs(track.scrollLeft)>=track.scrollWidth-track.clientWidth-4);
  track.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update,{passive:true});update();
}
