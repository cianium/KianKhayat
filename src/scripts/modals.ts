import skills from '../data/skills.json';
import {translate,getLanguage} from './i18n';
import {ui} from '../data/interface';
type Article={language?:string;slug:string;title:string;categories:string[];date:string;readTime:string;body:string;translations?:Record<string,Partial<Article>>};
type Certificate={slug:string;name:string;category:string;description:string;emoji:string;issuer:string;date:string;image?:string;pdf?:string;credentialUrl?:string;translations?:Record<string,Partial<Certificate>>};
function readData<T>(id:string):T[] {return JSON.parse(document.getElementById(id)?.textContent || '[]')}
const set=(id:string,value:string)=>document.getElementById(id)!.replaceChildren(document.createTextNode(value));
let opened:HTMLElement|null=null, trigger:HTMLElement|null=null;
function close() {
  if(!opened)return;opened.classList.remove('open');opened=null;
  document.querySelector('#cert-modal-img object')?.remove();
  document.body.style.overflow='';
  document.querySelectorAll<HTMLElement>('body > [data-modal-inert]').forEach(el=>{el.inert=false;delete el.dataset.modalInert});
  trigger?.focus();
}
function open(id:string,origin:HTMLElement) {
  if(opened)close();
  trigger=origin;opened=document.getElementById(id)!;
  translate(opened);opened.classList.add('open');document.body.style.overflow='hidden';
  document.querySelectorAll<HTMLElement>('body > nav,body > main,body > footer,body > #mobile-menu').forEach(el=>{if(!el.inert){el.inert=true;el.dataset.modalInert='true'}});
  opened.querySelector<HTMLButtonElement>('.modal-close')?.focus();
}
export function initModals() {
  const articles=readData<Article>('article-data'), certs=readData<Certificate>('cert-data');
  document.addEventListener('click',event=>{
    const target=event.target as Element;
    if(target.closest('[data-close]') || (target instanceof HTMLElement && target.dataset.overlay)) {close();return}
    const skillButton=target.closest<HTMLElement>('[data-skill]');
    if(skillButton) {
      const skill=skills[Number(skillButton.dataset.skill)];
      set('skill-modal-cat',skill.category.toUpperCase());set('skill-modal-title',skill.name);
      set('skill-modal-pct',skill.pct+'%');set('skill-modal-desc',skill.desc);set('skill-modal-path',skill.path);
      const grid=document.getElementById('skill-modal-details')!;grid.replaceChildren();
      Object.entries(skill.details).forEach(([key,value])=>{
        const item=document.createElement('div');item.className='skill-detail-item';
        const label=document.createElement('div');label.className='sdi-label';label.textContent=key;
        const val=document.createElement('div');val.className='sdi-val';val.textContent=value;
        item.append(label,val);grid.append(item);
      });
      const ring=document.getElementById('modal-ring-fill') as unknown as SVGElement;
      ring.style.strokeDashoffset=String(295-(skill.pct/100)*295);
      open('skill-modal',skillButton);return;
    }
    const articleButton=target.closest<HTMLElement>('[data-article]');
    if(articleButton) {
      const source=articles.find(a=>a.slug===articleButton.dataset.article)!;
      const article=source;
      for(const [id,text] of Object.entries({'article-modal-cat':article.categories.join(' · '),'article-modal-title':article.title,'article-modal-meta':`${article.date} · ${article.readTime}`})) {
        const el=document.getElementById(id)!;el.dataset.noTranslate='true';el.textContent=text;
      }
      const content=document.getElementById('article-modal-content')!;
      content.dataset.noTranslate='true';content.innerHTML=article.body;
      const modal=document.getElementById('article-modal')!;
      modal.lang=article.language||'en';modal.dir=['fa','ar','he','ur'].includes((article.language||'en').split('-')[0])?'rtl':'ltr';
      open('article-modal',articleButton);return;
    }
    const certButton=target.closest<HTMLElement>('[data-cert]');
    if(certButton) {
      const source=certs.find(c=>c.slug===certButton.dataset.cert)!;
      const cert={...source,...source.translations?.[getLanguage()]};
      const labels:Record<string,string>={goethe:'🇩🇪 Goethe Institut',python:'🐍 Python',linux:'🐧 Linux',web:'🌐 Web Dev'};
      set('cert-modal-cat',labels[cert.category] || cert.category);set('cert-modal-title',cert.name);
      set('cert-modal-desc',cert.description);set('cert-modal-issuer',cert.issuer);set('cert-modal-date',cert.date);
      const preview=document.getElementById('cert-modal-img')!;preview.replaceChildren();
      if(cert.image) {
        const image=new Image();image.src=cert.image;image.alt=cert.name;
        image.addEventListener('error',()=>{preview.textContent=ui('unavailable',getLanguage())},{once:true});
        preview.append(image);
      }
      else if(cert.pdf) {
        const object=document.createElement('object');object.type='application/pdf';object.data=cert.pdf;
        object.setAttribute('aria-label',cert.name);object.tabIndex=-1;
        const fallback=document.createElement('p');fallback.textContent=ui('unavailable',getLanguage());object.append(fallback);preview.append(object);
      }
      else {const emoji=document.createElement('span');emoji.style.fontSize='5rem';emoji.textContent=cert.emoji;preview.append(emoji)}
      const actions=document.getElementById('cert-file-actions')!;actions.replaceChildren();
      actions.dataset.noTranslate='true';
      const addLink=(label:string,url:string,download=false)=>{
        const link=document.createElement('a');link.className='cert-lb-btn';link.textContent=label;link.href=url;
        if(download)link.download='';else {link.target='_blank';link.rel='noopener'}
        actions.append(link);
      };
      if(cert.pdf||cert.image)addLink(ui('openFile',getLanguage()),cert.pdf||cert.image!);
      if(cert.pdf&&cert.image)addLink(ui('downloadImage',getLanguage()),cert.image,true);
      if(cert.credentialUrl)addLink(ui('credential',getLanguage()),cert.credentialUrl);
      const download=document.querySelector<HTMLButtonElement>('.cert-lb-btn.primary')!;
      download.disabled=!(cert.pdf || cert.image);
      download.onclick=()=>{const url=cert.pdf || cert.image;if(url){const a=document.createElement('a');a.href=url;a.download='';a.click()}};
      open('cert-modal',certButton);
    }
  });
  document.addEventListener('keydown',event=>{
    const target=event.target as HTMLElement;
    if((event.key==='Enter' || event.key===' ') && target.matches('[data-skill],[data-article],[data-cert]') && !target.matches('button,a')) {event.preventDefault();target.click()}
    if(!opened)return;
    if(event.key==='Escape')close();
    if(event.key==='Tab') {
      const items=Array.from(opened.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,textarea,[tabindex="0"]')).filter(element=>element.getClientRects().length>0);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus()}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus()}
    }
  });
}
