/* Article 8: full-year electricity sales in the shared reading-width chart layout. */
(() => {
  const mount=document.querySelector('[data-energy-chart]');
  if(!mount)return;
  const NS='http://www.w3.org/2000/svg',COLOURS=['#cf0000','#03071e'],LABEL='#505050';
  function node(tag,attrs={},parent,content){
    const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(content!==undefined)el.textContent=content;if(parent)parent.append(el);return el;
  }
  function text(svg,x,y,value,attrs={}){return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);}
  const number=value=>value.toLocaleString('en-US');
  function draw(){
    const data=JSON.parse(mount.dataset.energyChart),w=mount.clientWidth,h=360,left=57,right=w-10,top=76,bottom=316;
    mount.replaceChildren();
    const svg=node('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':data.title},mount);
    node('title',{},svg,data.title);
    node('desc',{},svg,'Full-year residential and industrial electricity sales from FY21 to FY25. The vertical axis runs from 20,000 to 70,000 GWh.');
    const x=i=>left+i/(data.rows.length-1)*(right-left),y=value=>bottom-(value-20000)/50000*(bottom-top);
    text(svg,0,16,'Electricity sales (GWh)');
    data.columns.slice(1).forEach((name,j)=>{
      const start=j*142;
      node('line',{x1:start,y1:39,x2:start+20,y2:39,stroke:COLOURS[j],'stroke-width':3},svg);
      node('circle',{cx:start+10,cy:39,r:3,fill:COLOURS[j]},svg);
      text(svg,start+28,44,name);
    });
    [20000,30000,40000,50000,60000,70000].forEach(value=>{
      node('line',{x1:left,y1:y(value),x2:right,y2:y(value),stroke:'#e4e9eb'},svg);
      text(svg,left-9,y(value)+5,number(value),{'text-anchor':'end'});
    });
    data.rows.forEach((row,i)=>text(svg,x(i),bottom+26,row[0],{'text-anchor':i===0?'start':i===data.rows.length-1?'end':'middle'}));
    data.columns.slice(1).forEach((name,j)=>{
      const colour=COLOURS[j],points=data.rows.map((row,i)=>`${x(i)},${y(row[j+1])}`);
      node('path',{d:'M'+points.join(' L'),fill:'none',stroke:colour,'stroke-width':3,'stroke-linejoin':'round','data-series':name},svg);
      data.rows.forEach((row,i)=>{
        const value=row[j+1];
        const point=node('circle',{cx:x(i),cy:y(value),r:4,fill:colour,tabindex:0,role:'img','aria-label':`${name}, ${row[0]}: ${number(value)} GWh`,'data-year':row[0],'data-value':value,'data-category':name},svg);
        node('title',{},point,`${name} · ${row[0]}: ${number(value)} GWh`);
        text(svg,x(i),y(value)+(w<500&&i%2===0?22:-12),number(value),{fill:colour,'text-anchor':i===0?'start':i===data.rows.length-1?'end':'middle','paint-order':'stroke',stroke:'white','stroke-width':3,'stroke-linejoin':'round'});
      });
    });
  }
  let raf,lastWidth=0;
  const redraw=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);};
  document.fonts.ready.then(redraw);addEventListener('resize',redraw);
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;redraw();}}).observe(mount);
})();
