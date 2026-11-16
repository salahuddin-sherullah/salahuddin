/* Responsive SVG histories; accessible source tables are rendered in the HTML. */
(function () {
    'use strict';
    const dataNode = document.getElementById('energy-chart-data');
    if (!dataNode) return;
    const charts = JSON.parse(dataNode.textContent);
    const colours = ['#cf0000', '#777171'];
    const NS = 'http://www.w3.org/2000/svg';
    function node(name, attrs, text) {
        const el = document.createElementNS(NS, name);
        Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value));
        if (text !== undefined) el.textContent = text;
        return el;
    }
    function draw(mount) {
        const chart = charts[mount.dataset.chart];
        const panel = chart.panels[0];
        const width = mount.clientWidth;
        if (!width) return;
        const narrow = width < 500;
        const height = narrow ? 290 : 360;
        const margin = {left: narrow ? 48 : 60, right: 18, top: 32, bottom: 38};
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        const x = i => margin.left + i / (panel.rows.length - 1) * plotWidth;
        const y = value => margin.top + plotHeight * (1 - value / panel.maximum);
        const svg = node('svg', {viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-labelledby': `${chart.id}-title ${chart.id}-desc`});
        svg.append(node('title', {id: `${chart.id}-title`}, chart.title));
        svg.append(node('desc', {id: `${chart.id}-desc`}, `${chart.subtitle} ${chart.note} Values are labelled in the chart.`));
        for (let tick = 0; tick <= 4; tick++) {
            const value = panel.maximum * tick / 4;
            svg.append(node('line', {x1: margin.left, y1: y(value), x2: width - margin.right, y2: y(value), stroke: '#e1e1e1'}));
            svg.append(node('text', {x: margin.left - 8, y: y(value) + 4, 'text-anchor': 'end', fill: '#666', 'font-size': 11}, value >= 1000 ? `${value / 1000}k` : value));
        }
        const skip = panel.rows.length > 5 ? (narrow ? 5 : 4) : 1;
        panel.rows.forEach((row, i) => {
            if (i % skip === 0 || i === panel.rows.length - 1) {
                // Keep the final two year labels from colliding.
                if (i !== panel.rows.length - 1 && x(panel.rows.length - 1) - x(i) < 60) return;
                svg.append(node('text', {x: x(i), y: height - 10, 'text-anchor': i === 0 ? 'start' : i === panel.rows.length - 1 ? 'end' : 'middle', fill: '#666', 'font-size': 12}, row[0]));
            }
        });
        panel.series.forEach((series, seriesIndex) => {
            const points = panel.rows.map((row, i) => `${x(i)},${y(row[seriesIndex + 1])}`).join(' ');
            svg.append(node('polyline', {points, fill: 'none', stroke: colours[seriesIndex], 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-dasharray': seriesIndex ? '6 4' : 'none'}));
            panel.rows.forEach((row, i) => {
                const value = row[seriesIndex + 1];
                const circle = node('circle', {cx: x(i), cy: y(value), r: panel.rows.length > 5 ? 3 : 4, fill: colours[seriesIndex]});
                circle.append(node('title', {}, `${row[0]}: ${series}: ${value.toLocaleString()}${panel.unit}`));
                svg.append(circle);
                if (panel.rows.length <= 3 || i === panel.rows.length - 1) {
                    svg.append(node('text', {x: x(i), y: y(value) - 12, 'text-anchor': i === 0 ? 'start' : i === panel.rows.length - 1 ? 'end' : 'middle', fill: colours[seriesIndex], 'font-size': narrow ? 11 : 13, 'font-weight': 600}, value.toLocaleString()));
                }
            });
        });
        const legend = document.createElement('div');
        legend.className = 'energy-legend';
        panel.series.forEach((series, i) => {
            const entry = document.createElement('span');
            const swatch = document.createElement('i');
            swatch.style.background = colours[i];
            entry.append(swatch, document.createTextNode(series + (i ? ' · dashed' : '')));
            legend.append(entry);
        });
        mount.replaceChildren(legend, svg);
    }
    const mounts = Array.from(document.querySelectorAll('.energy-line'));
    mounts.forEach(draw);
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(entries => entries.forEach(entry => draw(entry.target)));
        mounts.forEach(mount => observer.observe(mount));
    } else {
        window.addEventListener('resize', () => mounts.forEach(draw));
    }
    const units = document.getElementById('energy-units');
    const amount = document.getElementById('energy-unit-cost');
    function updateCost() {
        document.getElementById('energy-units-value').value = units.value;
        amount.value = `Rs ${(100 / Number(units.value)).toFixed(2)}`;
        units.setAttribute('aria-valuetext', `${units.value} units sold, ${amount.value} fixed cost per unit`);
    }
    units.addEventListener('input', updateCost);
    updateCost();
})();

/* Four selectable stages share one wire and one travelling electricity dot. */
(function () {
    'use strict';
    const journey = document.getElementById('power-journey');
    if (!journey) return;
    const stops = Array.from(journey.querySelectorAll('[data-journey-stop]'));
    const stories = Array.from(journey.querySelectorAll('.energy-journey-story'));
    const network = journey.querySelector('.energy-journey-stops');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const NS = 'http://www.w3.org/2000/svg';
    function svgNode(name, attributes) {
        const node = document.createElementNS(NS, name);
        Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
        return node;
    }
    // Essential geometry and SVG paint travel with the new script, so a stale
    // stylesheet cannot turn the open wire into a black filled shape.
    network.style.position = 'relative';
    const overlay = svgNode('svg', {class:'journey-flow', 'aria-hidden':'true', focusable:'false'});
    overlay.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none';
    const track = svgNode('path', {class:'journey-flow-track', fill:'none', stroke:'#bbb5af', 'stroke-width':2, 'stroke-linecap':'round', 'stroke-linejoin':'round'});
    const current = svgNode('path', {class:'journey-flow-current', fill:'none', stroke:'#cf0000', 'stroke-width':2, 'stroke-linecap':'round', 'stroke-linejoin':'round'});
    const dot = svgNode('circle', {class:'journey-flow-dot', r:7, visibility:'hidden', fill:'#cf0000', stroke:'white', 'stroke-width':2});
    overlay.append(track, current, dot);
    network.append(overlay);
    let animationFrame, resizeFrame, selected = 0, stageTargets = [], totalLength = 0, currentDistance = 0, running = false;
    journey.classList.add('is-interactive');

    function paint(distance) {
        currentDistance = distance;
        current.style.strokeDasharray = `${totalLength} ${totalLength}`;
        current.style.strokeDashoffset = String(totalLength - distance);
        const point = track.getPointAtLength(distance);
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
        dot.setAttribute('visibility', 'visible');
        stops.forEach((stop, i) => stop.classList.toggle('is-reached', distance >= stageTargets[i] - 0.01));
        // Light only after the same moving dot reaches the wire's bulb endpoint.
        const lit = distance >= totalLength - 0.01;
        stops[3].classList.toggle('is-lit', lit);
        stops[3].querySelectorAll('.journey-room-glow, .journey-rays').forEach(node => { node.style.opacity = lit ? '1' : '0'; });
        const lamp = stops[3].querySelector('.journey-lamp');
        lamp.style.fill = lit ? '#ffd88d' : '#fff';
        lamp.style.stroke = lit ? '#cf0000' : '#585252';
    }

    function buildWire() {
        cancelAnimationFrame(animationFrame);
        const wasRunning = running;
        const previousProgress = totalLength ? currentDistance / totalLength : 0;
        const bounds = network.getBoundingClientRect();
        if (!bounds.width) return;
        overlay.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
        const paths = [];
        stageTargets = [];
        stops.forEach(stop => {
            const wire = stop.querySelector('.journey-wire');
            const length = wire.getTotalLength();
            const transform = wire.getScreenCTM();
            // Sample the existing illustration's curves in the shared coordinate
            // system. Each next segment joins the previous one across any gutter.
            const arrival = svgNode('path', {d:wire.dataset.arrivalPath});
            const arrivalDistance = arrival.getTotalLength();
            const count = Math.ceil(length / 2);
            // Include the exact centre stop among the sampled curve points.
            const samples = [...new Set([arrivalDistance, ...Array.from({length:count + 1}, (_, i) => length * i / count)])].sort((a,b) => a-b);
            samples.forEach(distance => {
                const point = wire.getPointAtLength(distance).matrixTransform(transform);
                paths.push(`${paths.length ? 'L' : 'M'}${point.x - bounds.left},${point.y - bounds.top}`);
                if (distance === arrivalDistance) {
                    track.setAttribute('d', paths.join(' '));
                    stageTargets.push(track.getTotalLength());
                }
            });
            track.setAttribute('d', paths.join(' '));
        });
        current.setAttribute('d', track.getAttribute('d'));
        totalLength = track.getTotalLength();
        network.classList.add('has-continuous-wire');
        stops.forEach(stop => { stop.querySelector('.journey-wire').style.visibility = 'hidden'; });
        if (wasRunning) {
            paint(previousProgress * totalLength);
            run(selected);
        } else {
            paint(stageTargets[selected]);
        }
    }

    function run(index) {
        cancelAnimationFrame(animationFrame);
        // Read the last displayed position, including when a click interrupts
        // a journey already in progress. Never restart at the power station.
        const from = currentDistance;
        const end = stageTargets[index];
        const distance = Math.abs(end - from);
        running = false;
        if (reducedMotion.matches || distance < 0.01) { paint(end); return; }
        const duration = Math.min(3200, Math.max(400, distance / 0.35));
        let start;
        running = true;
        function frame(now) {
            if (start === undefined) start = now;
            const progress = Math.min(1, (now - start) / duration);
            paint(from + (end - from) * progress);
            if (progress < 1) animationFrame = requestAnimationFrame(frame);
            else running = false;
        }
        animationFrame = requestAnimationFrame(frame);
    }

    function show(index, animate) {
        selected = index;
        stops.forEach((stop, i) => {
            stop.disabled = false;
            stop.setAttribute('aria-pressed', String(i === index));
        });
        stories.forEach((story, i) => { story.hidden = i !== index; });
        if (animate && totalLength) run(index);
        if (animate) {
            const nav = document.getElementById('navButton') || document.getElementById('header');
            const progress = document.querySelector('.reading-progress.is-visible');
            const inset = (nav ? nav.getBoundingClientRect().height : 0) + (progress ? progress.offsetHeight : 0) + 12;
            const panel = journey.querySelector('.energy-journey-stories').getBoundingClientRect();
            const top = journey.getBoundingClientRect().top;
            if (panel.bottom > innerHeight - 12 || top < inset - 1) {
                window.scrollTo({top: window.scrollY + top - inset, behavior: 'instant'});
            }
        }
    }
    stops.forEach((stop, i) => stop.addEventListener('click', () => show(i, true)));
    show(0, false);
    const resize = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(buildWire);
    };
    new ResizeObserver(resize).observe(network);
    document.fonts.ready.then(resize);
    reducedMotion.addEventListener('change', resize);
})();
