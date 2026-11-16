/* Article 7: preserve the PDF's illustrative transport diamond at reading width. */
(() => {
  const mount=document.querySelector('[data-energy-chart]');
  if(!mount)return;
  const NS='http://www.w3.org/2000/svg',INK='#03071e',LABEL='#505050';
  const regions=[
    {row:1,colour:INK,points:[[862,190],[1100,427],[906,618],[670,382]],centre:[862,400],icon:'truck',counts:['120,000 trucks','1.5 million tractors']},
    {row:0,colour:'#cf0000',points:[[670,382],[906,618],[735,790],[500,552]],centre:[695,564],icon:'car',counts:['5.7 million vehicles']},
    {row:2,colour:'#948d8d',points:[[1100,427],[1226,552],[919,857],[795,731]],centre:[1015,650],icon:'bike',counts:['30.8 million vehicles']},
    {row:3,colour:'#f48c04',points:[[795,731],[919,857],[862,914],[735,790]],centre:[820,816],counts:['744,000 vehicles']}
  ];
  function node(tag,attrs={},parent,content){
    const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(content!==undefined)el.textContent=content;if(parent)parent.append(el);return el;
  }
  function text(svg,x,y,value,attrs={}){return node('text',{x,y,'font-size':14,fill:LABEL,...attrs},svg,value);}
  function vehicle(svg,x,y,kind){
    const g=node('g',{transform:`translate(${x} ${y}) scale(.7)`,fill:'none',stroke:'white','stroke-width':2,'aria-hidden':'true'},svg);
    const wheel=(cx,cy,r)=>node('circle',{cx,cy,r},g);
    if(kind==='bike'){
      wheel(-20,8,11);wheel(25,8,11);
      node('path',{d:'M-20 8 L-4 -14 L11 8 H-20 M-4 -14 H18 L25 8 M18 -14 V-23 H9'},g);
    }else if(kind==='truck'){
      node('rect',{x:-42,y:-22,width:52,height:29,rx:2},g);
      node('path',{d:'M10 -18 H27 L39 -4 V7 H10 M18 -18 V-4 H39'},g);
      wheel(-29,8,6);wheel(-13,8,6);wheel(28,8,6);
    }else{
      node('path',{d:'M-34 5 V-10 H-20 L-10 -24 H16 L27 -10 H36 V5 Z'},g);
      wheel(-20,6,6);wheel(24,6,6);
    }
  }
  function draw(){
    const data=JSON.parse(mount.dataset.energyChart),w=mount.clientWidth,compact=w<680;
    const size=Math.min(compact?w-4:370,370),left=(w-size)/2,top=44,h=top+size+12;
    const point=([x,y])=>[left+(x-500)*size/726,top+(y-190)*size/726];
    mount.replaceChildren();
    const svg=node('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':data.title},mount);
    node('title',{},svg,data.title);node('desc',{},svg,'Illustrative full-electrification scenario: 4,500 MW of potential additional demand. Areas do not encode quantities. Estimates and vehicle counts remain 2024.');
    text(svg,0,16,'Potential additional demand (MW)');
    regions.forEach(region=>{
      const row=data.rows[region.row];
      const polygon=node('polygon',{points:region.points.map(p=>point(p).join(',')).join(' '),fill:region.colour,stroke:'white','stroke-width':2,tabindex:0,role:'img','aria-label':`${row[0]}: ${row[1].toLocaleString('en-US')} MW; ${row[2].toLocaleString('en-US')} vehicles`,'data-region':true,'data-value':row[1]},svg);
      node('title',{},polygon,`${row[0]}: ${row[1].toLocaleString('en-US')} MW`);
      const [x,y]=point(region.centre);
      if(region.icon){
        const narrowBike=region.icon==='bike'&&size<320;
        vehicle(svg,x,y-(narrowBike?15:8),region.icon);
        text(svg,x-(narrowBike?13:0),y+(narrowBike?18:20),`${row[1].toLocaleString('en-US')} MW`,{'text-anchor':'middle',fill:'white','font-weight':600});
      }else{
        text(svg,x,y-2,row[1],{'text-anchor':'middle',fill:INK,'font-weight':600});
        text(svg,x,y+14,'MW',{'text-anchor':'middle',fill:INK});
      }
    });
    if(compact){
      const key=document.createElement('ul');key.className='energy-seven-key';
      [...regions].sort((a,b)=>a.row-b.row).forEach(region=>{
        const li=document.createElement('li'),swatch=document.createElement('i'),copy=document.createElement('span'),name=document.createElement('strong');
        swatch.style.background=region.colour;swatch.setAttribute('aria-hidden','true');
        name.textContent=data.rows[region.row][0];copy.append(name);
        region.counts.forEach(count=>{const line=document.createElement('span');line.textContent=count;copy.append(line);});
        li.append(swatch,copy);key.append(li);
      });mount.append(key);
    }else{
      const positions=[[left+size*.87,top+42,'start'],[left-16,top+size*.46,'end'],[left+size+12,top+size*.67,'start'],[left+size*.2,top+size*.9,'end']];
      regions.forEach((region,i)=>{
        const [x,y,anchor]=positions[i];text(svg,x,y,data.rows[region.row][0],{'text-anchor':anchor,fill:INK,'font-weight':600});
        region.counts.forEach((count,j)=>text(svg,x,y+21+j*19,count,{'text-anchor':anchor}));
      });
    }
  }
  let raf,lastWidth=0;
  const redraw=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);};
  document.fonts.ready.then(redraw);addEventListener('resize',redraw);
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;redraw();}}).observe(mount);
})();
