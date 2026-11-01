/* CellProof report, part 6: the recording mode. Open the page with #video, start the screen recorder, press the button (or Space), and the page
   performs the three minutes of docs/video_script.md by itself: the header's beats in the order of the script, the demo (a little faster, so
   that it fits), the search engine with two profiles, and the limits. Short captions stay on screen for anyone watching without sound. Every
   number in them is read from the same data as the page. Esc stops it. Nothing here changes what the page says or computes. */
(() => {
  if (!window.CPBench || !window.CPHero) return;
  const SPEED = 1.45, root = document.documentElement, ids = [];
  const SB = D.search, P = SB ? SB.profiles : [];
  const offered = (p) => CP.num([...p.verdicts].filter((c) => c !== "-").length), profile = (gene) => P.findIndex((p) => p.forced.length === 1 && p.forced[0][0] === gene);
  const genes = D.networks.published.nodes.length;

  const bar = document.createElement("div"), cap = document.createElement("div"), count = document.createElement("div");
  bar.className = "vid-bar"; cap.className = "vid-cap"; count.className = "vid-count";
  bar.innerHTML = '<button type="button" class="btn primary" id="vidGo">● Start the take (Space)</button><span>Start your screen recorder first. Esc stops. Keep the pointer off the window.</span>';
  /* #card: a closing card, a still to record for the last seconds of the video */
  const card = document.createElement("div");
  card.className = "vid-card"; card.innerHTML = "<b>CellProof</b><span>LLM-proposed rules, solver-verified.</span><small>github.com/scoobydoobydrew/meta_ai_hackathon</small>";
  document.body.append(bar, cap, count, card);
  const say = (text, top) => { cap.textContent = text || ""; cap.classList.toggle("show", !!text); cap.classList.toggle("top", !!top); };
  const click = (sel, i) => { const el = $$(sel)[i]; if (el) el.click(); };
  const scrollTo = (sel, gap = 0) => window.scrollTo({ top: $(sel).getBoundingClientRect().top + scrollY - gap, behavior: "smooth" });  /* `gap`: room kept above for a caption */

  const p53 = profile("p53"), wip = profile("Wip1"), demoStart = 76, demoEnd = demoStart + CPBench.seconds / SPEED + 1.5;
  const beat = (n) => () => CPHero.show(n);
  /* the search engine and the limits, from second `t0` of a take */
  const searchPart = (t0) => (SB ? [
    [t0, () => { say(`The solver's whole search on one board: ${offered(P[0])} sets of one or two changes, ${P[0].found.length} kept.`, true); scrollTo("#sx", 130); }],
    ...(p53 >= 0 ? [[t0 + 9, () => { click("#sxProfiles .sx-chip", p53); say(`p53 lost: ${offered(P[p53])} sets tried, ${P[p53].found.length ? P[p53].found.length + " kept" : "none leaves only death"}.`, true); }]] : []),
    ...(wip >= 0 ? [[t0 + 17, () => { click("#sxProfiles .sx-chip", wip); const other = P[wip].found.every((i) => !P[0].found.includes(i)); say(`WIP1 high: ${P[wip].found.length} kept${other ? ", a different one from the model cell's" : ""}.`, true); }]] : []),
    [t0 + 25, () => { say("Limits, plainly: a model of a cell, not of a person. Hypotheses for the lab.", true); scrollTo("#limits", 130); }],
  ] : []);
  /* seconds from the start of the take; the beats are the header's own, in the order of the script */
  const take = [
    [0, () => { scrollTo("#top"); CPHero.pin(true); CPHero.show(0); say(`Before this week: a published ${genes}-gene model of the DNA damage response, open papers, open-source solvers. Built this week: an agent where Muse Spark reads the papers and an exact solver decides.`); }],
    [13, () => say("")], [14, beat(1)], [20, beat(2)], [27, beat(3)], [36, beat(4)], [46, beat(5)], [56, beat(6)], [66, beat(7)],
    [demoStart, () => { CPHero.pin(false); CPBench.play(SPEED); }],
    ...searchPart(demoEnd),
  ];
  /* #video-short: the take that follows #intro-short, which has already said what the project is: the tumour, the samples, the demo a little faster, the search, the limits */
  const SPEED2 = 1.6, startDemo2 = 20, takeShort = [
    [0, () => { scrollTo("#top"); CPHero.pin(true); CPHero.show(6); }], [10, beat(7)],
    [startDemo2, () => { CPHero.pin(false); CPBench.play(SPEED2); }],
    ...searchPart(startDemo2 + CPBench.seconds / SPEED2 + 1.5),
  ];

  /* ---- the opening: a background of its own for each idea, drawn here (nothing is a picture of data), one line of words at a time, slower than the
     take. #intro-short is about 40 seconds (for the start of the three minutes), #intro about 100 (a cut of its own, which also explains the idea).
     Nothing here states a result; it ends on the sentence that says what pre-existed and what was built this week. */
  const TERM_EN = "<b>Solitary conviction</b>A state where you believe in something without having evidence that it would work.";
  const TERM_EL = "<b>Solitary conviction</b>Η κατάσταση όπου πιστεύεις σε κάτι χωρίς να έχεις απόδειξη ότι θα δουλέψει.";
  const EN = {
    short: [[0, "There is a feeling you get when you believe in something <em>before anyone else does.</em>", "crowd"], [7.5, TERM_EN, "dna", "term"], [16, "Before there is <em>proof.</em>", "trail"],
      [21, "We felt it at the start of this hackathon: a platform that looked <em>impossible</em> to build in one week.", "week"], [30, "And yet, here we are.", "leap"]],
    full: [[0, "Biology is drowning in <em>noise.</em>", "noise"], [4.5, "A flood of papers. Endless experiments. Too many gene switches to <em>ever try them all.</em>", "noise"], [10.5, "Trial and error is not enough.", "noise"],
      [15.5, "There is a feeling you get when you believe in something <em>before anyone else does.</em>", "crowd"], [23, TERM_EN, "dna", "term"], [31, "Before there is <em>proof.</em>", "trail"],
      [36, "We felt it at the start of this hackathon: a platform that looked <em>impossible</em> to build in one week.", "week"], [45, "And yet, here we are.", "leap"],
      [51.5, "A cell is a <em>circuit.</em> Genes switch each other on and off.", "circuit"], [56.5, `${genes} genes, each on or off: a logic circuit that can be checked.`, "circuit"],
      [61.5, "But the circuit is incomplete. The papers know links that it is missing.", "circuit-link"], [67, "An AI can read the papers. It cannot tell whether a new link <em>breaks</em> the circuit.", "circuit-link"],
      [73, "An exact solver can check the circuit. It cannot <em>read.</em>", "circuit-scan"], [78.5, "CellProof joins them. The AI proposes. The solver <em>decides.</em>", "circuit-scan"],
      [84, "What is left is tested on a virtual tumour.", "tumour"], [89, "We did not find a cure for cancer. We built a way to ask <em>how</em>, exactly.", "dna"]],
    what: ["A cell is a circuit of genes that switch each other on and off.", "An AI reads the papers and proposes what the circuit is missing.", "An exact solver checks every proposal and rejects what breaks it.",
      "What survives is tested on a virtual tumour, and asked again for tumours with different genes."],
    tag: "From shared uncertainty to solitary conviction.",
    cap: `Before this week: a published ${genes}-gene model, open papers, open-source solvers. This week: an agent where Muse Spark reads the papers and an exact solver decides. Hypotheses for the lab, not treatments.`,
  };
  const EL = {
    short: [[0, "Υπάρχει ένα συναίσθημα όταν πιστεύεις σε κάτι <em>πριν από κάθε άλλον.</em>", "crowd"], [7.5, TERM_EL, "dna", "term"], [16, "Πριν υπάρξει <em>απόδειξη.</em>", "trail"],
      [21, "Το νιώσαμε στην αρχή αυτού του hackathon: μια πλατφόρμα που φάνταζε <em>αδύνατο</em> να χτιστεί σε μία εβδομάδα.", "week"], [30, "Κι όμως, είμαστε εδώ.", "leap"]],
    full: [[0, "Η βιολογία πνίγεται στον <em>θόρυβο.</em>", "noise"], [4.5, "Χείμαρρος άρθρων. Ατελείωτα πειράματα. Υπερβολικά πολλοί συνδυασμοί γονιδίων για να τους <em>δοκιμάσεις όλους.</em>", "noise"], [10.5, "Η δοκιμή και το λάθος δεν αρκούν.", "noise"],
      [15.5, "Υπάρχει ένα συναίσθημα όταν πιστεύεις σε κάτι <em>πριν από κάθε άλλον.</em>", "crowd"], [23, TERM_EL, "dna", "term"], [31, "Πριν υπάρξει <em>απόδειξη.</em>", "trail"],
      [36, "Το νιώσαμε στην αρχή αυτού του hackathon: μια πλατφόρμα που φάνταζε <em>αδύνατο</em> να χτιστεί σε μία εβδομάδα.", "week"], [45, "Κι όμως, είμαστε εδώ.", "leap"],
      [51.5, "Ένα κύτταρο είναι ένα <em>κύκλωμα.</em> Τα γονίδια ανάβουν και σβήνουν το ένα το άλλο.", "circuit"], [56.5, `${genes} γονίδια, το καθένα αναμμένο ή σβηστό: ένα λογικό κύκλωμα που μπορεί να ελεγχθεί.`, "circuit"],
      [61.5, "Αλλά το κύκλωμα είναι ελλιπές. Τα papers ξέρουν συνδέσεις που του λείπουν.", "circuit-link"], [67, "Ένα AI μπορεί να διαβάσει τα papers. Δεν ξέρει αν μια νέα σύνδεση <em>χαλάει</em> το κύκλωμα.", "circuit-link"],
      [73, "Ένας ακριβής solver μπορεί να ελέγξει το κύκλωμα. Δεν μπορεί να <em>διαβάσει.</em>", "circuit-scan"], [78.5, "Το CellProof τους ενώνει. Το AI προτείνει. Ο solver <em>αποφασίζει.</em>", "circuit-scan"],
      [84, "Ό,τι μένει δοκιμάζεται σε έναν εικονικό όγκο.", "tumour"], [89, "Δεν βρήκαμε τη θεραπεία του καρκίνου. Φτιάξαμε έναν τρόπο να ρωτάμε <em>πώς</em>, με ακρίβεια.", "dna"]],
    what: ["Ένα κύτταρο είναι ένα κύκλωμα γονιδίων που ανάβουν και σβήνουν το ένα το άλλο.", "Ένα AI διαβάζει τα papers και προτείνει ό,τι λείπει από το κύκλωμα.", "Ένας ακριβής solver ελέγχει κάθε πρόταση και απορρίπτει όσες χαλάνε το κύκλωμα.",
      "Ό,τι επιβιώνει δοκιμάζεται σε έναν εικονικό όγκο, και ξαναρωτιέται για όγκους με διαφορετικά γονίδια."],
    tag: "From shared uncertainty to solitary conviction.",
    cap: `Πριν από αυτή την εβδομάδα: ένα δημοσιευμένο μοντέλο ${genes} γονιδίων, ανοιχτά papers, solvers ανοιχτού κώδικα. Αυτή την εβδομάδα: ένας agent όπου το Muse Spark διαβάζει τα papers και ένας ακριβής solver αποφασίζει. Υποθέσεις για το εργαστήριο, όχι θεραπείες.`,
  };
  const lines = document.createElement("div"), fl = document.createElement("div"), art = document.createElement("canvas"), actx = art.getContext("2d");
  lines.className = "vid-lines"; fl.className = "vid-flash"; art.className = "vid-art"; art.hidden = true; document.body.append(art, lines, fl);

  /* the backgrounds: each is drawn for the idea of its line, in the manner of glowing renders (a nebula, a luminous helix, a network of lit cells).
     noise: red points that flicker. crowd: a stream of points and one that stays. dna: a helix in a nebula. trail: one point walks into the dark.
     week: seven days fill one by one. leap: IMPOSSIBLE loses its first two letters and the point crosses the gap. circuit: a network with signals, with a
     new link, with a scan. tumour: the simulation's own cells (the only picture here that is data). */
  let scene = "", st0 = 0, raf = 0, W = 0, H = 0, pack = null;
  const rnd = (() => { let x = 7; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();
  const dots = Array.from({ length: 320 }, () => ({ x: rnd(), y: rnd(), v: 0.012 + rnd() * 0.04, r: 1 + rnd() * 2.2, p: rnd() * 6.28 }));
  const CLOUDS = Array.from({ length: 7 }, (_, i) => ({ x: rnd(), y: rnd(), r: 0.22 + rnd() * 0.3, c: [[120, 80, 255], [255, 80, 170], [60, 170, 255], [150, 90, 230]][i % 4], p: rnd() * 6.28, s: 0.03 + rnd() * 0.05 }));
  const STARS = Array.from({ length: 160 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.3, p: rnd() * 6.28 }));
  const NODES = Array.from({ length: 18 }, (_, i) => ({ x: ((i % 6) + 0.5 + (rnd() - 0.5) * 0.7) / 6, y: (Math.floor(i / 3 / 2) + 0.5 + (rnd() - 0.5) * 0.7) / 3 }));
  const EDGES = (() => {
    const out = [], seen = new Set();
    NODES.forEach((a, i) => NODES.map((b, j) => [j, Math.hypot(a.x - b.x, (a.y - b.y) * 0.6)]).filter(([j]) => j !== i).sort((u, v) => u[1] - v[1]).slice(0, 2).forEach(([j]) => {
      const k = i < j ? `${i}-${j}` : `${j}-${i}`; if (!seen.has(k)) { seen.add(k); out.push([i, j, (rnd() - 0.5) * 0.35, rnd()]); }
    }));
    return out;
  })(), LINK = [2, 15], CROWD2 = [[190, 182, 232], [92, 158, 255], [232, 192, 72], [58, 214, 168], [255, 110, 186]].map((c) => rgba(c, 0.95)), sans = css("--sans") || "sans-serif";
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3), clamp = (x) => Math.min(1, Math.max(0, x));
  const bg = (c1, c2) => { const g = actx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.72); g.addColorStop(0, c1); g.addColorStop(1, c2); actx.fillStyle = g; actx.fillRect(0, 0, W, H); };
  const glow = (x, y, r, a) => { const g = actx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,196,150,${a})`); g.addColorStop(1, "rgba(255,196,150,0)"); actx.fillStyle = g; actx.beginPath(); actx.arc(x, y, r, 0, 6.2832); actx.fill(); };
  function nebula(t, k) {
    actx.fillStyle = "#06061a"; actx.fillRect(0, 0, W, H); actx.globalCompositeOperation = "lighter";
    for (const c of CLOUDS) {
      const x = (c.x + Math.sin(t * c.s + c.p) * 0.05) * W, y = (c.y + Math.cos(t * c.s * 1.3 + c.p) * 0.05) * H, r = c.r * Math.max(W, H), g = actx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${c.c},${0.24 * k})`); g.addColorStop(1, `rgba(${c.c},0)`); actx.fillStyle = g; actx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    actx.globalCompositeOperation = "source-over";
    for (const s of STARS) { actx.fillStyle = `rgba(255,255,255,${0.2 + 0.45 * Math.abs(Math.sin(t * 0.8 + s.p))})`; actx.beginPath(); actx.arc(s.x * W, s.y * H, s.r, 0, 6.2832); actx.fill(); }
  }
  function helix(t) {  /* two luminous strands and their rungs, slowly turning, across the nebula */
    actx.save(); actx.translate(W * 0.5, H * 0.5); actx.rotate(-0.42); actx.globalCompositeOperation = "lighter"; actx.lineCap = "round";
    const len = Math.hypot(W, H) * 1.05, amp = Math.min(H * 0.17, 150), N = 120, ph = t * 0.9, pt = (s, k) => [(s - 0.5) * len, Math.sin(s * 22 + ph + k * Math.PI) * amp, Math.cos(s * 22 + ph + k * Math.PI)];
    for (let i = 0; i < N; i += 2) { const a = pt(i / N, 0), b = pt(i / N, 1); actx.strokeStyle = `rgba(255,255,255,${0.08 + 0.2 * Math.abs(a[2])})`; actx.lineWidth = 2; actx.beginPath(); actx.moveTo(a[0], a[1]); actx.lineTo(b[0], b[1]); actx.stroke(); }
    for (let k = 0; k < 2; k++) {
      const col = k ? "255,90,200" : "80,200,255"; actx.strokeStyle = `rgba(${col},.95)`; actx.shadowColor = `rgba(${col},1)`; actx.shadowBlur = 22; actx.lineWidth = 4; actx.beginPath();
      for (let i = 0; i <= N; i++) { const q = pt(i / N, k); if (i) actx.lineTo(q[0], q[1]); else actx.moveTo(q[0], q[1]); }
      actx.stroke(); actx.shadowBlur = 0;
    }
    actx.restore();
  }
  function circuit(t, mode) {  /* a network of lit cells: signals run along its links; `link` grows a new one; `scan` checks the links from left to right */
    nebula(t, 0.5); actx.globalCompositeOperation = "lighter"; actx.lineCap = "round";
    const sx = mode === "scan" ? clamp(t / 5.5) * W : -1, green = (x) => sx >= 0 && x < sx, P0 = (n) => [NODES[n].x * W, NODES[n].y * H];
    const path = (e) => { const [x1, y1] = P0(e[0]), [x2, y2] = P0(e[1]); return [x1, y1, (x1 + x2) / 2 + (y2 - y1) * e[2], (y1 + y2) / 2 - (x2 - x1) * e[2], x2, y2]; };
    const at = (q, s) => { const u = 1 - s; return [u * u * q[0] + 2 * u * s * q[2] + s * s * q[4], u * u * q[1] + 2 * u * s * q[3] + s * s * q[5]]; };
    for (const e of EDGES) {
      const q = path(e), ok = green((q[0] + q[4]) / 2), c = ok ? "90,240,170" : "60,170,255";
      actx.beginPath(); actx.moveTo(q[0], q[1]); actx.quadraticCurveTo(q[2], q[3], q[4], q[5]); actx.strokeStyle = `rgba(${c},.14)`; actx.lineWidth = 9; actx.stroke(); actx.strokeStyle = `rgba(${c},.6)`; actx.lineWidth = 1.6; actx.stroke();
      const [x, y] = at(q, (t * 0.3 + e[3]) % 1); actx.fillStyle = ok ? "rgba(200,255,230,.95)" : "rgba(170,225,255,.95)"; actx.beginPath(); actx.arc(x, y, 2.8, 0, 6.2832); actx.fill();
    }
    if (mode === "link" || mode === "scan") {
      const q = path([LINK[0], LINK[1], 0.2]), k = mode === "scan" ? 1 : clamp((t - 0.8) / 3.2), ok = green((q[0] + q[4]) / 2);
      actx.setLineDash([10, 10]); actx.strokeStyle = ok ? "rgba(90,240,170,.95)" : "rgba(255,196,150,.95)"; actx.lineWidth = 3; actx.beginPath();
      for (let s = 0; s <= k + 1e-6; s += 0.02) { const [x, y] = at(q, s); if (s) actx.lineTo(x, y); else actx.moveTo(x, y); }
      actx.stroke(); actx.setLineDash([]);
    }
    NODES.forEach((n, i) => {
      const [x, y] = P0(i), pulse = 0.7 + 0.3 * Math.sin(t * 2 + i), c = green(x) ? "90,240,170" : "255,90,190", g = actx.createRadialGradient(x, y, 0, x, y, 38);
      g.addColorStop(0, `rgba(${c},${0.55 * pulse})`); g.addColorStop(1, `rgba(${c},0)`); actx.fillStyle = g; actx.beginPath(); actx.arc(x, y, 38, 0, 6.2832); actx.fill();
      actx.fillStyle = "rgba(255,255,255,.95)"; actx.beginPath(); actx.arc(x, y, 3.4, 0, 6.2832); actx.fill();
    });
    if (sx >= 0 && sx < W) { const g = actx.createLinearGradient(sx - 120, 0, sx + 3, 0); g.addColorStop(0, "rgba(120,220,255,0)"); g.addColorStop(1, "rgba(220,250,255,.9)"); actx.fillStyle = g; actx.fillRect(sx - 120, 0, 123, H); }
    actx.globalCompositeOperation = "source-over";
  }
  function days(t) {  /* seven days, filling one by one */
    const sz = Math.min(W * 0.085, 96), gap = sz * 0.4, x0 = (W - (7 * sz + 6 * gap)) / 2, y = H * 0.76 - sz / 2, prog = 7 * clamp(t / 7);
    for (let i = 0; i < 7; i++) {
      const x = x0 + i * (sz + gap), k = clamp(prog - i);
      if (k > 0) { glow(x + sz / 2, y + sz / 2, sz * 1.4, 0.5 * k); actx.fillStyle = `rgba(255,196,150,${0.9 * k})`; actx.fillRect(x, y, sz, sz); }
      actx.strokeStyle = "rgba(255,255,255,.45)"; actx.lineWidth = 2; actx.strokeRect(x, y, sz, sz);
      actx.fillStyle = k > 0.5 ? "#1c1b30" : "rgba(255,255,255,.7)"; actx.font = `600 ${sz * 0.3}px ${sans}`; actx.textAlign = "center"; actx.fillText(String(i + 1), x + sz / 2, y + sz * 0.62);
    }
  }
  function leap(t) {  /* a dusk, two cliffs, IMPOSSIBLE: its first two letters tip into the gap, and the point crosses it and lights what is left */
    const g = actx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b0a26"); g.addColorStop(0.5, "#4b2b66"); g.addColorStop(0.78, "#e48c6c"); g.addColorStop(1, "#ffd3a4"); actx.fillStyle = g; actx.fillRect(0, 0, W, H);
    for (const s of STARS.slice(0, 70)) { actx.fillStyle = `rgba(255,255,255,${0.4 * (1 - s.y)})`; actx.fillRect(s.x * W, s.y * H * 0.5, s.r, s.r); }
    glow(W * 0.62, H * 0.7, Math.min(W, H) * 0.6, 0.95);
    const base = H * 0.76, size = Math.min(W * 0.075, H * 0.17); actx.font = `800 ${size}px ${sans}`; actx.textBaseline = "alphabetic"; actx.textAlign = "left";
    const wIM = actx.measureText("IM").width, wP = actx.measureText("POSSIBLE").width, xP = W * 0.46, xR = xP - W * 0.012, xL = xR - W * 0.2, xIM = xL - wIM - W * 0.012, land = 4.3, ign = clamp((t - land) / 0.9);
    actx.fillStyle = "#05050f";
    actx.beginPath(); actx.moveTo(0, H); actx.lineTo(0, base); actx.lineTo(xL, base); actx.quadraticCurveTo(xL + W * 0.008, base + H * 0.1, xL - W * 0.03, H); actx.fill();
    actx.beginPath(); actx.moveTo(xR, base); actx.lineTo(W, base - H * 0.02); actx.lineTo(W, H); actx.lineTo(xR - W * 0.03, H); actx.quadraticCurveTo(xR + W * 0.006, base + H * 0.12, xR, base); actx.fill();
    actx.save(); actx.fillStyle = `rgb(${(5 + 250 * ign) | 0},${(5 + 195 * ign) | 0},${(15 + 135 * ign) | 0})`; if (ign > 0) { actx.shadowColor = "rgba(255,196,150,.9)"; actx.shadowBlur = 30 * ign; } actx.fillText("POSSIBLE", xP, base); actx.restore();
    const tip = clamp((t - 1.3) / 0.9), fall = Math.max(0, t - 2.2);
    actx.save(); actx.translate(xIM + wIM + fall * 60, base + fall * fall * 380); actx.rotate(ease(tip) * 1.25 + fall * fall * 0.9); actx.fillStyle = "#05050f"; actx.fillText("IM", -wIM, 0); actx.restore();
    const sx = xL - W * 0.03, sy = base - 9, ex = xP + wP * 0.46, ey = base - size - 12, k = clamp((t - 2) / 2.3), px = sx + (ex - sx) * ease(k), py = sy + (ey - sy) * k - Math.sin(k * Math.PI) * H * 0.3;
    glow(px, py, 60 + 12 * Math.sin(t * 6), 0.9); actx.fillStyle = "#fff3e6"; actx.beginPath(); actx.arc(px, py, 8, 0, 6.2832); actx.fill();
    if (t > land && t < land + 1.2) { const r = (t - land) / 1.2; actx.strokeStyle = `rgba(255,220,180,${1 - r})`; actx.lineWidth = 3; actx.beginPath(); actx.arc(ex, ey, 20 + r * 260, 0, 6.2832); actx.stroke(); }
  }
  function tumour(t) {  /* the cells of the simulation, 72 hours after radiation, played once */
    nebula(t, 0.5);
    if (pack === null) { const TS = D.tissue, c = TS && TS.conditions.find((x) => x.name === "radiation_only" && x.frames); pack = c ? { tf: tissueFrames(TS), c } : false; }
    if (!pack) return;
    const rad = Math.min(W, H) * 0.36, cx = W * 0.5, cy = H * 0.5;
    actx.beginPath(); actx.arc(cx, cy, rad * 1.04, 0, 6.2832); actx.fillStyle = "rgba(120,108,196,.14)"; actx.fill(); actx.strokeStyle = "rgba(255,255,255,.3)"; actx.lineWidth = 2; actx.stroke();
    drawCrowd(actx, pack.tf, pack.c, clamp(t / 6) * (pack.c.times.length - 1), cx, cy, rad, CROWD2, "rgba(255,255,255,.12)");
  }
  function drawArt(t) {
    actx.clearRect(0, 0, W, H);
    if (scene === "noise") {
      bg("#2a0610", "#050003");
      for (const d of dots) { actx.fillStyle = `rgba(255,${80 + ((d.p * 20) | 0)},90,${0.1 + 0.55 * Math.abs(Math.sin(t * 3.2 + d.p * 9))})`; actx.fillRect(d.x * W, d.y * H, d.r * 1.6, d.r * 1.6); }
      for (let i = 0; i < 5; i++) { const y = (t * 90 + i * 211) % H; actx.fillStyle = "rgba(255,60,80,.06)"; actx.fillRect(0, y, W, 3 + (i % 3) * 3); }
    } else if (scene === "crowd") {
      nebula(t, 0.8);
      for (const d of dots) { const x = ((d.x + t * d.v) % 1) * W, y = d.y * H + Math.sin(t * 0.8 + d.p) * 10; actx.fillStyle = "rgba(190,182,232,.38)"; actx.beginPath(); actx.arc(x, y, d.r, 0, 6.2832); actx.fill(); }
      const cx = W * 0.5, cy = H * 0.5, ring = (t % 2.6) / 2.6;
      actx.strokeStyle = `rgba(255,196,150,${0.5 * (1 - ring)})`; actx.lineWidth = 2; actx.beginPath(); actx.arc(cx, cy, 20 + ring * Math.min(W, H) * 0.42, 0, 6.2832); actx.stroke();
      glow(cx, cy, 70 + 10 * Math.sin(t * 2), 0.8); actx.fillStyle = "#ffe2c8"; actx.beginPath(); actx.arc(cx, cy, 8, 0, 6.2832); actx.fill();
    } else if (scene === "dna") {
      nebula(t, 1); helix(t);
    } else if (scene === "trail") {
      nebula(t, 0.6);
      const x0 = W * 0.22, x1 = x0 + W * 0.46 * ease(t / 5), y = H * 0.5;
      actx.setLineDash([12, 12]); actx.strokeStyle = "rgba(255,196,150,.55)"; actx.lineWidth = 2; actx.beginPath(); actx.moveTo(x0, y); actx.lineTo(x1, y); actx.stroke(); actx.setLineDash([]);
      glow(x1, y, 80 + 10 * Math.sin(t * 3), 0.85); actx.fillStyle = "#ffe2c8"; actx.beginPath(); actx.arc(x1, y, 8, 0, 6.2832); actx.fill();
      const f = actx.createLinearGradient(x1, 0, W, 0); f.addColorStop(0, "rgba(3,3,12,0)"); f.addColorStop(0.35, "rgba(3,3,12,.92)"); actx.fillStyle = f; actx.fillRect(x1, 0, W - x1, H);
    } else if (scene === "week") {
      nebula(t, 0.7); days(t);
    } else if (scene === "leap") {
      leap(t);
    } else if (scene.startsWith("circuit")) {
      circuit(t, scene.slice(8));
    } else if (scene === "tumour") {
      tumour(t);
    }
  }
  function artLoop() { raf = 0; if (!scene) return; drawArt((performance.now() - st0) / 1000); raf = requestAnimationFrame(artLoop); }
  const setArt = (name) => {
    if (name === scene) return;
    scene = name; st0 = performance.now(); art.hidden = !name;
    if (name) { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; art.width = W * d; art.height = H * d; actx.setTransform(d, 0, 0, d, 0, 0); if (!raf) artLoop(); }
  };

  let cutId = 0;
  const flash = (dark) => { fl.classList.toggle("dark", !!dark); fl.classList.remove("go"); void fl.offsetWidth; fl.classList.add("go"); };
  const showLine = (html, big, warn, kind) => {
    clearTimeout(cutId); lines.innerHTML = ""; lines.classList.toggle("warn", !!warn); lines.classList.toggle("art", !!scene);
    if (!html) return;
    const mol = $("#heroMol"); mol.classList.remove("jolt"); void mol.offsetWidth; if (!reduced) mol.classList.add("jolt");
    if (!big) flash(true);
    cutId = setTimeout(() => { lines.innerHTML = kind === "card" ? html : `<p class="${big ? "big" : ""} ${kind || ""}">${html}</p>`; }, reduced ? 0 : 140);  /* a black frame between two lines */
  };
  const introPlan = (short) => {
    const set = CP.lang() === "el" ? EL : EN, src = short ? set.short : set.full, tail = src[src.length - 1][0] + 6.5;
    const title = `CellProof<small>${set.tag}</small>`, card = `<div class="cardbox"><p class="big compact">${title}</p><ol class="what">${set.what.map((w) => `<li>${w}</li>`).join("")}</ol></div>`;
    return [[0, () => { scrollTo("#top"); CPHero.pin(true); CPHero.show(0); root.classList.add("vid-intro", "vid-zoom"); }],
      ...src.map(([t, html, sc, kind]) => [t, () => { setArt(sc || ""); showLine(html, false, sc === "noise", kind); }]),
      [tail, () => { setArt(short ? "circuit" : "dna"); flash(); lines.classList.remove("warn"); showLine(short ? card : title, !short, false, short ? "card" : ""); say(set.cap); }]];
  };
  const end = take[take.length - 1][0] + 5, endShort = takeShort[takeShort.length - 1][0] + 5;  /* the last ten seconds of the video are the terminal, recorded apart */

  function stopTake(done) {
    ids.splice(0).forEach(clearTimeout); CPBench.stop(); CPHero.pin(false); say(""); count.textContent = ""; root.classList.remove("vid", "vid-intro", "vid-zoom"); showLine(""); setArt(""); fl.classList.remove("go");
    bar.hidden = false; if (done) say("");
  }
  function start() {
    if (root.classList.contains("vid")) return;
    root.classList.add("vid"); bar.hidden = true;
    [3, 2, 1].forEach((n, i) => ids.push(setTimeout(() => { count.textContent = String(n); }, i * 1000)));
    ids.push(setTimeout(() => {
      count.textContent = "";
      const hash = location.hash, intro = hash.startsWith("#intro"), plan = intro ? introPlan(hash === "#intro-short") : hash === "#video-short" ? takeShort : take, stopAt = intro ? plan[plan.length - 1][0] + (hash === "#intro-short" ? 16 : 7) : hash === "#video-short" ? endShort : end;
      plan.forEach(([s, fn]) => ids.push(setTimeout(fn, s * 1000)));
      ids.push(setTimeout(() => { stopTake(true); scrollTo("#top"); }, stopAt * 1000));
    }, 3000));
  }
  $("#vidGo").addEventListener("click", start);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("vid")) stopTake();
    else if (e.code === "Space" && /^#(video|intro)/.test(location.hash) && !root.classList.contains("vid") &&!/^(BUTTON|INPUT|TEXTAREA|A)$/.test(document.activeElement.tagName)) { e.preventDefault(); start(); }
  });
  /* the buttons exist only in the recording mode: #video in the address */
  const sync = () => { card.hidden = location.hash !== "#card"; const on = /^#(video|intro)/.test(location.hash); bar.hidden = !on || root.classList.contains("vid"); if (!on && root.classList.contains("vid")) stopTake(); };
  addEventListener("hashchange", sync); sync();
})();
