"""Rebuild the 17 original Energy Series figures and two new solar charts as Dark Matter SVGs.

Chart forms and panel arrangements follow the December 2024 PDF. New observations
come from the supplied November 2026 update; historical gaps remain explicit.
No plotting or network dependency is needed. Run from any directory.
"""
from pathlib import Path
import json, math, html, textwrap, base64

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'images/pages/energy-series/charts'
OUT.mkdir(parents=True,exist_ok=True)
old={f['id']:f for f in json.loads((ROOT/'data/energy-series/charts.json').read_text())['figures']}
RED='#cf0000'; GRAY='#948d8d'; INK='#111111'; NAVY='#03071e'; BURG='#6a040f'; PALE='#e5e2df'; GOLD='#f48c04'
COLORS=[RED,INK,GRAY,BURG,GOLD,'#370617','#d56e61','#6e6866','#b9b3b0','#f1bb83']
manifest=[]
AUDIT_NOTES=json.loads((ROOT/'data/energy-series/chart-notes.json').read_text())
presentations={}
logo=base64.b64encode((ROOT/'images/shared/brand/dark_matter_dark_logo.png').read_bytes()).decode()
def esc(s):return html.escape(str(s))
def num(v):return f'{v:,.2f}'.rstrip('0').rstrip('.') if isinstance(v,float) else f'{v:,}'
class SVG:
 def __init__(self,title,subtitle,height=650):
  self.subtitle=subtitle
  self.h=height;self.parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 {height}" role="img"><title>{esc(title)}</title><desc>{esc(subtitle)}</desc><rect width="1100" height="{height}" fill="white"/><g font-family="Arial, Helvetica, sans-serif">']
  self.parts.append('<g data-chart-heading="true">')
  self.text(30,38,title,25,bold=True,wrap=72)
  self.text(30,106,subtitle,16,color='#555',wrap=112)
  self.parts.append('</g>')
  self.heading_end=len(self.parts)
 def text(self,x,y,s,size=17,color=INK,bold=False,anchor='start',wrap=None):
  lines=textwrap.wrap(str(s),wrap) if wrap else str(s).split('\n')
  for i,l in enumerate(lines):self.parts.append(f'<text x="{x}" y="{y+i*size*1.3}" font-size="{size}" fill="{color}" font-weight="{600 if bold else 400}" text-anchor="{anchor}">{esc(l)}</text>')
 def rect(self,x,y,w,h,c):self.parts.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{max(0,w):.2f}" height="{max(0,h):.2f}" fill="{c}"/>')
 def line(self,x1,y1,x2,y2,c='#ddd',dash=False,width=1):self.parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{width}"'+(' stroke-dasharray="6 5"' if dash else '')+'/>')
 def path(self,d,c,stroke=None,width=2):self.parts.append(f'<path d="{d}" fill="{c}" stroke="{stroke or "none"}" stroke-width="{width}"/>')
 def circle(self,x,y,r,c):self.parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>')
 def legend(self,items,x=325,y=163):
  for label,c in items:self.rect(x,y-13,17,17,c);self.text(x+25,y+1,label,16);x+=25+len(label)*9+28
 def finish(self,id,source):
  self.line(30,self.h-66,1070,self.h-66)
  self.text(30,self.h-43,source,12,color='#666',wrap=125)
  self.parts.append(f'<image href="data:image/png;base64,{logo}" x="940" y="{self.h-51}" width="125" height="35"/></g></svg>')
  (OUT/f'{id}.svg').write_text(''.join(self.parts))
  # Inline figures use HTML captions; keep complete headings in standalone exports.
  plot=''.join(self.parts[:1]+self.parts[self.heading_end:])
  plot=plot.replace(f'viewBox="0 0 1100 {self.h}"',f'viewBox="30 140 1040 {self.h-140}"')
  (OUT/f'{id}-plot.svg').write_text(plot)
  presentations[id]=dict(plot_path=f'images/pages/energy-series/charts/{id}-plot.svg',plot_width=1040,plot_height=self.h-140,caption=self.subtitle)
def record(id,title,page,part,kind,rows,columns,note,status,refs,subtitle,source):
 note=AUDIT_NOTES[id]
 manifest.append(dict(id=id,title=title,source_page=page,part=part,kind=kind,rows=rows,columns=columns,note=note,status=status,refs=refs,subtitle=subtitle,source=source,path=f'images/pages/energy-series/charts/{id}.svg',**presentations[id]))
