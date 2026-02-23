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

// Pre-compute derived fields
GB_DATA.forEach(d => {
    d.growth = ((d["Pop. 2023"] - d["Pop. 2017"]) / d["Pop. 2017"]) * 100;
});

// District explorer
const districtColor = {};
[...GB_DATA]
    .sort((a, b) => b["Pop. 2023"] - a["Pop. 2023"])
    .forEach((d, i) => { districtColor[d.District] = GB_PALETTE[i]; });


    (function buildExplorer() {
        const metrics = [
            { key: "Pop. 2023",                      label: "Population 2023",       fmt: d3.format(",")                  },
            { key: "Population Density (per sq.km)", label: "Population Density",    fmt: d => d + " /km²"               },
            { key: "Multidimensional Poverty Index", label: "Poverty Index (MPI)",   fmt: d => d.toFixed(3)              },
            { key: "Poverty Headcount",              label: "Poverty Headcount %",   fmt: d => d.toFixed(1) + "%"        },
            { key: "Literacy Total",                 label: "Literacy Rate %",       fmt: d => d + "%"                   },
            { key: "Child Labour",                   label: "Child Labour Rate %",   fmt: d => (d * 100).toFixed(1) + "%"},
            { key: "Total Power Generation (MW)",    label: "Power Generation (MW)", fmt: d => d.toFixed(2) + " MW"     },
            { key: "Total Power Demand (MW)",        label: "Power Demand (MW)",     fmt: d => d.toFixed(2) + " MW"     },
            { key: "Total Tourists",                 label: "Total Tourists",        fmt: d3.format(",")                 },
        ];
    
        const margin = { top: 16, right: 20, bottom: 72, left: 80 };
        const totalW = 660;
        const totalH = 330;
        const width  = totalW - margin.left - margin.right;
        const height = totalH - margin.top  - margin.bottom;
        let activeMetric = metrics[0];
    
        const wrap = d3.select("#district-explorer")
            .append("div").attr("class", "explorer-wrap");
    
        // Metric dropdown
        const selectWrap = wrap.append("div").attr("class", "metric-select-wrap");
        selectWrap.append("label").attr("class", "metric-select-label").text("Metric");
        const select = selectWrap.append("select").attr("class", "metric-select");
        metrics.forEach(m => {
            select.append("option").attr("value", m.key).text(m.label);
        });
        select.on("change", function () {
            activeMetric = metrics.find(m => m.key === this.value);
            update();
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
    
        const gridG  = g.append("g");
        const xAxisG = g.append("g").attr("transform", `translate(0,${height})`);
        const yAxisG = g.append("g");
        const barsG  = g.append("g");
        const labelsG = g.append("g");  // value labels on top of bars
    
        // Tooltip
        const tooltip = wrap.append("div").attr("class", "bar-tooltip");
        tooltip.append("div").attr("class", "tt-district");
        tooltip.append("div").attr("class", "tt-value");
    
        function update() {
            const sorted = [...GB_DATA]
                .filter(d => d[activeMetric.key] != null)
                .sort((a, b) => b[activeMetric.key] - a[activeMetric.key]);
    
            const colorScale = d3.scaleQuantize()
                .domain([
                    d3.min(sorted, d => d[activeMetric.key]),
                    d3.max(sorted, d => d[activeMetric.key])
                ])
                .range(["#f48c06","#e85d05","#db2f01","#d00100","#9d0208","#6a040f","#370617","#03071e"])
    
            xScale.domain(sorted.map(d => d.District));
            yScale.domain([0, d3.max(sorted, d => d[activeMetric.key])]).nice()
    
            // x axis
            xAxisG.transition().duration(400)
                .call(d3.axisBottom(xScale).tickSize(0))
                .call(ax => ax.select(".domain").style("stroke", "#e4e9eb"))
                .selectAll("text")
                    .attr("transform", null)
                    .attr("text-anchor", "middle")
                    .attr("dy", "1.2em")
                    .style("fill", "#03071e")
                    .style("font-size", "12px");
    
            // y axis
            yAxisG.transition().duration(400)
                .call(d3.axisLeft(yScale).ticks(5).tickFormat(activeMetric.fmt).tickSize(0))
                .call(ay => ay.select(".domain").style("stroke", "none"))
                .selectAll("text")
                    .style("fill", "#03071e")
                    .style("font-size", "12px");
    
            // Horizontal grid lines
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
                        .attr("fill", d => colorScale(d[activeMetric.key]))
                        .attr("rx", 2)
                        .call(e => e.transition().duration(500)
                            .attr("y", d => yScale(d[activeMetric.key]))
                            .attr("height", d => height - yScale(d[activeMetric.key]))),
                    update => update
                        .call(u => u.transition().duration(400)
                            .attr("x", d => xScale(d.District))
                            .attr("y", d => yScale(d[activeMetric.key]))
                            .attr("width", xScale.bandwidth())
                            .attr("height", d => height - yScale(d[activeMetric.key]))
                            .attr("fill", d => colorScale(d[activeMetric.key]))),
                    exit => exit.transition().duration(300)
                        .attr("y", height).attr("height", 0).remove()
                )
                .on("mousemove", function (event, d) {
                    tooltip.style("opacity", 1)
                        .style("left", (event.clientX + 14) + "px")
                        .style("top",  (event.clientY - 36) + "px");
                    tooltip.select(".tt-district").text(d.District);
                    tooltip.select(".tt-value").text(activeMetric.fmt(d[activeMetric.key]));
                })
                .on("mouseleave", () => tooltip.style("opacity", 0));
    
            // Value labels at top of bars
            labelsG.selectAll("text")
                .data(sorted, d => d.District)
                .join(
                    enter => enter.append("text")
                        .attr("text-anchor", "middle")
                        .attr("font-size", 11)
                        .attr("fill", "#03071e")
                        .attr("pointer-events", "none")
                        .attr("x", d => xScale(d.District) + xScale.bandwidth() / 2)
                        .attr("y", height)
                        .attr("opacity", 0)
                        .text(d => activeMetric.fmt(d[activeMetric.key]))
                        .call(e => e.transition().duration(500)
                            .attr("y", d => yScale(d[activeMetric.key]) - 4)
                            .attr("opacity", 1)),
                    update => update
                        .text(d => activeMetric.fmt(d[activeMetric.key]))
                        .call(u => u.transition().duration(400)
                            .attr("x", d => xScale(d.District) + xScale.bandwidth() / 2)
                            .attr("y", d => yScale(d[activeMetric.key]) - 4)
                            .attr("opacity", 1)),
                    exit => exit.transition().duration(300)
                        .attr("opacity", 0).remove()
                )
        }
    
        update();
    })();


/* ── Population Growth Dumbbell Chart ── */

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

    const allPops = districts.flatMap(d => [d.pop2017, d.pop2023]);
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(allPops)]).nice().range([0, width]);
    const yScale = d3.scaleBand()
        .domain(districts.map(d => d.district))
        .range([0, height]).padding(0.3);

    // Vertical grid lines
    g.append("g").attr("class", "grid")
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
        .call(gg => gg.select(".domain").remove())
        .call(gg => gg.selectAll(".tick line")
            .style("stroke", "#e4e9eb").style("stroke-dasharray", "none"));

    // y axis — district labels
    g.append("g")
        .call(d3.axisLeft(yScale).tickSize(0))
        .call(ax => ax.select(".domain").remove())
        .call(ax => ax.selectAll(".tick text")
            .style("fill", "#192024").style("font-size", "12px").attr("dx", "-8px"));

    // x axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("~s")))
        .call(ax => ax.select(".domain").style("stroke", "#e4e9eb"))
        .call(ax => ax.selectAll(".tick text").style("fill", "#8a9aa3").style("font-size", "11px"));

    g.append("text")
        .attr("x", width / 2).attr("y", height + 40)
        .attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "#8a9aa3")
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
            .attr("x", xScale(d.pop2023) + 12).attr("y", cy + 4)
            .attr("font-size", 11).attr("fill", color)
            .text("+" + d.growth.toFixed(1) + "%");
    });
})();


