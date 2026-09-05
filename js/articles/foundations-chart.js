/* Interactive chart for the private-funding section of the development-sector article. */
(function buildFoundationsChart() {
    const mount = document.getElementById("foundations-chart");
    if (!mount || !window.d3) return;

    const data = [
        { name: "Novo Nordisk Foundation", country: "Denmark", value: 69.6 },
        { name: "Bill & Melinda Gates Foundation", country: "United States", value: 51.9 },
        { name: "Stichting INGKA Foundation", country: "Netherlands", value: 38.8 },
        { name: "Wellcome Trust", country: "United Kingdom", value: 37.0 },
        { name: "Mastercard Foundation", country: "Canada", value: 31.5 },
        { name: "Howard Hughes Medical Institute", country: "United States", value: 27.1 },
        { name: "Azim Premji Foundation", country: "India", value: 21.0 },
        { name: "Open Society Foundations", country: "United States", value: 19.6 },
        { name: "Lilly Endowment", country: "United States", value: 15.1 },
        { name: "Ford Foundation", country: "United States", value: 13.7 }
    ];
    const barColor = "#FF0000";
    const chartWidth = 660;
    const margin = { top: 8, right: 48, bottom: 62, left: 205 };
    const rowHeight = 39;
    const chartHeight = data.length * rowHeight + margin.top + margin.bottom;

    const card = d3.select(mount).append("div").attr("class", "foundations-chart-card");
    card.append("h4").attr("class", "foundations-chart-title").text("The world's wealthiest foundations");
    card.append("p").attr("class", "foundations-chart-subtitle").text("Financial endowments, 2020 · USD billions");

    const svg = card.append("svg")
        .attr("class", "foundations-chart-svg")
        .attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`)
        .attr("width", "100%")
        .attr("height", chartHeight)
        .attr("role", "img")
        .attr("aria-label", "Horizontal bar chart ranking the ten wealthiest foundations by endowment value in 2020.");

    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;
    const x = d3.scaleLinear().domain([0, 75]).range([0, width]);
    const y = d3.scaleBand().domain(data.map(d => d.name)).range([0, height]).padding(0.22);
    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    chart.append("g").attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues([0, 20, 40, 60]).tickSize(0).tickFormat(d => "$" + d + "B"))
        .call(g => g.selectAll("text").attr("dy", "1.3em"));

    chart.append("g").attr("class", "axis foundation-axis")
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("text").attr("class", "foundation-label").attr("dx", "-.55em"));

    const tooltip = d3.select("body").append("div").attr("class", "foundations-chart-tooltip").attr("role", "status");
    const bars = chart.append("g").selectAll("rect").data(data).join("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", barColor)
        .attr("tabindex", 0)
        .attr("aria-label", d => `${d.name}, ${d.country}: $${d.value.toFixed(1)} billion`);

    chart.append("g").selectAll("text").data(data).join("text")
        .attr("class", "value-label")
        .attr("x", d => x(d.value) + 8)
        .attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => "$" + d.value.toFixed(1) + "B");

    function showTooltip(event, d) {
        bars.classed("is-focused", item => item === d);
        tooltip.html(`<strong>${d.name}</strong><span>${d.country} · $${d.value.toFixed(1)} billion</span>`).classed("is-visible", true);
        moveTooltip(event);
    }
    function moveTooltip(event) {
        const xPos = Math.min(event.clientX + 14, window.innerWidth - 235);
        const yPos = Math.min(event.clientY + 14, window.innerHeight - 70);
        tooltip.style("left", xPos + "px").style("top", yPos + "px");
    }
    function hideTooltip() {
        bars.classed("is-focused", false);
        tooltip.classed("is-visible", false);
    }
    bars.on("pointerenter", showTooltip).on("pointermove", moveTooltip).on("pointerleave", hideTooltip)
        .on("focus", function(event, d) { showTooltip(event, d); })
        .on("blur", hideTooltip)
        .on("keydown", function(event) { if (event.key === "Escape") this.blur(); });

    const footer = card.append("div").attr("class", "foundations-chart-footer");
    footer.append("p").attr("class", "foundations-chart-source")
        .text("Source: Wikipedia · Exchange rates as of December 31, 2020");
    footer.append("img")
        .attr("class", "foundations-chart-logo")
        .attr("src", "images/dark_matter_dark_logo.png")
        .attr("alt", "Dark Matter");
})();
