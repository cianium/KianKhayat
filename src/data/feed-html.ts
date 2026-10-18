import {parseHTML} from 'linkedom';
// Feed readers have no site origin to resolve uploaded images and internal links.
export function feedHTML(html:string,origin:string) {
  if(!/\b(?:src|href)=["']\//i.test(html))return html;
  const {document}=parseHTML(`<html><body>${html}</body></html>`);
  for(const element of document.querySelectorAll('[src],[href]')) {
    for(const key of ['src','href']) {
      const value=element.getAttribute(key);
      if(value?.startsWith('/'))element.setAttribute(key,new URL(value,origin).href);
    }
  }
  return document.body.innerHTML;
}
