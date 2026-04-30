/**
 * gb-at-a-glance.js
 * Interactive D3 visualisations for gilgit-baltistan-at-a-glance.html.
 * Requires D3 v7 (loaded via CDN in the page <head>).
 *
 * Sections:
 *   1. Shared data & palette  — GB_DATA array, GB_PALETTE, districtColor map
 *   2. Shared helpers         — abbr(), addChartFooter()
 *   3. buildExplorer()        — horizontal bar chart (districts on y-axis)
 *   4. buildDumbbellChart()   — lollipop chart sorted by growth rate
 *   5. buildTourismChart()    — stacked bar of tourist arrivals 2010–2024
 *   6. buildSpendingChart()   — dual-axis: spending (bars) + GDP % (line)
 *
 * Design tokens applied consistently across all charts:
 *   - Axis tick labels : 15px, #8a9aa3 (value axes) / #111111 (category axes)
 *   - Grid lines       : horizontal only, solid #e4e9eb
 *   - x-axis line      : stroke #111111, stroke-width 1.5px
 *   - Data labels      : 15px abbreviated (e.g. "175k", "1.4M")
 *   - Chart title      : 21px bold #111111 (CSS)
 *   - Chart subtitle   : 17px #8a9aa3 (CSS)
 *   - Footer           : source 15px + Dark Matter logo 35px tall, bottom-left
 *
 * To update data: edit the GB_DATA array below.
 * To change colours: edit GB_PALETTE (10 values, index 0 = largest district).
 */


/* =============================================================================
   0. SCROLL SCENE — stat reveals on scroll
   ============================================================================= */
(function initScrollStats() {
    const scene  = document.querySelector('.scroll-scene');
    const items  = document.querySelectorAll('.stat-reveal-item');
    const photo2 = document.querySelector('.scene-img-2');
    if (!scene || !items.length) return;

    function reveal() {
        const scrolled   = -scene.getBoundingClientRect().top;
        const scrollable = scene.offsetHeight - window.innerHeight;
        const progress   = Math.max(0, Math.min(1, scrolled / scrollable));

        var activeIndex = -1;
        items.forEach(function(item, i) {
            if (progress >= (i + 1) / (items.length + 1)) {
                activeIndex = i;
            }
        });

        items.forEach(function(item, i) {
            item.classList.toggle('visible', i === activeIndex);
        });

        if (photo2) {
            photo2.classList.toggle('active', activeIndex >= 3);
        }
    }

    window.addEventListener('scroll', reveal, { passive: true });
    reveal();
})();


/* =============================================================================
   1. SHARED DATA & PALETTE
   ============================================================================= */

const GB_PALETTE = [
    "#360516","#370617","#6a040f","#9d0108","#d00100",
    "#db2f01","#e75d05","#f48c04","#faa308","#f9b507"
];

const GB_DATA = [
    { District: "Astore",   "Area (Sq.KM)": 5411,  "Pop. 2017": 95422,  "Pop. 2023": 111573, Male: 58837,  Female: 52735,  "Sex Ratio": 112, "No. of H.H": 13713, "H.H Size": 8.14, "Population Density (per sq.km)": 21, "Multidimensional Poverty Index": 0.167, "Poverty Headcount": 35.0, "Literacy Total": 55, "Child Labour": 0.219, "Total Power Generation (MW)": 18.85, "Total Power Demand (MW)": 39.36,  "Total Tourists": 74617  },
    { District: "Diamer",   "Area (Sq.KM)": 7234,  "Pop. 2017": 269840, "Pop. 2023": 337329, Male: 174458, Female: 162865, "Sex Ratio": 107, "No. of H.H": 41536, "H.H Size": 8.12, "Population Density (per sq.km)": 47, "Multidimensional Poverty Index": 0.429, "Poverty Headcount": 74.2, "Literacy Total": 29, "Child Labour": 0.058, "Total Power Generation (MW)": 26.60, "Total Power Demand (MW)": 94.02,  "Total Tourists": 148028 },
    { District: "Ghanche",  "Area (Sq.KM)": 8531,  "Pop. 2017": 156608, "Pop. 2023": 157822, Male: 83216,  Female: 74603,  "Sex Ratio": 112, "No. of H.H": 21174, "H.H Size": 7.45, "Population Density (per sq.km)": 18, "Multidimensional Poverty Index": 0.106, "Poverty Headcount": 24.0, "Literacy Total": 43, "Child Labour": null,  "Total Power Generation (MW)": 19.54, "Total Power Demand (MW)": 77.50,  "Total Tourists": 29475  },
    { District: "Ghizer",   "Area (Sq.KM)": 12381, "Pop. 2017": 172763, "Pop. 2023": 200069, Male: 100714, Female: 99353,  "Sex Ratio": 101, "No. of H.H": 27862, "H.H Size": 7.18, "Population Density (per sq.km)": 16, "Multidimensional Poverty Index": 0.066, "Poverty Headcount": 14.3, "Literacy Total": 64, "Child Labour": 0.237, "Total Power Generation (MW)": 28.01, "Total Power Demand (MW)": 110.22, "Total Tourists": 97410  },
    { District: "Gilgit",   "Area (Sq.KM)": 4208,  "Pop. 2017": 284337, "Pop. 2023": 324552, Male: 175006, Female: 149539, "Sex Ratio": 117, "No. of H.H": 47496, "H.H Size": 6.83, "Population Density (per sq.km)": 77, "Multidimensional Poverty Index": 0.081, "Poverty Headcount": 17.1, "Literacy Total": 67, "Child Labour": 0.072, "Total Power Generation (MW)": 92.73, "Total Power Demand (MW)": 167.00, "Total Tourists": 100617 },
    { District: "Hunza",    "Area (Sq.KM)": 10109, "Pop. 2017": 51398,  "Pop. 2023": 65497,  Male: 33694,  Female: 31803,  "Sex Ratio": 106, "No. of H.H": 11186, "H.H Size": 5.86, "Population Density (per sq.km)": 6,  "Multidimensional Poverty Index": 0.008, "Poverty Headcount": 2.0,  "Literacy Total": 71, "Child Labour": 0.097, "Total Power Generation (MW)": 9.61,  "Total Power Demand (MW)": 35.61,  "Total Tourists": 175205 },
    { District: "Kharmang", "Area (Sq.KM)": 6144,  "Pop. 2017": 54620,  "Pop. 2023": 61304,  Male: 32764,  Female: 28540,  "Sex Ratio": 115, "No. of H.H": 8819,  "H.H Size": 6.95, "Population Density (per sq.km)": 10, "Multidimensional Poverty Index": 0.157, "Poverty Headcount": 34.0, "Literacy Total": 49, "Child Labour": 0.092, "Total Power Generation (MW)": 13.08, "Total Power Demand (MW)": 19.19,  "Total Tourists": 16111  },
    { District: "Nagar",    "Area (Sq.KM)": 4137,  "Pop. 2017": 71748,  "Pop. 2023": 87410,  Male: 44813,  Female: 42597,  "Sex Ratio": 105, "No. of H.H": 13162, "H.H Size": 6.64, "Population Density (per sq.km)": 21, "Multidimensional Poverty Index": 0.065, "Poverty Headcount": 15.2, "Literacy Total": 66, "Child Labour": 0.245, "Total Power Generation (MW)": 11.19, "Total Power Demand (MW)": 40.00,  "Total Tourists": 50695  },
    { District: "Shigar",   "Area (Sq.KM)": 4173,  "Pop. 2017": 74709,  "Pop. 2023": 84608,  Male: 43756,  Female: 40852,  "Sex Ratio": 107, "No. of H.H": 10368, "H.H Size": 8.16, "Population Density (per sq.km)": 20, "Multidimensional Poverty Index": 0.211, "Poverty Headcount": 44.8, "Literacy Total": 46, "Child Labour": 0.278, "Total Power Generation (MW)": 7.30,  "Total Power Demand (MW)": 29.71,  "Total Tourists": 46891  },
    { District: "Skardu",   "Area (Sq.KM)": 10168, "Pop. 2017": 261240, "Pop. 2023": 278885, Male: 144300, Female: 134585, "Sex Ratio": 107, "No. of H.H": 37699, "H.H Size": 7.40, "Population Density (per sq.km)": 27, "Multidimensional Poverty Index": 0.172, "Poverty Headcount": 36.1, "Literacy Total": 54, "Child Labour": 0.162, "Total Power Generation (MW)": 36.24, "Total Power Demand (MW)": 148.60, "Total Tourists": 144263 },
];

// Pre-compute growth rate
GB_DATA.forEach(d => {
    d.growth = ((d["Pop. 2023"] - d["Pop. 2017"]) / d["Pop. 2017"]) * 100;
});

// Stable colour per district by population rank (largest → index 0 = darkest)
const districtColor = {};
[...GB_DATA]
    .sort((a, b) => b["Pop. 2023"] - a["Pop. 2023"])
    .forEach((d, i) => { districtColor[d.District] = GB_PALETTE[i]; });


/* =============================================================================
   2. SHARED HELPERS
   ============================================================================= */

/**
 * abbr(d) — clean abbreviated number labels.
 *   abbr(175205)  → "175k"
 *   abbr(1401010) → "1.4M"
 *   abbr(1000000) → "1M"
 */
function abbr(d) {
    if (d >= 1e6) {
        const v = Math.round(d / 1e5) / 10;
        return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "M";
    }
    if (d >= 1e3) return Math.round(d / 1e3) + "k";
    return String(d);
}

