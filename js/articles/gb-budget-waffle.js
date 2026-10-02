/* =============================================================================
   GB BUDGET WAFFLES — "The budget in 100 squares"
   Two scroll-driven waffles of the Gilgit-Baltistan budget, one engine:
     #gb-waffle      inflows  (where the money comes from)
     #gb-waffle-out  outflows (where the money goes)
   in gilgit-baltistan-budget.html. Requires d3 v7.

   Sections:
     1. Data           — INFLOWS / OUTFLOWS: category labels and shares only
     2. Allocation     — largest-remainder rounding into 100 whole squares
     3. Colour         — one warm ramp, stepped by size inside a category
     4. Sequence       — the scroll steps, built from the data
     5. Scene graph    — cells and category outlines
     6. Camera         — pitch and origin fitted to whatever is in view
     7. Paint          — drawing one frame between two steps
     8. Scroll driver  — thresholds play steps on their own clock
   ============================================================================= */
/* Freeze the screen height in pixels (--gb-vh) for the hero and the waffle steps.
   Brave and Chrome on iPhone resize the page area when their toolbar slides in
   or out, which changes 100vh mid-scroll; with 35 screen-tall steps that made
   the page leap by more than a screen. On touch devices the height is measured
   once and re-measured only when the width changes (rotation); elsewhere it
   follows every resize. */
(function freezeViewportHeight() {
    const root = document.documentElement;
    const touch = matchMedia("(pointer: coarse)").matches;
    let w = innerWidth;
    const set = () => root.style.setProperty("--gb-vh", innerHeight + "px");
    set();
    addEventListener("resize", () => {
        if (touch && innerWidth === w) return;
        w = innerWidth;
        set();
    });
})();

