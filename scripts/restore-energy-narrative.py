"""Restore the PDF's narrative with individually recorded factual updates.

pdf-narrative.json is the paragraph/heading transcription of PDF pages 3–40.
narrative-edits.json contains only the passages requiring dated/factual changes.
Every original block is retained in its original order and audited below.
Run this script, then build-energy-series.py to regenerate the public pages.
"""
from pathlib import Path
import json,re,difflib
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'data/energy-series'
parts=json.loads((D/'pdf-narrative.json').read_text());edits=json.loads((D/'narrative-edits.json').read_text())
figures={'01.06':'journey','01.09':'capacity-mix','01.18':'thermal','01.28':'geography','01.30':'customers','02.02':'tariffs','02.05':'bill','02.09':'imports','02.10':'fuel-cost','03.13':'capacity','03.23':'payments','04.01':'losses','04.15':'discos','04.19':'benchmark','05.01':'debt','06.02':'markets','07.08':'transport','08.01':'sales'}
subheads={'02.08','02.11','02.13','02.15','03.04','07.02','07.09','07.10','07.12','07.14','07.20','07.22','07.24'}
# The PDF places these recommendation titles on their own line above the copy.
listtitles={'08.11':'Allow Access to Marginal Cost Power','08.12':'Introduce Long-Term Power Contracts','08.13':'Enable Direct Contracts with Power Producers','08.14':'Ensure Reliable, 24/7 Power Supply','08.15':'Create Seasonal Incentives'}
audit=[]
for part in parts:
 out=[];rows=[]
 for b in part['blocks']:
  id=b['id'];t=edits.get(id,b)['text']
  # Explicit note marker for unchanged quantitative claims from the PDF.
  numerical=re.search(r'\d',re.sub(r'^\d{1,2}\.\s*','',t))
  if b['type']!='heading' and numerical and (id not in edits or not re.search(r'\[\d+\]',t)):
   t+=' [0]'+('' if '[N]' in t else '[N]')
  out.append('{{pdf:'+id+'}}')
  if b['type']=='heading':t=('### ' if id in subheads else '## ')+t
  elif id in listtitles:
   num=re.match(r'^(\d+)\. ',t)[1];title=listtitles[id];body=t.split(title,1)[1].strip();t=f'### {num}. {title}\n\n{body}'
  elif b['type']=='list':
   t=re.sub(r'^[●○•] ','- ',t)
   t=re.sub(r'^(- |\d{1,2}\. )([^:]+:)',r'\1**\2**',t)
   t=re.sub(r'^(\d{1,2}\. )(Generation|Transmission|Distribution) –',r'\1**\2** –',t)
  out.append(t)
  if id in figures:
   f=figures[id];out.append('{{journey}}' if f=='journey' else '{{chart:'+f+'}}')
  rows.append(dict(id=id,pdf_pages=b['pages'],type=b['type'],status='updated' if id in edits else 'retained',reason=edits[id]['reason'] if id in edits else 'Original wording retained. Quantitative historical claims link to the data notes.'))
 out.append('{{update-notes}}')
 (D/f'articles/{part["part"]:02d}.md').write_text('\n\n'.join(out)+'\n')
 audit.append(dict(part=part['part'],original_blocks=len(rows),retained_blocks=sum(x['status']=='retained' for x in rows),updated_blocks=sum(x['status']=='updated' for x in rows),omitted_blocks=0,blocks=rows))
(D/'narrative-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print('Restored all',sum(x['original_blocks'] for x in audit),'PDF narrative blocks in order across nine articles.')
