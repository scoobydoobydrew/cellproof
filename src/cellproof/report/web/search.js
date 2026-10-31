/* CellProof report, part 5: the search engine. The solver's whole search on one board: a ring of the 23 genes the search may change, each one
   switched off (red) or on (green), and a line between the two changes of every set it tried. Singles first, then pairs, in the order of the
   exhaustive search. The verdict on each set is the exact solver's (results/search_board.json, written by `cellproof board`), for the model
   cell and for a few tumour profiles (a genotype forced onto the network, as in the tumour-sample study). The page only draws that file: a
   line's colour is the verdict, a glowing set is a minimal one, and a profile's own list is the solver's answer for that profile. */
(() => {
  const root = $("#search"), SB = D.search;
  if (!root) return;
  if (!SB || !window.CP) { root.remove(); $$('nav a[href="#search"]').forEach((a) => a.remove()); return; }
  const { T, num } = CP;

  CP.add({
    en: {
      "sx.goal": "Goal", "sx.goalv": "only death", "sx.go": "Search ▶", "sx.tried": "sets tried", "sx.found": "kept: leave only death",
      "sx.model": "Model cell", "sx.nogeno": "no genotype forced", "sx.samples": (n) => `${num(n)} tumour samples`, "sx.lost": "lost", "sx.high": "high",
      "sx.ready": (n) => `Press Search. The solver will try ${num(n)} sets of one or two changes.`, "sx.run": (n) => `Trying ${num(n)} sets, one by one, with exact analysis.`,
      "sx.done": (n, k, d) => `Done: ${num(n)} sets tried, ${k} kept. Each kept set leaves only death, and no smaller set does. ${num(d)} sets leave only death; the others contain a smaller one.`,
      "sx.none": (n) => `None of the ${num(n)} sets leaves only death for this profile. Whatever one or two genes you change, another fate stays possible, or the circuit never settles.`,
      "sx.fixed": (names) => `This profile fixes ${names}, so sets that touch it are not offered.`, "sx.cells": "sets tried", "sx.kept": "kept",
      "sx.off": "switched off", "sx.on": "switched on", "sx.pinned": "fixed by the profile", "sx.dish": "Dish", "sx.tum": "Tumour", "sx.paper": "in the base paper",
      "sx.one": "1 change", "sx.two": "2 changes", "sx.only": "only with this profile",
      "sx.note": "The profile forces its genes in the model, as in the tumour-sample study. A statement about the model and public counts, not about any person. Hypotheses for the lab.",
      "sx.skip": (list) => `No search is needed in the model for ${list}: there the profile alone already leaves only death.`,
    },
    el: {
      "sx.goal": "Στόχος", "sx.goalv": "μόνο θάνατος", "sx.go": "Αναζήτηση ▶", "sx.tried": "σύνολα δοκιμάστηκαν", "sx.found": "κρατήθηκαν: αφήνουν μόνο θάνατο",
      "sx.model": "Κύτταρο του μοντέλου", "sx.nogeno": "χωρίς γενετική αλλαγή", "sx.samples": (n) => `${num(n)} δείγματα όγκων`, "sx.lost": "χαμένο", "sx.high": "υψηλό",
      "sx.ready": (n) => `Πάτα Αναζήτηση. Ο solver θα δοκιμάσει ${num(n)} σύνολα μιας ή δύο αλλαγών.`, "sx.run": (n) => `Δοκιμάζει ${num(n)} σύνολα, ένα ένα, με ακριβή ανάλυση.`,
      "sx.done": (n, k, d) => `Έτοιμο: δοκιμάστηκαν ${num(n)} σύνολα, κρατήθηκαν ${k}. Κάθε σύνολο που κρατήθηκε αφήνει μόνο θάνατο και κανένα μικρότερο δεν το κάνει. ${num(d)} σύνολα αφήνουν μόνο θάνατο· τα υπόλοιπα περιέχουν ένα μικρότερο.`,
      "sx.none": (n) => `Κανένα από τα ${num(n)} σύνολα δεν αφήνει μόνο θάνατο γι' αυτό το προφίλ. Όποια ένα ή δύο γονίδια κι αν αλλάξεις, μένει κάποια άλλη μοίρα ή το κύκλωμα δεν σταθεροποιείται ποτέ.`,
      "sx.fixed": (names) => `Το προφίλ καθορίζει ${names}, οπότε σύνολα που το αγγίζουν δεν προσφέρονται.`, "sx.cells": "σύνολα δοκιμάστηκαν", "sx.kept": "κρατήθηκαν",
      "sx.off": "σβηστό", "sx.on": "αναμμένο", "sx.pinned": "καθορισμένο από το προφίλ", "sx.dish": "Τρυβλίο", "sx.tum": "Όγκος", "sx.paper": "στο αρχικό paper",
      "sx.one": "1 αλλαγή", "sx.two": "2 αλλαγές", "sx.only": "μόνο με αυτό το προφίλ",
      "sx.note": "Το προφίλ επιβάλλει τα γονίδιά του στο μοντέλο, όπως στη μελέτη των δειγμάτων όγκων. Δήλωση για το μοντέλο και δημόσιους αριθμούς, όχι για κάποιον άνθρωπο. Υποθέσεις για το εργαστήριο.",
      "sx.skip": (list) => `Δεν χρειάζεται αναζήτηση στο μοντέλο για ${list}: εκεί το προφίλ από μόνο του αφήνει ήδη μόνο θάνατο.`,
    },
  });
  CP.refresh();

  const G = SB.genes, NG = G.length, P = SB.profiles, COMBOS = SB.combos.map((c) => c.map((li) => [G[li >> 1], li & 1])), N = COMBOS.length;
  const cv = $("#sxBoard"), ctx = cv.getContext("2d"), tip = $("#sxTip"), layer = document.createElement("canvas"), lc = layer.getContext("2d");
  const GREEN = [88, 230, 172], RED = [255, 104, 116], PEACH = [255, 190, 130], LILAC = [190, 182, 232], BLUE = [120, 150, 255], WHITE = [255, 255, 255];
  const TINT = { D: [GREEN, 0.2], O: [LILAC, 0.085], N: [BLUE, 0.07] }, DELTA = 0.042, sans = css("--sans") || "sans-serif";
  const PUB = ((D.interventions || {}).published || []).map((s) => JSON.stringify(s)), BASE = [[["TUG1", 0]], [["miR221", 1]]].map((s) => JSON.stringify(s)).filter((s) => PUB.includes(s));
  const setName = (s) => s.map(([n, v]) => `${pretty(n)} ${v ? "ON" : "✕"}`).join(" + "), inPaper = (s) => BASE.includes(JSON.stringify(s.map(([n, v]) => [n, v])));
  const nameOf = (forced) => (forced.length ? forced.map(([n, v]) => `${pretty(n)} ${T(v ? "sx.high" : "sx.lost")}`).join(" + ") : T("sx.model"));
  const MODEL_KEPT = new Set(P[0].found.map((i) => JSON.stringify(COMBOS[i])));

  let cur = 0, W = 0, dpr = 1, order = [], k = 0, shown = 0, running = false, done = false, t0 = 0, raf = 0, hl = -1, hover = -1, first = true, foundSet = new Set(), singles = new Set();
  const geo = { cx: 0, cy: 0, R: 0, pr: 3.5, pos: [] };
  const profile = () => P[cur], forcedMap = () => Object.fromEntries(profile().forced);

  function fit() {
    const r = cv.getBoundingClientRect(); if (!r.width) return false;
    dpr = Math.min(2, devicePixelRatio || 1); W = r.width;
    const px = Math.round(W * dpr); if (cv.width !== px) { cv.width = cv.height = px; layer.width = layer.height = px; }
    const label = Math.max(56, W * 0.17); geo.cx = geo.cy = W / 2; geo.R = W / 2 - label; geo.pr = Math.max(3.1, geo.R * 0.03);
    geo.pos = Array.from({ length: NG * 2 }, (_, li) => { const a = -Math.PI / 2 + (((li >> 1) + 0.5) / NG) * TAU + (li & 1 ? DELTA : -DELTA); return { x: geo.cx + Math.cos(a) * geo.R, y: geo.cy + Math.sin(a) * geo.R, a }; });
    return true;
  }
  const lits = (i) => SB.combos[i];
  function chord(c, i, col, alpha, lw) {
    const [u, v] = lits(i), a = geo.pos[u], b = geo.pos[v], f = 0.22;
    c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(geo.cx + ((a.x + b.x) / 2 - geo.cx) * f, geo.cy + ((a.y + b.y) / 2 - geo.cy) * f, b.x, b.y);
    c.strokeStyle = rgba(col, alpha); c.lineWidth = lw; c.stroke();
  }
  function paintLayer(upTo) {  /* the lines of the sets tried so far, kept apart so that a frame costs one image */
    lc.setTransform(dpr, 0, 0, dpr, 0, 0); lc.clearRect(0, 0, W, W); lc.lineCap = "round"; singles = new Set();
    const marks = profile().verdicts;
    for (let j = 0; j < upTo; j++) {
      const i = order[j];
      if (COMBOS[i].length === 1) { singles.add(i); continue; }
      const [col, a] = TINT[marks[i]]; chord(lc, i, col, a, 1);
    }
  }
  function draw(T0) {
    if (!W) return;
    const { cx, cy, R, pr, pos } = geo, marks = profile().verdicts, forced = forcedMap(), now = T0 || performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.drawImage(layer, 0, 0, W, W);
    ctx.lineCap = "round";
    for (let j = Math.max(0, k - 16); j < k; j++) { const i = order[j]; if (COMBOS[i].length === 2) chord(ctx, i, WHITE, 0.55 * (1 - (k - j) / 17), 1.4); }  /* the head of the sweep */
    for (const i of foundSet) {  /* the kept sets, once the sweep has reached them */
      if (!reached(i) || COMBOS[i].length !== 2) continue;
      ctx.save(); ctx.shadowColor = rgba(GREEN, 0.9); ctx.shadowBlur = 14; chord(ctx, i, mix(GREEN, WHITE, 0.45), 0.95, 2.6); ctx.restore();
    }
    const hi = hover >= 0 ? hover : hl;
    if (hi >= 0 && COMBOS[hi].length === 2) { ctx.save(); ctx.shadowColor = rgba(PEACH, 1); ctx.shadowBlur = 16; chord(ctx, hi, PEACH, 1, 3.2); ctx.restore(); }
    for (let li = 0; li < NG * 2; li++) {  /* the pills: red switched off, green switched on */
      const g = G[li >> 1], v = li & 1, p = pos[li], pinned = g in forced, mine = pinned && forced[g] === v, keptS = foundSet.has(singleIndex(li)) && reached(singleIndex(li)), tried = singles.has(singleIndex(li));
      const col = mine ? PEACH : pinned ? [150, 146, 180] : v ? GREEN : RED, pulse = hi >= 0 && COMBOS[hi].some(([n, w]) => n === g && w === v);
      if (keptS || pulse) { ctx.save(); ctx.shadowColor = rgba(keptS ? GREEN : PEACH, 1); ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(p.x, p.y, pr * 1.9, 0, TAU); ctx.strokeStyle = rgba(keptS ? mix(GREEN, WHITE, 0.4) : PEACH, 0.95); ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(p.x, p.y, pr * (tried ? 1.25 : 1), 0, TAU);
      if (pinned && !mine) { ctx.setLineDash([2, 2]); ctx.strokeStyle = rgba(col, 0.7); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.fillStyle = rgba(col, v || mine ? 0.95 : 0.55 + (tried ? 0.4 : 0)); ctx.fill(); if (!v) { ctx.strokeStyle = rgba(col, 0.95); ctx.lineWidth = 1.3; ctx.stroke(); } }
    }
    ctx.font = `500 ${Math.max(10, Math.min(12.5, W * 0.021))}px ${sans}`; ctx.textBaseline = "middle";  /* the gene names, outside the ring */
    G.forEach((g, gi) => {
      const a = -Math.PI / 2 + ((gi + 0.5) / NG) * TAU, c = Math.cos(a), s = Math.sin(a), x = cx + c * (R + pr * 3.2), y = cy + s * (R + pr * 3.2);
      ctx.textAlign = c > 0.2 ? "left" : c < -0.2 ? "right" : "center"; ctx.fillStyle = g in forced ? rgba(PEACH, 1) : "rgba(238,236,252,.86)"; ctx.fillText(pretty(g), x, y + (Math.abs(c) <= 0.2 ? s * 6 : 0));
    });
    const tried = k, big = Math.round(R * 0.36), kept = [...foundSet].filter(reached).length;  /* in the middle: how many sets have been tried */
    ctx.textAlign = "center"; ctx.font = `700 ${big}px ${sans}`; ctx.fillStyle = "#fff"; ctx.fillText(num(tried), cx, cy - big * 0.12);
    ctx.font = `500 ${Math.max(11, R * 0.075)}px ${sans}`; ctx.fillStyle = done && kept ? rgba(mix(GREEN, WHITE, 0.2), 1) : "rgba(228,224,255,.75)";
    ctx.fillText(done ? `${kept} ${T("sx.kept")}` : T("sx.cells"), cx, cy + big * 0.52);
  }
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const SINGLE = Array.from({ length: NG * 2 }, (_, li) => COMBOS.findIndex((c) => c.length === 1 && c[0][0] === G[li >> 1] && c[0][1] === (li & 1))), singleIndex = (li) => SINGLE[li];
  let at = new Int32Array(N).fill(-1);  /* where each set stands in the sweep (-1: not offered to this profile) */
  const reached = (i) => at[i] >= 0 && at[i] < k;

  function addResult(i, rank) {
    const s = COMBOS[i], model = profile().forced.length === 0, openable = MODEL_KEPT.has(JSON.stringify(s)), tum = openable && CP.hasTumour(s);
    const li = h(`<li data-i="${i}"><i class="n">${rank}</i><div><b>${esc(setName(s))}</b><small>${esc(T(s.length === 1 ? "sx.one" : "sx.two"))}${model && inPaper(s) ? ` · ${esc(T("sx.paper"))}` : ""}${openable ? "" : ` · ${esc(T("sx.only"))}`}</small></div>
      <div class="sx-open">${openable ? `<button type="button" data-w="dish">${esc(T("sx.dish"))}</button>` : ""}${tum ? `<button type="button" data-w="tumour">${esc(T("sx.tum"))}</button>` : ""}</div></li>`);
    li.addEventListener("mouseenter", () => { hl = i; if (!running) draw(); });
    li.addEventListener("mouseleave", () => { hl = -1; if (!running) draw(); });
    $$("button", li).forEach((b) => b.addEventListener("click", () => CP.open(s.map(([n, v]) => [n, v]), b.dataset.w)));
    $("#sxResults").appendChild(li);
  }
  function counters() { $("#sxTried").textContent = num(k); $("#sxFound").textContent = String(shown); }
  function message() {
    const p = profile(), n = order.length, dead = p.verdicts.split("").filter((x) => x === "D").length, pinned = p.forced.map(([g]) => pretty(g)).join(", ");
    $("#sxMsg").textContent = (done ? (p.found.length ? T("sx.done", n, p.found.length, dead) : T("sx.none", n)) : running ? T("sx.run", n) : T("sx.ready", n)) + (p.forced.length && done ? ` ${T("sx.fixed", pinned)}` : "");
  }
  function note() {
    const skip = SB.no_search_needed.filter((s) => s.forced.length === 1).slice(0, 3).map((s) => `${nameOf(s.forced)} (${num(s.samples)})`).join(", ");
    $("#sxNote").textContent = `${skip ? T("sx.skip", skip) + " " : ""}${T("sx.note")}`;
  }
  function chips() {
    $("#sxProfiles").replaceChildren(...P.map((p, i) => {
      const b = h(`<button type="button" class="sx-chip" aria-pressed="${i === cur}"><span>${esc(nameOf(p.forced))}</span><small>${esc(p.samples ? T("sx.samples", p.samples) : T("sx.nogeno"))}</small></button>`);
      b.addEventListener("click", () => select(i)); return b;
    }));
  }

  function reset() {
    cancelAnimationFrame(raf); running = false; done = false; k = 0; shown = 0; hl = -1; hover = -1;
    const p = profile(); order = []; at.fill(-1); for (let i = 0; i < N; i++) if (p.verdicts[i] !== "-") { at[i] = order.length; order.push(i); }
    foundSet = new Set(p.found); singles = new Set(); $("#sxResults").replaceChildren(); paintLayer(0); counters(); message(); draw();
  }
  function finish() {
    k = order.length; done = true; running = false; paintLayer(k);
    for (const i of profile().found) addResult(i, ++shown);
    counters(); message(); draw();
  }
  const SINGLES_MS = 1200, PAIRS_MS = 4300;
  function tick(now) {
    if (!running) return;
    const t = now - t0, nS = order.filter((i) => COMBOS[i].length === 1).length, n = order.length;
    const target = Math.min(n, Math.floor(t < SINGLES_MS ? (t / SINGLES_MS) * nS : nS + Math.min(1, (t - SINGLES_MS) / PAIRS_MS) * (n - nS)));
    if (target > k) {
      const marks = profile().verdicts;
      for (let j = k; j < target; j++) {
        const i = order[j];
        if (COMBOS[i].length === 1) singles.add(i); else { const [col, a] = TINT[marks[i]]; lc.lineCap = "round"; chord(lc, i, col, a, 1); }
        if (foundSet.has(i)) addResult(i, ++shown);
      }
      k = target; counters();
    }
    if (k >= n) { done = true; running = false; message(); draw(now); counters(); return; }
    draw(now); raf = requestAnimationFrame(tick);
  }
  function run() {
    reset();
    if (reduced) { finish(); return; }
    running = true; message(); t0 = performance.now(); raf = requestAnimationFrame(tick);
  }
  function select(i) { cur = i; chips(); run(); }

  /* the pointer names the change under it */
  cv.addEventListener("pointermove", (e) => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, forced = forcedMap(); let best = -1, bd = geo.pr * 2.6;
    geo.pos.forEach((p, li) => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = li; } });
    if (best < 0) { tip.classList.remove("show"); return; }
    const g = G[best >> 1], v = best & 1;
    tip.textContent = `${pretty(g)} · ${T(g in forced ? "sx.pinned" : v ? "sx.on" : "sx.off")}`; tip.style.left = Math.max(6, Math.min(r.width - 150, x + 12)) + "px"; tip.style.top = Math.max(6, y - 30) + "px"; tip.classList.add("show");
  });
  cv.addEventListener("pointerleave", () => tip.classList.remove("show"));
  $("#sxGo").addEventListener("click", run);
  new ResizeObserver(() => { if (fit()) { paintLayer(k); draw(); } }).observe(cv);
  CP.onLang(() => { chips(); message(); note(); relist(); draw(); });
  function relist() {  /* the words of the list follow the language; the list itself is the solver's, revealed in order */
    $("#sxResults").replaceChildren(); profile().found.slice(0, shown).forEach((i, n) => addResult(i, n + 1));
  }

  fit(); chips(); note(); reset();
  if (reduced) finish();
  else new IntersectionObserver((es) => { if (es[0].isIntersecting && first) { first = false; run(); } }, { threshold: 0.35 }).observe(cv);
})();
