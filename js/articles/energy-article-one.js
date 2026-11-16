/* Article 1: draw at the container's actual width, as in the GB budget charts.
   Text stays at 14px; only geometry responds to the available width and height. */
(() => {
  const mounts = [...document.querySelectorAll('[data-energy-chart]')];
  if (!mounts.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const RED = '#cf0000', GRAY = '#948d8d', LABEL = '#505050';
  const ramp = ['#370617','#6a040f','#9d0208','#d00000','#dc2f02','#e85d04','#f48c06','#faa307','#ffba08','#ffd60a'];
  function node(tag, attrs = {}, parent, content) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
    if (content !== undefined) el.textContent = content;
    if (parent) parent.append(el);
    return el;
  }
  function text(svg,x,y,value,attrs={}) {
    return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);
  }
  function svgIn(parent,w,h,label) {
    const svg = node('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':label},parent);
    node('title',{},svg,label);
    return svg;
  }
  function capacity(mount,data) {
    const grid = document.createElement('div');grid.className='energy-one-panels';mount.append(grid);
    const headings=[...new Set(data.rows.map(r=>r[0]))];
    headings.forEach((heading,index)=>{
      const cell=document.createElement('div');cell.className='energy-one-panel';grid.append(cell);
      const w=cell.clientWidth, rows=data.rows.filter(r=>r[0]===heading), h=242;
      const svg=svgIn(cell,w,h,heading);
      text(svg,0,18,heading,{'font-weight':600,fill:'#111'});
      const x=105, maxBar=w-x-38, maximum=index===2?65:50;
      rows.forEach((row,i)=>{
        const y=44+i*46, value=row[2], bw=value/maximum*maxBar;
        text(svg,0,y+20,row[1]);
        node('rect',{x,y,width:bw,height:28,fill:index===2?RED:GRAY},svg);
        text(svg,x+bw+7,y+20,value+'%',{fill:index===2?RED:LABEL});
      });
    });
  }
  function geography(mount,data) {
    const w=mount.clientWidth,h=300,svg=svgIn(mount,w,h,data.title);
    text(svg,0,18,'Share of national total (%)');
    const left=8,bottom=244,top=42,step=(w-left-8)/4,bw=Math.min(82,step*.54);
    node('line',{x1:left,y1:bottom,x2:w-8,y2:bottom,stroke:'#bcc7cd'},svg);
    data.rows.forEach((row,i)=>{
      const x=left+step*(i+.5),bh=row[1]/100*(bottom-top);
      node('rect',{x:x-bw/2,y:bottom-bh,width:bw,height:bh,fill:row[0].includes('South')?RED:GRAY},svg);
      text(svg,x,bottom-bh-10,row[1]+'%',{'text-anchor':'middle',fill:row[0].includes('South')?RED:LABEL});
      row[0].split('\n').forEach((line,n)=>text(svg,x,bottom+24+n*18,line,{'text-anchor':'middle'}));
    });
  }
  function sectorPath(cx,cy,r,inner,start,end) {
    const p=(a,rad)=>[cx+rad*Math.sin(a),cy-rad*Math.cos(a)];
    const a=p(start,r),b=p(end,r),c=p(end,inner),d=p(start,inner),large=end-start>Math.PI?1:0;
    return `M${a} A${r},${r} 0 ${large} 1 ${b} L${c} A${inner},${inner} 0 ${large} 0 ${d} Z`;
  }
  function donut(mount,data,budget) {
    // Match the GB running-cost chart: a left-aligned 620px canvas and 155px radius.
    const w=Math.min(620,mount.clientWidth),narrow=w<600;
    const keyHeight=narrow?Math.ceil(data.rows.length/2)*25+8:0;
    const h=Math.max(narrow?180:350,budget-keyHeight),cx=w/2,cy=h/2;
    const r=narrow?Math.min(155,(h-58)/2,w/2-20):155,inner=narrow?r*.71:110;
    const svg=svgIn(mount,w,h,data.title), total=data.rows.reduce((sum,r)=>sum+r[1],0);
    const palette=data.id==='thermal'?['#d00100','#f48c06','#ffba08','#ffd60a']:ramp;
    const centre=text(svg,cx,cy-4,data.id==='thermal'?'100%':'40.4m',{'font-size':narrow?24:28,'font-weight':700,fill:RED,'text-anchor':'middle'});
    const sub=text(svg,cx,cy+19,data.id==='thermal'?(narrow?'thermal capacity':'THERMAL'):(narrow?'connections':'CONNECTIONS'),{'text-anchor':'middle','font-size':narrow?12:14});
    const initial=[centre.textContent,sub.textContent];let angle=0;const labels=[];
    data.rows.forEach((row,i)=>{
      const start=angle,end=angle+row[1]/total*Math.PI*2,mid=(start+end)/2;angle=end;
      const path=node('path',{d:sectorPath(cx,cy,r,inner,start+.009,end-.009),fill:palette[i],class:'energy-one-slice',tabindex:0,role:'img','aria-label':`${row[0]}: ${row[1]}%`},svg);
      node('title',{},path,`${row[0]}: ${row[1]}%${data.id==='thermal'?' of thermal capacity':''}`);
      const show=()=>{centre.textContent=row[1]+'%';sub.textContent=row[0]};
      const reset=()=>{centre.textContent=initial[0];sub.textContent=initial[1]};
      path.addEventListener('pointerenter',show);path.addEventListener('pointerleave',reset);path.addEventListener('focus',show);path.addEventListener('blur',reset);
      labels.push({row,mid,side:Math.sin(mid)>=0?1:-1,y:cy-Math.cos(mid)*(r+18),color:palette[i]});
    });
    // Keep central typography above slices and ensure adjacent labels never overlap.
    svg.append(centre,sub);
    if(!narrow) {
      // Anchor every label to its own slice; compact one-line labels keep small
      // neighbours close without connector lines.
      for(const side of [-1,1]) {
        const group=labels.filter(l=>l.side===side).sort((a,b)=>a.y-b.y),gap=21;
        group.forEach((l,i)=>l.y=Math.max(19,l.y,i?group[i-1].y+gap:19));
        if(group.length&&group.at(-1).y>h-10){group.at(-1).y=h-10;for(let i=group.length-2;i>=0;i--)group[i].y=Math.min(group[i].y,group[i+1].y-gap);}
        group.forEach(l=>{
          const x=cx+Math.sin(l.mid)*(r+22)+side*7,y=l.y+4;
          const label=text(svg,x,y,l.row[0],{'text-anchor':side===1?'start':'end',class:'energy-one-slice-label','data-slice':l.row[0]});
          node('tspan',{dx:6,fill:RED,'font-weight':600},label,l.row[1]+'%');
        });
      }
    }
    if(narrow){
      const key=document.createElement('ul');key.className='energy-one-mobile-key';
      labels.forEach(l=>{const li=document.createElement('li'),swatch=document.createElement('i'),name=document.createElement('span'),value=document.createElement('strong');swatch.style.background=l.color;name.textContent=l.row[0];value.textContent=l.row[1]+'%';li.append(swatch,name,value);key.append(li)});mount.append(key);
    }
  }
  function capacityMix(mount,data,budget) {
    const scale=1.2,w=Math.min(620*scale,mount.clientWidth),narrow=w<600;
    const keyHeight=narrow?164:0,baseHeight=Math.max(narrow?200:350,budget-keyHeight),h=baseHeight*scale;
    const r=narrow?Math.min(155*scale,(baseHeight-16)/2*scale,w/2-12):155*scale,cx=w/2,cy=h/2;
    // Both bands use the distribution doughnut’s 45px thickness at 155px radius.
    const band=r*45/155,gap=r*6/155,outerInner=r-band;
    const innerOuter=outerInner-gap,hole=innerOuter-band;
    const svg=svgIn(mount,w,h,data.title);
    const overall=data.rows.filter(row=>row[0]==='Overall mix');
    const fuels=data.rows.filter(row=>row[0]==='Thermal breakdown');
    const colours={Thermal:RED,Hydel:GRAY,Nuclear:'#03071e',Renewables:'#6b705c',Coal:RED,Gas:'#f48c06',RFO:'#ffba08',RLNG:'#ffd60a'};
    const centre=text(svg,cx,cy-3,'100%',{'font-size':narrow?22:28,'font-weight':700,fill:RED,'text-anchor':'middle'});
    const sub=text(svg,cx,cy+16,narrow?'capacity':'TOTAL CAPACITY',{'font-size':narrow?10:11,'text-anchor':'middle'});
    const base=[centre.textContent,sub.textContent],labels=[];
    function ring(rows,outer,inner,level) {
      let angle=0;
      rows.forEach(row=>{
        const [,name,value]=row,end=angle+value/100*Math.PI*2,mid=(angle+end)/2;
        const arc=node('path',{d:sectorPath(cx,cy,outer,inner,angle+.006,end-.006),fill:colours[name],class:'energy-one-slice',tabindex:0,role:'img','aria-label':`${name}: ${value}% of total installed capacity${level==='fuel'?', part of thermal capacity':''}`,'data-level':level,'data-value':value,'data-source':name},svg);
        node('title',{},arc,`${name}: ${value}% of total installed capacity`);
        const show=()=>{centre.textContent=value+'%';sub.textContent=name;};
        const reset=()=>{centre.textContent=base[0];sub.textContent=base[1];};
        arc.addEventListener('pointerenter',show);arc.addEventListener('pointerleave',reset);arc.addEventListener('focus',show);arc.addEventListener('blur',reset);
        if(name==='Thermal'){
          const rr=(outer+inner)/2,tx=cx+Math.sin(mid)*rr,ty=cy-Math.cos(mid)*rr;
          if(!narrow)text(svg,tx,ty-3,'Thermal',{'font-size':11,'text-anchor':'middle',fill:'white','pointer-events':'none'});
          text(svg,tx,ty+(narrow?4:13),'56%',{'font-size':narrow?11:14,'text-anchor':'middle',fill:'white','font-weight':600,'pointer-events':'none'});
        }else labels.push({name,value,mid,outer});
        angle=end;
      });
    }
    ring(overall,innerOuter,hole,'overall');ring(fuels,r,outerInner,'fuel');
    svg.append(centre,sub);
    if(!narrow)labels.forEach(({name,value,mid,outer})=>{
      const side=Math.sin(mid)>=0?1:-1,x=cx+Math.sin(mid)*(outer+20)+side*6,y=Math.max(18,Math.min(h-6,cy-Math.cos(mid)*(outer+20)+4));
      const label=text(svg,x,y,name,{'text-anchor':side===1?'start':'end',class:'energy-one-slice-label','data-slice':name});
      node('tspan',{dx:6,fill:RED,'font-weight':600},label,value+'%');
    });
    if(narrow){
      [['Overall mix (inner ring)',overall],['Thermal fuels (outer ring)',fuels]].forEach(([title,rows])=>{
        const heading=document.createElement('p');heading.className='energy-one-key-title';heading.textContent=title;mount.append(heading);
        const key=document.createElement('ul');key.className='energy-one-mobile-key';
        rows.forEach(([,name,value])=>{
          const item=document.createElement('li'),swatch=document.createElement('i'),label=document.createElement('span'),val=document.createElement('strong');
          swatch.style.background=colours[name];label.textContent=name;val.textContent=value+'%';item.append(swatch,label,val);key.append(item);
        });mount.append(key);
      });
    }
  }
  function draw(mount) {
    const data=JSON.parse(mount.dataset.energyChart),figure=mount.closest('figure');
    const otherHeight=figure.getBoundingClientRect().height-mount.getBoundingClientRect().height;
    const header=document.querySelector('#header'), headerHeight=Math.max(60,header?header.getBoundingClientRect().height:0);
    const budget=Math.max(240,Math.min(430,innerHeight-headerHeight-28-otherHeight));
    mount.replaceChildren();
    if(data.id==='capacity-mix')capacity(mount,data);
    else if(data.id==='geography')geography(mount,data);
    else if(data.id==='thermal')capacityMix(mount,data,budget);
    else donut(mount,data,budget);
  }
  let raf;
  const drawAll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>mounts.forEach(draw));};
  document.fonts.ready.then(drawAll);
  addEventListener('resize',drawAll);
  let lastWidth=0;
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;drawAll();}}).observe(document.querySelector('.series-article'));
})();