/**
 * addChartFooter(svg, totalH, source)
 * Source text (15px) + Dark Matter logo (35px tall) at bottom-left of SVG,
 * left-aligned with the chart-title HTML element (SVG x = 0).
 * Requires margin.bottom ≥ 120 on the calling chart.
 */
function addChartFooter(svg, totalH, source) {
    svg.append("text")
        .attr("x", 0)
        .attr("y", totalH - 48)
        .attr("font-size", 14)
        .attr("fill", "#999999")
        .text("Source: " + source);

    svg.append("image")
        .attr("href", "images/dark_matter_dark_logo.png")
        .attr("x", 0)
        .attr("y", totalH - 30)
        .attr("height", 35);
}


/* =============================================================================
   3. GB HISTORY TIMELINE — removed, replaced by full-width photo break
   ============================================================================= */
/* (function buildTimeline() {
    const mount = document.getElementById("gb-timeline");
    if (!mount) return;

    const EVENTS = [
        { year: 1947, label: "Gilgit Rebellion",        desc: "The Gilgit Scouts mutinied against the Dogra Maharaja of Kashmir, overthrowing his governor. On November 1 — now celebrated as GB's Independence Day — the region declared independence and opted to join Pakistan. This was the founding political act of modern GB." },
        { year: 1949, label: "Karachi Agreement",        desc: "Administrative control of Gilgit & Baltistan transferred to the Pakistani government." },
        { year: 1963, label: "Sino-Pakistan Agreement",  desc: "Pakistan ceded approximately 5,180 sq km of GB territory (Shaksgam Valley) to China as part of a bilateral boundary agreement, a decision still disputed by India. This redrew the region's geopolitical boundaries." },
        { year: 1972, label: "Northern Areas Created",   desc: "GB was formally constituted as the Federally Administered Northern Areas, a distinct unit separate from Azad Kashmir, with no constitutional rights or parliamentary representation for its residents." },
        { year: 1978, label: "KKH Inaugurated",          desc: "Karakoram Highway formally opened, linking Pakistan to China through the Khunjerab Pass. The 1,300 KM long highway opened GB to trade, migration, tourism, and outside cultural influences." },
        { year: 1988, label: "Sectarian Violence",       desc: "One of the worst sectarian events in GB's history: thousands of armed Sunni tribesmen from southern Pakistan attacked Shia communities in Gilgit following inflamed rumors. Nearly 400 Shias were killed and dozens of villages were burned. This event marked a permanent rupture in inter-communal relations." },
        { year: 2009, label: "GB Empowerment Order",     desc: "A landmark administrative reform renamed the region 'Gilgit-Baltistan' and established a Chief Minister, Governor, and elected Legislative Assembly. It was the first meaningful grant of self-governance, though real power remained with Islamabad." },
        { year: 2010, label: "Attabad Lake Disaster",    desc: "Massive landslide in Hunza blocks the Hunza River, creating Attabad Lake and displacing thousands." },
        { year: 2015, label: "CPEC Corridor",            desc: "China–Pakistan Economic Corridor officially launched; GB becomes a central transit zone for the megaproject." },
        { year: 2018, label: "GB Order 2018",            desc: "New governance order expands the legislative assembly and introduces additional administrative reforms." },
        { year: 2022, label: "Climate Flooding",         desc: "The Pakistan floods of 2022 devastated GB severely. The Shishper Glacier outburst destroyed sections of the KKH. The floods were widely attributed to accelerated glacial melt driven by climate change and were part of Pakistan's broader 2022 flood disaster that inundated one-third of the country." },
    ];

    const W       = 820;
    const ROW_H   = 110;
    const AXIS_X  = 130;
    const DOT_R   = 7;
    const TOP_PAD = 0;
    const BOT_PAD = 100;   // extra room for addChartFooter
    const H       = TOP_PAD + EVENTS.length * ROW_H + BOT_PAD;
    const ACCENT  = "#d00100";
    const GOLD    = "#faa307";
    const DARK    = "#360516";
    const MID     = "#505050";

    const wrap = d3.select(mount);
    const card = wrap.append("div").attr("class", "timeline-wrap");
    card.append("div").attr("class", "chart-title").text("Gilgit-Baltistan: Key Historical Events");
    card.append("div").attr("class", "chart-subtitle").text("Most significant events in Gilgit-Baltistan since the 1940s, spanning political, social, economic, and climate/environmental dimensions");

    const svg = card.append("svg")
        .attr("width", W)
        .attr("height", H)
        .style("display", "block")
        .style("overflow", "visible");

    // Vertical spine — starts and ends exactly at first/last dot
    const firstDotY = TOP_PAD + ROW_H / 2;
    const lastDotY  = TOP_PAD + (EVENTS.length - 1) * ROW_H + ROW_H / 2;
    svg.append("line")
        .attr("x1", AXIS_X).attr("y1", firstDotY)
        .attr("x2", AXIS_X).attr("y2", lastDotY)
        .attr("stroke", "#dde3e6")
        .attr("stroke-width", 2);

    // Tooltip
    const tooltip = wrap.append("div")
        .attr("class", "bar-tooltip budget-tooltip");

    EVENTS.forEach((ev, i) => {
        const cy = TOP_PAD + i * ROW_H + ROW_H / 2;
        const dotColor = i % 3 === 0 ? ACCENT : i % 3 === 1 ? GOLD : DARK;

        // Horizontal tick from spine to dot area
        svg.append("line")
            .attr("x1", AXIS_X).attr("y1", cy)
            .attr("x2", AXIS_X + 24).attr("y2", cy)
            .attr("stroke", ACCENT)
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.7);

        // Dot
        const dot = svg.append("circle")
            .attr("cx", AXIS_X).attr("cy", cy)
            .attr("r", DOT_R)
            .attr("fill", dotColor)
            .attr("stroke", "#000000")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer");

        // Year label (left of spine)
        svg.append("text")
            .attr("x", AXIS_X - 14).attr("y", cy + 4)
            .attr("text-anchor", "end")
            .attr("font-size", 15).attr("font-weight", "700")
            .attr("fill", DARK)
            .text(ev.year);

        // Event label (right of spine)
        svg.append("text")
            .attr("x", AXIS_X + 32).attr("y", cy - 6)
            .attr("font-size", 15).attr("font-weight", "700")
            .attr("fill", DARK)
            .text(ev.label);

        // Description — wrap at 80 chars per line
        const words = ev.desc.split(" ");
        let line = "", lines = [];
        words.forEach(w => {
            const test = line ? line + " " + w : w;
            if (test.length > 80 && line) { lines.push(line); line = w; }
            else line = test;
        });
        if (line) lines.push(line);

        lines.forEach((l, li) => {
            svg.append("text")
                .attr("x", AXIS_X + 32).attr("y", cy + 13 + li * 14)
                .attr("font-size", 15).attr("fill", MID)
                .text(l);
        });
    });

    addChartFooter(svg, H, "Various historical records");
})()); */


/* =============================================================================
   4. DISTRICT EXPLORER — horizontal bar chart, districts on y-axis
   ============================================================================= */

