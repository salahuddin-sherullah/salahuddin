"""Build the nine-part Energy Series, its hub, citations and coverage register.
Run after build-energy-charts.py. Only Python's standard library is required.
"""
from pathlib import Path
import re,json,html,math,hashlib
from energy_article_one import figure as article_one_figure
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'data/energy-series'
SOURCES=json.loads((DATA/'sources.json').read_text());CHARTS={x['id']:x for x in json.loads((DATA/'chart-manifest.json').read_text())}
PARTS=[('electricity-ecosystem',
  'Understanding Pakistan’s Electricity Ecosystem',
  'Understanding Pakistan’s Electricity Ecosystem',
  'How generation, transmission and distribution shape the price and reliability of the electricity that reaches '
  'consumers.',
  'energy-hero.webp',
  3,
  8),
 ('electricity-prices',
  'Why is Electricity so Expensive in Pakistan?',
  'Why is Electricity so Expensive in Pakistan?',
  'Break down the electricity bill to understand why power became so expensive, and what can bring its cost down.',
  'charts/bill.svg',
  9,
  14),
 ('capacity-payments',
  'Excess Capacity and its Financial Implications',
  'Excess Capacity and its Financial Implications',
  'How capacity payments became a financial burden, why they are difficult to change, and what can ease the '
  'pressure.',
  'charts/capacity.svg',
  15,
  19),
 ('distribution-losses',
  'The Rs. 397 Billion Burden',
  'The Rs. 397 Billion Burden',
  'The cost of transmission and distribution losses, their root causes, and the reforms that can reduce the '
  'burden.',
  'charts/discos.svg',
  20,
  24),
 ('circular-debt',
  'Circular Debt: The Endless Loop Draining the Power Sector',
  'Circular Debt: The Endless Loop Draining the Power Sector',
  'How unpaid bills cycle through the power sector, why the debt persists, and the steps needed to break the '
  'loop.',
  'charts/debt.svg',
  25,
  28),
 ('politics-and-energy',
  'Politics and Energy',
  'Politics and Energy',
  'How political decisions on fuel, gas, coal and electricity shape energy access, prices and financial '
  'stability.',
  'charts/markets.svg',
  29,
  31),
 ('residential-demand',
  'Growing Residential Demand',
  'Growing Residential Demand',
  'How electric transport, cooking, heating and water heating could put Pakistan’s spare power capacity to '
  'productive use.',
  'charts/transport.svg',
  32,
  35),
 ('industrial-demand',
  'Growing Industrial Demand',
  'Growing Industrial Demand',
  'The price of power, the shift to captive supply and solar, and five ways to restore industrial demand and '
  'competitiveness.',
  'charts/sales.svg',
  36,
  38),
 ('solar-revolution',
  'Pakistan’s Solar Revolution',
  'Pakistan’s Solar Revolution',
  'What is driving rooftop solar, who benefits, who is left behind, and how the grid can evolve alongside it.',
  'solar-cover.svg',
  39,
  40)]
for i,p in enumerate(PARTS,1):
 PARTS[i-1]=dict(zip(['slug','title','topic','dek','image','start','end'],p),number=i,path=f'energy-{i:02d}-{p[0]}.html')
PHOTOS=json.loads((DATA/'card-photos.json').read_text())
for photo in PHOTOS:
 PARTS[photo['part']-1].update(image=photo['image'],alt=photo['alt'])
PARTS[0]['alt']='An electricity substation illuminated at dusk'
HEADER=(DATA/'header.html').read_text();FOOTER=(DATA/'footer.html').read_text()
NOTES=json.loads((DATA/'narrative-notes.json').read_text())
esc=lambda s:html.escape(str(s).replace(' — ', ': ').replace('—', ', '),quote=True)
used=set()
def inline(s):
 s=s.replace('\\[','[').replace('\\]',']');s=esc(s)
 s=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',r'<a href="\2">\1</a>',s)
 s=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',s)
 s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<em>\1</em>',s)
 def cite(m):
  k=m[1];assert k in SOURCES,k;used.add(int(k));return f'<sup><a class="series-citation" href="#source-{k}" aria-label="Source {k}">[{k}]</a></sup>'
 s=s.replace('[N]', '<sup><a class="series-citation" href="#update-notes" aria-label="Data note">note</a></sup>')
 return re.sub(r'\[(\d+)\]',cite,s)