def vertical(id,title,subtitle,page,part,rows,series,unit,maximum,note,status,refs,source,benchmark=None):
 s=SVG(title,subtitle,690);x0=305;y0=550;top=210;plotw=740
 s.text(30,210,unit,20,wrap=21);s.legend(list(zip(series,[GRAY,RED]))) if len(series)>1 else None
 n=len(rows);g=plotw/n;bw=min(90,g*.65/len(series));s.line(x0,y0,1060,y0,INK)
 for i,row in enumerate(rows):
  for j,v in enumerate(row[1:]):
   x=x0+g*(i+.5)+(j-(len(series)-1)/2)*bw-bw/2
   if v is None:s.text(x+bw/2,y0-15,'N/D',14,anchor='middle');continue
   h=v/maximum*(y0-top);c=[GRAY,RED][j] if len(series)>1 else (RED if row[0].startswith('Pakistan') or id=='fuel-cost' else GRAY)
   s.rect(x,y0-h,bw*.9,h,c);s.text(x+bw*.45,y0-h-10,num(v),17,bold=True,anchor='middle')
  s.text(x0+g*(i+.5),y0+25,row[0],16,anchor='middle',wrap=max(8,int(g/9)))
 if benchmark:
  y=y0-benchmark[0]/maximum*(y0-top);s.line(x0,y,1060,y,INK,True);s.text(1050,y-8,benchmark[1],14,anchor='end')
 s.finish(id,source);record(id,title,page,part,'grouped columns' if len(series)>1 else 'columns',rows,['Category']+series,note,status,refs,subtitle,source)

# PDF p.4: ownership and province panels; fuel mix is combined with p.5 below.
id='capacity-mix';title='Who owns the capacity and where it sits'
s=SVG(title,'Ownership and provincial shares of capacity. Historical comparison, 2024.',660)
panels=[('Ownership · 2024',[['Government',46],['CPEC',17],['KE and IPPs',37]],50),('Province · 2024',[['Punjab',43],['Sindh',35],['KPK',14],['Balochistan',8]],50)]
rows=[]
for n,(heading,values,mx) in enumerate(panels):
 x=30+n*520;s.text(x,185,heading,19,bold=True)
 if n:s.line(x-15,163,x-15,540,'#aaa')
 for i,(label,v) in enumerate(values):
  y=225+i*76;s.text(x,y+26,label,17);s.rect(x+120,y,v/mx*145,43,RED if n==2 else GRAY);s.text(x+128+v/mx*145,y+28,f'{v}%',17);rows.append([heading,label,v])
s.finish(id,'Source: Energy Series (2024), Caravan Media. Shares not updated from 2024.')
record(id,title,4,1,'two horizontal bar panels',rows,['Panel','Category','Share (%)'],'Ownership and provincial shares NOT UPDATED: all values retain the original 2024 comparison. The FY25 fuel mix appears in the combined capacity chart below.', 'Not updated · 2024',[0], 'Ownership and provincial distribution of installed capacity in 2024.','Energy Series (2024), Caravan Media')

def donut(id,title,subtitle,page,part,rows,center,note,status,refs,source):
 s=SVG(title,subtitle,730);cx,cy,r,inner=720,390,205,112;total=sum(v for _,v in rows);angle=-math.pi/2
 s.text(30,210,'Share of total\n'+('thermal capacity (%)' if id=='thermal' else 'consumer connections (%)'),21)
 for i,(label,v) in enumerate(rows):
  end=angle+v/total*2*math.pi
  def p(a,rad):return (cx+rad*math.cos(a),cy+rad*math.sin(a))
  a,b=p(angle,r),p(end,r);c,d=p(end,inner),p(angle,inner);large=int(end-angle>math.pi)
  s.path(f'M{a[0]},{a[1]} A{r},{r} 0 {large} 1 {b[0]},{b[1]} L{c[0]},{c[1]} A{inner},{inner} 0 {large} 0 {d[0]},{d[1]} Z',COLORS[i%len(COLORS)])
  mid=(angle+end)/2;tx,ty=p(mid,(r+inner)/2)
  if v>=5:s.text(tx,ty+5,f'{v}%',17,'white' if i%len(COLORS) not in [4,8,9] else INK,anchor='middle')
  # Smaller shares use a clean key on the left instead of colliding labels.
  s.rect(30,285+i*29,12,12,COLORS[i%len(COLORS)]);s.text(52,297+i*29,f'{label}  {v}%',17)
  angle=end
 s.text(cx,cy-5,center,24,bold=True,anchor='middle');s.finish(id,source)
 record(id,title,page,part,'doughnut',rows,['Category','Share of thermal capacity (%)' if id=='thermal' else 'Share (%)'],note,status,refs,subtitle,source)
