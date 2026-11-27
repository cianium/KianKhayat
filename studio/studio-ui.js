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
})();