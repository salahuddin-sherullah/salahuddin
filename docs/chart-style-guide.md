# Chart Style Guide
**Dark Matter — GB At a Glance article charts**
*All D3 v7 charts in `js/articles/gb-at-a-glance.js`*

---

## 1. Colour Palette

### Site-wide accent colour
`#FF0000` (`#FF7F50`) is the single accent colour used across all articles for
inline heading highlights (e.g. `<strong style="color:#FF0000">`), stat card
left borders, and any other brand-coloured UI elements.
**`#00B8AE` (teal) has been fully retired** — do not use it in new files.

### Chart brand colours
| Token | Hex | Usage |
|---|---|---|
| Dark text | `#111111` | x-axis labels, chart border, axis line |
| Muted label | `#8a9aa3` | y-axis ticks, data labels, grid, COVID annotation |
| Grid line | `#e4e9eb` | Horizontal grid lines, card top/bottom border |
| Footer text | `#b0bec5` | Source attribution text |
| Accent red | `#d00100` | Primary series (bars, 2023 dot, spending) |
| Accent orange | `#f48c06` | Secondary series (foreign arrivals, GDP % line) |

### District palette (10 colours, index 0 = highest population = darkest)
```js
const GB_PALETTE = [
    "#03071e", "#370617", "#6a040f", "#9d0108", "#d00100",
    "#db2f01", "#e75d05", "#f48c04", "#faa308", "#f9b507"
];
```
Districts are ranked by `Pop. 2023` and assigned a colour at initialisation.
The same assignment is reused across all metric switches in the Explorer.

### Explorer bar colour scale
Quantize scale (8 stops, low → high value maps light orange → near-black):
```js
["#f48c06", "#e85d05", "#db2f01", "#d00100", "#9d0208", "#6a040f", "#370617", "#03071e"]
```

---

## 2. Typography

### HTML elements (rendered as divs above the SVG)
| Element | CSS class | Size | Weight | Colour |
|---|---|---|---|---|
| Chart title | `.chart-title` | 21px | 700 | `#111111` |
| Chart subtitle | `.chart-subtitle` | 17px | 400 | `#8a9aa3` |
| Legend text | `.db-legend` / `.tourism-legend` | 14px | 400 | `#8a9aa3` / `#111111` |

### SVG text elements (set via D3 `.style("font-size", ...)`)
| Element | Size | Colour |
|---|---|---|
| x-axis category labels (districts, years) | 16px | `#111111` |
| y-axis value tick labels | 16px | `#8a9aa3` |
| District name labels (y-axis, dumbbell) | 16px | `#111111` |
| Rotated axis titles (spending chart) | 16px | `#8a9aa3` |
| Data / bar value labels | 15px | `#8a9aa3` |
| Growth-rate labels (dumbbell) | 16px | district colour |
| Abbreviated total labels (tourism bars) | 14px | `#8a9aa3` |
| Bar value labels (spending) | 12px | `#8a9aa3` |
| Annotation text (COVID-19) | 14px | `#8a9aa3` |
| Source attribution (footer) | 14px | `#b0bec5` |

**Font family:** inherited from the article page (`Playfair Display` for headings and `Inter` for surrounding page text).
Do not set `font-family` on SVG elements; let it inherit.

---

## 3. Number Formatting

Use the shared `abbr(d)` helper for all bar labels and axis ticks on large numbers:

```js
function abbr(d) {
    if (d >= 1e6) {
        const v = Math.round(d / 1e5) / 10;
        return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "M";
    }
    if (d >= 1e3) return Math.round(d / 1e3) + "k";
    return String(d);
}
```

| Input | Output |
|---|---|
| 175,205 | `175k` |
| 1,401,010 | `1.4M` |
| 1,000,000 | `1M` |
| 337,329 | `337k` |
| 47 | `47` |

**Tooltips** use full precision formats (`d3.format(",")`, `.toFixed(2)`, etc.) since
space is not a constraint there.

---

## 4. Axes

### x-axis (value or year axis at chart bottom)
```
stroke:       #111111
stroke-width: 1.5px
tick size:    0 (no tick marks, labels only)
label dy:     1.2em (category) or 1.4em (year)
label color:  #111111
label size:   16px
```

### y-axis (left — value or district names)
```
domain line:  removed (.domain.remove())
tick size:    0
label color:  #8a9aa3 (values) or #111111 (district names)
label size:   16px
```

### Year-axis tick reduction
For time-series charts with 15 years of data, only label **alternate years**
to avoid label overlap:
```js
const altYears = data.map(d => d.year).filter((y, i) => i % 2 === 0);
// → [2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024]

d3.axisBottom(xScale).tickValues(altYears).tickFormat(d3.format("d"))
```

---

## 5. Grid Lines

**Horizontal only** — solid, no dash, light gray.

```js
g.append("g")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""))
    .call(gg => gg.select(".domain").remove())
    .call(gg => gg.selectAll(".tick line")
        .style("stroke", "#e4e9eb")
        .style("stroke-dasharray", "none"));
```

- For **vertical bar charts**: `axisLeft(yScale).tickSize(-width)` — lines at y-tick values.
- For **horizontal bar charts** and **dumbbell charts**: `axisLeft(yScale).tickSize(-width)` where yScale is a `scaleBand` — one horizontal line per band (row separator).
- **Never** use `axisBottom(xScale).tickSize(height)` — that produces vertical lines.