(function buildBudgetWaffles() {
    if (typeof d3 === "undefined") return;

    /* ---- 1. The budget ---------------------------------------------------- */
    const INFLOWS = {
        period: "FY2022–23 to FY2026–27",
        receipts: [
            {id:"g-nondevelopment", name:"A. Non-Development Budget", shortName:"non-development", goesTo:"non-development activities",
             explain:"This is the money used to keep government services running day to day, by paying people, running schools and hospitals, and keeping government offices open. It is not mainly for building new projects.", children:[
                {id:"r-grant", name:"Federal Grant-in-Aid", share:49.0, plain:"are provided by the federal government in Islamabad. A grant-in-aid is simply money Islamabad gives Gilgit-Baltistan to help run everyday public services, such as schools, hospitals and government offices; it does not have to be paid back"},
                {id:"r-local", name:"Local Revenue / Non-Tax Revenue Target", share:3.7, plain:"are raised inside Gilgit-Baltistan, through things such as local taxes, licence fees, tourism fees, utility charges and payments for use of natural resources"},
                {id:"r-deficit", name:"Budget Deficit Financing", share:5.4, plain:"come from extra money arranged when the government’s normal income is not enough to cover what it plans to spend. This can include additional federal support or money set aside to cover unpaid bills"},
                {id:"r-savings", name:"One-off Savings, Surrenders, Recoveries & Adjustments", share:1.5, plain:"come from money that was not spent or has been recovered, for example when a government job remains vacant, a project costs less than expected, or an earlier payment is returned"}
            ]},
            {id:"g-development", name:"B. Development Budget", shortName:"development", goesTo:"development activities",
             explain:"This is money for making things better or building new things, such as roads, schools, hospitals, water systems and bridges.", children:[
                {id:"r-adp", name:"ADP Allocation (Rupee Component)", share:15.0, plain:"come from Gilgit-Baltistan’s own main pot for building and improving things, such as roads, schools, hospitals and water systems"},
                {id:"r-psdp", name:"Federal PSDP (incl. PM Initiatives)", share:11.1, plain:"are provided by the federal government in Islamabad for building and improvement projects, such as important roads, bridges, hospitals, schools and other shared facilities"},
                {id:"r-fec", name:"FEC Component", share:0.6, plain:"are set aside to pay for things that must be bought from outside Pakistan, or for specialist help from abroad, such as imported hospital machines or engineering equipment. The label FEC means this money may need to be paid in a foreign currency, such as US dollars", singularPlain:"is set aside to pay for things that must be bought from outside Pakistan, or for specialist help from abroad, such as imported hospital machines or engineering equipment. The label FEC means this money may need to be paid in a foreign currency, such as US dollars"},
                {id:"r-other-development", name:"Other Development Funds", share:1.4, plain:"come from special one-off pools of money outside the usual development budget. This can include emergency help from the Prime Minister, money released late for a particular project, or funding for a single need such as flood repairs, a water scheme or a hospital upgrade", singularPlain:"comes from special one-off pools of money outside the usual development budget. This can include emergency help from the Prime Minister, money released late for a particular project, or funding for a single need such as flood repairs, a water scheme or a hospital upgrade"}
            ]},
            {id:"g-wheat", name:"C. Wheat Subsidy", shortName:"wheat subsidy", goesTo:"the wheat subsidy", noBreakdown:true,
             explain:"This helps keep wheat affordable for people in Gilgit-Baltistan. It brings together federal support, money from wheat sales and money left over from an earlier period.", children:[
                {id:"r-wheat", name:"Federal subsidy, sale proceeds & carry-forwards", share:12.3, plain:"comes from federal support, money recovered from wheat sales and funds carried forward from an earlier period. Together, these help meet the cost of supplying wheat at an affordable price, including transport to remote areas"}
            ]}
        ]
    };

    /* Outflows use the same three top-level shares as the inflows (the budget
       balances), opened into where the money is spent. Non-development is split
       by department, FY2022–23 to FY2025–26 (FY2026–27 is tabled for Q1 only).
       Development is split by sector, ADP sectors (incl. block allocations) plus
       federal PSDP schemes grouped by what they build, FY2023–24 and FY2024–25. */
    const OUTFLOWS = {
        period: "FY2022–23 to FY2026–27",
        receipts: [
            {id:"o-nondevelopment", name:"A. Non-Development Spending", shortName:"non-development", goesTo:"non-development activities",
             explain:"This is what it costs to keep the government running every year: the salaries of teachers, doctors and police, the bills of offices and hospitals, and the grants and subsidies the government pays out.", children:[
                {id:"o-finance", name:"Finance Department", share:15.0436, plain:"are held by the Finance Department. This is money managed centrally rather than by a single service, mostly grants, subsidies and other payments the government makes on behalf of the whole administration"},
                {id:"o-education", name:"School & Higher Education", share:12.2631, plain:"pay for schools, colleges and the teachers who run them, from primary classrooms to technical and higher education. Education is the largest single service the government runs"},
                {id:"o-other-dept", name:"All Other Departments", share:9.4970, plain:"are spread across 27 other offices, from agriculture, forests and local government to the courts, the Legislative Assembly, the Cabinet and the Chief Minister’s and Governor’s secretariats"},
                {id:"o-works", name:"Works & Power", share:8.2559, plain:"keep roads, government buildings and the electricity network running, through the Communication & Works and Water & Power departments"},
                {id:"o-home", name:"Police, Home & Prisons", share:8.0649, plain:"pay for policing, prisons and the upkeep of law and order across the region"},
                {id:"o-health", name:"Health", share:6.4518, plain:"run hospitals, district health centres and dispensaries, and pay the doctors, nurses and health workers in them"}
            ]},
            {id:"o-development", name:"B. Development Spending", shortName:"development", goesTo:"development activities",
             explain:"This is what Gilgit-Baltistan spends on building for the future: power plants, roads, hospitals, schools and water systems, through its own ADP and the federal PSDP.", children:[
                {id:"o-energy", name:"Energy & Power", share:6.1707, plain:"build hydropower plants and the regional grid, such as the Naltar-III and Shagarthang hydropower projects. In a region that still runs short of electricity every winter, this is the biggest development priority"},
                {id:"o-roads", name:"Roads & Transport", share:5.7259, plain:"build and upgrade roads and bridges, including the road from Pissan to Hoper in Nagar and the corridor from Thalichi in GB to Shounter in AJ&K"},
                {id:"o-other-dev", name:"Other Sectors & PM’s Special Package", share:4.0593, plain:"go to the remaining sectors, such as agriculture, tourism, social welfare and policing, along with the Prime Minister’s Special Package for GB"},
                {id:"o-planning", name:"Planning, Local Government & Block Allocations", share:3.7159, plain:"go to the Planning & Development Department, local government and rural development schemes, and block allocations that are assigned to projects during the year"},
                {id:"o-health-dev", name:"Hospitals & Health", share:3.5215, plain:"build and upgrade hospitals, such as the 250-bed hospital in Skardu, the cardiac hospital in Gilgit and the mother and child hospital in Chilas"},
                {id:"o-water", name:"Water, Sanitation & Urban Development", share:2.7287, plain:"pay for water supply, sewerage, irrigation and urban development, such as Gilgit’s sewerage system and the Greater Water Supply scheme in Hunza"},
                {id:"o-education-dev", name:"Schools & Colleges", share:2.1688, plain:"build and improve schools, colleges and technical institutes"}
            ]},
            {id:"o-wheat", name:"C. Wheat Subsidy", shortName:"wheat subsidy", goesTo:"the wheat subsidy", noBreakdown:true,
             explain:"This pays for buying wheat, carrying it to every corner of the region and selling it below cost, so that flour stays affordable in places that are cut off for months at a time.", children:[
                {id:"o-wheat-all", name:"Wheat purchase, transport & subsidised sale", share:12.3329, plain:"buy wheat, carry it to remote areas and sell it at a subsidised price"}
            ]}
        ]
    };

    function buildWaffle(root, BUDGET, cfg) {
        if (!root) return;

        const N = 100;
        const COLS = 10;

        /* ---- 2. Derived figures, and the allocation of squares ---------------- */
        const sum = g => d3.sum(g.children, c => c.share);
        const TOTAL_R = d3.sum(BUDGET.receipts, sum);
        if (Math.abs(TOTAL_R - 100) > 0.001)
            console.warn(`Inflow shares total ${TOTAL_R}, rather than the 100 needed for the 100-rupee picture.`);

        const byId = new Map();
        BUDGET.receipts.forEach(g => {
            g.total = sum(g); byId.set(g.id, g);
            g.kids = g.children.slice().sort((a, b) => b.share - a.share);
            g.kids.forEach(k => { k.parent = g; byId.set(k.id, k); });
        });

        /* Largest remainder is applied twice: first to the top-level categories,
           then inside each category, so the 100-rupee story stays whole. */
        function allocate(groups) {
            const assign = (items, total, weight) => {
                const exact = items.map(d => total * weight(d) / d3.sum(items, weight));
                const base = exact.map(Math.floor);
                exact.map((e, i) => [e - base[i], weight(items[i]), i])
                    .sort((a, b) => b[0] - a[0] || b[1] - a[1])
                    .slice(0, total - d3.sum(base))
                    .forEach(([, , i]) => base[i]++);
                return base;
            };
            const categoryRupees = assign(groups, N, g => g.total);
            let at = 0;
            const map = new Map();
            groups.forEach((g, gi) => {
                const start = at;
                const childRupees = assign(g.kids, categoryRupees[gi], l => l.share);
                g.kids.forEach((l, i) => {
                    const n = childRupees[i];
                    map.set(l.id, {n, from: at, to: at + n - 1});
                    at += n;
                });
                map.set(g.id, {n: at - start, from: start, to: at - 1});
            });
            return map;
        }
        const PLAN = allocate(BUDGET.receipts);
        const squares = id => PLAN.get(id).n;

        /* every cell knows which category and source it belongs to */
        const CELLS = d3.range(N).map(i => ({i, r: Math.floor(i / COLS), c: i % COLS}));
        BUDGET.receipts.forEach(g => {
            g.kids.forEach(l => {
                const lp = PLAN.get(l.id);
                for (let i = lp.from; i <= lp.to; i++) CELLS[i].of = {g, l};
            });
        });

        /* ---- 3. Colour -------------------------------------------------------- */
        const step = d3.piecewise(d3.interpolateRgb.gamma(2.2), cfg.ramp);
        const rgb  = c => { const o = d3.rgb(c); return [o.r, o.g, o.b]; };
        const mixc = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);
        const css  = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;

        const groups = BUDGET.receipts;
        groups.forEach((g, gi) => {
            g.col = rgb(step(groups.length < 2 ? 0 : gi / (groups.length - 1)));
            g.kids.forEach((l, li) => {
                l.col = rgb(step(g.kids.length < 2 ? 0 : li / (g.kids.length - 1)));
            });
        });

        /* ---- 4. The sequence -------------------------------------------------- */
        const rupeeWord = n => n === 1 ? "rupee" : "rupees";
        /* "the development budget", "the wheat subsidy", but plain "development spending" */
        const called = g => { const nm = g.name.slice(3).toLowerCase(); return /spending$/.test(nm) ? nm : "the " + nm; };
        const STATE = [
            {focus: null, k: "", h: "The whole budget",
             fig: "100 rupees", sub: "",
             p: cfg.firstP},
            ...groups.flatMap((g, i) => [
                {focus: g.id, level: "group", k: "", h: g.name,
                 fig: squares(g.id) + " rupees", sub: "",
                 p: `Out of the total 100 rupees, ${squares(g.id)} rupees go to ${g.goesTo}. ${g.explain}`},
                ...(g.noBreakdown ? [] : g.kids.map(l => ({
                    focus: l.id, parent: g.id, level: "leaf",
                    k: g.name.slice(3),
                    h: l.name, fig: `${squares(l.id)} ${rupeeWord(squares(l.id))}`,
                    sub: `out of ${squares(g.id)} rupees for ${g.shortName}`,
                    p: `Out of the ${squares(g.id)} rupees for ${g.shortName}, ${squares(l.id)} ${rupeeWord(squares(l.id))} ${squares(l.id) === 1 && l.singularPlain ? l.singularPlain : l.plain}.`
                }))),
                /* a bridge card between categories, pointing to the next one */
                ...(i < groups.length - 1 ? [{
                    focus: null, highlight: groups[i + 1].id, k: "",
                    h: `Next: ${groups[i + 1].name.slice(3)}`, fig: "", sub: "",
                    p: `After ${called(g)}, the ${i + 1 === groups.length - 1 ? "last" : "next"} main category is ${called(groups[i + 1])}.`
                }] : [])
            ]),
            {focus: null, k: "", h: "All three, in place",
             fig: "100 rupees", sub: `of total budget ${cfg.flow}`,
             p: cfg.lastP}
        ];

        /* ---- 5. Scene graph --------------------------------------------------- */
        const chart = root.querySelector(".gb-waffle__chart");
        const svg = d3.select(chart).append("svg")
            .attr("role", "img")
            .attr("aria-label", cfg.aria);
        const gCell = svg.append("g");
        const gBoundary = svg.append("g");

        CELLS.forEach(c => {
            c.rect = gCell.append("rect").attr("class", "gb-waffle__cell").attr("rx", 1);
            c.rect.append("title").text(`${c.of.l.name} · ${c.of.g.name.slice(3)}`);
        });
        const BOUNDARIES = groups.map(g => ({g, path: gBoundary.append("path").attr("class", "gb-waffle__boundary")}));

        /* ---- 6. The camera ---------------------------------------------------- */
        let CAM_OUT = null, CAMS = new Map();

        function boxOf(id) {
            const {from, to} = PLAN.get(id);
            let r0 = 99, r1 = 0, c0 = 99, c1 = 0;
            for (let i = from; i <= to; i++) {
                const r = Math.floor(i / COLS), c = i % COLS;
                r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c);
            }
            return {r0, r1, c0, c1};
        }

        function cameras() {
            const w = Math.max(120, chart.clientWidth), h = Math.max(120, chart.clientHeight);
            const PAD = {l: 24, r: 24, t: 26, b: 54};
            const availW = w - PAD.l - PAD.r, availH = h - PAD.t - PAD.b;
            const cx = PAD.l + availW / 2, cy = PAD.t + availH / 2;

            /* FILL keeps the grid off the edges; GAP is the white between squares */
            const FILL = 0.95, GAP = 0.0176;
            const fit = (box, cap) => {
                const bw = box.c1 - box.c0 + 1, bh = box.r1 - box.r0 + 1;
                let P = Math.min(availW / bw, availH / bh) * FILL;
                if (cap) P = Math.min(P, cap);
                const S = P * (1 - GAP);
                return {P, S,
                    ox: cx - (box.c0 + box.c1) * P / 2 - S / 2,
                    oy: cy - (box.r0 + box.r1) * P / 2 - S / 2};
            };

            CAM_OUT = fit({r0: 0, r1: COLS - 1, c0: 0, c1: COLS - 1});
            const PBASE = CAM_OUT.P;
            CAMS = new Map();
            groups.forEach(g => {
                /* a small push in at least, never past three and a bit: beyond that
                   a category stops reading as part of a hundred */
                const raw = fit(boxOf(g.id));
                CAMS.set(g.id, fit(boxOf(g.id), Math.min(Math.max(raw.P, PBASE * 1.12), PBASE * 3.2)));
                g.kids.forEach(l => {
                    const leafRaw = fit(boxOf(l.id));
                    CAMS.set(l.id, fit(boxOf(l.id), Math.min(Math.max(leafRaw.P, PBASE * 1.35), PBASE * 4.2)));
                });
            });
        }

        /* ---- 7. Drawing one frame --------------------------------------------- */
        const lerp = (a, b, t) => a + (b - a) * t;
        const ease = d3.easeCubicInOut;
        const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

        /* The camera and the breaking-up never overlap: the view arrives, and only
           then does the category come apart. Between two categories the view
           travels straight across rather than pulling back out. */
        const PH = {
            in:   {cam: [0, .45],  split: [.50, 1]},
            out:  {close: [0, .30], cam: [.28, 1]},
            both: {close: [0, .16], cam: [.10, .58], split: [.62, 1]}
        };
        const ph = (t, a, b) => ease(clamp01((t - a) / (b - a)));

        const camAt = i => STATE[i].focus ? CAMS.get(STATE[i].focus) : CAM_OUT;
        function camera(a, b, t) {
            const A = camAt(a), B = camAt(b), fa = STATE[a].focus, fb = STATE[b].focus;
            const e = fa && fb ? ph(t, ...PH.both.cam)
                    : fb       ? ph(t, ...PH.in.cam)
                    : fa       ? ph(t, ...PH.out.cam)
                    : ease(t);
            return {P: lerp(A.P, B.P, e), S: lerp(A.S, B.S, e),
                    ox: lerp(A.ox, B.ox, e), oy: lerp(A.oy, B.oy, e)};
        }

        const groupFocus = s => s.level === "leaf" ? s.parent : s.focus;
        const cellFocus = (s, o) => s.highlight ? o.g.id === s.highlight
            : !s.focus ? false
            : s.level === "leaf" ? o.l.id === s.focus : o.g.id === s.focus;
        const opacityFor = (s, o) => !s.focus && !s.highlight ? 1 : cellFocus(s, o) ? 1 : 0.2;
        const boundaryFocus = (s, g) => !s.focus && !s.highlight ? 1
            : groupFocus(s) === g.id || s.highlight === g.id ? 1 : 0.2;

        function paint(a, b, t) {
            const A = STATE[a], B = STATE[b], e = ease(t);
            const cam = camera(a, b, t);
            const both = A.focus && B.focus;
            const splitOf = id => {
                if (byId.get(id).noBreakdown) return 0;
                const fa = groupFocus(A) === id, fb = groupFocus(B) === id;
                if (fa && fb) return 1;
                if (fb) return ph(t, ...(both ? PH.both.split : PH.in.split));
                if (fa) return 1 - ph(t, ...(both ? PH.both.close : PH.out.close));
                return 0;
            };

            /* a cell takes its category's colour, or its source's once the category
               has been opened, and fades while another category is being read */
            CELLS.forEach(c => {
                const o = c.of;
                c.rect.attr("x", cam.ox + c.c * cam.P).attr("y", cam.oy + c.r * cam.P)
                      .attr("width", cam.S).attr("height", cam.S)
                      .attr("fill", css(mixc(o.g.col, o.l.col, splitOf(o.g.id))))
                      .attr("opacity", lerp(opacityFor(A, o), opacityFor(B, o), e));
            });

            /* subtle outlines keep the three main blocks readable */
            BOUNDARIES.forEach(({g, path}) => {
                const plan = PLAN.get(g.id), members = new Set(d3.range(plan.from, plan.to + 1));
                const edge = (i, dr, dc) => {
                    const row = Math.floor(i / COLS) + dr, col = i % COLS + dc;
                    return row >= 0 && row < COLS && col >= 0 && col < COLS && members.has(row * COLS + col);
                };
                let d = "";
                members.forEach(i => {
                    const row = Math.floor(i / COLS), col = i % COLS;
                    const x = cam.ox + col * cam.P, y = cam.oy + row * cam.P, p = cam.P;
                    if (!edge(i, -1, 0)) d += `M${x},${y}H${x + p}`;
                    if (!edge(i, 0, 1))  d += `M${x + p},${y}V${y + p}`;
                    if (!edge(i, 1, 0))  d += `M${x + p},${y + p}H${x}`;
                    if (!edge(i, 0, -1)) d += `M${x},${y + p}V${y}`;
                });
                path.attr("d", d)
                    .attr("stroke-width", Math.max(1.25, cam.P * 0.035))
                    .attr("opacity", lerp(boundaryFocus(A, g), boundaryFocus(B, g), e));
            });
        }

        /* ---- 8. The scroll driver ---------------------------------------------
           Modelled on the sticky-graphic scrollers in long-form news graphics:
           every step is its own screen-tall section of text that scrolls over a
           sticky chart, so the reader passes every card however fast they go.

           Scroll decides which step is active; the chart then animates to it on
           its own (the zoom in, the split, the zoom out). Position is measured in
           steps: s = 0 when the first section sits at the top of the stage, s = 1
           one section later. A step becomes active once its card is TRIGGER of
           the way in. If several steps become active at once, the chart runs
           through each one in order, faster, arriving within about one step's
           time, so it never jumps and never trails far behind the text. */
        const NT = STATE.length - 1;
        const TRIGGER = 0.4;              // how far the next card is in before it takes over
        const STEP_MS = 1500;             // one step's transition
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const FADE_MS = 280;              // reduced motion: fade out, switch, fade in

        const scrolly = root.querySelector(".gb-waffle__scrolly");
        const sticky  = root.querySelector(".gb-waffle__sticky");
        const stepsEl = document.createElement("div");
        stepsEl.className = "gb-waffle__steps";
        STATE.forEach(st => {
            const sec = document.createElement("section");
            sec.className = "gb-waffle__step";
            sec.innerHTML = `<div class="gb-waffle__card">
                ${st.k ? `<p class="gb-waffle__step-k">${st.k}</p>` : ""}
                <h3>${st.h}</h3>
                ${st.fig ? `<div class="gb-waffle__fig" style="color:${st.focus === null ? "var(--gb-waffle-tot)" : cfg.tone}">${st.fig}${st.sub ? `<span>${st.sub}</span>` : ""}</div>` : ""}
                <p>${st.p}</p>
            </div>`;
            stepsEl.appendChild(sec);
        });
        scrolly.appendChild(stepsEl);
        const firstStep = stepsEl.firstElementChild;

        function position() {
            const H = firstStep.offsetHeight;
            if (!H) return 0;
            const s = (sticky.getBoundingClientRect().top - stepsEl.getBoundingClientRect().top) / H;
            return Math.max(0, Math.min(NT, s));
        }
        const activeStep = () => Math.min(NT, Math.floor(position() + TRIGGER));

        /* pos is where the chart is drawn, in steps; it moves towards target */
        let pos = activeStep(), target = pos, anim = 0, last = 0;
        function draw() {
            if (pos >= NT) { paint(NT - 1, NT, 1); return; }
            const i = Math.floor(pos);
            paint(i, i + 1, pos - i);
        }
        function tick(now) {
            const dt = last ? Math.min(64, now - last) : 16;
            last = now;
            const dist = target - pos;
            /* one step takes STEP_MS; a backlog plays faster so it lands in about the same time */
            const move = Math.max(1, Math.abs(dist)) * dt / STEP_MS;
            pos = Math.abs(dist) <= move ? target : pos + Math.sign(dist) * move;
            draw();
            anim = pos === target ? 0 : requestAnimationFrame(tick);
            if (!anim) last = 0;
        }
        /* Reduced motion (e.g. iOS Settings > Accessibility > Motion): no zooming
           or sliding. The chart fades out, changes while hidden and fades back in,
           so the change still reads as a transition rather than a jump. */
        let fadeTimer = 0;
        function fadeTo() {
            if (fadeTimer) return;                  // a fade is under way; it lands on the latest target
            chart.style.opacity = "0";
            fadeTimer = setTimeout(() => {
                pos = target; draw();
                chart.style.opacity = "1";
                fadeTimer = 0;
            }, FADE_MS);
        }
        function onScroll() {
            headerOffset();
            const t = activeStep();
            if (t === target) return;
            target = t;
            if (reduce) { fadeTo(); return; }
            if (!anim) anim = requestAnimationFrame(tick);
        }

        /* keep the sticky stage clear of the fixed bars above it: the desktop
           #header, the mobile #navButton (added late by skel-layers) and the
           reading-progress strip (shown only once scrolling starts), so this is
           re-measured on scroll rather than once */
        let barOffset = -1;
        function headerOffset() {
            const bars = [document.getElementById("header"), document.getElementById("navButton"),
                          document.querySelector(".reading-progress")];
            const h = Math.round(bars.reduce((m, el) => {
                if (!el || getComputedStyle(el).display === "none") return m;
                return Math.max(m, el.getBoundingClientRect().bottom);
            }, 0));
            if (h === barOffset) return;
            barOffset = h;
            root.style.setProperty("--gb-waffle-top", Math.max(0, h) + "px");
        }

        /* ---- go ---- */
        headerOffset();
        cameras();
        draw();
        addEventListener("scroll", onScroll, {passive: true});
        addEventListener("resize", () => { headerOffset(); cameras(); draw(); });
        new ResizeObserver(() => { cameras(); draw(); }).observe(chart);
    }

    buildWaffle(document.getElementById("gb-waffle"), INFLOWS, {
        ramp: ["#CF0000", "#DB2E01", "#E75C03", "#F38B05", "#F9A206", "#FEB907"],
        tone: "var(--gb-waffle-accent)", flow: "inflows",
        aria: "Waffle chart of 100 squares, one per rupee of average budget inflow",
        firstP: "Think of all budget inflows as 100 rupees. The money coming in is split into three main categories: non-development, development and wheat subsidy.",
        lastP: "Together, these categories make up all 100 rupees."
    });
    buildWaffle(document.getElementById("gb-waffle-out"), OUTFLOWS, {
        ramp: ["#02061D", "#360516", "#69030E", "#9C0107"],
        tone: "var(--gb-waffle-accent)", flow: "outflows",
        aria: "Waffle chart of 100 squares, one per rupee of average budget spending",
        firstP: "Now follow the same 100 rupees out of the treasury. They are spent in the same three blocks, non-development, development and wheat subsidy, but this time we open each one to see who spends it and on what.",
        lastP: "Together, these make up all 100 rupees of spending."
    });
})();
