import sanitizeHtml from 'sanitize-html';
import {parseHTML} from 'linkedom';

const options = {
  allowedTags: ['p','h2','h3','h4','h5','h6','blockquote','ul','ol','li','strong','em','b','i','u','s','del','code','pre','br','hr','a','img','div','span','table','thead','tbody','tr','th','td','caption','sup','sub'],
  allowedAttributes: {
    '*': ['dir','style'], div: ['class'], span: ['class'], code: ['class'],
    a: ['href','title','target','rel'], img: ['src','alt','width','height','loading'],
    ol: ['start'], th: ['scope','colspan','rowspan'], td: ['colspan','rowspan']
  },
  allowedClasses: {div:['article-ref'],span:[],code:[/^language-[a-z0-9-]+$/]},
  allowedStyles: {'*': {'text-align': [/^(left|right|center|justify)$/]}},
  allowedSchemes: ['https','http','mailto'],
  allowedSchemesByTag: {img:['https']},
  allowProtocolRelative: false,
};
function tree(html) {
  const {document}=parseHTML('<html><body>'+html+'</body></html>');
  const node=n=>n.nodeType===3 ? n.textContent : n.nodeType===1 ?
    [n.localName,[...n.attributes].map(a=>[a.name,a.value]).sort(),[...n.childNodes].map(node)] : null;
  return JSON.stringify([...document.body.childNodes].map(node));
}
/** Validate at build time, and return only the sanitizer's output for every renderer. */
export function safeArticleHTML(html) {
  const clean=sanitizeHtml(html,options);
  if(tree(html)!==tree(clean))throw new Error('Article contains unsupported or unsafe HTML. Remove scripts, embeds, event handlers, unsafe URLs or unsupported styles.');
  const {document}=parseHTML('<html><body>'+clean+'</body></html>');
  for(const element of document.querySelectorAll('[href],[src]')) {
    for(const attr of ['href','src']) {
      const value=element.getAttribute(attr);if(value===null)continue;
      if(/[\u0000-\u0020\\]/.test(value)||value.startsWith('//'))throw new Error('Invalid article URL.');
      if(attr==='src'&&!(/^https:\/\//.test(value)||/^\/(?!\/)/.test(value)))throw new Error('Images must use HTTPS or a local root-relative path.');
      if(attr==='href'&&!(/^(https?:\/\/|mailto:|\/(?!\/)|#)/.test(value)))throw new Error('Links must use HTTP(S), mailto, a root-relative path or an anchor.');
    }
  }
  // Add opener protection without changing the article's words or stored source.
  return sanitizeHtml(clean,{...options,transformTags:{a:(tagName,attribs)=>({tagName,attribs:{...attribs,...(attribs.target==='_blank'?{rel:'noopener noreferrer'}:{})}})}});
}
