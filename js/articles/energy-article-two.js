/* Article 2 uses Article 1's figure wrapper, typography and source footer.
   Draw each SVG at its available width so labels remain readable at 14px. */
(() => {
  const mounts=[...document.querySelectorAll('[data-energy-chart]')];
  if(!mounts.length)return;
  const NS='http://www.w3.org/2000/svg',RED='#cf0000',GRAY='#948d8d',INK='#111111',LABEL='#505050';
  function node(tag,attrs={},parent,content){
    const el=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(content!==undefined)el.textContent=content;
    if(parent)parent.append(el);
    return el;
  }
  function text(svg,x,y,value,attrs={}){return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);}
  function svgIn(mount,w,h,title){
    const svg=node('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':title},mount);
    node('title',{},svg,title);return svg;
  }
  function bar(svg,attrs,label){
    const rect=node('rect',{...attrs,tabindex:0,role:'img','aria-label':label,'data-bar':true},svg);
    node('title',{},rect,label);return rect;
  }
  function tariffs(mount,data){
    const w=mount.clientWidth,h=310,svg=svgIn(mount,w,h,data.title),top=56,bottom=264,left=10,right=w-10,step=(right-left)/3;
    text(svg,0,16,'US cents / kWh');
    [GRAY,RED].forEach((colour,j)=>{
      const x=w-146+j*78;node('rect',{x,y:5,width:12,height:12,fill:colour},svg);text(svg,x+19,16,data.columns[j+1]);
    });
    node('line',{x1:left,y1:bottom,x2:right,y2:bottom,stroke:'#bcc7cd'},svg);
    data.rows.forEach((row,i)=>{
      const centre=left+step*(i+.5),bw=Math.min(48,step*.24),gap=6;
      row.slice(1).forEach((value,j)=>{
        const x=centre+(j===0?-bw-gap/2:gap/2),bh=value/25*(bottom-top),colour=j?RED:GRAY;
        bar(svg,{x,y:bottom-bh,width:bw,height:bh,fill:colour},`${row[0]}, ${data.columns[j+1]}: ${value} US cents per kWh`);
        text(svg,x+bw/2,bottom-bh-10,value,{'text-anchor':'middle',fill:j?RED:LABEL});
      });
      text(svg,centre,bottom+26,row[0],{'text-anchor':'middle'});
    });
  }
  function bill(mount,data){
    const w=mount.clientWidth,narrow=w<600,svg=svgIn(mount,w,narrow?232:174,data.title);
    const palette=[RED,INK,GRAY,'#6a040f','#f48c04'],y=narrow?12:42,bh=48;let x=0;
    data.rows.forEach(([label,value],i)=>{
      const bw=value/100*w;
      bar(svg,{x,y,width:bw,height:bh,fill:palette[i]},`${label}: ${value}% of the illustrative bill`);
      if(!narrow){
        text(svg,x+bw/2,y+29,value+'%',{'text-anchor':'middle',fill:[2,4].includes(i)?INK:'white'});
        const lineY=i%2===0?20:120;
        text(svg,x+bw/2,lineY,label,{'text-anchor':'middle'});
      }else{
        const lineY=88+i*27;
        node('rect',{x:0,y:lineY-11,width:11,height:11,fill:palette[i]},svg);
        text(svg,20,lineY,label);text(svg,w,lineY,value+'%',{'text-anchor':'end',fill:RED,'font-weight':600});
      }
      x+=bw;
    });
  }
  function imports(mount,data){
    const w=mount.clientWidth,h=324*1.2,svg=svgIn(mount,w,h,data.title),left=46,right=left+(w-left-18)*.8,top=38,bottom=280+(h-324);
    const x=i=>left+i/(data.rows.length-1)*(right-left),y=v=>bottom-v/100*(bottom-top);
    text(svg,0,16,'Share (%)');
    const curve=data.rows.map((r,i)=>`${x(i)},${y(r[1])}`).join(' L');
    node('rect',{x:left,y:top,width:right-left,height:bottom-top,fill:GRAY},svg);
    node('path',{d:`M${left},${bottom} L${curve} L${right},${bottom} Z`,fill:RED,'data-area':'imported'},svg);
    [0,25,50,75,100].forEach(value=>text(svg,left-9,y(value)+5,value+'%',{'text-anchor':'end'}));
    const ticks=right-left<400?[0,10,20]:[0,4,8,12,16,20];
    ticks.forEach(i=>text(svg,x(i),bottom+25,data.rows[i][0],{'text-anchor':i===0?'start':i===20?'end':'middle'}));
    text(svg,(left+right)/2,y(74),'Domestic',{'text-anchor':'middle',fill:INK,'font-weight':600});
    text(svg,(left+right)/2,y(15),'Imported',{'text-anchor':'middle',fill:'white','font-weight':600});
    data.rows.forEach((row,i)=>{
      const point=node('circle',{cx:x(i),cy:y(row[1]),r:5,fill:'transparent',tabindex:0,role:'img','aria-label':`${row[0]}: imported ${row[1]}%, domestic ${row[2]}%`},svg);
      node('title',{},point,`${row[0]} · Imported ${row[1]}% · Domestic ${row[2]}%`);
    });
  }
  function fuelCost(mount,data){
    const w=mount.clientWidth,narrow=w<600,h=narrow?376:326,svg=svgIn(mount,w,h,data.title);
    const left=10,right=w-10,top=48,bottom=264,step=(right-left)/data.rows.length,bw=Math.min(58,step*.63);
    text(svg,0,16,'Fuel cost (PKR / kWh)');
    node('line',{x1:left,y1:bottom,x2:right,y2:bottom,stroke:'#bcc7cd'},svg);
    data.rows.forEach(([label,value],i)=>{
      const x=left+step*(i+.5);
      if(value===null)text(svg,x,bottom-12,'N/D',{'text-anchor':'middle'});
      else{
        const bh=value/40*(bottom-top);
        bar(svg,{x:x-bw/2,y:bottom-bh,width:bw,height:bh,fill:RED},`${label.replace('\n',' ')}: ${value} PKR per kWh`);
        text(svg,x,bottom-bh-10,value,{'text-anchor':'middle',fill:RED});
      }
      if(narrow)text(svg,0,0,label.replace('\n',' '),{transform:`translate(${x+3},${bottom+20}) rotate(-55)`,'text-anchor':'end'});
      else label.split('\n').forEach((line,j)=>text(svg,x,bottom+26+j*18,line,{'text-anchor':'middle'}));
    });
  }
  const renderers={tariffs,bill,imports,'fuel-cost':fuelCost};
  function draw(mount){const data=JSON.parse(mount.dataset.energyChart);mount.replaceChildren();renderers[data.id](mount,data);}
  let raf,lastWidth=0;
  const drawAll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>mounts.forEach(draw));};
  document.fonts.ready.then(drawAll);
  addEventListener('resize',drawAll);
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;drawAll();}}).observe(document.querySelector('.series-article'));
})();