def table(rows,caption=''):
 return '<div class="series-table-scroll" tabindex="0" role="region" aria-label="'+esc(caption or 'Detailed figures')+'"><table>'+('<caption>'+esc(caption)+'</caption>' if caption else '')+'<thead><tr>'+''.join('<th scope="col">'+inline(str(x))+'</th>' for x in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(str(x) if x is not None else 'Not dispatched')+'</td>' for x in row)+'</tr>' for row in rows[1:])+'</tbody></table></div>'
def chart(id):
 c=CHARTS[id]
 if c['part'] in {1,2,3,4,5,6,7,8,9}:return article_one_figure(c,inline)
def markdown(text,part=None):
 out=[];lines=text.strip().splitlines();i=0
 while i<len(lines):
  line=lines[i].strip()
  if not line or line=='---':i+=1;continue
  if line.startswith('{{pdf:'):
   out.append('<!-- Narrative block '+line[6:-2]+' -->');i+=1;continue
  if line.startswith('{{chart:'):out.append(chart(line[8:-2]));i+=1;continue
  if line=='{{journey}}':out.append((DATA/'journey.html').read_text());i+=1;continue
  if line=='{{update-notes}}':out.append(update_notes(part));i+=1;continue
  if line.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    row=[x.strip() for x in lines[i].strip().strip('|').split('|')]
    if not all(re.fullmatch(r':?-+:?',x.replace(' ','')) for x in row):rows.append(row)
    i+=1
   out.append(table(rows));continue
  h=re.match(r'^(#{2,4}) (.*)',line)
  if h:
   level=len(h[1]);out.append(f'<h{level}>{inline(h[2])}</h{level}>');i+=1;continue
  ordered=re.match(r'^(\d{1,2})\. (.*)',line)
  if ordered:
   out.append('<ol class="series-original-list" start="'+ordered[1]+'"><li>'+inline(ordered[2])+'</li></ol>');i+=1;continue
  if re.match(r'^[-*] ',line):
   items=[]
   while i<len(lines) and re.match(r'^\s*[-*] ',lines[i]):
    items.append('<li>'+inline(re.sub(r'^\s*[-*] ','',lines[i]))+'</li>');i+=1
   out.append('<ul>'+''.join(items)+'</ul>');continue
  block=[line];i+=1
  while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||\{\{|[-*] )',lines[i].strip()):block.append(lines[i].strip());i+=1
  out.append('<p>'+inline(' '.join(block))+'</p>')
 return '\n'.join(out)
def update_notes(part):
 n=part['number']
 notes=''.join('<li>'+inline(note)+'</li>' for note in NOTES[str(n)])
 return '<section class="series-notes" id="update-notes"><h2>Data notes</h2><p>Updated figures use the latest comparable observations available in the November 2026 update and subsequent source checks, with their reporting dates stated. Figures labelled “2024 edition data, not updated” retain the earlier evidence, which may cover years before 2024. '+inline('[0][108]')+'</p><details class="series-register"><summary>Reporting dates, historical figures and qualifications</summary><div class="series-register-body"><ul>'+notes+'</ul></div></details></section>'
def source_item(k):
 source=SOURCES[str(k)]
 label=esc(source['title'])
 if source.get('url'):label='<a href="'+esc(source['url'])+'">'+label+'</a>'
 return f'<li id="source-{k}" value="{k}">{label}</li>'
def document(title,description,body,part=0):
 renderers={1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine'}
 chart_scripts='<script src="js/articles/energy-series.js" defer></script>' if part==1 else ''
 if part in renderers:chart_scripts+=f'<script src="js/articles/energy-article-{renderers[part]}.js" defer></script><script src="js/articles/energy-insights.js" defer></script>' 
 markup='<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+esc(title)+' | Salahuddin</title><meta name="description" content="'+esc(description)+'"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:type" content="article"><script src="js/jquery.min.js"></script><script src="js/skel.min.js"></script><script src="js/skel-layers.min.js"></script><script src="js/init.js"></script><noscript><link rel="stylesheet" href="css/skel.css"><link rel="stylesheet" href="css/style.css"><link rel="stylesheet" href="css/style-xlarge.css"><style>body.series-page{min-width:0}.series-page #footer .container{width:min(1200px,calc(100% - 2rem))}@media(max-width:980px){.series-page #header{position:relative;height:auto;line-height:2}.series-page #header h1,.series-page #header nav{position:static;padding:.5rem 1rem;height:auto}.series-page #header nav ul{display:flex;flex-wrap:wrap;gap:1rem}.series-page #header nav li{margin:0}.series-page #header .has-subnav ul{display:none}.series-page .series-breadcrumb{margin-top:2rem}.series-page #footer .row{margin:0}.series-page #footer .row>div{width:100%;padding:1rem 0}}</style></noscript><link rel="stylesheet" href="css/articles/energy-series.css"><link rel="stylesheet" href="css/articles/energy-collection.css">'+('<link rel="stylesheet" href="css/articles/energy-article-one.css">' if part in renderers else '')+'</head><body class="article-page energy-page series-page" id="top"><a class="energy-skip" href="#series-main">Skip to content</a>'+HEADER+body+FOOTER+chart_scripts+'</body></html>\n'
 # Content-based asset URLs prevent a new drawing script using cached old styles.
 return re.sub(r'(href|src)="((?:css|js)/articles/[^"?]+)"',
  lambda m:m[1]+'="'+m[2]+'?v='+hashlib.sha256((ROOT/m[2]).read_bytes()).hexdigest()[:12]+'"',markup)
def navigation(current=None):
 return '<details class="series-menu"><summary>Explore all nine parts</summary><ol>'+''.join('<li>'+('<span aria-current="page">'+esc(p['topic'])+'</span>' if p['number']==current else '<a href="'+p['path']+'">'+esc(p['topic'])+'</a>')+'</li>' for p in PARTS)+'</ol></details>'
coverage=[]
for part in PARTS:
 used.clear();n=part['number'];raw=(DATA/f'articles/{n:02d}.md').read_text();content=markdown(raw,part)
 # Keep an explicit original citation on each article, including the journey.
 used.add(0);used.add(108)
 sources='<section class="series-sources" id="sources"><h2>Sources</h2><p>Primary publications are linked where available; press reports and unverified source claims retain that attribution.</p><ol>'+''.join(source_item(k) for k in sorted(used))+'</ol></section>'
 pager='<nav class="series-pager" aria-label="Continue the series">'
 if n>1:p=PARTS[n-2];pager+='<a href="'+p['path']+'"><small><span class="arrow-left" aria-hidden="true"></span> Previous · Part '+str(n-1)+'</small><strong>'+esc(p['title'])+'</strong></a>'
 if n<9:p=PARTS[n];pager+='<a href="'+p['path']+'"><small>Next · Part '+str(n+1)+' <span class="ui-arrow" aria-hidden="true"></span></small><strong>'+esc(p['title'])+'</strong></a>'
 else:pager+='<a href="pakistan-electricity-puzzle.html"><small><span class="arrow-left" aria-hidden="true"></span> Back to the collection</small><strong>Pakistan’s power landscape</strong></a>'
 pager+='</nav>'
 body='<div class="series-breadcrumb"><a href="pakistan-electricity-puzzle.html"><span class="arrow-left" aria-hidden="true"></span> Pakistan’s power landscape</a><span>Part '+str(n)+' of 9</span></div><header class="series-article-header"><p class="series-label">Energy series / '+esc(part['topic'])+'</p><h1>'+esc(part['title'])+'</h1><p class="series-dek">'+esc(part['dek'])+'</p><p class="series-meta">Salahuddin · Updated <time datetime="2026-11-16">16 November 2026</time> · '+str(math.ceil(len(raw.split())/210))+' min read, plus data notes</p></header><div class="series-nav-wrap">'+navigation(n)+'</div><main id="series-main" class="series-article energy-article" data-reading-start>'+content+sources+pager+'</main>'
 (ROOT/part['path']).write_text(document(part['title'],part['dek'],body,n))
 coverage.append(dict(part=part['number'],page=part['path'],original_pdf_pages=list(range(part['start'],part['end']+1)),headings=re.findall(r'^#{2,3} (.+)',raw,re.M),charts=re.findall(r'\{\{chart:([^}]+)\}\}',raw),citations=sorted(used),word_count=len(raw.split()),detailed_update_register=False,pdf_narrative_blocks=re.findall(r'\{\{pdf:([^}]+)\}\}',raw)))
def card_title(title):
 prefix,_,last=title.rpartition(' ')
 return esc(prefix)+' <span class="series-card-tail">'+esc(last)+' <span class="ui-arrow" aria-hidden="true"></span></span>'
def card(p,lead=False):
 return '<article class="series-card'+(' series-card-lead' if lead else '')+'"><a class="series-card-link" href="'+p['path']+'"><div class="series-card-image'+''+'"><img src="images/pages/energy-series/'+p['image']+'" alt="'+esc(p['alt'])+'" width="1200" height="700" '+('' if lead else 'loading="lazy"')+'></div><div class="series-card-copy"><p class="series-label">Part '+f'{p["number"]:02d}'+' / '+esc(p['topic'])+'</p><h2>'+card_title(p['title'])+'</h2><p>'+esc(p['dek'])+'</p></div></a></article>'
body='<section class="series-hub-hero"><div><a class="series-back" href="blog.html"><span class="arrow-left" aria-hidden="true"></span> All articles</a><p class="series-label">Pakistan and Counting / Energy series</p><h1>Pakistan’s power<br>landscape</h1><p>Nine stories about the system behind the switch, and the choices that could change it.</p><span class="series-hero-meta">Salahuddin · November 2026</span></div></section><main id="series-main" class="series-hub"><div class="series-intro"><p>A country with spare power plants can still struggle to keep the lights on. A family that uses fewer units can still face a heavy bill. Follow the electricity, the money and the decisions connecting them.</p><p>These nine articles explore the choices shaping Pakistan’s power system, from the cost of generation to the rise of rooftop solar.</p></div><div class="series-section-heading"><h2>Start with the system</h2><span>01–03 / How power becomes a bill</span></div>'+card(PARTS[0],True)+'<div class="series-grid series-grid-two">'+''.join(card(p) for p in PARTS[1:3])+'</div><div class="series-section-heading"><h2>Follow the money</h2><span>04–06 / Losses, debt and political choices</span></div><div class="series-grid">'+''.join(card(p) for p in PARTS[3:6])+'</div><div class="series-section-heading"><h2>Where change begins</h2><span>07–09 / Homes, factories and rooftops</span></div><div class="series-grid">'+''.join(card(p) for p in PARTS[6:9])+'</div></main>'
(ROOT/'pakistan-electricity-puzzle.html').write_text(document('Pakistan’s power landscape: A nine-part energy series','Nine detailed articles on Pakistan’s electricity system, bills, capacity payments, losses, circular debt, politics, demand and solar. Updated November 2026.',body))
(DATA/'coverage.json').write_text(json.dumps(coverage,indent=2)+'\n')
f=ROOT/'blog.html';b=f.read_text().replace('<h3>Pakistan’s electricity puzzle</h3>','<h3>Pakistan’s power landscape</h3>').replace('<p class="blog-feed-meta">Energy</p>','<p class="blog-feed-meta">Energy · Nine-part series</p>').replace('Why more power plants have not meant cheaper electricity. Follow the power, the bill and the missing money.','Nine stories about electricity, prices, debt and solar, with updated figures, rebuilt charts and a complete source trail.');b=b.replace('solar—with updated', 'solar, with updated');f.write_text(b)
print(f'Built hub + 9 articles; {len(CHARTS)} charts; detailed registers, citations and coverage audit.')
