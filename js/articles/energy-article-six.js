/* Article 6: the established paragraph-width grouped-column chart treatment. */
(() => {
  const mount=document.querySelector('[data-energy-chart]');
  if(!mount)return;
  const NS='http://www.w3.org/2000/svg',RED='#cf0000',GRAY='#948d8d',LABEL='#505050';
  function node(tag,attrs={},parent,content){
    const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(content!==undefined)el.textContent=content;if(parent)parent.append(el);return el;
  }
  function text(svg,x,y,value,attrs={}){return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);}
  function draw(){
    const data=JSON.parse(mount.dataset.energyChart),w=mount.clientWidth,h=360,left=10,right=w-10,top=65,bottom=276,step=(right-left)/data.rows.length;
    mount.replaceChildren();
    const svg=node('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':data.title},mount);
    node('title',{},svg,data.title);text(svg,0,16,'Number of jurisdictions');
    [GRAY,RED].forEach((colour,j)=>{const x=j*92;node('rect',{x,y:32,width:12,height:12,fill:colour},svg);text(svg,x+19,43,data.columns[j+1]);});
    node('line',{x1:left,y1:bottom,x2:right,y2:bottom,stroke:'#bcc7cd'},svg);
    data.rows.forEach((row,i)=>{
      const centre=left+step*(i+.5),bw=Math.min(48,step*.24),gap=6;
      row.slice(1).forEach((value,j)=>{
        const x=centre+(j===0?-bw-gap/2:gap/2),bh=value/250*(bottom-top),colour=j?RED:GRAY;
        const rect=node('rect',{x,y:bottom-bh,width:bw,height:bh,fill:colour,tabindex:0,role:'img','aria-label':`${row[0].replace('\n',' ')}, ${data.columns[j+1]}: ${value} jurisdictions`,'data-bar':true,'data-value':value,'data-year':data.columns[j+1]},svg);
        node('title',{},rect,`${row[0].replace('\n',' ')} · ${data.columns[j+1]}: ${value}`);
        text(svg,x+bw/2,bottom-bh-10,value,{'text-anchor':'middle',fill:j?RED:LABEL});
      });
      const lines=w<500&&i===2?['Wholesale /','retail','competition']:row[0].split('\n');
      lines.forEach((line,j)=>text(svg,centre,bottom+26+j*18,line,{'text-anchor':'middle'}));
    });
  }
  let raf,lastWidth=0;
  const redraw=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);};
  document.fonts.ready.then(redraw);addEventListener('resize',redraw);
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;redraw();}}).observe(mount);
})();
