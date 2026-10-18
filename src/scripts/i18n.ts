import {translateText, displayName as formatName} from '../data/translate';
import type {Language} from '../data/sites';
export type {Language};
const language = document.documentElement.lang as Language;
const texts = new WeakMap<Text,{source:string;last:string}>();
const attributes = new WeakMap<Element,Map<string,{source:string;last:string}>>();
export const getLanguage = () => language;

function displayName(value:string) { return formatName(value, language); }

export function t(source: string): string {
  return translateText(source, language);
}

export function translate(root: Element = document.body) {
  root.querySelectorAll<HTMLElement>('[data-localized]').forEach(element=>{
    const values=JSON.parse(element.dataset.localized!);element.textContent=displayName(values[language] ?? values.en);
  });
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node) {
    const parent=node.parentElement;
    return !parent || parent.closest('script,style,[data-no-translate],[data-localized]') || !node.textContent?.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
  }});
  for(let node=walker.nextNode();node;node=walker.nextNode()) {
    const text=node as Text;
    let record=texts.get(text);
    // Dynamic modal content may reuse the same text node. Refresh the source when it changes.
    if(!record || text.data!==record.last) record={source:text.data,last:text.data};
    const parts=record.source.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    text.data=parts[1]+t(parts[2])+parts[3];record.last=text.data;texts.set(text,record);
  }
  for(const element of [root,...root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')]) {
    if(element.closest('[data-no-translate]')) continue;
    const stored=attributes.get(element) ?? new Map();
    for(const attr of ['placeholder','aria-label','title','alt']) {
      const current=element.getAttribute(attr);if(current===null) continue;
      let record=stored.get(attr);
      if(!record || current!==record.last) record={source:current,last:current};
      record.last=t(record.source);element.setAttribute(attr,record.last);stored.set(attr,record);
    }
    attributes.set(element,stored);
  }
}

export function initLanguage() {
  const menu=document.getElementById('lang-menu')!;
  const button=document.getElementById('lang-btn')!;
  const close=()=>{menu.classList.remove('open');button.setAttribute('aria-expanded','false')};
  document.addEventListener('click',event=>{
    const target=event.target as Element;
    const option=target.closest<HTMLElement>('[data-lang]');
    if(option) {close();return}
    if(target.closest('[data-action="language"]')) {
      const open=menu.classList.toggle('open');button.setAttribute('aria-expanded',String(open));
      if(open) menu.querySelector<HTMLAnchorElement>('[aria-checked="true"]')?.focus();
    } else if(!target.closest('#lang-switch')) close();
  });
  menu.addEventListener('keydown',event=>{
    const options=Array.from(menu.querySelectorAll<HTMLAnchorElement>('[data-lang]'));
    const index=options.indexOf(document.activeElement as HTMLAnchorElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
      options[next].focus();
    }
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && menu.classList.contains('open')) {close();button.focus()}});
}