(function buildExplorer() {
    const metrics = [
        { key: "Pop. 2023",                      label: "Population 2023",
          subtitle: "Total resident population by district, Census 2023",
          fmt: d3.format(","),              shortFmt: abbr                              },
        { key: "Population Density (per sq.km)", label: "Population Density",
          subtitle: "Residents per square kilometre of district area",
          fmt: d => d + " /km²",           shortFmt: d => d                             },
        { key: "Multidimensional Poverty Index", label: "Poverty Index (MPI)",
          subtitle: "OPHI Multidimensional Poverty Index — higher values indicate greater deprivation",
          fmt: d => d.toFixed(3),          shortFmt: d => d.toFixed(3)                  },
        { key: "Poverty Headcount",              label: "Poverty Headcount %",
          subtitle: "Share of population living below the poverty line",
          fmt: d => d.toFixed(1) + "%",    shortFmt: d => Math.round(d) + "%"           },
        { key: "Literacy Total",                 label: "Literacy Rate %",
          subtitle: "Share of population aged 10+ who can read and write",
          fmt: d => d + "%",               shortFmt: d => d + "%"                       },
        { key: "Child Labour",                   label: "Child Labour Rate %",
          subtitle: "Share of children aged 10–14 engaged in economic activity",
          fmt: d => (d * 100).toFixed(1) + "%", shortFmt: d => Math.round(d * 100) + "%" },
        { key: "Total Power Generation (MW)",    label: "Power Generation (MW)",
          subtitle: "Installed hydropower generation capacity in megawatts",
          fmt: d => d.toFixed(2) + " MW",  shortFmt: d => Math.round(d) + " MW"        },
        { key: "Total Power Demand (MW)",        label: "Power Demand (MW)",
          subtitle: "Total electricity demand in megawatts",
          fmt: d => d.toFixed(2) + " MW",  shortFmt: d => Math.round(d) + " MW"        },
        { key: "Total Tourists",                 label: "Total Tourists",
          subtitle: "Total tourist arrivals recorded by the GB Tourism Department, 2023",
          fmt: d3.format(","),             shortFmt: abbr                               },
    ];

    // Horizontal bar chart — districts on y-axis, values on x-axis
    const margin = { top: 20, right: 80, bottom: 120, left: 105 };
    const totalW = 660;
    const totalH = 505;
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;
    let activeMetric = metrics[0];

    const wrap = d3.select("#district-explorer")
        .append("div").attr("class", "explorer-wrap");

    wrap.append("div").attr("class", "chart-title").text("District Explorer");
    const subtitleEl = wrap.append("div").attr("class", "chart-subtitle")
        .text(metrics[0].subtitle);

    const selectWrap = wrap.append("div").attr("class", "metric-select-wrap");
    selectWrap.append("label").attr("class", "metric-select-label").text("Metric");
    const select = selectWrap.append("select").attr("class", "metric-select");
    metrics.forEach(m => select.append("option").attr("value", m.key).text(m.label));
    select.on("change", function () {
        activeMetric = metrics.find(m => m.key === this.value);
        subtitleEl.text(activeMetric.subtitle);
        update();
    });

    const svg = wrap.append("svg")
        .attr("width",  totalW)
        .attr("height", totalH)
        .style("display", "block");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // xScale: values (linear) — horizontal
    // yScale: districts (band) — vertical
    const xScale = d3.scaleLinear().range([0, width]);
    const yScale = d3.scaleBand().range([0, height]).padding(0.18);

    const gridG   = g.append("g");
    const xAxisG  = g.append("g").attr("transform", `translate(0,${height})`);
    const yAxisG  = g.append("g");
    const barsG   = g.append("g");
    const labelsG = g.append("g");

    const tooltip = wrap.append("div").attr("class", "bar-tooltip");
    tooltip.append("div").attr("class", "tt-district");
    tooltip.append("div").attr("class", "tt-value");

    addChartFooter(svg, totalH,
        "Pakistan Bureau of Statistics, Census 2023; GB Tourism Department; OPHI MPI 2023");

    function update() {
        const sorted = [...GB_DATA]
            .filter(d => d[activeMetric.key] != null)
            .sort((a, b) => b[activeMetric.key] - a[activeMetric.key]);

        // High value = darkest colour
        const colorScale = d3.scaleQuantize()
            .domain([d3.min(sorted, d => d[activeMetric.key]),
                     d3.max(sorted, d => d[activeMetric.key])])
            .range(["#f48c06","#e85d05","#db2f01","#d00100","#9d0208","#6a040f","#370617","#360516"]);

        xScale.domain([0, d3.max(sorted, d => d[activeMetric.key])]).nice();
        yScale.domain(sorted.map(d => d.District));

        // x axis (bottom) — value ticks, 15px
        xAxisG.transition().duration(400)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(activeMetric.shortFmt).tickSize(0))
            .call(ax => ax.select(".domain")
                .style("stroke", "#111111")
                .style("stroke-width", "1px"))
            .selectAll("text")
                .attr("dy", "1.2em")
                .style("fill", "#505050")
                .style("font-size", "15px");

        // y axis (left) — district names, 15px
        yAxisG.transition().duration(400)
            .call(d3.axisLeft(yScale).tickSize(0))
            .call(ay => ay.select(".domain").remove())
            .selectAll("text")
                .style("fill", "#111111")
                .style("font-size", "15px")
                .attr("dx", "-6px");

        // Horizontal grid lines at each district row
        // gridG.transition().duration(400)
        //     .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
        //     .call(gg => gg.select(".domain").remove())
        //     .call(gg => gg.selectAll(".tick line")
        //         .style("stroke", "#e4e9eb")
        //         .style("stroke-dasharray", "none"));

        // Horizontal bars
        barsG.selectAll("rect")
            .data(sorted, d => d.District)
            .join(
                enter => enter.append("rect")
                    .attr("y",      d => yScale(d.District))
                    .attr("x",      0)
                    .attr("height", yScale.bandwidth())
                    .attr("width",  0)
                    .attr("fill",   d => colorScale(d[activeMetric.key]))
                    .attr("rx", 2)
                    .call(e => e.transition().duration(500)
                        .attr("width", d => xScale(d[activeMetric.key]))),
                update => update
                    .call(u => u.transition().duration(400)
                        .attr("y",      d => yScale(d.District))
                        .attr("height", yScale.bandwidth())
                        .attr("width",  d => xScale(d[activeMetric.key]))
                        .attr("fill",   d => colorScale(d[activeMetric.key]))),
                exit => exit.transition().duration(300)
                    .attr("width", 0).remove()
            )
            .on("mousemove", function (event, d) {
                tooltip.style("opacity", 1)
                    .style("left", (event.clientX + 14) + "px")
                    .style("top",  (event.clientY - 36) + "px");
                tooltip.select(".tt-district").text(d.District);
                tooltip.select(".tt-value").text(activeMetric.fmt(d[activeMetric.key]));
            })
            .on("mouseleave", () => tooltip.style("opacity", 0));

        // Value labels at right end of bars, 15px
        labelsG.selectAll("text")
            .data(sorted, d => d.District)
            .join(
                enter => enter.append("text")
                    .attr("y",   d => yScale(d.District) + yScale.bandwidth() / 2)
                    .attr("dy",  "0.35em")
                    .attr("x",   0)
                    .attr("font-size", 14)
                    .attr("fill", "#505050")
                    .attr("pointer-events", "none")
                    .attr("opacity", 0)
                    .text(d => activeMetric.shortFmt(d[activeMetric.key]))
                    .call(e => e.transition().duration(500)
                        .attr("x", d => xScale(d[activeMetric.key]) + 6)
                        .attr("opacity", 1)),
                update => update
                    .text(d => activeMetric.shortFmt(d[activeMetric.key]))
                    .call(u => u.transition().duration(400)
                        .attr("y",  d => yScale(d.District) + yScale.bandwidth() / 2)
                        .attr("x",  d => xScale(d[activeMetric.key]) + 6)
                        .attr("opacity", 1)),
                exit => exit.transition().duration(300)
                    .attr("opacity", 0).remove()
            );
    }

    update();
})();


/* =============================================================================
   4. DUMBBELL CHART — population growth 2017 vs 2023
   ============================================================================= */

(function buildDumbbellChart() {
    const fmt = d3.format(",");

    const districts = [...GB_DATA]
        .map(d => ({
            district: d.District,
            pop2017:  d["Pop. 2017"],
            pop2023:  d["Pop. 2023"],
            growth:   d.growth,
        }))
        .sort((a, b) => b.growth - a.growth);

    const margin = { top: 16, right: 80, bottom: 125, left: 100 };
    const totalW = 660;
    const rowH   = 44;
    const height = districts.length * rowH;
    const totalH = height + margin.top + margin.bottom;
    const width  = totalW - margin.left - margin.right;

    const wrap = d3.select("#dumbbell-chart")
        .append("div").attr("class", "dumbbell-wrap");

    wrap.append("div").attr("class", "chart-title")
        .text("Population Growth by District (2017–2023)");
    wrap.append("div").attr("class", "chart-subtitle")
        .text("Hollow dot = 2017 census  ·  Filled dot = 2023 census  ·  Sorted by growth rate");

    const legend = wrap.append("div").attr("class", "db-legend");
    legend.append("div").html(`<span class="db-legend-dot" style="background:#e4e9eb; border: 2px solid #8a9aa3; box-sizing:border-box;"></span>2017`);
    legend.append("div").html(`<span class="db-legend-dot" style="background:#d00100;"></span>2023`);
    legend.append("div").html(`<span style="color:#8a9aa3; font-size:13px; line-height:1;">&#8212;</span>&nbsp;change`);

    const svg = wrap.append("svg")
        .attr("width",  totalW)
        .attr("height", totalH)
        .style("display", "block");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const allPops = districts.flatMap(d => [d.pop2017, d.pop2023]);
    const xScale  = d3.scaleLinear().domain([0, d3.max(allPops)]).nice().range([0, width]);
    const yScale  = d3.scaleBand().domain(districts.map(d => d.district)).range([0, height]).padding(0.3);

    // Horizontal grid lines at each district row
    g.append("g")
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
        .call(gg => gg.select(".domain").remove())
        .call(gg => gg.selectAll(".tick line")
            .style("stroke", "#e4e9eb")
            .style("stroke-dasharray", "none"));

    // y axis — district names, 15px
    g.append("g")
        .call(d3.axisLeft(yScale).tickSize(0))
        .call(ax => ax.select(".domain").remove())
        .call(ax => ax.selectAll(".tick text")
            .style("fill", "#111111")
            .style("font-size", "15px")
            .attr("dx", "-8px"));

    // x axis — bold line, abbreviated ticks, 15px
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(abbr))
        .call(ax => ax.select(".domain")
            .style("stroke", "#111111")
            .style("stroke-width", "1px"))
        .call(ax => ax.selectAll(".tick text")
            .style("fill", "#505050")
            .style("font-size", "15px"));

    g.append("text")
        .attr("x", width / 2).attr("y", height + 42)
        .attr("text-anchor", "middle")
        .attr("font-size", 15).attr("fill", "#8a9aa3")
        .text("Population");

    const tooltip = wrap.append("div").attr("class", "db-tooltip");
    tooltip.append("div").attr("class", "tt-title");
    tooltip.append("div").attr("class", "tt-row")
        .html(`<span class="tt-muted">2017</span><span class="tt-2017"></span>`);
    tooltip.append("div").attr("class", "tt-row")
        .html(`<span class="tt-muted">2023</span><span class="tt-2023"></span>`);
    tooltip.append("div").attr("class", "tt-change");

    const showTip = (event, d) => {
        tooltip.style("opacity", 1)
            .style("left", (event.clientX + 16) + "px")
            .style("top",  (event.clientY - 40) + "px");
        tooltip.select(".tt-title").text(d.district);
        tooltip.select(".tt-2017").text(fmt(d.pop2017));
        tooltip.select(".tt-2023").text(fmt(d.pop2023));
        tooltip.select(".tt-change").text("▲ +" + d.growth.toFixed(1) + "%");
    };
    const hideTip = () => tooltip.style("opacity", 0);

    districts.forEach((d, i) => {
        const cy    = yScale(d.district) + yScale.bandwidth() / 2;
        const color = GB_PALETTE[i];

        g.append("line")
            .attr("x1", xScale(d.pop2017)).attr("x2", xScale(d.pop2023))
            .attr("y1", cy).attr("y2", cy)
            .attr("stroke", color).attr("stroke-width", 2).attr("stroke-opacity", 0.55);

        g.append("circle")
            .attr("cx", xScale(d.pop2017)).attr("cy", cy).attr("r", 6)
            .attr("fill", "#fff").attr("stroke", color).attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mousemove", e => showTip(e, d)).on("mouseleave", hideTip);

        g.append("circle")
            .attr("cx", xScale(d.pop2023)).attr("cy", cy).attr("r", 7)
            .attr("fill", color).attr("stroke", color).attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mousemove", e => showTip(e, d)).on("mouseleave", hideTip);

        g.append("text")
            .attr("x", xScale(d.pop2023) + 12).attr("y", cy + 5)
            .attr("font-size", 16).attr("fill", color)
            .text("+" + d.growth.toFixed(1) + "%");
    });

    addChartFooter(svg, totalH,
        "Pakistan Bureau of Statistics, Census 2017 & 2023");
})();