# The fuel mix from PDF p.4 and the thermal breakdown from p.5 share one hierarchy.
id='thermal';title='Pakistan’s installed electricity capacity by source'
caption='Overall capacity mix, with thermal fuels split in the outer ring. FY25.'
overall=[['Thermal',56,RED],['Hydel',28,GRAY],['Nuclear',9,NAVY],['Renewables',7,'#6b705c']]
fuels=[['Coal',18,RED],['Gas',11,'#f48c06'],['RFO',8,'#ffba08'],['RLNG',19,'#ffd60a']]
s=SVG(title,caption,700);cx,cy=520,380

def capacity_arc(start,end,outer,inner,color):
 def point(a,r):return (cx+r*math.sin(a),cy-r*math.cos(a))
 a,b=point(start,outer),point(end,outer);c,d=point(end,inner),point(start,inner);large=int(end-start>math.pi)
 s.path(f'M{a[0]},{a[1]} A{outer},{outer} 0 {large} 1 {b[0]},{b[1]} L{c[0]},{c[1]} A{inner},{inner} 0 {large} 0 {d[0]},{d[1]} Z',color,'white',2)

a=0
for name,value,color in overall:
 end=a+value/100*math.tau;capacity_arc(a,end,131,74,color)
 mid=(a+end)/2
 if name=='Thermal':s.text(cx+102.5*math.sin(mid),cy-102.5*math.cos(mid)-5,'Thermal\n56%',15,'white',anchor='middle')
 else:
  x=cx+190*math.sin(mid);y=cy-190*math.cos(mid)
  s.text(x,y,f'{name} {value}%',17,anchor='end' if math.sin(mid)<0 else 'start')
 a=end
a=0
for name,value,color in fuels:
 end=a+value/100*math.tau;capacity_arc(a,end,195,138,color);mid=(a+end)/2
 s.text(cx+220*math.sin(mid)+8,cy-220*math.cos(mid),f'{name} {value}%',17)
 a=end
s.text(cx,cy-3,'100%',28,RED,bold=True,anchor='middle');s.text(cx,cy+23,'TOTAL CAPACITY',14,anchor='middle')
s.finish(id,'Source: Renewables First, Pakistan Electricity Review 2026; NEPRA SIR 2025.')
rows=[['Overall mix',name,value] for name,value,_ in overall]+[['Thermal breakdown',name,value] for name,value,_ in fuels]
record(id,title,5,1,'nested doughnut',rows,['Level','Source','Share of total capacity (%)'],'All labels are shares of total utility-scale capacity. Rounded thermal components sum to 56%, versus the source’s approximately 57% headline; using those components makes the overall mix total 100%. Rooftop solar is excluded. RFO means furnace oil.','Updated',[2],caption,'Renewables First, Pakistan Electricity Review 2026; NEPRA SIR 2025.')
vertical('geography','The North needs power that the South could supply','North–south generation capacity and demand shares. Historical comparison.',6,1,[['Generation\nNorth',57],['Demand\nNorth',77],['Generation\nSouth',43],['Demand\nSouth',23]],['Share'],'Share of national total (%)',100,'NOT UPDATED: all four values are retained from 2024. North: Punjab and KPK; South: Sindh and Balochistan.','Not updated · 2024',[0],'Source: Energy Series (2024), Caravan Media calculations.')
consumer=[['PESCO',9.9],['IESCO',9.9],['GEPCO',12.2],['LESCO',17.4],['FESCO',13.7],['MEPCO',20.4],['HESCO',3.1],['SEPCO',2],['QESCO',1.8],['KE',9.4]]
donut('customers','Distribution networks serve about 40.4 million connections','Share of consumers in FY25; TESCO is outside this dataset.',7,1,consumer,'40.4 million\nconnections','Updated from FY23 using NEPRA PER FY25. The ten supplied counts sum to 40,435,207; shares are rounded and total 99.8%. The original unquantified TESCO slice is omitted because the update explicitly excludes it. Connections are not people.','Updated',[11],'Source: NEPRA Performance Evaluation Report, Distribution Companies, FY2024–25.')
vertical('tariffs','Pakistan’s tariffs rose as its neighbours’ fell','Average power tariffs, 2021 and 2024. Historical comparison, not updated.',9,2,[['India',12,8],['Bangladesh',9,7.5],['Pakistan',13,21]],['2021','2024'],'US cents / kWh',25,'NOT UPDATED: 2021 and 2024 values retained. Consumer classes, taxes and exchange-rate dates are not harmonised in the source. Do not compare directly with the separate industrial tariff estimates.','Not updated · 2021–24',[0],'Source: Energy Series (2024); Statista, Tribune, Paradigm Shift and Atif Mian.')
# PDF p.10: one horizontal 100% stacked bill, not a waffle.
s=SVG('The bill pays for more than generation','Illustrative shares of the final bill; 2024 composition, not updated.',380);x=30
bill=[['Generation',48],['Transmission',3],['Distribution',8],['Taxes',15],['Additional charges',26]]
for i,(label,v) in enumerate(bill):
 w=v*10.4;s.rect(x,180,w,57,COLORS[i]);s.text(x+w/2,215,f'{v}%',18,'white' if i!=4 else INK,anchor='middle');s.text(x+w/2,160 if i%2==0 else 270,label,15,anchor='middle');x+=w
