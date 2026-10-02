/* =============================================================================
   GB BUDGET vs PROVINCES — total budget and budget per resident, side by side
   Mounts into #budget-compare-chart in gilgit-baltistan-budget.html. Requires d3 v7.

   Two bar panels, each sorted highest to lowest by its own value: GB falls to
   the bottom of the total-budget panel and rises to the top of the per-resident
   panel. GB is the only coloured bar; the provinces are a neutral grey. Built
   like the article's other charts: a bordered card, scalable viewBox SVGs in
   the two-column development grid, and the source-and-logo footer.
   ============================================================================= */
(function buildBudgetCompare() {
    const mount = document.getElementById("budget-compare-chart");
    if (!mount || typeof d3 === "undefined") return;

    /* FY2026–27 budgets (PKR billion) and 2023 Census population */
    const DATA = [
        {region: "Punjab",             budget: 5903,    pop: 127.68e6},
        {region: "Sindh",              budget: 3562,    pop: 55.69e6},
        {region: "Khyber Pakhtunkhwa", budget: 2170,    pop: 40.85e6},
        {region: "Balochistan",        budget: 1089.26, pop: 14.89e6},
        {region: "Gilgit-Baltistan",   budget: 158.54,  pop: 1.709e6, gb: true}
    ];
    DATA.forEach(d => { d.perCap = d.budget * 1e9 / d.pop; });
    const GB = DATA.find(d => d.gb);

    const COL = {gb: "#CF0000", other: "#948D8D", ink: "#111111", label: "#505050", rule: "#e4e9eb"};
    const PANELS = [
        {key: "budget", title: "Total budget (PKR billion)", fmt: d3.format(",.0f")},
        {key: "perCap", title: "Budget per resident (Rs)",   fmt: d3.format(",.0f")}
    ];
    const fmtB = d3.format(",.2f"), fmtM = d3.format(",.2f"), fmtRs = d3.format(",.0f");

    /* card: same anatomy as the article's other charts (title and subtitle
       inside a bordered card, a two-column grid of panels, source and logo) */
    const card = d3.select(mount).append("div").attr("class", "budget-wrap gb-compare-card");
    card.append("div").attr("class", "chart-title").text("A Small Budget, Spread Over Few People");
    card.append("div").attr("class", "chart-subtitle")
        .text("Of the five, Gilgit-Baltistan has the smallest budget but the largest per resident. FY2026–27 budgets; population from the 2023 Census.");
    const grid = card.append("div").attr("class", "gb-budget-development-grid gb-compare-grid");
    const footer = card.append("div").attr("class", "gb-budget-development-footer");
    footer.append("span").text("Source: GB Finance Department, Annual Budget Statement 2026–27; provincial budgets as reported by Dawn, Samaa, Profit and Business Recorder; PBS, Census 2023");
    footer.append("span").attr("class", "gb-compare-note")
        .text("Note: GB’s budget is PKR 158.54B in the official FY2026–27 budget documents; media reports put it at PKR 218.8B. See the notes at the end of the article.");
    footer.append("img").attr("src", "images/shared/brand/dark_matter_dark_logo.png").attr("alt", "Dark Matter");

    /* the same numbers as a table, for screen readers. It sits outside the card:
       the card scrolls on overflow, and a hidden table inside it made it scroll */
    /* the hiding styles sit on a wrapper div: a <table> ignores width/overflow
       and would still widen the page */
    const table = d3.select(mount).append("div").attr("class", "gb-compare-table").append("table");
    table.append("caption").text("FY2026–27 budget and budget per resident, by province or region");
    table.append("thead").append("tr").selectAll("th")
        .data(["Province or region", "Budget (PKR billion)", "Population (2023)", "Budget per resident (Rs)"])
        .join("th").attr("scope", "col").text(d => d);
    table.append("tbody").selectAll("tr").data(DATA).join("tr")
        .html(d => `<th scope="row">${d.region}</th><td>${fmtB(d.budget)}</td><td>${fmtM(d.pop / 1e6)} million</td><td>${fmtRs(d.perCap)}</td>`);


    /* one panel = one SVG drawn 1:1 at its column's width, so the type stays at
       the article's chart size (14px) instead of scaling with the panel; rows
       sorted by that panel's value. Redrawn when the column width changes. */
    const HEAD = 34, ROW = 46, BAR = 30, LABEL_W = 150, VALUE_W = 60, FONT = 14;
    const VH = HEAD + DATA.length * ROW;
    const cells = PANELS.map(() => grid.append("div"));

    function drawPanel(cell, panel) {
        cell.selectAll("*").remove();
        const VW = Math.max(260, Math.floor(cell.node().clientWidth));
        const rows = DATA.slice().sort((a, b) => b[panel.key] - a[panel.key]);
        const x = d3.scaleLinear().domain([0, d3.max(rows, d => d[panel.key])]).range([0, VW - LABEL_W - VALUE_W]);
        const svg = cell.append("svg")
            .attr("width", VW).attr("height", VH).attr("viewBox", `0 0 ${VW} ${VH}`)
            .attr("role", "img").attr("aria-label", `${panel.title}, highest to lowest`)
            .style("display", "block").style("max-width", "100%");

        svg.append("text").attr("x", 0).attr("y", 16).attr("font-size", FONT).attr("font-weight", 600)
            .attr("fill", COL.ink).text(panel.title);

        rows.forEach((d, i) => {
            const cy = HEAD + i * ROW + ROW / 2;
            const w = Math.max(2, x(d[panel.key]));
            svg.append("text").attr("x", LABEL_W - 10).attr("y", cy + 5).attr("text-anchor", "end")
                .attr("font-size", FONT).attr("font-weight", d.gb ? 700 : 400)
                .attr("fill", d.gb ? COL.ink : COL.label).text(d.region);
            svg.append("rect").attr("x", LABEL_W).attr("y", cy - BAR / 2).attr("width", w).attr("height", BAR)
                .attr("fill", d.gb ? COL.gb : COL.other);
            svg.append("text").attr("x", LABEL_W + w + 8).attr("y", cy + 5)
                .attr("font-size", FONT)
                .attr("fill", d.gb ? COL.gb : COL.label).text(panel.fmt(d[panel.key]));
        });
    }

    let drawnW = -1, raf = 0;
    function drawAll() {
        const w = grid.node().clientWidth;
        if (w === drawnW) return;
        drawnW = w;
        PANELS.forEach((panel, i) => drawPanel(cells[i], panel));
    }
    drawAll();
    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawAll); }).observe(grid.node());
})();