/* =============================================================================
   5. TOURISM STACKED BAR — domestic vs foreign arrivals 2010–2024
   ============================================================================= */

(function buildTourismChart() {
    const tourismData = [
        { year: 2010, domestic: 45300,    foreign: 7728  },
        { year: 2011, domestic: 61233,    foreign: 5242  },
        { year: 2012, domestic: 28893,    foreign: 4324  },
        { year: 2013, domestic: 51914,    foreign: 4501  },
        { year: 2014, domestic: 50304,    foreign: 3442  },
        { year: 2015, domestic: 200651,   foreign: 4082  },
        { year: 2016, domestic: 439685,   foreign: 4773  },
        { year: 2017, domestic: 781224,   foreign: 6212  },
        { year: 2018, domestic: 1391628,  foreign: 9027  },
        { year: 2019, domestic: 1023023,  foreign: 10828 },
        { year: 2020, domestic: 633242,   foreign: 1098  },
        { year: 2021, domestic: 893129,   foreign: 3237  },
        { year: 2022, domestic: 912587,   foreign: 12140 },
        { year: 2023, domestic: 882690,   foreign: 16130 },
        { year: 2024, domestic: 989793,   foreign: 20490 },
    ];

    const keys   = ["domestic", "foreign"];
    const colors = { domestic: "#d00100", foreign: "#f48c06" };
    const labels = { domestic: "Domestic", foreign: "Foreign" };
    const stacked = d3.stack().keys(keys)(tourismData);

    // Only label alternate years: 2010, 2012, 2014 … 2024
    const altYears = tourismData.map(d => d.year).filter((y, i) => i % 2 === 0);

    const margin = { top: 16, right: 20, bottom: 120, left: 85 };
    const totalW = 660;
    const totalH = 405;
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;

    const wrap = d3.select("#tourism-chart")
        .append("div").attr("class", "tourism-chart-wrap");

    wrap.append("div").attr("class", "chart-title")
        .text("Tourist Arrivals in Gilgit-Baltistan (2010–2024)");
    wrap.append("div").attr("class", "chart-subtitle")
        .text("Domestic and foreign visitor counts by year");

    const legendDiv = wrap.append("div").attr("class", "tourism-legend");
    keys.forEach(k => {
        const item = legendDiv.append("div").attr("class", "tourism-legend-item");
        item.append("span").attr("class", "tourism-legend-dot").style("background", colors[k]);
        item.append("span").text(labels[k]);
    });

    const svg = wrap.append("svg")
        .attr("width",  totalW)
        .attr("height", totalH)
        .style("display", "block");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(tourismData.map(d => d.year))
        .range([0, width]).padding(0.25);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(tourismData, d => d.domestic + d.foreign) * 1.08])
        .nice().range([height, 0]);

    // Horizontal grid lines only
    g.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""))
        .call(gg => gg.select(".domain").remove())
        .call(gg => gg.selectAll(".tick line")
            .style("stroke", "#e4e9eb").style("stroke-dasharray", "none"));

    // x axis — alternate year labels only, 15px
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .tickSize(0)
            .tickValues(altYears)
            .tickFormat(d3.format("d")))
        .call(ax => ax.select(".domain")
            .style("stroke", "#111111").style("stroke-width", "1px"))
        .call(ax => ax.selectAll(".tick text")
            .style("fill", "#111111")
            .style("font-size", "15px")
            .attr("dy", "1.4em"));

    // y axis — abbreviated ticks, 15px
    g.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(abbr).tickSize(0))
        .call(ay => ay.select(".domain").remove())
        .call(ay => ay.selectAll(".tick text")
            .style("fill", "#8a9aa3").style("font-size", "15px"));

    const tooltip = wrap.append("div").attr("class", "bar-tooltip tourism-tooltip");

    // Stacked bar layers
    stacked.forEach(layer => {
        const key   = layer.key;
        const isTop = key === "foreign";
        g.selectAll(`.bar-${key}`)
            .data(layer)
            .join("rect")
            .attr("class", `bar-${key}`)
            .attr("x",      d => xScale(d.data.year))
            .attr("y",      d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width",  xScale.bandwidth())
            .attr("fill",   colors[key])
            .attr("rx",     isTop ? 2 : 0)
            .style("cursor", "pointer")
            .on("mousemove", function (event, d) {
                const total = d.data.domestic + d.data.foreign;
                tooltip.style("opacity", 1)
                    .style("left", (event.clientX + 16) + "px")
                    .style("top",  (event.clientY - 80) + "px")
                    .html(`
                        <div class="tt-district">${d.data.year}</div>
                        <div class="tt-multi-row"><span class="tt-multi-label">Total</span><span class="tt-multi-val">${d3.format(",")(total)}</span></div>
                        <div class="tt-multi-row"><span style="color:#f08080">Domestic</span><span class="tt-multi-val">${d3.format(",")(d.data.domestic)}</span></div>
                        <div class="tt-multi-row"><span style="color:#f48c06">Foreign</span><span class="tt-multi-val">${d3.format(",")(d.data.foreign)}</span></div>
                    `);
            })
            .on("mouseleave", () => tooltip.style("opacity", 0));
    });

    // Abbreviated total labels on top of bars, 15px
    g.selectAll(".total-label")
        .data(tourismData)
        .join("text")
        .attr("class", "total-label")
        .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.domestic + d.foreign) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .attr("fill", "#505050")
        .attr("pointer-events", "none")
        .text(d => abbr(d.domestic + d.foreign));

    // COVID-19 annotation
    const covidX = xScale(2020) + xScale.bandwidth() / 2;
    g.append("line")
        .attr("x1", covidX).attr("x2", covidX)
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", "#beb4b4").attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3");
    g.append("text")
        .attr("x", covidX + 4).attr("y", 16)
        .attr("font-size", 14).attr("fill", "#505050")
        .text("COVID-19");

    addChartFooter(svg, totalH,
        "GB Tourism Department, 2024");
})();


/* =============================================================================
   6. SPENDING DUAL-AXIS CHART — PKR spending (bars) + % of GDP (line)
   ============================================================================= */

