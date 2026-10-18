export function initWork() {
  const tabs=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  function select(tab:HTMLButtonElement) {
    tabs.forEach(btn=>{const active=btn===tab;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active));btn.tabIndex=active?0:-1});
    document.querySelectorAll<HTMLElement>('.work-panel').forEach(panel=>panel.classList.toggle('active',panel.id==='work-panel-'+tab.dataset.tab));
  }
  tabs.forEach((tab,index)=>{
    tab.tabIndex=index===0?0:-1;tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('keydown',event=>{
      const direction=document.documentElement.dir==='rtl'?-1:1;
      const step=event.key==='ArrowRight'?direction:event.key==='ArrowLeft'?-direction:0;
      if(step){event.preventDefault();const next=tabs[(index+step+tabs.length)%tabs.length];select(next);next.focus()}
    });
  });
  let category='all';
  const search=document.getElementById('cert-search') as HTMLInputElement|null;
  const filter=()=>{
    const query=(search?.value||'').trim().toLocaleLowerCase();
    const years=new Set<string>();
    document.querySelectorAll<HTMLElement>('.cert-card').forEach(card=>{
      const name=card.querySelector('.cert-name')?.textContent?.toLocaleLowerCase() || '';
      const matches=(category==='all'||card.dataset.cat===category) && (!query || name.includes(query) || card.dataset.name?.includes(query));
      card.classList.toggle('hidden',!matches);if(matches)years.add(card.dataset.year!);
    });
    document.querySelectorAll<HTMLElement>('.cert-year-marker').forEach(marker=>{marker.hidden=!years.has(marker.dataset.year!)});
  };
  search?.addEventListener('input',filter);
  document.querySelectorAll<HTMLElement>('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    category=button.dataset.filter!;
    document.querySelectorAll('[data-filter]').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button))});filter();
  }));
  document.addEventListener('portfolio:language',filter);
}