s.finish('bill','Source: Energy Series (2024). Historical illustration, not a current bill calculator.')
record('bill','The anatomy of an electricity bill',10,2,'100% horizontal stacked bar',bill,['Component','Share (%)'],'NOT UPDATED: generation 48%, transmission 3%, distribution 8%, taxes 15%, additional charges 26% are 2024 illustrative shares. The updated Rs 3.23/unit debt surcharge does not establish a new percentage split.','Not updated · 2024',[0,24,25],'Five components of the final bill.','Energy Series (2024)')
# PDF p.11: 100% stacked area history.
s=SVG('Imported fuels became a larger exposure before the 2024 fall','Historical fuel-share series, 2004–2024. FY25 uses a different definition.',700)
rows=old['imports']['panels'][0]['rows'];x0,y0,w,h=330,555,700,350
def xx(i):return x0+i/(len(rows)-1)*w
def yy(v):return y0-v/100*h
pts=' '.join(f'{xx(i)},{yy(r[1])}' for i,r in enumerate(rows))
s.rect(x0,y0-h,w,h,GRAY);s.path(f'M{x0},{y0} L{pts} L{x0+w},{y0} Z',RED)
for v in [0,20,40,60,80,100]:s.text(x0-15,yy(v)+5,f'{v}%',15,anchor='end')
for i,r in enumerate(rows):
 if i%4==0:s.text(xx(i),y0+30,r[0],16,anchor='middle')
s.text(30,210,'Domestic and imported\nfuel shares (%)',20);s.text(650,300,'Domestic',22,'white',bold=True);s.text(650,500,'Imported',22,'white',bold=True)
s.finish('imports','Source: Energy Series (2024); Farooq Tirmizi / Pakistan Today. Intermediate points approximate.')
record('imports','Domestic and imported fuel shares',11,2,'100% stacked area',rows,['Year','Imported (%)','Domestic (%)'],'NOT UPDATED: original 2004–2024 series. Intermediate points are approximate visual readings from the 2024 chart, not an underlying dataset. FY25’s approximately 29% includes RLNG, imported coal, RFO and electricity imports and must not be appended to this ambiguous-denominator history.','Not updated · 2004–24',[0,2],'Original history retained; 2024 imported share is 22%.','Energy Series (2024)')
vertical('fuel-cost','Fuel costs differ sharply by source','October 2025 actual fuel costs; a single month, not an annual median.',12,2,[['RFO',32.69],['RLNG',21.06],['Imported\ncoal',14.39],['Gas',13.36],['Local\ncoal',13.1],['Bagasse',10.74],['Nuclear',2.17]],['Fuel cost'],'PKR / kWh',40,'Updated using the supplied table citing NEPRA’s 9 December 2025 FCA decision; the update supplies no direct decision link. HSD is omitted because it was not dispatched; no fuel-cost value was supplied. The original FY24 annual medians and FY26 reference rates remain in the data notes; these bases are not directly comparable.','Updated · monthly basis',[108],'Source: supplied November 2026 update, citing NEPRA FCA decision of 9 December 2025.')
# PDF p.16: seasonal columns topped by idle capacity and capacity/average reference lines.
s=SVG('Seasonal demand leaves much of the fleet unused','Utility-scale capacity: FY25. Served system peaks: approximately 28 GW / 16 GW.',700)
x0,y0,h=315,555,350;cap=41.121
for x,v,label in [(450,28,'Summer peak'),(760,16,'Winter peak')]:
 s.rect(x,y0-h,95,h,PALE);s.rect(x,y0-v/cap*h,95,v/cap*h,RED);s.text(x+47,y0-v/cap*h-12,str(v),21,bold=True,anchor='middle');s.text(x+47,y0+30,label,18,anchor='middle')