(function buildSpendingChart() {
    const data = [
        { year: 2010, spending: 3.26,  gdpPct: 0.0361 },
        { year: 2011, spending: 4.14,  gdpPct: 0.0373 },
        { year: 2012, spending: 2.12,  gdpPct: 0.0167 },
        { year: 2013, spending: 3.68,  gdpPct: 0.0283 },
        { year: 2014, spending: 3.53,  gdpPct: 0.0234 },
        { year: 2015, spending: 14.1,  gdpPct: 0.0828 },
        { year: 2016, spending: 30.23, gdpPct: 0.1491 },
        { year: 2017, spending: 53.38, gdpPct: 0.2316 },
        { year: 2018, spending: 93.96, gdpPct: 0.3352 },
        { year: 2019, spending: 65.34, gdpPct: 0.2084 },
        { year: 2020, spending: 40.46, gdpPct: 0.1273 },
        { year: 2021, spending: 63.35, gdpPct: 0.1707 },
        { year: 2022, spending: 66.58, gdpPct: 0.1585 },
        { year: 2023, spending: 66.06, gdpPct: 0.1405 },
        { year: 2024, spending: 75.77, gdpPct: 0.1457 },
    ];

    const margin = { top: 16, right: 85, bottom: 120, left: 85 };
    const totalW = 660;
    const totalH = 405;
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;

    const wrap = d3.select("#spending-chart")
        .append("div").attr("class", "tourism-chart-wrap");

    wrap.append("div").attr("class", "chart-title")
        .text("Tourist Spending in Gilgit-Baltistan (2010–2024)");
    wrap.append("div").attr("class", "chart-subtitle")
        .text("Total annual tourist spending has increased significantly since 2015");

    const legendDiv = wrap.append("div").attr("class", "tourism-legend");

    const barItem = legendDiv.append("div").attr("class", "tourism-legend-item");
    barItem.append("span").attr("class", "tourism-legend-dot").style("background", "#d00100");
    barItem.append("span").text("Total Spending (Billion PKR)");

    const lineItem = legendDiv.append("div").attr("class", "tourism-legend-item");
    const lineSvg  = lineItem.append("svg").attr("width", 24).attr("height", 12);
    lineSvg.append("line")
        .attr("x1", 0).attr("x2", 24).attr("y1", 6).attr("y2", 6)
        .attr("stroke", "#f48c06").attr("stroke-width", 2.5);
    lineSvg.append("circle")
        .attr("cx", 12).attr("cy", 6).attr("r", 3.5)
        .attr("fill", "#f48c06").attr("stroke", "#fff").attr("stroke-width", 1.5);
    lineItem.append("span").text("Tourist Spending % of GDP");

    const svg = wrap.append("svg")
        .attr("width",  totalW)
        .attr("height", totalH)
        .style("display", "block");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Only label alternate years to avoid overlap
    const altYears = data.map(d => d.year).filter((y, i) => i % 2 === 0);

    const xScale = d3.scaleBand().domain(data.map(d => d.year)).range([0, width]).padding(0.3);
    const yLeft  = d3.scaleLinear().domain([0, d3.max(data, d => d.spending) * 1.1]).nice().range([height, 0]);
    const yRight = d3.scaleLinear().domain([0, d3.max(data, d => d.gdpPct) * 1.1]).nice().range([height, 0]);

    // Horizontal grid lines only
    g.append("g")
        .call(d3.axisLeft(yLeft).ticks(5).tickSize(-width).tickFormat(""))
        .call(gg => gg.select(".domain").remove())
        .call(gg => gg.selectAll(".tick line")
            .style("stroke", "#e4e9eb").style("stroke-dasharray", "none"));

    // x axis — bold line, alternate year labels only, 15px
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .tickSize(0)
            .tickValues(altYears)
            .tickFormat(d3.format("d")))
        .call(ax => ax.select(".domain")
            .style("stroke", "#111111").style("stroke-width", "1px"))
        .call(ax => ax.selectAll(".tick text")
            .style("fill", "#111111").style("font-size", "15px").attr("dy", "1.4em"));

    // Left y axis — spending, 15px, gray
    g.append("g")
        .call(d3.axisLeft(yLeft).ticks(5).tickFormat(d => Math.round(d) + "B").tickSize(0))
        .call(ay => ay.select(".domain").remove())
        .call(ay => ay.selectAll(".tick text")
            .style("fill", "#8a9aa3").style("font-size", "15px"));

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2).attr("y", -68)
        .attr("text-anchor", "middle")
        .attr("font-size", 15).attr("fill", "#505050")
        .text("Total Spending (Billion PKR)");

    // Right y axis — GDP %, 15px, gray
    g.append("g")
        .attr("transform", `translate(${width}, 0)`)
        .call(d3.axisRight(yRight).ticks(5).tickFormat(d => Math.round(d * 100) + "%").tickSize(0))
        .call(ay => ay.select(".domain").remove())
        .call(ay => ay.selectAll(".tick text")
            .style("fill", "#8a9aa3").style("font-size", "15px").attr("dx", "8px"));

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2).attr("y", width + 74)
        .attr("text-anchor", "middle")
        .attr("font-size", 15).attr("fill", "#505050")
        .text("Tourist Spending % of GDP");

    const tooltip = wrap.append("div").attr("class", "bar-tooltip tourism-tooltip");

    const showTip = (event, d) => {
        tooltip.style("opacity", 1)
            .style("left", (event.clientX + 16) + "px")
            .style("top",  (event.clientY - 80) + "px")
            .html(`
                <div class="tt-district">${d.year}</div>
                <div class="tt-multi-row"><span style="color:#f08080">Spending</span><span class="tt-multi-val">${d.spending.toFixed(2)}B PKR</span></div>
                <div class="tt-multi-row"><span style="color:#f48c06">% of GDP</span><span class="tt-multi-val">${(d.gdpPct * 100).toFixed(3)}%</span></div>
            `);
    };
    const hideTip = () => tooltip.style("opacity", 0);

    // Bars
    g.selectAll(".bar-spending")
        .data(data)
        .join("rect")
        .attr("class", "bar-spending")
        .attr("x",           d => xScale(d.year))
        .attr("y",           d => yLeft(d.spending))
        .attr("width",       xScale.bandwidth())
        .attr("height",      d => height - yLeft(d.spending))
        .attr("fill",        "#d00100")
        // .attr("fill-opacity", 0.85)
        .attr("rx", 2)
        .style("cursor", "pointer")
        .on("mousemove", showTip)
        .on("mouseleave", hideTip);

    // Bar labels — 12px, rounded
    g.selectAll(".bar-label")
        .data(data)
        .join("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr("y", d => yLeft(d.spending) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .attr("fill", "#505050")
        .attr("pointer-events", "none")
        .text(d => d.spending >= 10 ? Math.round(d.spending) : d.spending.toFixed(1));

    // Line — GDP %
    const lineGen = d3.line()
        .x(d => xScale(d.year) + xScale.bandwidth() / 2)
        .y(d => yRight(d.gdpPct))
        .curve(d3.curveMonotoneX);

    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#f48c06")
        .attr("stroke-width", 3)
        .attr("d", lineGen);

    // Dots on GDP line
    g.selectAll(".dot-gdp")
        .data(data)
        .join("circle")
        .attr("class", "dot-gdp")
        .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr("cy", d => yRight(d.gdpPct))
        .attr("r", 3.5)
        .attr("fill", "#f48c06")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("mousemove", showTip)
        .on("mouseleave", hideTip);

    // CPEC announced annotation (2015)
    const cpecX = xScale(2015) + xScale.bandwidth() / 2;
    g.append("line")
        .attr("x1", cpecX).attr("x2", cpecX)
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", "#c0c8cc").attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3");
    g.append("text")
        .attr("x", cpecX + 4).attr("y", 14)
        .attr("font-size", 14).attr("fill", "#505050")
        .text("CPEC announced");

    // COVID-19 annotation
    const covidX = xScale(2020) + xScale.bandwidth() / 2;
    g.append("line")
        .attr("x1", covidX).attr("x2", covidX)
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", "#c0c8cc").attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3");
    g.append("text")
        .attr("x", covidX + 4).attr("y", 14)
        .attr("font-size", 14).attr("fill", "#505050")
        .text("COVID-19");

    addChartFooter(svg, totalH,
        "GB Tourism Department; Pakistan Bureau of Statistics, 2024");
})();


/* =============================================================================
   7. BUDGET MARIMEKKO CHART — GB budget 2024–25 source breakdown
   ============================================================================= */

