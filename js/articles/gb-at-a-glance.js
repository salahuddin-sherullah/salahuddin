/**
 * gb-at-a-glance.js
 * Interactive D3 visualisations for gilgit-baltistan-at-a-glance.html.
 * Requires D3 v7 (loaded via CDN in the page <head>).
 *
 * Sections:
 *   1. Shared data & palette  — GB_DATA array, GB_PALETTE, districtColor map
 *   2. buildExplorer()        — interactive bar chart with metric switcher
 *   3. buildPopTable()        — census comparison table (2017 vs 2023)
 *   4. buildDumbbellChart()   — lollipop chart sorted by growth rate
 *
 * To update data: edit the GB_DATA array below.
 * To change colours: edit GB_PALETTE (10 values, index 0 = largest district).
 */


/* =============================================================================
   1. SHARED DATA & PALETTE
   GB_DATA is the single source of truth used by all three visualisations.
   districtColor assigns a palette colour to each district by population rank
   (largest district → index 0 = darkest colour). This mapping is computed
   once and reused so bar colours stay consistent when metrics are switched.
   ============================================================================= */

const GB_PALETTE = [
    "#03071e","#370617","#6a040f","#9d0108","#d00100",
    "#db2f01","#e75d05","#f48c04","#faa308","#f9b507"
];

const GB_DATA = [
    { District: "Astore",   "Area (Sq.KM)": 5411,  "Pop. 2017": 95422,  "Pop. 2023": 111573, Male: 58837,  Female: 52735,  "Sex Ratio": 112, "No. of H.H": 13713, "H.H Size": 8.14, "Population Density (per sq.km)": 21 },
    { District: "Diamer",   "Area (Sq.KM)": 7234,  "Pop. 2017": 269840, "Pop. 2023": 337329, Male: 174458, Female: 162865, "Sex Ratio": 107, "No. of H.H": 41536, "H.H Size": 8.12, "Population Density (per sq.km)": 47 },
    { District: "Ghanche",  "Area (Sq.KM)": 8531,  "Pop. 2017": 156608, "Pop. 2023": 157822, Male: 83216,  Female: 74603,  "Sex Ratio": 112, "No. of H.H": 21174, "H.H Size": 7.45, "Population Density (per sq.km)": 18 },
    { District: "Ghizer",   "Area (Sq.KM)": 12381, "Pop. 2017": 172763, "Pop. 2023": 200069, Male: 100714, Female: 99353,  "Sex Ratio": 101, "No. of H.H": 27862, "H.H Size": 7.18, "Population Density (per sq.km)": 16 },
    { District: "Gilgit",   "Area (Sq.KM)": 4208,  "Pop. 2017": 284337, "Pop. 2023": 324552, Male: 175006, Female: 149539, "Sex Ratio": 117, "No. of H.H": 47496, "H.H Size": 6.83, "Population Density (per sq.km)": 77 },
    { District: "Hunza",    "Area (Sq.KM)": 10109, "Pop. 2017": 51398,  "Pop. 2023": 65497,  Male: 33694,  Female: 31803,  "Sex Ratio": 106, "No. of H.H": 11186, "H.H Size": 5.86, "Population Density (per sq.km)": 6  },
    { District: "Kharmang", "Area (Sq.KM)": 6144,  "Pop. 2017": 54620,  "Pop. 2023": 61304,  Male: 32764,  Female: 28540,  "Sex Ratio": 115, "No. of H.H": 8819,  "H.H Size": 6.95, "Population Density (per sq.km)": 10 },
    { District: "Nagar",    "Area (Sq.KM)": 4137,  "Pop. 2017": 71748,  "Pop. 2023": 87410,  Male: 44813,  Female: 42597,  "Sex Ratio": 105, "No. of H.H": 13162, "H.H Size": 6.64, "Population Density (per sq.km)": 21 },
    { District: "Shigar",   "Area (Sq.KM)": 4173,  "Pop. 2017": 74709,  "Pop. 2023": 84608,  Male: 43756,  Female: 40852,  "Sex Ratio": 107, "No. of H.H": 10368, "H.H Size": 8.16, "Population Density (per sq.km)": 20 },
    { District: "Skardu",   "Area (Sq.KM)": 10168, "Pop. 2017": 261240, "Pop. 2023": 278885, Male: 144300, Female: 134585, "Sex Ratio": 107, "No. of H.H": 37699, "H.H Size": 7.40, "Population Density (per sq.km)": 27 },
];