s.line(315,y0-h,1040,y0-h,INK);s.text(1035,y0-h-12,'41.1k MW installed',17,anchor='end');ay=y0-23/cap*h;s.line(315,ay,1040,ay,'#777',True);s.text(1035,ay-10,'23k MW average · 2024 only',15,anchor='end');s.text(30,210,'Installed capacity\nand seasonal demand\nThousand MW',20);s.text(620,260,'Unused nameplate\ncapacity',16,anchor='middle');s.finish('capacity','Source: Renewables First PER 2026 (FY25); Energy Series (2024) for historical average.')
record('capacity','Installed capacity versus seasonal demand',16,3,'seasonal columns with idle capacity', [['Installed capacity FY25',41.121],['Summer served peak FY25',28],['Winter served peak FY25',16],['Average demand 2024',23]],['Measure','Thousand MW'],'Capacity and seasonal peaks updated. Average demand in MW NOT UPDATED: dashed 23,000 MW line is historical 2024, not the FY25 average. NEPRA’s computed peak above 33,000 MW uses a different basis. Nameplate capacity is not continuously dispatchable power.','Partly updated',[2,9,0],'Seasonal demand and installed capacity, with a clearly historical average reference.','Renewables First / NEPRA; Energy Series (2024)')
vertical('payments','Capacity shares and payment shares are not the same','Ownership and capacity-payment shares, 2024. Historical comparison, not updated.',17,3,[['Government\nplants',46,49],['CPEC',17,36],['Other IPPs',37,15]],['Installed capacity','Capacity payments'],'Share (%)',60,'NOT UPDATED: all ownership/payment shares are 2024. The government/GENCO and other-IPP labels follow the original grouping. Current payment totals cannot be allocated using these old shares as if ownership had not changed.','Not updated · 2024',[0],'Source: Energy Series (2024); PIDE / PPIB.')
# PDF p.20: stacked financial-loss columns.
s=SVG('Collection improved, but network losses remain costly','Annual T&D financial losses plus under-recovery, PKR billion.',690)
s.text(30,215,'Power-sector\nshortfalls\nPKR billion',20);s.legend([('T&D losses',RED),('Under-recovery',NAVY)],310)
rows=[['FY23',166,236],['FY24',230,279],['FY25',265,132]]
for i,(yr,td,un) in enumerate(rows):
 x=365+i*245;y0=550;scale=.6;s.rect(x,y0-un*scale,85,un*scale,NAVY);s.rect(x,y0-(un+td)*scale,85,td*scale,RED);s.text(x+42,y0-un*scale/2+5,str(un),20,'white',anchor='middle');s.text(x+42,y0-un*scale-td*scale/2+5,str(td),20,'white',anchor='middle');s.text(x+42,y0-(td+un)*scale-15,str(td+un),21,bold=True,anchor='middle');s.text(x+42,580,yr,18,anchor='middle')
s.finish('losses','Source: original FY23–FY24 series; NEPRA PER FY2024–25 (FY25 excludes KE under-recovery).')
record('losses','The annual cost of losses and unpaid bills',20,4,'stacked columns',rows,['Year','T&D (PKR bn)','Under-recovery (PKR bn)'],'FY25 updated to Rs 397B, excluding KE’s Rs 74.66B under-recovery; including it gives approximately Rs 472B. FY23 and FY24 retain the original series; later FY24 estimates (276/315) differ. The apparent 22% fall is against the unrevised original base, not a clean restated comparison. FY26 PER data not supplied.','Partly updated',[11,34,0],'Original stacked comparison extended to FY25.','NEPRA PER FY25; Energy Series (2024)')
# PDF p.22: paired horizontal DISCO panels, with benchmark lines.
rows=[['SEPCO',39.18,36.04],['QESCO',38.38,52.41],['PESCO',37.15,87.48],['HESCO',27.89,27.14],['K-Electric',14.73,1.05],['MEPCO',13.81,14.01],['LESCO',13.7,35.17],['GEPCO',10.6,5.5],['FESCO',9.02,2.97],['IESCO',8.61,4.78]]
s=SVG('The average hides very different distribution networks','Actual T&D loss rates and financial losses from exceeding allowed targets, FY25.',890);s.text(160,178,'T&D loss rate (%)',20,bold=True);s.text(630,178,'Financial loss (PKR bn)',20,bold=True)
for i,(name,v,fin) in enumerate(rows):
 y=205+i*47;s.text(30,y+24,name,17);s.rect(160,y,v/40*345,30,RED);s.text(170+v/40*345,y+23,f'{v:.2f}%',16);s.rect(630,y,fin/90*330,30,NAVY);s.text(640+fin/90*330,y+23,f'{fin:.2f}',16)
for v,label,y in [(8,'8% global (historical)',730),(17.55,'17.55% ex-WAPDA',760)]:
 x=160+v/40*345;s.line(x,200,x,685,INK,True);s.text(x,y,label,13,anchor='middle')