(function buildBudgetChart() {
    const DATA = {
        label: "Total Budget",
        value: 140.172,
        children: [
            {
                label: "Non-Development", value: 86.6,
                children: [
                    { label: "Federal Grant-in-Aid",       value: 68.000 },
                    { label: "Local Revenues",             value: 5.019  },
                    { label: "Budget Deficit",             value: 10.625 },
                    { label: "Recovery Electricity Bills", value: 1.400  },
                    { label: "GB Revenue Authority",       value: 1.303  },
                    { label: "Savings / Surrenders",       value: 0.253  },
                ]
            },
            {
                label: "Development", value: 34.5,
                children: [
                    { label: "ADP Allocation",             value: 20.000 },
                    { label: "ETI (FEC Component)",        value: 1.000  },
                    { label: "Federal PSDP",               value: 9.500  },
                    { label: "PSDP (PM Initiatives)",      value: 4.000  },
                ]
            },
            {
                label: "Wheat Subsidy", value: 19.072,
                children: [
                    { label: "Federal Subsidy (Wheat)",    value: 15.872 },
                    { label: "Sale Proceeds of Wheat",     value: 3.200  },
                ]
            },
        ]
    };

    const PALETTES = {
        "Non-Development": ["#d00100","#e85d05","#f48c06","#faa307","#ffba08","#ffd60a"],
        "Development":     ["#1b4332","#2d6a4f","#52b788","#95d5b2"],
        "Wheat Subsidy":   ["#023e8a","#0077b6"],
    };

    // Format a PKR billion value: strip trailing decimal zeros (68.000 → "68B", 9.5 → "9.5B")
    const fmtB = v => parseFloat(v.toFixed(3)) + "B";

    const TOTAL      = DATA.value;
    const margin     = { top: 20, right: 170, bottom: 130, left: 40 };
    const totalW     = 750;
    const totalH     = 450;
    const INNER_W    = totalW - margin.left - margin.right;  // 510
    const INNER_H    = totalH - margin.top - margin.bottom;  // 310
    const GAP        = 6;
    const categories = DATA.children;

    // Compute column x positions and widths (proportional to budget share)
    let xCursor = 0;
    const catLayout = categories.map(cat => {
        const colW = (cat.value / TOTAL) * (INNER_W - GAP * (categories.length - 1));
        const x = xCursor;
        xCursor += colW + GAP;
        return { ...cat, x, colW };
    });

    const wrap = d3.select("#budget-chart")
        .append("div").attr("class", "budget-wrap");

    wrap.append("div").attr("class", "chart-title")
        .text("Inflows by Source — GB Budget 2024–25");
    wrap.append("div").attr("class", "chart-subtitle")
        .text("Over 70% of the GB's annual budget is funded by the federal government in Islamabad");

    const svg = wrap.append("svg")
        .attr("width",  totalW)
        .attr("height", totalH)
        .style("display", "block")
        .style("overflow", "visible");  // allow footer logo to render below SVG bounds

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Horizontal grid lines at 0 / 25 / 50 / 75 / 100%
    [0, 25, 50, 75, 100].forEach(t => {
        g.append("line")
            .attr("x1", 0).attr("x2", INNER_W)
            .attr("y1", INNER_H * (1 - t / 100))
            .attr("y2", INNER_H * (1 - t / 100))
            .attr("stroke", "#e4e9eb").attr("stroke-width", 1);
        g.append("text")
            .attr("x", -6).attr("y", INNER_H * (1 - t / 100) + 4)
            .attr("text-anchor", "end")
            .attr("font-size", 14).attr("fill", "#8a9aa3")
            .text(t + "%");
    });

    // Tooltip
    const tooltip = wrap.append("div")
        .attr("class", "bar-tooltip budget-tooltip");

    // Draw segments
    catLayout.forEach(cat => {
        const pal      = PALETTES[cat.label];
        const catTotal = cat.children.reduce((s, c) => s + c.value, 0);
        let yCursor    = 0;

        cat.children.forEach((sub, i) => {
            const segH  = (sub.value / catTotal) * INNER_H;
            const segY  = yCursor;
            const color = pal[i % pal.length];

            g.append("rect")
                .attr("x", cat.x).attr("y", segY)
                .attr("width", cat.colW).attr("height", segH)
                .attr("fill", color)
                .attr("stroke", "#fff").attr("stroke-width", 0.5)
                .style("cursor", "pointer")
                .on("mouseenter", function(event) {
                    d3.select(this).attr("fill-opacity", 0.8);
                    tooltip.style("opacity", 1)
                        .html(`
                            <div class="tt-district">${cat.label}</div>
                            <div style="color:#fff;margin-bottom:6px">${sub.label}</div>
                            <div class="tt-multi-row"><span class="tt-multi-label">Value</span><span class="tt-multi-val">${fmtB(sub.value)} PKR</span></div>
                            <div class="tt-multi-row"><span class="tt-multi-label">% of category</span><span class="tt-multi-val">${(sub.value / catTotal * 100).toFixed(1)}%</span></div>
                            <div class="tt-multi-row"><span class="tt-multi-label">% of total</span><span class="tt-multi-val">${(sub.value / TOTAL * 100).toFixed(1)}%</span></div>
                        `)
                        .style("left", (event.clientX + 16) + "px")
                        .style("top",  (event.clientY - 60) + "px");
                })
                .on("mousemove", function(event) {
                    tooltip
                        .style("left", (event.clientX + 16) + "px")
                        .style("top",  (event.clientY - 60) + "px");
                })
                .on("mouseleave", function() {
                    d3.select(this).attr("fill-opacity", 1);
                    tooltip.style("opacity", 0);
                });

            // Inline labels — only when segment is large enough to fit text
            if (segH >= 22 && cat.colW >= 60) {
                const cy = segY + segH / 2;
                if (cat.colW > 90 && segH > 34) {
                    const maxChars = Math.floor((cat.colW - 12) / 6.2);
                    const shortName = sub.label.length > maxChars
                        ? sub.label.slice(0, maxChars - 1) + "…"
                        : sub.label;
                    g.append("text")
                        .attr("x", cat.x + 7).attr("y", cy - 6)
                        .attr("font-size", 14).attr("font-weight", "500")
                        .attr("fill", "rgba(255,255,255,0.9)")
                        .attr("dominant-baseline", "middle")
                        .attr("pointer-events", "none")
                        .text(shortName);
                    g.append("text")
                        .attr("x", cat.x + 7).attr("y", cy + 8)
                        .attr("font-size", 13).attr("fill", "rgba(255,255,255,0.65)")
                        .attr("dominant-baseline", "middle")
                        .attr("pointer-events", "none")
                        .text(fmtB(sub.value));
                } else {
                    g.append("text")
                        .attr("x", cat.x + cat.colW / 2).attr("y", cy)
                        .attr("text-anchor", "middle").attr("font-size", 13)
                        .attr("fill", "rgba(255,255,255,0.7)")
                        .attr("dominant-baseline", "middle")
                        .attr("pointer-events", "none")
                        .text(fmtB(sub.value));
                }
            }

            yCursor += segH;
        });

        // X-axis labels below each column
        const xMid = cat.x + cat.colW / 2;
        g.append("text")
            .attr("x", xMid).attr("y", INNER_H + 22)
            .attr("text-anchor", "middle").attr("font-size", 12)
            .attr("fill", "#353535").attr("letter-spacing", "0.04em")
            .text(cat.label.toUpperCase());
        g.append("text")
            .attr("x", xMid).attr("y", INNER_H + 40)
            .attr("text-anchor", "middle").attr("font-size", 13)
            .attr("fill", "#FF0000").attr("font-weight", "600")
            .text(fmtB(cat.value) + " PKR");
        g.append("text")
            .attr("x", xMid).attr("y", INNER_H + 57)
            .attr("text-anchor", "middle").attr("font-size", 12)
            .attr("fill", "#353535")
            .text("(" + (cat.value / TOTAL * 100).toFixed(0) + "% of total)");
    });

    // Total budget label — centred in right margin, 10% of SVG width (66px) further right
    // Wheat Subsidy right edge ≈ INNER_W (510); label centre at INNER_W + 121 = 631 group (671 SVG)
    const totalX = INNER_W + 100;
    g.append("text")
        .attr("x", totalX).attr("y", INNER_H + 22)
        .attr("text-anchor", "middle")
        .attr("font-size", 14).attr("font-weight", "700").attr("fill", "#d00100")
        .attr("letter-spacing", "0.06em")
        .text("TOTAL");
    g.append("text")
        .attr("x", totalX).attr("y", INNER_H + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", 14).attr("font-weight", "700").attr("fill", "#d00100")
        .text("140.17B" + " PKR");

    // Footer — source & logo positioned 15% lower than addChartFooter default
    // Default offsets from bottom: source −48, logo −30. At 85% → source −41, logo −26.
    svg.append("text")
        .attr("x", 0).attr("y", totalH - 41)
        .attr("font-size", 14).attr("fill", "#999999")
        .text("Source: GB Finance Department, Budget 2024–25");
    svg.append("image")
        .attr("href", "images/dark_matter_dark_logo.png")
        .attr("x", 0).attr("y", totalH - 26)
        .attr("height", 35);
})();


/* =============================================================================
   8. NON-DEVELOPMENT DONUT CHART — expenditure by major object classification
   ============================================================================= */

(function buildBudgetDonutChart() {
    const DATA = [
        { label: "Employees Related Expenses",               value: 47.00 },
        { label: "Grants, Subsidies, Writeoffs, Loans etc.", value: 28.32 },
        { label: "Operating Expenses",                       value: 7.76  },
        { label: "Capital & Other Operational Expenditures", value: 3.06  },
        { label: "Employees Retirement Benefits",            value: 0.45  },
    ];

    const TOTAL   = 86.60;
    const PALETTE = ["#d00100","#f48c06","#faa307","#ffba08","#ffd60a"];
    const W       = 620;
    const H       = 580;
    const CX      = W / 2;
    const CY      = H / 2 - 40;  // shifted up to reduce gap between subtitle and donut ring
    const R_OUTER = 155;
    const R_INNER = 110;
    const PAD     = 0.018;

    const wrap = d3.select("#budget-donut-chart")
        .append("div").attr("class", "budget-donut-wrap");

    wrap.append("div").attr("class", "chart-title")
        .text("Outflows — Non-Development Expenditure");
    wrap.append("div").attr("class", "chart-subtitle")
        .text("Over half of GB's non-development budget goes to paying off government employees");

    const svg = wrap.append("svg")
        .attr("width", W).attr("height", H)
        .style("display", "block")
        .style("overflow", "visible");

    const color = d3.scaleOrdinal().domain(DATA.map(d => d.label)).range(PALETTE);
    const pie   = d3.pie().value(d => d.value).sort(null).padAngle(PAD);
    const arc      = d3.arc().innerRadius(R_INNER).outerRadius(R_OUTER);
    const arcHover = d3.arc().innerRadius(R_INNER).outerRadius(R_OUTER + 10);
    const arcs = pie(DATA);

    // Tooltip — reuses project bar-tooltip classes
    const tooltip = wrap.append("div")
        .attr("class", "bar-tooltip budget-tooltip");

    const g = svg.append("g").attr("transform", `translate(${CX},${CY})`);

    // Centre labels — update on hover, reset on leave
    const centreVal = g.append("text")
        .attr("text-anchor", "middle").attr("y", -10)
        .attr("font-size", 28).attr("font-weight", "700").attr("fill", "#d00100")
        .text("86.6B");
    const centreLabel = g.append("text")
        .attr("text-anchor", "middle").attr("y", 14)
        .attr("font-size", 14).attr("fill", "#4c4c4c").attr("letter-spacing", "0.05em")
        .text("PKR TOTAL");
    const centreSub = g.append("text")
        .attr("text-anchor", "middle").attr("y", 30)
        .attr("font-size", 14).attr("fill", "#000000").attr("font-weight", "600")
        .text("NON-DEVELOPMENT");

    // Slices
    g.selectAll("path.slice")
        .data(arcs)
        .join("path")
        .attr("class", "slice")
        .attr("d", arc)
        .attr("fill", d => color(d.data.label))
        .attr("stroke", "none")
        .style("cursor", "pointer")
        .style("transition", "d 0.18s ease")
        .on("mouseenter", function(event, d) {
            d3.select(this).attr("d", arcHover);
            const pct = (d.data.value / TOTAL * 100).toFixed(1);
            centreVal.text(d.data.value.toFixed(2) + "B");
            centreLabel.text(pct + "% of total");
            centreSub.text(d.data.label.length > 20 ? d.data.label.slice(0, 19) + "…" : d.data.label);
            tooltip.style("opacity", 1)
                .html(`
                    <div class="tt-district">Non-Development</div>
                    <div style="color:#fff;margin-bottom:6px">${d.data.label}</div>
                    <div class="tt-multi-row"><span class="tt-multi-label">Value</span><span class="tt-multi-val">${d.data.value.toFixed(2)}B PKR</span></div>
                    <div class="tt-multi-row"><span class="tt-multi-label">Share</span><span class="tt-multi-val">${pct}%</span></div>
                `)
                .style("left", (event.clientX + 16) + "px")
                .style("top",  (event.clientY - 50) + "px");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.clientX + 16) + "px")
                .style("top",  (event.clientY - 50) + "px");
        })
        .on("mouseleave", function() {
            d3.select(this).attr("d", arc);
            centreVal.text("86.6B");
            centreLabel.text("PKR TOTAL");
            centreSub.text("NON-DEVELOPMENT");
            tooltip.style("opacity", 0);
        });

    // Outside labels — placed directly beside each slice, no connector lines
    // Small slices (Capital, Retirement Benefits) are skipped; all visible on hover/tooltip
    const LABEL_RADIUS = R_OUTER + 18;  // just outside the slice edge

    arcs.forEach(d => {
        if (d.data.label === "Employees Retirement Benefits") return;
        if (d.data.label === "Capital & Other Operational Expenditures") return;

        const midAngle = (d.startAngle + d.endAngle) / 2;
        const onRight  = Math.sin(midAngle) >= 0;
        const anchor   = onRight ? "start" : "end";
        const sign     = onRight ? 1 : -1;

        // Label anchor point at LABEL_RADIUS from donut centre
        const lx    = Math.sin(midAngle) * LABEL_RADIUS;
        const ly    = -Math.cos(midAngle) * LABEL_RADIUS;
        const textX = lx + sign * 6;

        // Word-wrap name into lines of max 18 chars
        const words = d.data.label.split(" ");
        let line = "", lines = [];
        words.forEach(w => {
            const test = line ? line + " " + w : w;
            if (test.length > 18 && line) { lines.push(line); line = w; }
            else line = test;
        });
        if (line) lines.push(line);

        const LINE_H    = 17;  // px between name lines (matches 15px font with breathing room)
        const VALUE_GAP = 10;  // extra gap between the name block and the value line
        const nameH     = lines.length * LINE_H;
        const baseY     = ly - nameH / 2;  // vertically centre name block around midpoint

        lines.forEach((l, i) => {
            g.append("text")
                .attr("x", textX).attr("y", baseY + i * LINE_H)
                .attr("text-anchor", anchor)
                .attr("font-size", 14).attr("fill", "#505050")
                .text(l);
        });

        g.append("text")
            .attr("x", textX).attr("y", baseY + nameH + VALUE_GAP)
            .attr("text-anchor", anchor)
            .attr("font-size", 14).attr("font-weight", "600").attr("fill", "#FF0000")
            .text(d.data.value.toFixed(1) + "B | " + (d.data.value / TOTAL * 100).toFixed(1) + "%");
    });

    addChartFooter(svg, H, "GB Finance Department, Budget 2024–25");
})();