// Pre-compute derived fields
GB_DATA.forEach(d => {
    d.growth = ((d["Pop. 2023"] - d["Pop. 2017"]) / d["Pop. 2017"]) * 100;
});

// Assign palette colour by population rank (largest → darkest), kept stable across metric switches
const districtColor = {};
[...GB_DATA]
    .sort((a, b) => b["Pop. 2023"] - a["Pop. 2023"])
    .forEach((d, i) => { districtColor[d.District] = GB_PALETTE[i]; });


/* ── District Explorer (interactive bar chart) ── */

(function buildExplorer() {
    const metrics = [
        { key: "Pop. 2023",                       label: "Population 2023",   fmt: d3.format(",") },
        { key: "growth",                          label: "Growth Rate %",     fmt: d => d.toFixed(1) + "%" },
        { key: "Population Density (per sq.km)",  label: "Density (per km²)", fmt: d => d + " /km²" },
        { key: "Sex Ratio",                       label: "Sex Ratio",         fmt: d => d + " M/100F" },
        { key: "H.H Size",                        label: "Household Size",    fmt: d => d.toFixed(2) },
    ];

    const margin = { top: 16, right: 20, bottom: 72, left: 70 };
    const totalW = 660;
    const totalH = 330;
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;
    let activeMetric = metrics[0];

    const wrap = d3.select("#district-explorer")
        .append("div").attr("class", "explorer-wrap");

    // Metric toggle buttons
    const switcher = wrap.append("div").attr("class", "metric-switcher");
    metrics.forEach(m => {
        switcher.append("button")
            .attr("class", "metric-btn" + (m === activeMetric ? " active" : ""))
            .text(m.label)
            .on("click", function () {
                wrap.selectAll(".metric-btn").classed("active", false);
                d3.select(this).classed("active", true);
                activeMetric = m;
                update();
            });
    });

    // SVG canvas
    const svg = wrap.append("svg")
        .attr("width",  totalW)
        .attr("height", totalH)
        .style("display", "block");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().range([0, width]).padding(0.25);
    const yScale = d3.scaleLinear().range([height, 0]);

    const gridG  = g.append("g");           // grid lines (behind bars)
    const xAxisG = g.append("g").attr("transform", `translate(0,${height})`);
    const yAxisG = g.append("g");
    const barsG  = g.append("g");

    // Tooltip
    const tooltip = wrap.append("div").attr("class", "bar-tooltip");
    tooltip.append("div").attr("class", "tt-district");
    tooltip.append("div").attr("class", "tt-value");

    function update() {
        const sorted = [...GB_DATA].sort((a, b) => b[activeMetric.key] - a[activeMetric.key]);
        xScale.domain(sorted.map(d => d.District));
        yScale.domain([0, d3.max(sorted, d => d[activeMetric.key])]).nice();

        // x axis — upright labels, no tilt
        xAxisG.transition().duration(400)
            .call(d3.axisBottom(xScale).tickSize(0))
            .call(ax => ax.select(".domain").style("stroke", "#e4e9eb"))
            .selectAll("text")
                .attr("transform", null)
                .attr("text-anchor", "middle")
                .attr("dy", "1.2em")
                .style("fill", "#8a9aa3")
                .style("font-size", "11px");

        // y axis
        yAxisG.transition().duration(400)
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(activeMetric.fmt).tickSize(0))
            .call(ay => ay.select(".domain").style("stroke", "none"))
            .selectAll("text")
                .style("fill", "#8a9aa3")
                .style("font-size", "11px");

        // Horizontal light-gray grid lines
        gridG.transition().duration(400)
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""))
            .call(gg => gg.select(".domain").remove())
            .call(gg => gg.selectAll(".tick line")
                .style("stroke", "#e4e9eb")
                .style("stroke-dasharray", "none"));

        // Bars
        barsG.selectAll("rect")
            .data(sorted, d => d.District)
            .join(
                enter => enter.append("rect")
                    .attr("x", d => xScale(d.District))
                    .attr("y", height)
                    .attr("width", xScale.bandwidth())
                    .attr("height", 0)
                    .attr("fill", d => districtColor[d.District])
                    .attr("rx", 2)
                    .call(e => e.transition().duration(500)
                        .attr("y", d => yScale(d[activeMetric.key]))
                        .attr("height", d => height - yScale(d[activeMetric.key]))),
                update => update
                    .attr("fill", d => districtColor[d.District])
                    .call(u => u.transition().duration(400)
                        .attr("x", d => xScale(d.District))
                        .attr("y", d => yScale(d[activeMetric.key]))
                        .attr("width", xScale.bandwidth())
                        .attr("height", d => height - yScale(d[activeMetric.key])))
            )
            .on("mousemove", function (event, d) {
                tooltip.style("opacity", 1)
                    .style("left", (event.clientX + 14) + "px")
                    .style("top",  (event.clientY - 36) + "px");
                tooltip.select(".tt-district").text(d.District);
                tooltip.select(".tt-value").text(activeMetric.fmt(d[activeMetric.key]));
            })
            .on("mouseleave", () => tooltip.style("opacity", 0));
    }

    update();
})();