s.text(630,741,'Rs 265.01B total, excluding KE',18,bold=True);s.finish('discos','Source: NEPRA Performance Evaluation Report FY2024–25. KE’s loss calculation is disputed.')
record('discos','DISCO performance: physical and financial losses',22,4,'paired horizontal bars',rows,['DISCO','T&D (%)','Financial loss (PKR bn)'],'Updated to FY25. Financial loss measures breach of the allowed target, not the value of all energy lost. Rs 265.01B total excludes KE; KE’s displayed Rs 1.05B is under court challenge. Historical 8% global line NOT UPDATED. All companies exceeded their allowed targets.','Updated',[11],'Loss rates and their financial impact, as two aligned panels.','NEPRA PER FY25')
vertical('benchmark','Pakistan’s network losses remain above the historical peer benchmarks','Pakistan: ex-WAPDA DISCOs, FY25. Other countries: original comparison, not updated.',23,4,[['India',15],['Bangladesh',10.3],['Singapore',2],['US',6],['Pakistan',17.55]],['Loss rate'],'T&D loss (%)',20,'Only Pakistan is updated, to FY25 ex-WAPDA DISCO losses. Peer rates and the 8% global benchmark are NOT UPDATED and do not share a confirmed reporting year or coverage. KE’s separate FY25 rate is 14.73%.','Partly updated',[11,0],'Source: NEPRA PER FY25; historical peer figures from IPRI, Energy Series (2024).',(8,'8% global benchmark · historical'))
def line_chart(id,title,subtitle,page,part,rows,series,unit,minimum,maximum,note,status,refs,source):
 s=SVG(title,subtitle,700);x0,y0,w,h=320,550,730,350;s.text(30,210,unit,20,wrap=23)
 for v in [minimum+(maximum-minimum)*i/4 for i in range(5)]:
  y=y0-(v-minimum)/(maximum-minimum)*h;s.line(x0,y,1050,y);s.text(x0-14,y+5,num(v),15,anchor='end')
 for j,name in enumerate(series):
  points=[]
  for i,row in enumerate(rows):points.append((x0+i/(len(rows)-1)*w,y0-(row[j+1]-minimum)/(maximum-minimum)*h))
  s.path('M'+' L'.join(f'{x},{y}' for x,y in points),'none',[RED,NAVY][j],3)
  for i,(x,y) in enumerate(points):
   s.circle(x,y,4,[RED,NAVY][j])
   if len(rows)<7 or i==len(rows)-1:s.text(x+6 if i==0 else x,y-12,num(rows[i][j+1]),16,[RED,NAVY][j],anchor='start' if i==0 else ('end' if i==len(rows)-1 else 'middle'))
  if len(series)>1:s.text(points[-1][0],points[-1][1]+27,name,15,[RED,NAVY][j],anchor='end')
 for i,row in enumerate(rows):
  if len(rows)<7 or i%4==0 or i==len(rows)-1:s.text(x0+i/(len(rows)-1)*w,y0+30,row[0],15,anchor='middle')
 if id=='debt':
  idx=7;x=x0+idx/(len(rows)-1)*w;y=y0-(450-minimum)/(maximum-minimum)*h;s.circle(x,y,7,INK);s.line(x,340,x,y-10,INK);s.text(x,275,'FY13 government\npayment intervention',16,anchor='middle')
 s.finish(id,source);record(id,title,page,part,'line chart',rows,['Period']+series,note,status,refs,subtitle,source)
debtrows=old['debt']['panels'][0]['rows'][:-1]+[['2024',2393],['2025',1614],['2026',1675]]
line_chart('debt','Debt fell, then started accumulating again','Power-sector circular debt, PKR billion. Updated annual endpoints through June 2026.',25,5,debtrows,['Circular debt'],'PKR billion',0,3000,'FY24 restated to 2,393; FY25 1,614; FY26 1,675. One reply reports 1,641 for FY25; this series uses 1,614. Earlier points NOT UPDATED; except the labelled 2013 value, they are approximate readings of the original graphic. Refinancing signed in September 2025 must not be treated as a June 2025 event.','Partly updated',[0,2,36,58],'Source: historical IPRI graphic; NEPRA / Power Division and October 2026 National Assembly reply.')
vertical('markets','Electricity markets have moved towards more competitive structures','Number of jurisdictions, 1989 and 2024. Historical comparison, not updated.',29,6,[['Vertically\nintegrated',215,72],['Single buyer',14,89],['Wholesale / retail\ncompetition',1,69]],['1989','2024'],'Number of jurisdictions',250,'NOT UPDATED. Original source calls these countries but counts 230 in each year without defining coverage. Pakistan’s 2026 CTBCM developments are discussed separately, not inserted into an unrefreshed global dataset.','Not updated · 1989–2024',[0],'Source: Energy Series (2024), Global Power Market Structures Database.')
# PDF p.33: rotated square composition, with vehicle illustrations and callouts.
s=SVG('Electrifying transport could create 4,500 MW of new demand','Full-electrification scenario, 2024. These estimates are not an adoption forecast.',810)
s.text(30,210,'Incremental demand\nby vehicle category\nMW',20)
# Trace the original tilted-square subdivisions; colours follow Dark Matter.
def transformed(x,y):return 440+(x-500)*.65,180+(y-190)*.65
for points,c in [([(862,190),(1100,427),(906,618),(670,382)],NAVY), ([(670,382),(906,618),(735,790),(500,552)],RED), ([(1100,427),(1226,552),(919,857),(795,731)],GRAY), ([(795,731),(919,857),(862,914),(735,790)],GOLD)]:
 pts=[transformed(x,y) for x,y in points];s.path('M'+' L'.join(f'{x},{y}' for x,y in pts)+' Z',c,'white',2)
