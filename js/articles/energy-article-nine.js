/* Article 9: two new solar charts in the established paragraph-width layout. */
(() => {
  const mounts=[...document.querySelectorAll('[data-energy-chart]')];
  if(!mounts.length)return;
  const NS='http://www.w3.org/2000/svg',RED='#cf0000',GRAY='#948d8d',LABEL='#505050';
  function node(tag,attrs={},parent,content){
    const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(content!==undefined)el.textContent=content;if(parent)parent.append(el);return el;
  }
  function text(svg,x,y,value,attrs={}){return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);}
  function draw(mount){
    const data=JSON.parse(mount.dataset.energyChart),prices=data.id==='solar-prices',w=mount.clientWidth;
    const rowStep=78,top=55,bottom=top+data.rows.length*rowStep-18,h=bottom+48,left=1,right=w-66,maximum=prices?32:12;
    const x=value=>left+value/maximum*(right-left);
    mount.replaceChildren();
    const svg=node('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':data.title},mount);
    node('title',{},svg,data.title);
    node('desc',{},svg,prices?'Historical panel prices of 28 and 11 US cents per watt, alongside a reported 2026 range of 10–12 cents per watt.':'Solar module imports in the same January–May period: 11.781 GW in 2025 and 4.574 GW in 2026, a decrease of approximately 61%.');
    text(svg,0,16,prices?'Panel price (US cents/W)':'Module imports (GW)');
    data.rows.forEach((row,i)=>{
      const y=top+i*rowStep,lo=row[1],hi=prices?row[2]:lo,colour=i===data.rows.length-1?RED:GRAY;
      const valueLabel=prices?(hi>lo?`${lo}–${hi}`:String(lo)):lo.toFixed(3);
      text(svg,0,y,row[0],{fill:'#111'});
      const bar=node('g',{tabindex:0,role:'img','aria-label':`${row[0]}: ${valueLabel} ${prices?'US cents per watt':'GW'}`,'data-bar':true,'data-low':lo,'data-high':hi},svg);
      node('title',{},bar,`${row[0]}: ${valueLabel} ${prices?'US cents/W':'GW'}`);
      node('rect',{x:left,y:y+12,width:x(lo)-left,height:25,fill:colour},bar);
      if(hi>lo){
        node('rect',{x:x(lo),y:y+12,width:x(hi)-x(lo),height:25,fill:'#e5e2df'},bar);
        [lo,hi].forEach(value=>node('line',{x1:x(value),y1:y+9,x2:x(value),y2:y+40,stroke:RED,'stroke-width':2},bar));
      }
      text(svg,x(hi)+10,y+30,valueLabel,{fill:colour,'font-weight':600});
    });
    node('line',{x1:left,y1:bottom,x2:right,y2:bottom,stroke:'#bcc7cd'},svg);
    (prices?[0,10,20,30]:[0,3,6,9,12]).forEach(value=>{
      node('line',{x1:x(value),y1:bottom,x2:x(value),y2:bottom+5,stroke:'#bcc7cd'},svg);
      text(svg,x(value),bottom+24,value,{'text-anchor':value===0?'start':'middle'});
    });
  }
  let raf;
  const redraw=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>mounts.forEach(draw));};
  document.fonts.ready.then(redraw);addEventListener('resize',redraw);
  mounts.forEach(mount=>{let lastWidth=0;new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;redraw();}}).observe(mount);});
})();