/* ── Population Change Table ── */

(function buildPopTable() {
    const total2023 = d3.sum(GB_DATA, d => d["Pop. 2023"]);
    const fmt = d3.format(",");

    const districts = [...GB_DATA]
        .map(d => ({
            ...d,
            share:  (d["Pop. 2023"] / total2023) * 100,
            change:  d["Pop. 2023"] - d["Pop. 2017"],
        }))
        .sort((a, b) => b["Pop. 2023"] - a["Pop. 2023"]);

    const wrap  = d3.select("#population-table").append("div").attr("class", "table-wrap");
    const table = wrap.append("table").attr("class", "census-table");

    // Header
    table.append("thead").append("tr")
        .selectAll("th")
        .data(["District", "2017", "2023", "Change", "Growth %", "Share of GB"])
        .join("th")
        .attr("class", (d, i) => i === 0 ? "left" : "")
        .text(d => d);

    // Body rows
    const tbody = table.append("tbody");

    districts.forEach((d, i) => {
        const tr = tbody.append("tr");

        // District name with colour dot
        const cell = tr.append("td").attr("class", "left")
            .append("div").attr("class", "district-cell");
        cell.append("span").attr("class", "ct-dot").style("background", GB_PALETTE[i]);
        cell.append("span").text(d.District);

        // 2017
        tr.append("td").text(fmt(d["Pop. 2017"]));

        // 2023 — bolder
        tr.append("td").style("color", "#192024").style("font-weight", "600")
            .text(fmt(d["Pop. 2023"]));

        // Absolute change
        tr.append("td").style("color", "#d00100")
            .text("+" + fmt(d.change));

        // Growth % badge
        tr.append("td")
            .append("span")
            .attr("class", "growth-badge " + (d.growth > 20 ? "growth-high" : "growth-normal"))
            .text(d.growth.toFixed(1) + "%");

        // Share of GB — mini inline bar
        const shareWrap = tr.append("td").append("div").attr("class", "share-bar-wrap");
        shareWrap.append("div").attr("class", "share-bar-bg")
            .append("div").attr("class", "share-bar-fill")
                .style("width", d.share.toFixed(1) + "%")
                .style("background", GB_PALETTE[i]);
        shareWrap.append("span").attr("class", "share-label")
            .text(d.share.toFixed(1) + "%");
    });
})();