def vehicle(x,y,kind,color='white'):
 if kind=='bike':
  s.parts.append(f'<g fill="none" stroke="{color}" stroke-width="2"><circle cx="{x-20}" cy="{y+8}" r="11"/><circle cx="{x+25}" cy="{y+8}" r="11"/><path d="M{x-20} {y+8} L{x-4} {y-14} L{x+11} {y+8} H{x-20} M{x-4} {y-14} H{x+18} L{x+25} {y+8} M{x+18} {y-14} V{y-23} H{x+9}"/></g>')
 elif kind=='truck':
  s.parts.append(f'<g fill="none" stroke="{color}" stroke-width="2"><rect x="{x-42}" y="{y-22}" width="52" height="29" rx="2"/><path d="M{x+10} {y-18} H{x+27} L{x+39} {y-4} V{y+7} H{x+10} M{x+18} {y-18} V{y-4} H{x+39}"/><circle cx="{x-29}" cy="{y+8}" r="6"/><circle cx="{x-13}" cy="{y+8}" r="6"/><circle cx="{x+28}" cy="{y+8}" r="6"/></g>')
 else:
  s.parts.append(f'<g fill="none" stroke="{color}" stroke-width="2"><path d="M{x-34} {y+5} V{y-10} H{x-20} L{x-10} {y-24} H{x+16} L{x+27} {y-10} H{x+36} V{y+5} Z"/><circle cx="{x-20}" cy="{y+6}" r="6"/><circle cx="{x+24}" cy="{y+6}" r="6"/></g>')
for ox,oy,label,kind in [(862,400,'1,550 MW','truck'),(695,564,'1,400 MW','car'),(1015,650,'1,300 MW','bike')]:
 x,y=transformed(ox,oy);vehicle(x,y-12,kind);s.text(x,y+29,label,20,'white',bold=True,anchor='middle')
x,y=transformed(820,816);s.text(x,y,'250',21,INK,bold=True,anchor='middle');s.text(x,y+25,'MW',19,INK,bold=True,anchor='middle')
s.text(1070,215,'120,000 trucks +\n1.5m tractors',16,anchor='end');s.line(710,230,925,230,'#888')
s.text(335,270,'5.7 million\ncars',17);s.line(370,290,370,350,'#888');s.line(370,350,500,350,'#888')
s.text(1070,665,'30.8 million\nmotorcycles',16,anchor='end');s.line(780,640,920,640,'#888')
s.text(335,650,'744,000 buses\nand SUVs',16);s.line(440,675,620,675,'#888')
s.finish('transport','Source: Energy Series (2024), Caravan Media calculations. Vehicle counts and MW NOT UPDATED.')
record('transport','The transport electrification opportunity',33,7,'rotated transport diagram',[['Cars',1400,5700000],['Trucks and tractors',1550,1620000],['Motorcycles',1300,30800000],['Buses and SUVs',250,744000]],['Vehicle category','Additional MW','Vehicles (original)'],'NOT UPDATED: MW estimates and vehicle counts remain 2024. The diamond follows the original illustrative geometry; its areas are not a quantitative treemap. Transport fuel savings and emissions depend on charging, generation mix, adoption and efficiency.','Not updated · scenario',[0],'Original four-part transport illustration.','Energy Series (2024)')
line_chart('sales','Industrial electricity sales recovered after the decline','Full-year electricity sales, GWh. FY21–FY25 use Economic Survey 2025–26 totals.',36,8,[['FY21',58722,29954],['FY22',56202,31600],['FY23',54354,31138],['FY24',54911,27830],['FY25',57455,29181]],['Residential','Industrial'],'Electricity sales\nGWh',20000,70000,'Updated: FY21–FY25 use the full-year series in Economic Survey 2025–26, Statistical Appendix Table 14.1. This revises the earlier FY21–FY23 observations. FY23 declines are 3.3% for households and 1.5% for industry. July–March FY26 figures are reported separately in the narrative and are not annual totals.','Updated',[7],'Source: Pakistan Economic Survey 2025–26, Statistical Appendix Table 14.1.')
# Two new Article 9 charts supplement the PDF narrative using the supplied update.
solar_prices=[['Historical comparison: start',28,28],['Historical comparison: end',11,11],['2026 reported range',10,12]]
price_title='Cheaper panels changed the economics of solar'
price_caption='Panel prices in US cents per watt; the 2026 observation is a reported range.'
price_note='The original three-year comparison (28 to 11 cents/W) is NOT UPDATED; its endpoints are retained as historical observations without assigning precise dates. The shaded 10–12 cents/W interval is the reported 2026 price range, not a statistical confidence interval. Panel prices exclude the rest of an installed system.'
s=SVG(price_title,price_caption,570)
for i,(label,lo,hi) in enumerate(solar_prices):
 y=180+i*90;colour=RED if i==2 else GRAY
 s.text(30,y,label,17);s.rect(30,y+14,lo/32*920,28,colour)
 if hi>lo:
  s.rect(30+lo/32*920,y+14,(hi-lo)/32*920,28,PALE)
  for value in [lo,hi]:s.line(30+value/32*920,y+10,30+value/32*920,y+46,RED,width=2)
 s.text(44+hi/32*920,y+35,f'{lo}–{hi}' if hi>lo else str(lo),17,colour)
