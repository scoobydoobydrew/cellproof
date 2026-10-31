/* Tissue what-if. The frames PhysiBoSS wrote (one digit per cell) replayed on a canvas, the share of cells still alive for every
   condition, the 240-hour runs on a log scale, the table of conditions, and the chemistry behind the solver's targets. Nothing is
   typed in: every number comes from D.tissue and D.downstream, which the page builder computes from results/tissue/*.json,
   results/targets.json and results/compounds.json. */
(() => {
  const TS = D.tissue, DS = D.downstream, section = $("#tissue");
  if (!TS || !section) return;
  section.hidden = false;
  const F = TS.facts, N = F.cells, spacing = TS.settings.spacing, H = F.hours;
  const byName = Object.fromEntries(TS.conditions.map((c) => [c.name, c]));
  const shown = TS.conditions.filter((c) => c.frames && ["radiation", "hit", "miss"].includes(c.group));
  const STATE = ["undecided", "arrest", "senescence", "autophagy", "committed to apoptosis", "gone"];
  const VARS = ["--f-proliferation", "--f-arrest", "--f-senescence", "--f-autophagy", "--f-apoptosis", "--line"];
  const hours = (minutes) => Math.round(minutes / 6) / 10;
  const tag = (cls, text, title) => `<span class="pill ${cls}"${title ? ` title="${esc(title)}"` : ""}>${esc(text)}</span>`;

  /* ---------- the numbers on top ---------- */
  const total = F.hits.count + F.misses.count, agree = F.hits.agree + F.misses.agree;
  const aliveStates = [["senescent", F.radiation.senescent], ["in arrest", F.radiation.arrest], ["recycling themselves (autophagy)", F.radiation.autophagy], ["undecided", F.radiation.undecided]].filter(([, n]) => n);
  $("#tissueLede").textContent = `The same Boolean network runs inside each of ${fmt(N)} irradiated cells of a small virtual tissue, simulated with PhysiBoSS, an existing open-source simulator of many cells. ` +
    "Every cell flips its genes at random moments, so the cells do not all follow the same path. This is a second, independent engine checking the exact solver. It is not a prediction for any patient.";
  $("#tissueStats").replaceChildren(...[
    [fmt(N), "irradiated cells in the virtual tissue, each carrying the whole network"],
    [`${agree}/${total}`, `sets on which the simulation and the exact solver agree: ${F.hits.count} the solver accepts and ${F.misses.count} of the same size it rejects`],
    [`${F.long.none_alive}/${F.long.count}`, `of the solver's sets leave no cell alive after ${F.long.hours} h; after ${H} h, ${F.hits.count - F.hits.none_alive} of them still held a few cells (at most ${F.hits.most_alive} of ${fmt(N)})`],
    [fmt(F.radiation.alive), `cells alive after ${H} h of radiation alone (${pct(F.radiation.alive, N)}%): ${aliveStates.map(([w, n]) => `${fmt(n)} ${w}`).join(", ") || "none"}`],
  ].map(([n, t]) => h(`<div class="stat"><b>${esc(n)}</b><span>${esc(t)}</span></div>`)));

  /* ---------- the tissue ---------- */
  const decoded = new Map();
  function frame(c, k) {
    const key = `${c.name}:${k}`;
    if (!decoded.has(key)) {
      const out = new Uint8Array(N);
      let i = 0;
      c.frames[k].replace(/(\d)(\d+),/g, (_, digit, run) => { out.fill(+digit, i, i + +run); i += +run; return ""; });
      decoded.set(key, out);
    }
    return decoded.get(key);
  }
  const cv = $("#tCanvas"), ctx = cv.getContext("2d");
  const radius = Math.max(...TS.positions.map(([x, y]) => Math.hypot(x, y))) + spacing;
  const steps = shown[0].times.length;
  const sel = $("#tCond"), slider = $("#tTime"), play = $("#tPlay");
  let cond = byName.radiation_only, k = Math.max(0, shown[0].times.findIndex((m) => m >= 540)), timer = null;

  [["radiation", "No intervention"], ["hit", "The solver's sets: leave only apoptosis"], ["miss", "Sets of the same size that the solver rejects"]].forEach(([group, label]) => {
    const og = document.createElement("optgroup");
    og.label = label;
    shown.filter((c) => c.group === group).forEach((c) => { const o = document.createElement("option"); o.value = c.name; o.textContent = group === "radiation" ? "Radiation only" : c.label; og.appendChild(o); });
    sel.appendChild(og);
  });
  slider.max = steps - 1;

  function size() {
    const w = Math.max(240, cv.clientWidth || 480), dpr = window.devicePixelRatio || 1;
    cv.width = cv.height = Math.round(w * dpr);
    draw();
  }
  function draw() {
    const w = cv.width, s = w / (2 * radius), r = Math.max(1.1, spacing * 0.46 * s), colors = VARS.map(css), state = frame(cond, k);
    ctx.clearRect(0, 0, w, w);
    ctx.lineWidth = Math.max(1, w / 500);
    for (let i = 0; i < N; i++) {
      ctx.beginPath();
      ctx.arc(w / 2 + TS.positions[i][0] * s, w / 2 - TS.positions[i][1] * s, r, 0, 6.2832);
      if (state[i] === 5) { ctx.strokeStyle = colors[5]; ctx.stroke(); } else { ctx.fillStyle = colors[state[i]]; ctx.fill(); }
    }
  }
  function now() {
    const counts = cond.counts[k], alive = cond.alive[k];
    $("#tClock").textContent = `${hours(cond.times[k])} h`;
    slider.value = k;
    $("#tNow").innerHTML = `<b>${fmt(alive)}</b><span>of ${fmt(N)} cells alive (${pct(alive, N)}%)</span>` +
      `<span class="t-sub">${counts.map((n, i) => (n ? `${fmt(n)} ${STATE[i]}` : "")).filter(Boolean).join(" · ")}</span>`;
  }

  /* ---------- line charts (svg) ---------- */
  function chart(el, series, o) {
    const W = 560, Ht = 280, m = { l: 50, r: 26, t: 10, b: 34 };
    const x = (v) => m.l + (v / o.xmax) * (W - m.l - m.r);
    const lo = o.log ? Math.log10(o.floor) : 0, hi = o.log ? Math.log10(o.ymax) : o.ymax;
    const y = (v) => Ht - m.b - (((o.log ? Math.log10(Math.max(v, o.floor)) : v) - lo) / (hi - lo)) * (Ht - m.t - m.b);
    const root = svg("svg", { viewBox: `0 0 ${W} ${Ht}`, role: "img", "aria-label": o.label });
    o.yticks.forEach(([v, text]) => {
      svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: css("--line-soft") }, root);
      svg("text", { x: m.l - 8, y: y(v) + 4, "text-anchor": "end" }, root).textContent = text;
    });
    o.xticks.forEach((v) => svg("text", { x: x(v), y: Ht - 12, "text-anchor": "middle" }, root).textContent = `${v} h`);
    series.forEach((s) => svg("polyline", { points: s.pts.map(([a, b]) => `${x(a).toFixed(1)},${y(b).toFixed(1)}`).join(" "), fill: "none", stroke: s.color,
      "stroke-width": s.width, "stroke-linejoin": "round", opacity: s.opacity ?? 1 }, root));
    if (o.marker != null) svg("line", { x1: x(o.marker), x2: x(o.marker), y1: m.t, y2: Ht - m.b, stroke: css("--fg-3"), "stroke-dasharray": "3 3" }, root);
    el.replaceChildren(root);
  }
  const share = (c) => c.times.map((t, i) => [t / 60, (100 * c.alive[i]) / N]);
  function charts() {
    chart($("#tChart"), [
      ...shown.filter((c) => c.group === "miss").map((c) => ({ pts: share(c), color: css("--bad"), width: 1.4, opacity: 0.55 })),
      ...shown.filter((c) => c.group === "hit").map((c) => ({ pts: share(c), color: css("--good"), width: 1.4, opacity: 0.65 })),
      { pts: share(byName.radiation_only), color: css("--fg-2"), width: 2.2 },
      { pts: share(cond), color: css("--accent"), width: 3.2 },
    ], { xmax: H, ymax: 100, yticks: [0, 25, 50, 75, 100].map((v) => [v, `${v}%`]), xticks: [0, 12, 24, 36, 48, 60, 72].filter((v) => v <= H),
         marker: cond.times[k] / 60, label: "Share of the cells still alive over time, for every condition; the selected one is highlighted." });
  }
  const longs = TS.conditions.filter((c) => c.group === "long");
  if (longs.length) {
    const Hl = longs[0].times[longs[0].times.length - 1] / 60;
    $("#tailTitle").textContent = "What is still alive, on a log scale";
    $("#tailNote").textContent = `After ${H} h, ${F.hits.count - F.hits.none_alive} of the solver's ${F.hits.count} sets still hold a few cells (at most ${F.hits.most_alive} of ${fmt(N)}). ` +
      `Each line below is one solver set run for ${Hl} h: ${F.long.none_alive} of ${F.long.count} reach zero cells alive (drawn at the floor, "0"). The solver promises where cells end, not how fast.`;
    chart($("#tTail"), longs.map((c) => ({ pts: c.times.map((t, i) => [t / 60, c.alive[i]]), color: css("--good"), width: 1.6, opacity: 0.75 })),
      { xmax: Hl, ymax: N, log: true, floor: 0.5, yticks: [[0.5, "0"], [1, "1"], [10, "10"], [100, "100"], [1000, "1,000"]], xticks: [0, 48, 96, 144, 192, 240].filter((v) => v <= Hl),
        label: "Cells still alive over time on a log scale, one line for each of the solver's sets run to 240 hours." });
  } else $("#tTail").closest(".card").hidden = true;

  /* ---------- the table ---------- */
  const GROUP = { radiation: "no intervention", hit: "solver accepts", miss: "solver rejects", rate: "no intervention, other apoptosis rate" };
  const rows = TS.rows.filter((r) => r.group !== "long");
  $("#tableNote").textContent = `After ${H} h. "Agrees" means the simulation and the solver say the same: fewer than ${100 * F.agree_below}% of the cells alive for a set the solver accepts, at least ${100 * F.agree_below}% for one it rejects.`;
  $("#tTable").innerHTML = `<thead><tr><th>Set</th><th>Solver</th><th class="num">Alive</th><th>How they stand</th><th class="num">Hours to 90% dead</th><th>Agrees</th></tr></thead><tbody>` +
    rows.map((r) => {
      const share = r.alive_end / r.cells;
      const verdict = r.group === "hit" ? (share < F.agree_below ? tag("good", "agrees") : tag("bad", "differs")) : r.group === "miss" ? (share >= F.agree_below ? tag("good", "agrees") : tag("bad", "differs")) : "";
      const stand = [["undecided", r.none], ["arrest", r.arrest], ["senescence", r.senescence], ["autophagy", r.autophagy]].filter(([, n]) => n).map(([w, n]) => `${fmt(n)} ${w}`).join(", ");
      return `<tr data-name="${esc(r.name)}"><td>${esc(r.label)}</td><td>${esc(GROUP[r.group])}</td><td class="num">${fmt(r.alive_end)}</td><td>${esc(stand || "none alive")}</td>` +
        `<td class="num">${r.minutes_to_90_percent_dead == null ? "not within " + H : hours(r.minutes_to_90_percent_dead)}</td><td>${verdict}</td></tr>`;
    }).join("") + "</tbody>";
  function marks() { $$("#tTable tbody tr").forEach((tr) => tr.classList.toggle("sel", tr.dataset.name === cond.name)); }

  /* ---------- controls ---------- */
  function show() { now(); draw(); charts(); marks(); }
  function stop() { clearInterval(timer); timer = null; play.textContent = k >= steps - 1 ? "Replay" : "Play"; }
  sel.onchange = () => { cond = byName[sel.value]; show(); };
  slider.oninput = () => { stop(); k = +slider.value; show(); };
  play.onclick = () => {
    if (timer) return stop();
    if (k >= steps - 1) k = 0;
    play.textContent = "Pause";
    timer = setInterval(() => { k += 1; show(); if (k >= steps - 1) stop(); }, 170);
    show();
  };
  sel.value = cond.name;
  $("#tChartLegend").innerHTML = [["--good", "the solver's sets"], ["--bad", "sets it rejects"], ["--fg-2", "radiation only"], ["--accent", "selected"]]
    .map(([v, w]) => `<span><i style="background:var(${v})"></i>${esc(w)}</span>`).join("");
  $("#tLegend").innerHTML = STATE.map((w, i) => `<span><i style="background:${i === 5 ? "transparent" : `var(${VARS[i]})`};${i === 5 ? "border:1px solid var(--line)" : ""}"></i>${esc(w)}</span>`).join("");
  $("#tNote").textContent = `Positions are the simulator's; colours are what each cell's network says at that time. Time is a modelling choice (one model time unit = one hour), the rates are not measured, ` +
    `and the cells do not divide or talk to each other: the picture counts deaths and fates. Seeds and settings are in results/tissue/summary.json.`;
  new ResizeObserver(size).observe(cv);
  new MutationObserver(() => { draw(); charts(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  size();
  show();

  /* ---------- from a target to chemistry ---------- */
  const card = $("#downCard");
  if (!DS) card.hidden = true;
  else {
    const T = DS.targets, P = (DS.compounds || {}).proteins || [];
    const knockouts = T.filter((r) => r.knock_out_only), single = knockouts.filter((r) => r.literals.every((l) => l.kind === "protein"));
    const strong = (p) => (((p.chembl || {}).at_1_micromolar_or_better) || {}).compounds ?? 0;
    const best = (p) => { const m = ((p.chembl || {}).most_potent || [])[0]; return m ? `${m.name || m.compound}: ${m.measure} ${m.relation === "=" ? "" : m.relation}${m.value} ${m.units} (pChEMBL ${m.pchembl.toFixed(2)})` : "none recorded"; };
    const readouts = (p) => (((p.chembl || {}).at_1_micromolar_or_better) || {}).records_mentioning_phosphorylation ?? 0;
    const solverP = P.filter((p) => p.sets.length), briefP = P.filter((p) => !p.sets.length);
    card.innerHTML = `<h3>From a target to chemistry</h3>
      <p class="muted t-note">Could a drug reach what the solver asks for? Of its ${T.length} sets, ${knockouts.length} are knock-outs, which an inhibitor could imitate; the others need a gene switched <em>on</em>. ` +
      `Of the knock-outs, ${single.length} concern a single protein (${single.map((r) => r.label.replace(" KO", "")).join(", ")}); a knock-out of ${knockouts.filter((r) => !single.includes(r)).map((r) => r.label.replace(" KO", "")).join(", ")} is not a protein. ` +
      `Allowing up to three knock-outs at once adds no further set.</p>
      <div class="t-chips">${T.map((r) => tag(r.knock_out_only ? "good" : "", r.label, r.literals.map((l) => `${l.node}: ${l.kind.replace(/_/g, " ")}`).join("; "))).join("")}</div>` +
      (P.length ? `<div class="scroll-x"><table class="tbl"><thead><tr><th>Protein</th><th>Why listed</th><th>Model: knocked out alone</th><th class="num">ChEMBL records</th><th class="num">Compounds at 1 µM or better</th><th>Most potent on record</th></tr></thead><tbody>` +
        P.map((p) => `<tr><td><b>${esc(p.symbol)}</b><div class="t-sub">${esc(p.name || "")}</div></td><td>${esc(p.why)}</td>` +
          `<td>${p.only_apoptosis ? tag("good", "only apoptosis") : esc(p.knock_out_alone_leaves.join(", "))}</td>` +
          `<td class="num">${p.chembl ? fmt(p.chembl.records.all) : "no entry"}</td><td class="num">${fmt(strong(p))}</td>` +
          `<td>${esc(best(p))}${readouts(p) ? `<div class="t-sub">${readouts(p)} of the ${fmt(((p.chembl || {}).records || {}).pchembl_6_or_more ?? 0)} strong records are assays that mention phosphorylation: a readout in cells, not binding</div>` : ""}</td></tr>`).join("") + `</tbody></table></div>
        <p class="muted t-note">ChEMBL release ${esc(DS.compounds.chembl_release)}, queried ${esc(DS.compounds.queried)}. ${solverP.length ? `Where the solver points (${solverP.map((p) => p.symbol).join(", ")}) ChEMBL holds ${solverP.map((p) => `${strong(p)} compounds at 1 µM or better for ${p.symbol}`).join(" and ")}; ` : ""}` +
        `${briefP.length ? `for the kinases the project brief names (${briefP.map((p) => p.symbol).join(", ")}) it holds ${briefP.map((p) => strong(p)).map(fmt).join(", ")}, and knocking out each of them alone does not leave only apoptosis in this model unless the column above says so. ` : ""}` +
        `Nothing here is predicted: every compound has a measured activity, an assay and a publication in the data.</p>` : "");
  }

  /* ---------- what this does not show ---------- */
  const noP53 = DS ? DS.targets.filter((r) => !r.with_p53_lost.only_apoptosis).length : 0, noStable = DS ? DS.targets.filter((r) => r.with_p53_lost.fixed_points === 0).length : 0;
  $("#tissueLimits").replaceChildren(...[
    ["No signals between cells", "The network has no inputs from neighbours, so the tissue is many independent cells. PhysiBoSS can model gradients and contact; this model does not use them."],
    ["No drug, no dose", "An intervention is a gene fixed on or off from the first minute in every cell. No drug, uptake, timing or dose is modelled, and none is claimed."],
    ["Time and rates are choices", "One model time unit is one hour and every gene flips at the same rate. The results say which end states are reached and how robustly, not how many real hours."],
    ["Cells do not divide here", "The run counts deaths and fates. It says nothing about regrowth or about cells that survive."],
    ["Two fates never occur", "The network has four stable end states. Under equal rates, a healthy cell that is irradiated reaches only two of them in this tissue; the other two appear only under some interventions."],
    ...(DS ? [["Every answer needs p53", `With p53 knocked out, ${noP53} of the ${DS.targets.length} sets no longer leave only apoptosis: ${noStable} have no stable state at all (the network oscillates) and the rest one that matches none of the four fates. Whatever the model says here is for cells that have p53.`]] : []),
    ["Not a clinical trial", "No patient, no tumour, no efficacy or safety claim, and no process that could cause a second cancer is modelled. These are hypotheses about a model."],
  ].map(([t, p]) => h(`<div class="limit"><h4>${esc(t)}</h4><p>${esc(p)}</p></div>`)));
})();