---

## 6. Chart Dimensions & Margins

All charts use a consistent bottom margin of **≥ 120px** to accommodate the
x-axis labels, source text, and logo.

| Chart | `totalW` | `totalH` | margin |
|---|---|---|---|
| District Explorer (horizontal bar) | 660 | 505 | `{top:20, right:80, bottom:120, left:105}` |
| Dumbbell (lollipop) | 660 | dynamic¹ | `{top:16, right:80, bottom:125, left:100}` |
| Tourist Arrivals (stacked bar) | 660 | 405 | `{top:16, right:20, bottom:120, left:85}` |
| Tourist Spending (dual-axis) | 660 | 405 | `{top:16, right:85, bottom:120, left:85}` |

¹ Dumbbell `totalH = (numDistricts × rowH) + margin.top + margin.bottom`
  where `rowH = 44`.

---

## 7. Chart Cards (HTML wrappers)

Each chart is wrapped in a card div rendered by D3 before the SVG:

```html
<div class="explorer-wrap">           <!-- or dumbbell-wrap / tourism-chart-wrap -->
  <div class="chart-title">...</div>
  <div class="chart-subtitle">...</div>
  <!-- optional legend / dropdown -->
  <svg>...</svg>
</div>
```

CSS for the card:
```css
background:    #ffffff
border-top:    1px solid #e4e9eb   /* open-frame style — top & bottom only */
border-bottom: 1px solid #e4e9eb
padding:       1.4em 1.6em 1.6em 0  /* zero left padding — flush with border */
overflow-x:    auto
```
**No left padding** — this keeps the chart title, subtitle, source text, and logo
flush with the left end of the top/bottom borders. The SVG's internal `margin.left`
still provides space for y-axis labels; the card itself has no additional indent.

No `border-left`, `border-right`, or `border-radius`.

---

## 8. Footer (Source + Logo)

Every chart SVG ends with a call to `addChartFooter(svg, totalH, sourceText)`.
This appends two elements **directly to the SVG** (not inside the translated `g`),
so coordinates are absolute SVG coordinates.

```js
function addChartFooter(svg, totalH, source) {
    svg.append("text")
        .attr("x", 0)
        .attr("y", totalH - 48)   // source baseline
        .attr("font-size", 14)
        .attr("fill", "#b0bec5")
        .text("Source: " + source);

    svg.append("image")
        .attr("href", "images/dark_matter_dark_logo.png")
        .attr("x", 0)
        .attr("y", totalH - 34)   // logo top; bottom at totalH - 1
        .attr("height", 35);
}
```

**Alignment:** both elements use `x = 0`, which aligns with the left edge of the
SVG — the same as the `.chart-title` HTML div (the card padding starts at x=0
of the SVG in document flow).

**Sources used:**
| Chart | Source string |
|---|---|
| Explorer | `Pakistan Bureau of Statistics, Census 2023; GB Tourism Department; OPHI MPI 2023` |
| Dumbbell | `Pakistan Bureau of Statistics, Census 2017 & 2023` |
| Tourist Arrivals | `GB Tourism Department, 2024` |
| Tourist Spending | `GB Tourism Department; Pakistan Bureau of Statistics, 2024` |

---

## 9. Bars & Shapes

| Property | Value |
|---|---|
| Bar corner radius (`rx`) | `2` |
| Bar enter animation | grow from zero height/width, 500ms |
| Bar update animation | 400ms transition |
| Bar exit animation | shrink to zero, 300ms, then remove |
| Dumbbell 2017 dot radius | 6 (hollow, white fill, district stroke) |
| Dumbbell 2023 dot radius | 7 (filled, district colour) |
| Connector line opacity | 0.55 |
| GDP line stroke-width | 2.5 |
| GDP dot radius | 3.5 (orange fill, white 1.5px stroke) |
| COVID annotation line | 1px, `#c0c8cc`, dash `4,3` |

---

## 10. Tooltips

All tooltips are `position: fixed` divs, shown on `mousemove` and hidden on
`mouseleave`. They are appended to the **chart wrap div** (not `body`), so they
scroll with the chart card.

Tooltip content always shows **full-precision** values (not abbreviated).

| CSS class | Used by |
|---|---|
| `.bar-tooltip` | Explorer (district + value) |
| `.db-tooltip` | Dumbbell (district, 2017, 2023, change) |
| `.bar-tooltip.tourism-tooltip` | Tourist Arrivals, Tourist Spending |

---

## 11. Adding a New Chart

1. Add a container `<div id="my-chart"></div>` to the HTML in the correct section.
2. Create an IIFE `(function buildMyChart() { ... })();` in `gb-at-a-glance.js`.
3. Inside the IIFE:
   - Select `#my-chart`, append a `.<type>-wrap` div.
   - Add `.chart-title` and `.chart-subtitle` divs.
   - Set `margin.bottom ≥ 120`.
   - Apply all axis, grid, and label styles from sections 4–5 above.
   - End with `addChartFooter(svg, totalH, "Source: ...")`.
4. Add any new CSS classes to section 6 of `css/articles/gb-at-a-glance.css`.
5. Do **not** set `font-family` on SVG elements.
6. Do **not** use `d3.format("~s")` for bar labels — use `abbr()` instead.