s.finish('solar-prices','Source: December 2024 Energy Series; Business Recorder, 9 July 2026.')
record('solar-prices',price_title,None,9,'horizontal bars with reported range',solar_prices,['Observation','Lower price (US cents/W)','Upper price (US cents/W)'],price_note,'New · historical and updated',[0,94],price_caption,'December 2024 Energy Series; Business Recorder, 9 July 2026')
solar_imports=[['Jan–May 2025',11.781],['Jan–May 2026',4.574]]
import_title='Panel imports slowed by 61% in early 2026'
import_caption='Imported module capacity, GW. The comparison covers the same five months in each year.'
import_note='January–May volumes are 11,781 MW in 2025 and 4,574 MW in 2026, converted to GW; the decrease rounds to 61%. Imports measure incoming module capacity, not installed or operating solar capacity. These partial-year observations are not annual totals.'
s=SVG(import_title,import_caption,500)
for i,(label,value) in enumerate(solar_imports):
 y=180+i*95;colour=GRAY if i==0 else RED
 s.text(30,y,label,17);s.rect(30,y+14,value/12*890,28,colour);s.text(44+value/12*890,y+35,f'{value:.3f}',17,colour)
s.finish('solar-imports','Source: Business Recorder, 9 July 2026, reporting customs import data.')
record('solar-imports',import_title,None,9,'horizontal bars',solar_imports,['Period','Module imports (GW)'],import_note,'New · updated',[94],import_caption,'Business Recorder, 9 July 2026, reporting customs import data')

# Additional briefing figures use the same HTML wrapper and chart typography.
for c in json.loads((ROOT/'data/energy-series/briefing-charts.json').read_text()):
 height=520 if c['type']!='bars' else 300+len(c['rows'])*90
 s=SVG(c['title'],c['caption'],height)
 if c['type']=='bars':
  s.text(30,168,c['unit'],16)
  for i,(label,value) in enumerate(c['rows']):
   y=210+i*90;s.text(30,y,label,17)
   if c.get('track'):s.rect(30,y+12,900,28,PALE)
   s.rect(30,y+12,value/c['maximum']*900,28,c['colours'][i])
   value_text=f"{value:.{c['decimals']}f}".rstrip('0').rstrip('.') if c['decimals'] else str(int(value))
   s.text(45+value/c['maximum']*900,y+33,value_text+c['suffix'],17,c['colours'][i])
 elif c['type']=='stacked':
  x=30
  for i,(label,value) in enumerate(c['rows']):
   width=value/100*1040;s.rect(x,185,width,45,c['colours'][i]);s.text(x+width/2,215,str(value)+'%',19,INK if i==2 else 'white',anchor='middle');x+=width
   s.rect(30,265+i*40,12,12,c['colours'][i]);s.text(54,277+i*40,label,17)
 else:
  for i,(label,value) in enumerate(c['rows']):
   y=180+i*130;s.text(30,y,c['labels'][i],16);s.text(30,y+43,c['display'][i],34,c['colours'][i],bold=True);s.text(30,y+74,label,17)
 s.finish(c['id'],'Source: '+c['source'])
 record(c['id'],c['title'],None,c['part'],c['type'],c['rows'],c['columns'],c['note'],'New · dated briefing insight',c['refs'],c['caption'],c['source'])
 manifest[-1]['insight']=c

(ROOT/'data/energy-series/chart-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Built {len(manifest)} charts and provenance manifest.')
