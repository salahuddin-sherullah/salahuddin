/* Article 5: circular-debt history, using the established chart typography and layout. */
(() => {
  const mount=document.querySelector('[data-energy-chart]');
  if(!mount)return;
  const NS='http://www.w3.org/2000/svg',RED='#cf0000',LABEL='#505050';
  function node(tag,attrs={},parent,content){
    const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(content!==undefined)el.textContent=content;if(parent)parent.append(el);return el;
  }
  function text(svg,x,y,value,attrs={}){return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);}
  const number=value=>value.toLocaleString('en-US');
  function draw(){
    const data=JSON.parse(mount.dataset.energyChart),w=mount.clientWidth,h=350,left=48,right=w-56,top=36,bottom=302;
    mount.replaceChildren();
    const svg=node('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':data.title},mount);
    node('title',{},svg,data.title);
    const firstYear=Number(data.rows[0][0]),lastYear=Number(data.rows.at(-1)[0]);
    const x=year=>left+(Number(year)-firstYear)/(lastYear-firstYear)*(right-left),y=value=>bottom-value/3000*(bottom-top);
    text(svg,0,16,'PKR billion');
    [0,750,1500,2250,3000].forEach(value=>{
      node('line',{x1:left,y1:y(value),x2:right,y2:y(value),stroke:'#e4e9eb'},svg);
      text(svg,left-9,y(value)+5,number(value),{'text-anchor':'end'});
    });
    const ticks=w<500?['2006','2016','2026']:['2006','2010','2014','2018','2022','2026'];
    ticks.forEach(year=>text(svg,x(year),bottom+25,year,{'text-anchor':year==='2006'?'start':year==='2026'?'end':'middle'}));
    const points=data.rows.map(([year,value])=>`${x(year)},${y(value)}`);
    node('path',{d:'M'+points.join(' L'),fill:'none',stroke:RED,'stroke-width':3,'stroke-linejoin':'round','data-series':'circular-debt'},svg);
    data.rows.forEach(([year,value])=>{
      const point=node('circle',{cx:x(year),cy:y(value),r:year==='2013'?5:3,fill:year==='2013'?'#111':RED,tabindex:0,role:'img','aria-label':`${year}: ${number(value)} PKR billion${year==='2013'?'; government payment intervention':''}`,'data-year':year,'data-value':value},svg);
      node('title',{},point,`${year}: ${number(value)} PKR billion`);
    });
    const intervention=data.rows.find(([year])=>year==='2013'),eventX=x(intervention[0]),eventY=y(intervention[1]),labelX=w<500?Math.max(75,eventX-36):eventX;
    text(svg,labelX,140,'FY13 government',{'text-anchor':'middle',fill:'#111'});
    text(svg,labelX,158,'payment intervention',{'text-anchor':'middle',fill:'#111'});
    node('line',{x1:eventX,y1:170,x2:eventX,y2:eventY-9,stroke:'#777','data-event':'FY13'},svg);
    const [last,value]=data.rows.at(-1);
    text(svg,x(last)+8,y(value)+5,number(value),{fill:RED,'font-weight':600,'data-latest':value});
  }
  let raf,lastWidth=0;
  const redraw=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);};
  document.fonts.ready.then(redraw);addEventListener('resize',redraw);
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;redraw();}}).observe(mount);
})();
