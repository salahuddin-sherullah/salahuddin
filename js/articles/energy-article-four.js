/* Article 4: the established Energy Series figure layout, with fixed-size labels. */
(() => {
  const mounts=[...document.querySelectorAll('[data-energy-chart]')];
  if(!mounts.length)return;
  const NS='http://www.w3.org/2000/svg',RED='#cf0000',GRAY='#948d8d',NAVY='#03071e',LABEL='#505050';
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
  function losses(mount,data){
    const w=mount.clientWidth,h=320,svg=svgIn(mount,w,h,data.title),left=10,right=w-10,top=64,bottom=272,step=(right-left)/3,scale=(bottom-top)/600;
    text(svg,0,16,'PKR billion');key(svg,0,43,'T&D losses',RED);key(svg,140,43,'Under-recovery',NAVY);
    node('line',{x1:left,y1:bottom,x2:right,y2:bottom,stroke:'#bcc7cd'},svg);
    data.rows.forEach(([year,td,recovery],i)=>{
      const cx=left+step*(i+.5),bw=Math.min(78,step*.5),total=td+recovery;
      bar(svg,{x:cx-bw/2,y:bottom-recovery*scale,width:bw,height:recovery*scale,fill:NAVY},`${year}: under-recovery ${recovery} PKR billion`);
      bar(svg,{x:cx-bw/2,y:bottom-total*scale,width:bw,height:td*scale,fill:RED},`${year}: T&D losses ${td} PKR billion`);
      text(svg,cx,bottom-recovery*scale/2+5,recovery,{'text-anchor':'middle',fill:'white'});
      text(svg,cx,bottom-recovery*scale-td*scale/2+5,td,{'text-anchor':'middle',fill:'white'});
      text(svg,cx,bottom-total*scale-10,total,{'text-anchor':'middle',fill:'#111','font-weight':600,'data-total':total});
      text(svg,cx,bottom+25,year,{'text-anchor':'middle'});
    });
  }
  function discos(mount,data){
    const grid=document.createElement('div');grid.className='energy-one-panels';mount.append(grid);
    const titles=['T&D loss rate (%)','Financial loss (PKR billion)'];
    titles.forEach((title,index)=>{
      const panel=document.createElement('div');panel.className='energy-one-panel';grid.append(panel);
      const w=panel.clientWidth,top=32,rowHeight=32,h=top+data.rows.length*rowHeight+52,left=84,usable=w-left-54,maximum=index===0?40:90;
      const svg=svgIn(panel,w,h,title),valueLabels=[];text(svg,0,17,title,{'font-weight':600,fill:'#111'});
      data.rows.forEach((row,i)=>{
        const value=row[index+1],y=top+i*rowHeight,bw=value/maximum*usable;
        text(svg,0,y+15,row[0]);
        bar(svg,{x:left,y,width:bw,height:20,fill:index===0?RED:NAVY,'data-company':row[0],'data-measure':index,'data-value':value},`${row[0]}: ${value.toFixed(2)}${index===0?'% T&D loss rate':' PKR billion financial loss above the allowed target'}, FY25`);
        valueLabels.push(text(svg,left+bw+7,y+15,value.toFixed(2)+(index===0?'%':''),{'paint-order':'stroke',stroke:'white','stroke-width':3,'stroke-linejoin':'round'}));
      });
      if(index===0){
        [[8,'8% global · historical','#111','3 3'],[17.55,'17.55% ex-WAPDA','#777','6 4']].forEach(([value,label,colour,dash],i)=>{
          const x=left+value/maximum*usable,y=top+data.rows.length*rowHeight+17+i*22;
          node('line',{x1:x,y1:top-2,x2:x,y2:top+(data.rows.length-1)*rowHeight+22,stroke:colour,'stroke-dasharray':dash,'data-reference':value},svg);
          node('line',{x1:0,y1:y,x2:20,y2:y,stroke:colour,'stroke-dasharray':dash},svg);text(svg,27,y+5,label);
        });
      }else{
        text(svg,0,top+data.rows.length*rowHeight+22,'Reported total (excluding KE):');
        text(svg,0,top+data.rows.length*rowHeight+44,'Rs 265.01 billion',{'font-weight':600,fill:'#111'});
      }
      svg.append(...valueLabels);
    });
  }
  function benchmark(mount,data){
    const w=mount.clientWidth,narrow=w<600,h=narrow?386:340,svg=svgIn(mount,w,h,data.title),left=10,right=w-10,top=44,bottom=260,step=(right-left)/data.rows.length;
    text(svg,0,16,'T&D loss (%)');
    node('line',{x1:left,y1:bottom,x2:right,y2:bottom,stroke:'#bcc7cd'},svg);
    data.rows.forEach(([country,value],i)=>{
      const cx=left+step*(i+.5),bw=Math.min(72,step*.55),bh=value/20*(bottom-top),colour=country==='Pakistan'?RED:GRAY;
      bar(svg,{x:cx-bw/2,y:bottom-bh,width:bw,height:bh,fill:colour},`${country}: ${value}% T&D losses${country==='Pakistan'?' (FY25 ex-WAPDA DISCOs)':' (historical comparison, not updated)'}`);
      text(svg,cx,bottom-bh-10,value+'%',{'text-anchor':'middle',fill:country==='Pakistan'?RED:LABEL});
      if(narrow)text(svg,0,0,country,{transform:`translate(${cx+3},${bottom+22}) rotate(-50)`,'text-anchor':'end'});
      else text(svg,cx,bottom+26,country,{'text-anchor':'middle'});
    });
    const reference=8,y=bottom-reference/20*(bottom-top);
    node('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#666','stroke-dasharray':'6 5','data-reference':reference},svg);
    node('line',{x1:0,y1:h-17,x2:24,y2:h-17,stroke:'#666','stroke-dasharray':'6 5'},svg);
    text(svg,32,h-12,'8% global benchmark · historical');
  }
  const renderers={losses,discos,benchmark};
  function draw(mount){const data=JSON.parse(mount.dataset.energyChart);mount.replaceChildren();renderers[data.id](mount,data);}
  let raf,lastWidth=0;
  const drawAll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>mounts.forEach(draw));};
  document.fonts.ready.then(drawAll);addEventListener('resize',drawAll);
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;drawAll();}}).observe(document.querySelector('.series-article'));
})();