/* ── Dumbbell Chart ── */

(function buildDumbbellChart() {
    const fmt = d3.format(",");

    // Sort by growth rate descending
    const districts = [...GB_DATA]
        .map(d => ({
            district: d.District,
            pop2017:  d["Pop. 2017"],
            pop2023:  d["Pop. 2023"],
            growth:   d.growth,
        }))
        .sort((a, b) => b.growth - a.growth);

    const margin = { top: 20, right: 64, bottom: 44, left: 90 };
    const totalW = 660;
    const rowH   = 44;
    const height = districts.length * rowH;
    const width  = totalW - margin.left - margin.right;

    const wrap = d3.select("#dumbbell-chart")
        .append("div").attr("class", "dumbbell-wrap");

    // Legend
    const legend = wrap.append("div").attr("class", "db-legend");
    legend.append("div").html(`<span class="db-legend-dot" style="background:#e4e9eb; border: 2px solid #8a9aa3; box-sizing:border-box;"></span>2017`);
    legend.append("div").html(`<span class="db-legend-dot" style="background:#d00100;"></span>2023`);
    legend.append("div").html(`<span style="color:#8a9aa3; font-size:13px; line-height:1;">&#8212;</span>&nbsp;change`);

    const svg = wrap.append("svg")
        .attr("width",  totalW)
        .attr("height", height + margin.top + margin.bottom)
        .style("display", "block");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const allPops = districts.flatMap(d => [d.pop2017, d.pop2023]);
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(allPops)])
        .nice()
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(districts.map(d => d.district))
        .range([0, height])
        .padding(0.3);

    // Vertical grid lines
    g.append("g").attr("class", "grid")
        .call(d3.axisBottom(xScale).ticks(5).tickSize(height).tickFormat(""))
        .attr("transform", "translate(0,0)")
        .call(gg => gg.select(".domain").remove());

    // y axis — district labels
    g.append("g")
        .call(d3.axisLeft(yScale).tickSize(0))
        .call(ax => ax.select(".domain").remove())
        .call(ax => ax.selectAll(".tick text")
            .style("fill", "#192024")
            .style("font-size", "12px")
            .attr("dx", "-8px"));

    // x axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("~s")))
        .call(ax => ax.select(".domain").style("stroke", "#e4e9eb"))
        .call(ax => ax.selectAll(".tick text").style("fill", "#8a9aa3").style("font-size", "11px"));

    // x axis label
    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("fill", "#8a9aa3")
        .text("Population");

    // Tooltip
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

    // Draw one row per district
    districts.forEach((d, i) => {
        const cy    = yScale(d.district) + yScale.bandwidth() / 2;
        const color = GB_PALETTE[i];

        // Connecting line
        g.append("line")
            .attr("x1", xScale(d.pop2017))
            .attr("x2", xScale(d.pop2023))
            .attr("y1", cy).attr("y2", cy)
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.55);

        // 2017 dot — hollow
        g.append("circle")
            .attr("cx", xScale(d.pop2017))
            .attr("cy", cy)
            .attr("r", 6)
            .attr("fill", "#fff")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mousemove", e => showTip(e, d))
            .on("mouseleave", hideTip);

        // 2023 dot — filled
        g.append("circle")
            .attr("cx", xScale(d.pop2023))
            .attr("cy", cy)
            .attr("r", 7)
            .attr("fill", color)
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mousemove", e => showTip(e, d))
            .on("mouseleave", hideTip);

        // Growth % label to the right of 2023 dot
        g.append("text")
            .attr("x", xScale(d.pop2023) + 12)
            .attr("y", cy + 4)
            .attr("font-size", 11)
            .attr("fill", color)
            .text("+" + d.growth.toFixed(1) + "%");
    });
})();