/* ── Tourism Stacked Bar Chart ── */

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

    const margin = { top: 28, right: 20, bottom: 50, left: 75 };
    const totalW = 660;
    const totalH = 360;
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;

    const wrap = d3.select("#tourism-chart")
        .append("div").attr("class", "tourism-chart-wrap");

    // Legend
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

    // Scales
    const xScale = d3.scaleBand()
        .domain(tourismData.map(d => d.year))
        .range([0, width])
        .padding(0.25);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(tourismData, d => d.domestic + d.foreign) * 1.08])
        .nice()
        .range([height, 0]);

    // Horizontal grid lines
    g.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""))
        .call(gg => gg.select(".domain").remove())
        .call(gg => gg.selectAll(".tick line").style("stroke", "#e4e9eb"));

    // x axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(0).tickFormat(d3.format("d")))
        .call(ax => ax.select(".domain").style("stroke", "#e4e9eb"))
        .call(ax => ax.selectAll(".tick text")
            .style("fill", "#8a9aa3")
            .style("font-size", "11px")
            .attr("dy", "1.4em"));

    // y axis
    g.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("~s")).tickSize(0))
        .call(ay => ay.select(".domain").remove())
        .call(ay => ay.selectAll(".tick text")
            .style("fill", "#8a9aa3")
            .style("font-size", "11px"));

    // Tooltip
    const tooltip = wrap.append("div").attr("class", "bar-tooltip tourism-tooltip");

    // Stacked bar layers
    stacked.forEach(layer => {
        const key   = layer.key;
        const isTop = key === "foreign"; // foreign sits on top — gets rounded corners
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

    // Total labels on top of each bar
    g.selectAll(".total-label")
        .data(tourismData)
        .join("text")
        .attr("class", "total-label")
        .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.domestic + d.foreign) - 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 9)
        .attr("fill", "#8a9aa3")
        .attr("pointer-events", "none")
        .text(d => d3.format("~s")(d.domestic + d.foreign));

    // COVID-19 annotation line
    const covidX = xScale(2020) + xScale.bandwidth() / 2;
    g.append("line")
        .attr("x1", covidX).attr("x2", covidX)
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", "#c0c8cc")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3");
    g.append("text")
        .attr("x", covidX + 4).attr("y", 12)
        .attr("font-size", 9).attr("fill", "#8a9aa3")
        .text("COVID-19");
})();


