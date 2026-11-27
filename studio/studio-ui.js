(() => {
 const root=document.documentElement;
 const buttons=document.querySelectorAll('[data-theme-toggle]');
 const system=matchMedia('(prefers-color-scheme: dark)');
 let preference;try{preference=localStorage.getItem('studio-theme')}catch{}
 const apply=value=>{root.dataset.theme=value;buttons.forEach(b=>{b.hidden=false;b.setAttribute('aria-label',value==='dark'?'فعال‌کردن تم روشن':'فعال‌کردن تم تاریک')})};
 apply(preference==='light'||preference==='dark'?preference:system.matches?'dark':'light');
 buttons.forEach(b=>b.addEventListener('click',()=>{preference=root.dataset.theme==='dark'?'light':'dark';apply(preference);try{localStorage.setItem('studio-theme',preference)}catch{}}));
 system.addEventListener('change',()=>{if(!preference)apply(system.matches?'dark':'light')});
 const toggle=document.querySelector('[data-nav-toggle]'),menu=document.getElementById('sidebar-content');
 if(toggle&&menu){
  const mobile=matchMedia('(max-width: 820px)');
  const set=expanded=>{menu.hidden=!expanded;toggle.setAttribute('aria-expanded',String(expanded))};
  const sync=()=>{toggle.hidden=!mobile.matches;set(!mobile.matches)};
  sync();mobile.addEventListener('change',sync);
  toggle.addEventListener('click',()=>set(menu.hidden));
  menu.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobile.matches){set(false);toggle.focus()}});
 }
 const body=document.querySelector('[data-body]'),counter=document.querySelector('[data-count]');
 if(body&&counter){const update=()=>{counter.textContent=body.value.length.toLocaleString('fa-IR')+' / ۶۰٬۰۰۰ نویسه'};counter.hidden=false;body.addEventListener('input',update);update()}

 const forms=[...document.querySelectorAll('[data-profile-upload]')];
 let uploading=false;
 for(const form of forms){
  form.hidden=false;
  const input=form.elements.file,crop=form.elements.crop,canvas=form.parentElement.querySelector('[data-crop-preview]'),img=form.parentElement.querySelector('[data-current]'),status=form.querySelector('[data-upload-status]');
  let bitmap=null,generation=0;
  const render=()=>{
   if(!bitmap||!canvas)return;
   const side=Math.min(bitmap.width,bitmap.height),p=crop.value;
   const x=p==='west'?0:p==='east'?bitmap.width-side:(bitmap.width-side)/2;
   const y=p==='north'?0:p==='south'?bitmap.height-side:(bitmap.height-side)/2;
   const ctx=canvas.getContext('2d');ctx.clearRect(0,0,360,360);ctx.drawImage(bitmap,x,y,side,side,0,0,360,360);
   canvas.hidden=false;if(img)img.hidden=true;
  };
  input.addEventListener('change',async()=>{
   const current=++generation;bitmap?.close();bitmap=null;if(canvas)canvas.hidden=true;if(img)img.hidden=false;status.textContent='';
   const file=input.files[0];if(!file||!canvas)return;
   if(file.size>10*1024*1024){status.textContent='حجم تصویر بیش از حد مجاز است.';return}
   try{const next=await createImageBitmap(file);if(current!==generation){next.close();return}if(next.width*next.height>40000000){next.close();throw Error('oversize')}bitmap=next;render()}catch{status.textContent='پیش‌نمایش تصویر ممکن نیست؛ فایل را بررسی کن.'}
  });
  crop?.addEventListener('change',render);
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(uploading)return;
   const file=input.files[0];if(!file)return;
   const slot=form.dataset.slot;
   if(file.size>(slot==='resume'?20:10)*1024*1024){status.textContent='حجم فایل بیش از حد مجاز است.';return}
   uploading=true;forms.forEach(f=>f.querySelector('button').disabled=true);status.textContent='در حال ذخیره فایل…';
   try{
    const res=await fetch('/profile/media/'+slot+(crop?'?crop='+encodeURIComponent(crop.value):''),{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Studio-CSRF':form.dataset.csrf,'X-Studio-Revision':form.dataset.revision},body:file});
    if(!res.ok)throw Error(res.status===409?'نسخه جدیدتری وجود دارد؛ صفحه را تازه‌سازی کن.':'فایل ذخیره نشد. نوع، اندازه و اتصال را بررسی کن.');
    const {revision}=await res.json();
    forms.forEach(f=>f.dataset.revision=String(revision));document.querySelector('[data-profile-revision]').value=String(revision);
    ++generation;bitmap?.close();bitmap=null;input.value='';if(canvas)canvas.hidden=true;if(img){img.src='/profile/media/'+slot+'?v='+revision;img.hidden=false}
    status.textContent='فایل ذخیره شد.';
   }catch(error){status.textContent=error.message||'خطا در ذخیره فایل.'}
   finally{uploading=false;forms.forEach(f=>f.querySelector('button').disabled=false)}
  });
 }
})();