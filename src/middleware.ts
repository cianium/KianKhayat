import {defineMiddleware} from 'astro:middleware';
import {parseHTML} from 'linkedom';
import {siteLanguage} from './data/sites';
import {displayName, translateText} from './data/translate';

// Localize the preserved source markup during prerendering, not after page load.
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const {document} = parseHTML(await response.text());
  const root = document.body;
  for (const element of root.querySelectorAll('[data-localized]')) {
    const values = JSON.parse(element.getAttribute('data-localized')!);
    element.textContent = displayName(values[siteLanguage] ?? values.en, siteLanguage);
    element.removeAttribute('data-localized');
    element.setAttribute('data-no-translate', '');
  }
  const visit = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3 && child.textContent?.trim()) {
        const parts = child.textContent.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
        child.textContent = parts[1] + translateText(parts[2], siteLanguage) + parts[3];
      } else if (child.nodeType === 1 && !(child as Element).matches('script,style,[data-no-translate]')) visit(child);
    }
  };
  visit(root as unknown as Node);
  for (const element of root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')) {
    if (element.closest('[data-no-translate]')) continue;
    for (const attr of ['placeholder', 'aria-label', 'title', 'alt']) {
      const value = element.getAttribute(attr);
      if (value !== null) element.setAttribute(attr, translateText(value, siteLanguage));
    }
  }
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(document.toString(), {status: response.status, statusText: response.statusText, headers});
});