/* ── Tourist Spending & GDP Share (Dual-Axis Chart) ── */

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

    const margin = { top: 28, right: 72, bottom: 50, left: 72 };
    const totalW = 660;
    const totalH = 360;
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;

    const wrap = d3.select("#spending-chart")
        .append("div").attr("class", "tourism-chart-wrap");

    // Legend — bar swatch for spending, inline SVG for GDP line
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

    // Scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, width]).padding(0.3);

    const yLeft = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.spending) * 1.1])
        .nice().range([height, 0]);

    const yRight = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.gdpPct) * 1.1])
        .nice().range([height, 0]);

    // Horizontal grid (tied to left axis)
    g.append("g")
        .call(d3.axisLeft(yLeft).ticks(5).tickSize(-width).tickFormat(""))
        .call(gg => gg.select(".domain").remove())
        .call(gg => gg.selectAll(".tick line").style("stroke", "#e4e9eb"));

    // x axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(0).tickFormat(d3.format("d")))
        .call(ax => ax.select(".domain").style("stroke", "#e4e9eb"))
        .call(ax => ax.selectAll(".tick text")
            .style("fill", "#8a9aa3").style("font-size", "11px").attr("dy", "1.4em"));

    // Left y axis — spending
    g.append("g")
        .call(d3.axisLeft(yLeft).ticks(5).tickFormat(d => d + "B").tickSize(0))
        .call(ay => ay.select(".domain").remove())
        .call(ay => ay.selectAll(".tick text")
            .style("fill", "#d00100").style("font-size", "11px"));

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2).attr("y", -56)
        .attr("text-anchor", "middle")
        .attr("font-size", 10).attr("fill", "#d00100")
        .text("Total Spending (Billion PKR)");

    // Right y axis — GDP %
    g.append("g")
        .attr("transform", `translate(${width}, 0)`)
        .call(d3.axisRight(yRight).ticks(5).tickFormat(d => (d * 100).toFixed(2) + "%").tickSize(0))
        .call(ay => ay.select(".domain").remove())
        .call(ay => ay.selectAll(".tick text")
            .style("fill", "#f48c06").style("font-size", "11px").attr("dx", "8px"));

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2).attr("y", width + 62)
        .attr("text-anchor", "middle")
        .attr("font-size", 10).attr("fill", "#f48c06")
        .text("Tourist Spending % of GDP");

    // Tooltip
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

    // Bars — total spending
    g.selectAll(".bar-spending")
        .data(data)
        .join("rect")
        .attr("class", "bar-spending")
        .attr("x",           d => xScale(d.year))
        .attr("y",           d => yLeft(d.spending))
        .attr("width",       xScale.bandwidth())
        .attr("height",      d => height - yLeft(d.spending))
        .attr("fill",        "#d00100")
        .attr("fill-opacity", 0.85)
        .attr("rx", 2)
        .style("cursor", "pointer")
        .on("mousemove", showTip)
        .on("mouseleave", hideTip);

    // Value labels on bars
    g.selectAll(".bar-label")
        .data(data)
        .join("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr("y", d => yLeft(d.spending) - 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 8)
        .attr("fill", "#8a9aa3")
        .attr("pointer-events", "none")
        .text(d => d.spending.toFixed(1));

    // Line — GDP %
    const lineGen = d3.line()
        .x(d => xScale(d.year) + xScale.bandwidth() / 2)
        .y(d => yRight(d.gdpPct))
        .curve(d3.curveMonotoneX);

    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#f48c06")
        .attr("stroke-width", 2.5)
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

    // COVID-19 annotation
    const covidX = xScale(2020) + xScale.bandwidth() / 2;
    g.append("line")
        .attr("x1", covidX).attr("x2", covidX)
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", "#c0c8cc").attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3");
    g.append("text")
        .attr("x", covidX + 4).attr("y", 12)
        .attr("font-size", 9).attr("fill", "#8a9aa3")
        .text("COVID-19");
})();
