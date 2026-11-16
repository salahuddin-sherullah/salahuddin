/* Dated briefing charts share the series' reading width, colours and typography. */
(() => {
  const mounts=[...document.querySelectorAll('[data-energy-insight]')];
  if(!mounts.length)return;
  const NS='http://www.w3.org/2000/svg',LABEL='#505050';
  function node(tag,attrs={},parent,value){
    const el=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([key,val])=>el.setAttribute(key,val));
    if(value!==undefined)el.textContent=value;
    if(parent)parent.append(el);
    return el;
  }
  function text(svg,x,y,value,attrs={}){return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);}
  function wrapped(svg,x,y,value,width,attrs={}){
    const words=value.split(' ');let line='',row=0;
    const probe=text(svg,x,y,'',attrs);
    words.forEach(word=>{
      const candidate=line?`${line} ${word}`:word;probe.textContent=candidate;
      if(probe.getComputedTextLength()>width&&line){text(svg,x,y+row*20,line,attrs);row++;line=word;}else line=candidate;
    });
    probe.remove();text(svg,x,y+row*20,line,attrs);return (row+1)*20;
  }
  function accessible(svg,label,attrs={}){
    const group=node('g',{tabindex:0,role:'img','aria-label':label,'data-insight-value':true,...attrs},svg);
    node('title',{},group,label);return group;
  }
  function draw(mount){
    const data=JSON.parse(mount.dataset.energyInsight),w=mount.clientWidth;
    mount.replaceChildren();
    const svg=node('svg',{width:w,role:'img','aria-label':data.title},mount);
    node('title',{},svg,data.title);node('desc',{},svg,data.caption+' '+data.note);
    let height;
    if(data.type==='bars'){
      let y=wrapped(svg,0,16,data.unit,w)+28;
      const right=w-86,left=1,x=value=>left+value/data.maximum*(right-left);
      data.rows.forEach(([label,value],i)=>{
        y+=wrapped(svg,0,y,label,w,{fill:'#111'})-20;
        const display=value.toLocaleString('en-US',{maximumFractionDigits:data.decimals})+data.suffix;
        const group=accessible(svg,`${label}: ${display}`,{'data-value':value});
        if(data.track)node('rect',{x:left,y:y+12,width:right-left,height:25,fill:'#eeece9'},group);
        node('rect',{x:left,y:y+12,width:x(value)-left,height:25,fill:data.colours[i]},group);
        text(svg,x(value)+9,y+30,display,{fill:data.colours[i]==='#948d8d'?'#505050':data.colours[i],'font-weight':600});
        y+=78;
      });
      const bottom=y-24;
      node('line',{x1:left,y1:bottom,x2:right,y2:bottom,stroke:'#bcc7cd'},svg);
      data.ticks.forEach(value=>{
        node('line',{x1:x(value),y1:bottom,x2:x(value),y2:bottom+5,stroke:'#bcc7cd'},svg);
        text(svg,x(value),bottom+23,value,{'text-anchor':value===0?'start':'middle'});
      });
      height=bottom+40;
    }else if(data.type==='stacked'){
      let y=wrapped(svg,0,16,data.unit,w)+16,x=0;
      data.rows.forEach(([label,value],i)=>{
        const width=value/100*w,group=accessible(svg,`${label}: ${value}% of projected 2035 emissions`,{'data-value':value});
        node('rect',{x,y,width,height:42,fill:data.colours[i]},group);
        text(svg,x+width/2,y+27,`${value}%`,{fill:i===2?'#111':'white','text-anchor':'middle','font-weight':600});x+=width;
      });
      y+=70;
      data.rows.forEach(([label,value],i)=>{
        node('rect',{x:0,y:y-12,width:12,height:12,fill:data.colours[i]},svg);
        y+=wrapped(svg,22,y,label,w-24,{fill:'#111'})+10;
      });
      height=y+6;
    }else{
      // Different periods and estimation statuses are separated, not stacked or added.
      let y=20;
      data.rows.forEach(([label,value],i)=>{
        if(i){node('line',{x1:0,y1:y-18,x2:w,y2:y-18,stroke:'#dedbd7'},svg);}
        y+=wrapped(svg,0,y,data.labels[i],w);
        const group=accessible(svg,`${data.labels[i]}: ${data.display[i]}. ${label}`,{'data-value':value});
        text(group,0,y+27,data.display[i],{'font-size':32,'font-weight':600,fill:data.colours[i]});
        y+=wrapped(svg,0,y+55,label,w)+75;
      });
      height=y-20;
    }
    svg.setAttribute('height',height);svg.setAttribute('viewBox',`0 0 ${w} ${height}`);
  }
  let frame;
  const redraw=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>mounts.forEach(draw));};
  document.fonts.ready.then(redraw);addEventListener('resize',redraw);
  mounts.forEach(mount=>{let previous=0;new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==previous){previous=width;redraw();}}).observe(mount);});
})();
