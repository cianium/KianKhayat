export async function loadActivityHeatmap() {
  const grid=document.getElementById('heatmap-grid');if(!grid)return;
  try {
    const response=await fetch('https://github-contributions-api.jogruber.de/v4/cianium?y=last',{signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error('Contribution API unavailable');
    const data=await response.json();
    const days=data.contributions;
    if(!Array.isArray(days) || !days.length || days.length>400 || days.some(day=>!day||!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isInteger(day.count)||day.count<0 || !Number.isFinite(day.level??0)))throw new Error('Invalid contribution response');
    grid.replaceChildren();
    const firstDay=new Date(days[0].date+'T00:00:00').getDay();
    for(let i=0;i<firstDay;i++){const blank=document.createElement('span');blank.className='heatmap-cell';blank.style.visibility='hidden';grid.append(blank)}
    days.forEach(day=>{
      const cell=document.createElement('span');cell.className='heatmap-cell';cell.dataset.level=String(Math.max(0,Math.min(day.level??0,4)));
      cell.title=`${day.date}: ${day.count} contribution${day.count===1?'':'s'}`;grid.append(cell);
    });
    grid.style.display='grid';document.getElementById('heatmap-legend')!.style.display='flex';
    grid.scrollLeft=document.documentElement.dir==='rtl'?-grid.scrollWidth:grid.scrollWidth;
  } catch { document.getElementById('heatmap-fallback')!.style.display='block'; }
  finally { document.getElementById('heatmap-loading')!.style.display='none'; }
}
