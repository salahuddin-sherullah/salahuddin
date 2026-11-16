/* Article 3 follows the responsive, paragraph-width chart treatment of Articles 1–2. */
(() => {
  const mounts=[...document.querySelectorAll('[data-energy-chart]')];
  if(!mounts.length)return;
  const NS='http://www.w3.org/2000/svg',RED='#cf0000',GRAY='#948d8d',PALE='#e5e2df',LABEL='#505050';
  function node(tag,attrs={},parent,content){
    const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(content!==undefined)el.textContent=content;if(parent)parent.append(el);return el;
  }
  function text(svg,x,y,value,attrs={}){return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);}
  function svgIn(mount,w,h,title){
    const svg=node('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':title},mount);
    node('title',{},svg,title);return svg;
  }
  function bar(svg,attrs,label){
    const rect=node('rect',{...attrs,tabindex:0,role:'img','aria-label':label,'data-bar':true},svg);node('title',{},rect,label);return rect;
  }
  function key(svg,x,y,label,fill){node('rect',{x,y:y-11,width:12,height:12,fill},svg);text(svg,x+19,y,label);}
  function payments(mount,data){
    const w=mount.clientWidth,h=350,svg=svgIn(mount,w,h,data.title),top=w<330?88:68,bottom=286,left=10,right=w-10,step=(right-left)/3;
    text(svg,0,16,'Share (%)');
    key(svg,0,43,data.columns[1],GRAY);key(svg,w<330?0:150,w<330?63:43,data.columns[2],RED);
    node('line',{x1:left,y1:bottom,x2:right,y2:bottom,stroke:'#bcc7cd'},svg);
    data.rows.forEach((row,i)=>{
      const centre=left+step*(i+.5),bw=Math.min(48,step*.24),gap=6;
      row.slice(1).forEach((value,j)=>{
        const x=centre+(j===0?-bw-gap/2:gap/2),bh=value/60*(bottom-top),colour=j?RED:GRAY;
        bar(svg,{x,y:bottom-bh,width:bw,height:bh,fill:colour},`${row[0].replace('\n',' ')}, ${data.columns[j+1]}: ${value}% (2024)`);
        text(svg,x+bw/2,bottom-bh-10,value+'%',{'text-anchor':'middle',fill:j?RED:LABEL});
      });
      row[0].split('\n').forEach((line,j)=>text(svg,centre,bottom+25+j*18,line,{'text-anchor':'middle'}));
    });
  }
  const renderers={payments};
  function draw(mount){const data=JSON.parse(mount.dataset.energyChart);mount.replaceChildren();renderers[data.id](mount,data);}
  let raf,lastWidth=0;
  const drawAll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>mounts.forEach(draw));};
  document.fonts.ready.then(drawAll);addEventListener('resize',drawAll);
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;drawAll();}}).observe(document.querySelector('.series-article'));
})();
