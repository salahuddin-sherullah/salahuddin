"""Shared Article 1–9 figures, using the GB budget chart typography and responsive sizing."""
import html,json
from pathlib import Path

def figure(c,inline):
 esc=lambda value:html.escape(str(value),quote=True)
 donut=c['id'] in {'thermal','customers'}
 data={key:c[key] for key in ['id','title','rows','caption']}
 if c['part'] in {2,3,4,5,6,7,8,9}:data['columns']=c['columns']
 source=c['source'].removeprefix('Source: ')
 refs=''.join(f'[{x}]' for x in c['refs'])
 plot=f'<div class="energy-one-plot" data-energy-chart="{esc(json.dumps(data))}"><noscript><img src="{c["plot_path"]}" alt="{esc(c["subtitle"])}" width="{c["plot_width"]}" height="{c["plot_height"]}"></noscript></div>'
 if 'insight' in c:
  data=c['insight']
  plot=f'<div class="energy-one-plot" data-energy-insight="{esc(json.dumps(data))}"><noscript><img src="{c["plot_path"]}" alt="{esc(c["subtitle"])}" width="{c["plot_width"]}" height="{c["plot_height"]}"></noscript></div>'
 if c['id']=='capacity':
  # Restore the previous SVG drawing; the shared HTML footer supplies its source.
  root=Path(__file__).resolve().parents[1]
  body_path='images/pages/energy-series/charts/capacity-body.svg'
  body=(root/c['plot_path']).read_text().replace('viewBox="30 140 1040 560"','viewBox="30 140 1040 470"')
  (root/body_path).write_text(body)
  plot=f'<div class="energy-one-plot"><img src="{body_path}" alt="{esc(c["subtitle"])}" width="1040" height="470"></div>'
 return f'''<figure class="series-figure energy-one-figure{' energy-one-donut' if donut else ''}" id="fig-{c['id']}">
<figcaption><h3>{esc(c['title'])}</h3><p class="series-chart-subtitle">{esc(c['caption'])}</p></figcaption>
{plot}
<div class="energy-one-footer"><p>Source: {esc(source)}</p><p class="series-figure-note">{inline(c['note']+' '+refs)}</p><img src="images/shared/brand/dark_matter_dark_logo.png" alt="Dark Matter" width="125" height="35"></div>
</figure>'''
