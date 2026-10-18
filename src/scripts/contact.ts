import {emailConfig} from '../data/email';
import {getLanguage,t} from './i18n';
const errorText={en:'Your message could not be sent. Please try again or email cian@kiankhayat.me.',de:'Deine Nachricht konnte nicht gesendet werden. Versuche es erneut oder schreibe an cian@kiankhayat.me.',fa:'پیام شما ارسال نشد. دوباره تلاش کنید یا به cian@kiankhayat.me ایمیل بزنید.'};
export function initContact() {
  const form=document.getElementById('contact-form-wrap') as HTMLFormElement|null;if(!form)return;
  let sending=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending)return;
    if((form.elements.namedItem('website') as HTMLInputElement|null)?.value)return;
    const fields=[
      {id:'cf-name',test:(v:string)=>v.trim().length>0&&v.length<=120&&!/[\r\n]/.test(v)},
      {id:'cf-email',test:(v:string)=>v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())},
      {id:'cf-subject',test:(v:string)=>v.trim().length>0&&v.length<=200&&!/[\r\n]/.test(v)},
      {id:'cf-msg',test:(v:string)=>v.trim().length>10&&v.length<=5000}
    ];
    let first:HTMLInputElement|HTMLTextAreaElement|null=null;
    fields.forEach(({id,test})=>{
      const input=document.getElementById(id) as HTMLInputElement;
      const valid=test(input.value);input.classList.toggle('error',!valid);input.setAttribute('aria-invalid',String(!valid));
      document.getElementById(id+'-err')!.classList.toggle('show',!valid);if(!valid && !first)first=input;
    });
    if(first){(first as HTMLElement).focus();return}
    sending=true;
    const button=document.getElementById('submit-btn') as HTMLButtonElement;
    const label=document.getElementById('submit-text')!;
    const error=document.getElementById('form-error')!;
    button.disabled=true;error.hidden=true;form.setAttribute('aria-busy','true');
    label.textContent=t('Sending…');document.getElementById('submit-icon')!.textContent='⏳';
    const values=new FormData(form);
    try {
      const response=await fetch(emailConfig.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({service_id:emailConfig.serviceId,template_id:emailConfig.templateId,user_id:emailConfig.publicKey,template_params:{name:values.get('name'),email:values.get('email'),subject:values.get('subject'),message:values.get('message')}})});
      if(!response.ok)throw new Error('Email delivery request failed');
      form.hidden=true;document.getElementById('form-success')!.classList.add('show');
    } catch {
      error.textContent=errorText[getLanguage()];error.dataset.noTranslate='true';error.hidden=false;
    } finally {
      sending=false;button.disabled=false;form.removeAttribute('aria-busy');label.textContent=t('Send Message');document.getElementById('submit-icon')!.textContent='→';
    }
  });
}