/* =============================================================================
   9b. DEVELOPMENT EXPENDITURE DONUT — by Sector
   Style mirrors the Non-Development donut: no polylines, labels placed directly
   beside each slice at LABEL_RADIUS. Only slices > 5% are labelled.
   ============================================================================= */
(function buildBudgetDonut2Chart() {
    const mount = document.getElementById("budget-donut2-chart");
    if (!mount) return;

    const DATA = [
        { label: "Infrastructure, Transport & Urban Development", value: 7.97 },
        { label: "Energy & Power",                               value: 3.31 },
        { label: "Education",                                    value: 2.11 },
        { label: "Health",                                       value: 1.74 },
        { label: "Economic Development Sectors",                 value: 1.08 },
        { label: "Governance, Law & Administration",             value: 0.84 },
        { label: "Planning, Technology & Coordination",          value: 0.83 },
        { label: "Social Protection & Welfare",                  value: 0.29 },
        { label: "Water & Irrigation",                           value: 0.19 },
        { label: "Miscellaneous",                                value: 0.20 },
    ];
    const TOTAL   = 18.56;
    const PALETTE = ["#360516","#6a040f","#9d0208","#d00100","#db2f01","#e85d05","#f48c06","#faa307","#ffba08","#ffd60a"];

    const W       = 680;
    const H       = 580;
    const CX      = W / 2;
    const CY      = H / 2 - 40;
    const R_OUTER = 155;
    const R_INNER = 110;
    const PAD     = 0.018;

    const wrap = d3.select(mount);
    const card = wrap.append("div").attr("class", "budget-donut2-wrap");
    card.append("div").attr("class", "chart-title").text("Outflows — Development Expenditure");
    card.append("div").attr("class", "chart-subtitle")
        .text("Infrastructure & transport account for 43% of GB's total development spending");

    const svg = card.append("svg")
        .attr("width", W).attr("height", H)
        .style("display", "block")
        .style("overflow", "visible");

    const color = d3.scaleOrdinal().domain(DATA.map(d => d.label)).range(PALETTE);
    const pie   = d3.pie().value(d => d.value).sort(null).padAngle(PAD);
    const arc      = d3.arc().innerRadius(R_INNER).outerRadius(R_OUTER);
    const arcHover = d3.arc().innerRadius(R_INNER).outerRadius(R_OUTER + 10);
    const arcs = pie(DATA);

    // Tooltip — same classes as non-development donut
    const tooltip = wrap.append("div")
        .attr("class", "bar-tooltip budget-tooltip");

    const g = svg.append("g").attr("transform", `translate(${CX},${CY})`);

    // Centre labels — update on hover, reset on leave
    const centreVal = g.append("text")
        .attr("text-anchor", "middle").attr("y", -10)
        .attr("font-size", 28).attr("font-weight", "700").attr("fill", "#d00100")
        .text("18.56B");
    const centreLabel = g.append("text")
        .attr("text-anchor", "middle").attr("y", 14)
        .attr("font-size", 14).attr("fill", "#4c4c4c").attr("letter-spacing", "0.05em")
        .text("PKR TOTAL");
    const centreSub = g.append("text")
        .attr("text-anchor", "middle").attr("y", 30)
        .attr("font-size", 14).attr("fill", "#000000").attr("font-weight", "600")
        .text("DEVELOPMENT");

    // Slices
    g.selectAll("path.slice")
        .data(arcs)
        .join("path")
        .attr("class", "slice")
        .attr("d", arc)
        .attr("fill", d => color(d.data.label))
        .attr("stroke", "none")
        .style("cursor", "pointer")
        .style("transition", "d 0.18s ease")
        .on("mouseenter", function(event, d) {
            d3.select(this).attr("d", arcHover);
            const pct = (d.data.value / TOTAL * 100).toFixed(1);
            centreVal.text(d.data.value.toFixed(2) + "B");
            centreLabel.text(pct + "% of total");
            centreSub.text(d.data.label.length > 20 ? d.data.label.slice(0, 19) + "…" : d.data.label);
            tooltip.style("opacity", 1)
                .html(`
                    <div class="tt-district">Development</div>
                    <div style="color:#fff;margin-bottom:6px">${d.data.label}</div>
                    <div class="tt-multi-row"><span class="tt-multi-label">Value</span><span class="tt-multi-val">${d.data.value.toFixed(2)}B PKR</span></div>
                    <div class="tt-multi-row"><span class="tt-multi-label">Share</span><span class="tt-multi-val">${pct}%</span></div>
                `)
                .style("left", (event.clientX + 16) + "px")
                .style("top",  (event.clientY - 50) + "px");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.clientX + 16) + "px")
                .style("top",  (event.clientY - 50) + "px");
        })
        .on("mouseleave", function() {
            d3.select(this).attr("d", arc);
            centreVal.text("18.56B");
            centreLabel.text("PKR TOTAL");
            centreSub.text("DEVELOPMENT");
            tooltip.style("opacity", 0);
        });

    // Outside labels — no connector lines, placed directly beside slice
    // Only render slices with > 5% share (value > 0.928B)
    const LABEL_RADIUS = R_OUTER + 18;

    arcs.forEach(d => {
        if (d.data.value / TOTAL < 0.05) return;  // skip slices ≤ 5%

        const midAngle = (d.startAngle + d.endAngle) / 2;
        const onRight  = Math.sin(midAngle) >= 0;
        const anchor   = onRight ? "start" : "end";
        const sign     = onRight ? 1 : -1;

        const lx    = Math.sin(midAngle) * LABEL_RADIUS;
        const ly    = -Math.cos(midAngle) * LABEL_RADIUS;
        const textX = lx + sign * 6;

        // Word-wrap name into lines of max 18 chars
        const words = d.data.label.split(" ");
        let line = "", lines = [];
        words.forEach(w => {
            const test = line ? line + " " + w : w;
            if (test.length > 18 && line) { lines.push(line); line = w; }
            else line = test;
        });
        if (line) lines.push(line);

        const LINE_H    = 17;
        const VALUE_GAP = 10;
        const nameH     = lines.length * LINE_H;
        const baseY     = ly - nameH / 2;

        lines.forEach((l, i) => {
            g.append("text")
                .attr("x", textX).attr("y", baseY + i * LINE_H)
                .attr("text-anchor", anchor)
                .attr("font-size", 14).attr("fill", "#505050")
                .text(l);
        });

        g.append("text")
            .attr("x", textX).attr("y", baseY + nameH + VALUE_GAP)
            .attr("text-anchor", anchor)
            .attr("font-size", 14).attr("font-weight", "600").attr("fill", "#FF0000")
            .text(d.data.value.toFixed(1) + "B | " + (d.data.value / TOTAL * 100).toFixed(1) + "%");
    });

    addChartFooter(svg, H, "GB Finance Department, Budget 2024–25");
})();

/* =============================================================================
   9. BUDGET BUBBLE CHART — District Budget vs Per Capita Budget
   Scatter/bubble chart: x = total budget (M PKR), y = per capita budget,
   fixed-radius circles coloured by population (YlOrRd gradient).
   Colour legend top-right. Source/logo via addChartFooter.
   ============================================================================= */
(function buildBudgetBubbleChart() {
    const mount = document.getElementById("budget-bubble-chart");
    if (!mount) return;

    const data = [
        { district: "Gilgit",   budget: 2182.71, population: 324552, perCapita: 0.006725289 },
        { district: "Diamer",   budget: 1987.79, population: 337329, perCapita: 0.005892743 },
        { district: "Skardu",   budget: 1924.37, population: 278885, perCapita: 0.006900224 },
        { district: "Ghizer",   budget: 1780.51, population: 200069, perCapita: 0.008899460 },
        { district: "Ghanche",  budget: 1314.88, population: 157822, perCapita: 0.008331430 },
        { district: "Astore",   budget: 1055.00, population: 111573, perCapita: 0.009455693 },
        { district: "Nagar",    budget:  768.82, population:  87410, perCapita: 0.008795561 },
        { district: "Hunza",    budget:  717.77, population:  65497, perCapita: 0.010958838 },
        { district: "Shiger",   budget:  637.33, population:  84608, perCapita: 0.007532763 },
        { district: "Kharmang", budget:  624.96, population:  61304, perCapita: 0.010194359 },
    ];

    const FIXED_R = 12;
    const margin  = { top: 75, right: 40, bottom: 143, left: 70 };
    const totalW  = 660;
    const totalH  = 538;
    const W       = totalW - margin.left - margin.right;
    const H       = totalH - margin.top  - margin.bottom;

    // Chart wrapper card (title + subtitle go INSIDE so border-top sits above them)
    const wrap = d3.select(mount);
    const card = wrap.append("div").attr("class", "budget-bubble-wrap");
    card.append("div").attr("class", "chart-title").text("Annual Development Programme Allocation by District");
    card.append("div").attr("class", "chart-subtitle")
        .text("Per capita development budget under the ADP varies significantly across districts, reflecting the geographic challenges");

    const svg = card.append("svg")
        .attr("width",  totalW)
        .attr("height", totalH)
        .style("overflow", "visible");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
        .domain([500, d3.max(data, d => d.budget) * 1.08])
        .nice()
        .range([0, W]);

    const yScale = d3.scaleLinear()
        .domain([0.005, 0.012])   // cap at 12k PKR per capita
        .range([H, 0]);

    const popMin = d3.min(data, d => d.population);
    const popMax = d3.max(data, d => d.population);
    const colorScale = d3.scaleSequential()
        .domain([popMin, popMax])
        .interpolator(d3.interpolateYlOrRd);

    // Horizontal grid lines only
    g.append("g")
        .call(d3.axisLeft(yScale).ticks(6).tickSize(-W).tickFormat(""))
        .call(gg => gg.select(".domain").remove())
        .call(gg => gg.selectAll(".tick line").attr("stroke", "#e4e9eb"));

    // X axis
    g.append("g")
        .attr("transform", `translate(0,${H})`)
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => d + "M").tickSize(0))
        .call(ax => ax.select(".domain").attr("stroke", "#111111").attr("stroke-width", "1"))
        .call(ax => ax.selectAll(".tick text").attr("fill", "#111111").attr("font-size", 14).attr("dy", "1.4em"));

    // Y axis
    g.append("g")
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => (d * 1000).toFixed(1) + "k").tickSize(0))
        .call(ay => ay.select(".domain").remove())
        .call(ay => ay.selectAll(".tick text").attr("fill", "#8a9aa3").attr("font-size", 14));

    // Axis labels
    g.append("text")
        .attr("x", W / 2).attr("y", H + 46)
        .attr("text-anchor", "middle")
        .attr("font-size", 14).attr("fill", "#505050")
        .text("Total ADP Allocation (Million PKR)");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -H / 2).attr("y", -58)
        .attr("text-anchor", "middle")
        .attr("font-size", 14).attr("fill", "#505050")
        .text("Per Capita Allocation (Thousand PKR)");

    // Tooltip
    const tooltip = d3.select(mount).append("div")
        .attr("class", "db-tooltip")
        .style("position", "fixed")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Bubble groups
    const bubbleG = g.selectAll(".bubble")
        .data(data)
        .join("g")
        .attr("class", "bubble")
        .attr("transform", d => `translate(${xScale(d.budget)},${yScale(d.perCapita)})`);

    bubbleG.append("circle")
        .attr("r",            FIXED_R)
        .attr("fill",         d => colorScale(d.population))
        .attr("fill-opacity", 0.9)
        .attr("stroke",       "#8a9aa3")
        .attr("stroke-width", 1)
        .style("cursor", "default")
        .on("mouseenter", function(event, d) {
            d3.select(this).attr("fill-opacity", 1).attr("stroke-width", 2);
            tooltip.style("opacity", 1)
                .style("left", (event.clientX + 14) + "px")
                .style("top",  (event.clientY - 50) + "px")
                .html(`<div class="tt-title">${d.district}</div>
                       <div class="tt-row"><span class="tt-muted">Budget</span><span>${d.budget.toFixed(1)}M PKR</span></div>
                       <div class="tt-row"><span class="tt-muted">Per Capita</span><span>${(d.perCapita * 1000).toFixed(1)}k PKR</span></div>
                       <div class="tt-row"><span class="tt-muted">Population</span><span>${d3.format(",")(d.population)}</span></div>`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.clientX + 14) + "px")
                   .style("top",  (event.clientY - 50) + "px");
        })
        .on("mouseleave", function() {
            d3.select(this).attr("fill-opacity", 0.9).attr("stroke-width", 1.5);
            tooltip.style("opacity", 0);
        });

    // District labels — left for Skardu (large x), right for all others
    const labelX      = d => d.district === "Skardu" ? -(FIXED_R + 6) : (FIXED_R + 6);
    const labelAnchor = d => d.district === "Skardu" ? "end" : "start";

    // District name (top line)
    bubbleG.append("text")
        .attr("text-anchor", labelAnchor)
        .attr("x", labelX)
        .attr("y", "-0.4em")
        .attr("font-size", 14)
        .attr("fill", "#360516")
        .attr("pointer-events", "none")
        .text(d => d.district);

    // Per capita value (bottom line, slightly bold)
    bubbleG.append("text")
        .attr("text-anchor", labelAnchor)
        .attr("x", labelX)
        .attr("y", "0.85em")
        .attr("font-size", 14)
        .attr("font-weight", "650")
        .attr("fill", "#505050")
        .attr("pointer-events", "none")
        .text(d => (d.perCapita * 1000).toFixed(1) + "k");

    // Colour gradient legend (top-right)
    const legendW = 140, legendH = 10;
    const defs = svg.append("defs");
    const lgId = "bub-pop-gradient";
    const lg   = defs.append("linearGradient").attr("id", lgId).attr("x1", "0%").attr("x2", "100%");
    d3.range(0, 1.01, 0.1).forEach(t => {
        lg.append("stop")
            .attr("offset", (t * 100) + "%")
            .attr("stop-color", colorScale(popMin + t * (popMax - popMin)));
    });

    // Legend anchored to SVG (not g) so increasing margin.top only moves the plot, not the legend
    const legG = svg.append("g").attr("transform", "translate(0,10)");
    legG.append("text")
        .attr("font-size", 13).attr("fill", "#666").attr("y", -8)
        .text("Population");
    legG.append("rect")
        .attr("width", legendW).attr("height", legendH)
        .attr("rx", 3).attr("fill", `url(#${lgId})`);
    legG.append("text")
        .attr("font-size", 13).attr("fill", "#666").attr("y", legendH + 16)
        .text("60k");
    legG.append("text")
        .attr("font-size", 13).attr("fill", "#666").attr("y", legendH + 16)
        .attr("x", legendW).attr("text-anchor", "end")
        .text("350k");

    addChartFooter(svg, totalH, "GB Finance Department, Budget 2024–25");
})();
