/* CellProof report, part 6: the recording mode. Open the page with #video, start the screen recorder, press the button (or Space), and the page
   performs the three minutes of docs/video_script.md by itself: the header's beats in the order of the script, the demo (a little faster, so
   that it fits), the search engine with the model cell and the p53 profile, and the three cards of what this is and is not. Short captions stay on screen for anyone watching without sound. Every
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

  const p53 = profile("p53"), demoStart = 76, demoEnd = demoStart + CPBench.seconds / SPEED + 1.5;
  const beat = (n) => () => CPHero.show(n);
  /* the search engine and the three cards of what this is and is not (the limits themselves wait behind the technical door), from second `t0` of a take */
  const searchPart = (t0) => (SB ? [
    [t0, () => { say(`The solver's whole search on one board: ${offered(P[0])} sets of one or two changes, ${P[0].found.length} kept.`, true); scrollTo("#sx", 130); }],
    ...(p53 >= 0 ? [[t0 + 9, () => { click("#sxProfiles .sx-chip", p53); say(`p53 lost: ${offered(P[p53])} sets tried, ${P[p53].found.length ? P[p53].found.length + " kept" : "none leaves only death"}.`, true); }]] : []),
    [t0 + 17, () => { say("Limits, plainly: a model of a cell, not of a person. Hypotheses for the lab.", true); scrollTo("#honest", 90); }],
  ] : []);
  /* seconds from the start of the take; the beats are the header's own, in the order of the script */
  const take = [
    [0, () => { scrollTo("#top"); CPHero.pin(true); CPHero.show(0); say(`Before this week: a published ${genes}-gene model of the DNA damage response, open papers, open-source solvers. Built this week: an agent where Muse Spark reads the papers and an exact solver decides.`); }],
    [13, () => say("")], [14, beat(1)], [20, beat(2)], [27, beat(3)], [36, beat(4)], [46, beat(5)], [56, beat(6)], [66, beat(7)],
    [demoStart, () => { CPHero.pin(false); CPBench.play(SPEED); }],
    ...searchPart(demoEnd),
  ];
  /* #video-short: the take that follows #intro-short, which has already said what the project is: the tumour, the samples, the demo a little faster, the search, the three cards of what this is and is not */
  const SPEED2 = 1.5, startDemo2 = 16, takeShort = [
    [0, () => { scrollTo("#top"); CPHero.pin(true); CPHero.show(6); }], [8, beat(7)],
    [startDemo2, () => { CPHero.pin(false); CPBench.play(SPEED2); }],
    ...searchPart(startDemo2 + CPBench.seconds / SPEED2 + 1.5),
  ];

  /* ---- the opening: a background of its own for each idea, drawn here (nothing is a picture of data), one line of words at a time, slower than the
     take. #intro-short is about 40 seconds (for the start of the three minutes), #intro about 100 (a cut of its own, which also explains the idea).
     Nothing here states a result; it ends on the sentence that says what pre-existed and what was built this week. */
  const TERM_EN = "<b>Solitary conviction</b>A state where you believe in something without having evidence that it would work.";
  const TERM_EL = "<b>Solitary conviction</b>Η κατάσταση όπου πιστεύεις σε κάτι χωρίς να έχεις απόδειξη ότι θα δουλέψει.";
  const STARS_EN = "We aimed for the <em>stars:</em> a cure for cancer.", MOON_EN = "We landed on the <em>moon:</em> a platform that helps labs choose which tests to run first.<small>A small step on the way.</small>";
  const STARS_EL = "Στοχεύσαμε στα <em>αστέρια:</em> τη θεραπεία του καρκίνου.", MOON_EL = "Προσγειωθήκαμε στη <em>Σελήνη:</em> μια πλατφόρμα που βοηθά τα εργαστήρια να διαλέξουν ποιες δοκιμές να τρέξουν πρώτες.<small>Ένα μικρό βήμα στον δρόμο.</small>";
  const EN = {
    short: [[0, "There is a feeling you get when you believe in something <em>before anyone else does.</em>", "cosmos"], [7.5, TERM_EN, "dna", "term"],
      [16, "We felt it at the start of this hackathon: a platform that looked <em>impossible</em> to build in one week.", "week"],
      [25, STARS_EN, "moon"], [28.2, MOON_EN, "moon"]],
    full: [[0, "Biology is drowning in <em>noise.</em>", "noise"], [4.5, "A flood of papers. Endless experiments. Too many gene switches to <em>ever try them all.</em>", "noise"], [10.5, "Trial and error is not enough.", "noise"],
      [15.5, "There is a feeling you get when you believe in something <em>before anyone else does.</em>", "cosmos"], [23, TERM_EN, "dna", "term"],
      [31, "We felt it at the start of this hackathon: a platform that looked <em>impossible</em> to build in one week.", "week"],
      [40, STARS_EN, "moon"], [43.2, MOON_EN, "moon"],
      [49.7, "A cell is a <em>circuit.</em> Genes switch each other on and off.", "circuit"], [54.7, `${genes} genes, each on or off: a logic circuit that can be checked.`, "circuit"],
      [59.7, "But the circuit is incomplete. The papers know links that it is missing.", "circuit-link"], [65.2, "An AI can read the papers. It cannot tell whether a new link <em>breaks</em> the circuit.", "circuit-link"],
      [71.2, "An exact solver can check the circuit. It cannot <em>read.</em>", "circuit-scan"], [76.7, "CellProof joins them. The AI proposes. The solver <em>decides.</em>", "circuit-scan"],
      [82.2, "What is left is tested on a virtual tumour.", "tumour"], [87.2, "We did not find a cure for cancer. We built a way to ask <em>how</em>, exactly.", "dna"]],
    what: [["The field", "Cancer biology: how cells respond to radiation."], ["The problem", "Cell models are incomplete, and nobody can check every idea from the papers by hand."],
      ["How it helps", "An AI proposes, an exact solver checks, and researchers get candidates to test in the lab."]],
    tag: "From shared uncertainty to solitary conviction.",
    cap: `Before this week: a published ${genes}-gene model, open papers, open-source solvers. This week: an agent where Muse Spark reads the papers and an exact solver decides. Hypotheses for the lab, not treatments.`,
  };
  const EL = {
    short: [[0, "Υπάρχει ένα συναίσθημα όταν πιστεύεις σε κάτι <em>πριν από κάθε άλλον.</em>", "cosmos"], [7.5, TERM_EL, "dna", "term"],
      [16, "Το νιώσαμε στην αρχή αυτού του hackathon: μια πλατφόρμα που φάνταζε <em>αδύνατο</em> να χτιστεί σε μία εβδομάδα.", "week"],
      [25, STARS_EL, "moon"], [28.2, MOON_EL, "moon"]],
    full: [[0, "Η βιολογία πνίγεται στον <em>θόρυβο.</em>", "noise"], [4.5, "Χείμαρρος άρθρων. Ατελείωτα πειράματα. Υπερβολικά πολλοί συνδυασμοί γονιδίων για να τους <em>δοκιμάσεις όλους.</em>", "noise"], [10.5, "Η δοκιμή και το λάθος δεν αρκούν.", "noise"],
      [15.5, "Υπάρχει ένα συναίσθημα όταν πιστεύεις σε κάτι <em>πριν από κάθε άλλον.</em>", "cosmos"], [23, TERM_EL, "dna", "term"],
      [31, "Το νιώσαμε στην αρχή αυτού του hackathon: μια πλατφόρμα που φάνταζε <em>αδύνατο</em> να χτιστεί σε μία εβδομάδα.", "week"],
      [40, STARS_EL, "moon"], [43.2, MOON_EL, "moon"],
      [49.7, "Ένα κύτταρο είναι ένα <em>κύκλωμα.</em> Τα γονίδια ανάβουν και σβήνουν το ένα το άλλο.", "circuit"], [54.7, `${genes} γονίδια, το καθένα αναμμένο ή σβηστό: ένα λογικό κύκλωμα που μπορεί να ελεγχθεί.`, "circuit"],
      [59.7, "Αλλά το κύκλωμα είναι ελλιπές. Τα papers ξέρουν συνδέσεις που του λείπουν.", "circuit-link"], [65.2, "Ένα AI μπορεί να διαβάσει τα papers. Δεν ξέρει αν μια νέα σύνδεση <em>χαλάει</em> το κύκλωμα.", "circuit-link"],
      [71.2, "Ένας ακριβής solver μπορεί να ελέγξει το κύκλωμα. Δεν μπορεί να <em>διαβάσει.</em>", "circuit-scan"], [76.7, "Το CellProof τους ενώνει. Το AI προτείνει. Ο solver <em>αποφασίζει.</em>", "circuit-scan"],
      [82.2, "Ό,τι μένει δοκιμάζεται σε έναν εικονικό όγκο.", "tumour"], [87.2, "Δεν βρήκαμε τη θεραπεία του καρκίνου. Φτιάξαμε έναν τρόπο να ρωτάμε <em>πώς</em>, με ακρίβεια.", "dna"]],
    what: [["Ο τομέας", "Βιολογία του καρκίνου: πώς αντιδρούν τα κύτταρα στην ακτινοβολία."], ["Το πρόβλημα", "Τα μοντέλα των κυττάρων είναι ελλιπή, και κανείς δεν μπορεί να ελέγξει με το χέρι κάθε ιδέα από τα papers."],
      ["Πού βοηθά", "Ένα AI προτείνει, ένας ακριβής solver ελέγχει, και οι ερευνητές παίρνουν υποψήφιες αλλαγές για δοκιμή στο εργαστήριο."]],
    tag: "From shared uncertainty to solitary conviction.",
    cap: `Πριν από αυτή την εβδομάδα: ένα δημοσιευμένο μοντέλο ${genes} γονιδίων, ανοιχτά papers, solvers ανοιχτού κώδικα. Αυτή την εβδομάδα: ένας agent όπου το Muse Spark διαβάζει τα papers και ένας ακριβής solver αποφασίζει. Υποθέσεις για το εργαστήριο, όχι θεραπείες.`,
  };
  const lines = document.createElement("div"), fl = document.createElement("div"), art = document.createElement("canvas");
  let actx = art.getContext("2d");
  lines.className = "vid-lines"; fl.className = "vid-flash"; art.className = "vid-art"; art.hidden = true; document.body.append(art, lines, fl);

  /* the backgrounds: each is drawn for the idea of its line, in the manner of glowing renders: a universe of stars, a band of the galaxy, spiral galaxies, nebulae.
     noise: red points that flicker. cosmos: a person on a cliff facing the galaxies. dna: a luminous helix in the universe. week: seven days fill one by one.
     moon: the point aims for a star and lands on the moon. circuit: a network with
     signals, with a new link, with a scan. tumour: the simulation's own cells (the only picture here that is data). */
  let scene = "", st0 = 0, raf = 0, W = 0, H = 0, pack = null;
  const rnd = (() => { let x = 7; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })(), gauss = () => rnd() + rnd() + rnd() - 1.5;
  const dots = Array.from({ length: 320 }, () => ({ x: rnd(), y: rnd(), r: 1 + rnd() * 2.2, p: rnd() * 6.28 }));
  const CLOUDS = Array.from({ length: 8 }, (_, i) => ({ x: rnd(), y: rnd(), r: 0.22 + rnd() * 0.3, c: [[120, 80, 255], [255, 90, 120], [60, 170, 255], [150, 90, 230]][i % 4], p: rnd() * 6.28, s: 0.03 + rnd() * 0.05 }));
  const STARS = Array.from({ length: 460 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + Math.pow(rnd(), 3) * 2.2, p: rnd() * 6.28 }));
  const BAND = Array.from({ length: 800 }, () => ({ s: rnd() * 1.4 - 0.2, o: gauss(), z: 0.6 + rnd() * 1.4, a: 0.18 + rnd() * 0.5, c: rnd() }));
  const spiral = (n) => Array.from({ length: n }, (_, i) => { const r = Math.pow(rnd(), 0.6); return { r, th: r * 9 + (i % 2) * Math.PI + (rnd() - 0.5) * 0.5, z: 0.6 + rnd() * 1.4 }; });
  const GAL = [{ x: 0.16, y: 0.27, R: 0.11, tilt: 0.45, rot: 0.5, pts: spiral(520) }, { x: 0.86, y: 0.2, R: 0.085, tilt: 0.6, rot: -0.4, pts: spiral(420) }, { x: 0.91, y: 0.62, R: 0.055, tilt: 0.5, rot: 0.9, pts: spiral(260) }];
  const NODES = Array.from({ length: 18 }, (_, i) => ({ x: ((i % 6) + 0.5 + (rnd() - 0.5) * 0.7) / 6, y: (Math.floor(i / 6) + 0.5 + (rnd() - 0.5) * 0.7) / 3 }));
  const EDGES = (() => {
    const out = [], seen = new Set();
    NODES.forEach((a, i) => NODES.map((b, j) => [j, Math.hypot(a.x - b.x, (a.y - b.y) * 0.6)]).filter(([j]) => j !== i).sort((u, v) => u[1] - v[1]).slice(0, 2).forEach(([j]) => {
      const k = i < j ? `${i}-${j}` : `${j}-${i}`; if (!seen.has(k)) { seen.add(k); out.push([i, j, (rnd() - 0.5) * 0.35, rnd()]); }
    }));
    return out;
  })(), LINK = [2, 15], CROWD2 = [[190, 182, 232], [92, 158, 255], [232, 192, 72], [58, 214, 168], [255, 110, 186]].map((c) => rgba(c, 0.95)), sans = css("--sans") || "sans-serif";
  const CRATERS = Array.from({ length: 34 }, () => ({ a: -Math.PI / 2 + (rnd() - 0.5) * 1.5, d: 0.5 + rnd() * 0.5, r: 0.012 + rnd() * 0.05 }));
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3), clamp = (x) => Math.min(1, Math.max(0, x));
  const bg = (c1, c2) => { const g = actx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.72); g.addColorStop(0, c1); g.addColorStop(1, c2); actx.fillStyle = g; actx.fillRect(0, 0, W, H); };
  const glow = (x, y, r, a) => { const g = actx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,196,150,${a})`); g.addColorStop(1, "rgba(255,196,150,0)"); actx.fillStyle = g; actx.beginPath(); actx.arc(x, y, r, 0, 6.2832); actx.fill(); };
  function nebula(k, rich, c) {  /* clouds, the band of the galaxy, spiral galaxies and stars, drawn once into `c` */
    c.fillStyle = "#05051a"; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "lighter";
    const m = Math.max(W, H);
    for (const q of CLOUDS) { const x = q.x * W, y = q.y * H, r = q.r * m, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${q.c},${0.36 * k})`); g.addColorStop(1, `rgba(${q.c},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
    if (rich) {
      for (let i = 0; i < 6; i++) { const sx = 0.1 + i * 0.16, x = sx * W, y = (0.88 - 0.55 * sx) * H, g = c.createRadialGradient(x, y, 0, x, y, m * 0.2); g.addColorStop(0, "rgba(150,170,255,.11)"); g.addColorStop(1, "rgba(150,170,255,0)"); c.fillStyle = g; c.fillRect(x - m * 0.2, y - m * 0.2, m * 0.4, m * 0.4); }
      for (const q of BAND) { c.fillStyle = q.c > 0.7 ? `rgba(255,190,200,${q.a})` : `rgba(200,215,255,${q.a})`; c.fillRect(q.s * W + q.o * W * 0.1, (0.88 - 0.55 * q.s) * H + q.o * H * 0.3, q.z, q.z); }
      for (const g of GAL) {
        const cx = g.x * W, cy = g.y * H, R = g.R * m, gl = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.7), co = Math.cos(g.rot), si = Math.sin(g.rot);
        gl.addColorStop(0, "rgba(255,225,180,.55)"); gl.addColorStop(1, "rgba(255,200,150,0)"); c.fillStyle = gl; c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
        for (const q of g.pts) { const px = Math.cos(q.th) * q.r * R, py = Math.sin(q.th) * q.r * R * g.tilt; c.fillStyle = `rgba(${(255 - 110 * q.r) | 0},${(225 - 45 * q.r) | 0},${(170 + 85 * q.r) | 0},${0.8 - 0.5 * q.r})`; c.fillRect(cx + px * co - py * si, cy + px * si + py * co, q.z, q.z); }
      }
    }
    c.globalCompositeOperation = "source-over";
    for (const q of STARS) {
      const a = 0.45 + 0.4 * Math.sin(q.p), x = q.x * W, y = q.y * H; c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); c.arc(x, y, q.r, 0, 6.2832); c.fill();
      if (q.r > 1.7) { c.strokeStyle = `rgba(255,255,255,${a * 0.6})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x - q.r * 5, y); c.lineTo(x + q.r * 5, y); c.moveTo(x, y - q.r * 5); c.lineTo(x, y + q.r * 5); c.stroke(); }
    }
  }
  const skies = {};
  function sky(name, t, k, rich, still) {  /* the universe of a scene: drawn once, then copied with a slow zoom, twinkling stars and now and then a shooting star */
    const key = `${name}${W}x${H}`;
    if (!skies[key]) { const o = document.createElement("canvas"), d = Math.min(2, devicePixelRatio || 1); o.width = W * d; o.height = H * d; const c = o.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); nebula(k, rich, c); skies[key] = o; }
    const z = still ? 1 : 1 + 0.03 * Math.min(1, t / 10);
    actx.save(); actx.translate(W / 2, H / 2); actx.scale(z, z); actx.translate(-W / 2, -H / 2); actx.drawImage(skies[key], 0, 0, W, H); actx.restore();
    if (still) return;
    twinkle(t, 70); if (rich) shootStar(t);
  }
  function twinkle(t, n) { for (let i = 0; i < n; i++) { const q = STARS[i]; actx.fillStyle = `rgba(255,255,255,${0.7 * Math.abs(Math.sin(t * 1.3 + q.p * 3))})`; actx.beginPath(); actx.arc(q.x * W, q.y * H, q.r * 1.2, 0, 6.2832); actx.fill(); } }
  function shootStar(t) {
    const per = 6.5, k2 = (t % per) / 0.9;
    if (k2 < 1) { const n = Math.floor(t / per), x0 = W * (0.15 + ((n * 0.37) % 0.6)), y0 = H * (0.08 + ((n * 0.23) % 0.25)), x = x0 + k2 * W * 0.28, y = y0 + k2 * H * 0.16, g = actx.createLinearGradient(x - W * 0.09, y - H * 0.05, x, y); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,.95)"); actx.strokeStyle = g; actx.lineWidth = 2; actx.beginPath(); actx.moveTo(x - W * 0.09, y - H * 0.05); actx.lineTo(x, y); actx.stroke(); }
  }
  const layers = {};
  function frozen(name, draw, zoom, t) {  /* what does not move is drawn once into a layer and copied (with a very slow push-in if `zoom`) */
    const key = `${name}${W}x${H}`;
    if (!layers[key]) { const o = document.createElement("canvas"), d = Math.min(2, devicePixelRatio || 1); o.width = W * d; o.height = H * d; const c = o.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); const keep = actx; actx = c; try { draw(); } finally { actx = keep; } layers[key] = o; }
    const z = zoom ? 1 + zoom * clamp(t / 8) : 1;
    actx.save(); actx.translate(W / 2, H / 2); actx.scale(z, z); actx.translate(-W / 2, -H / 2); actx.drawImage(layers[key], 0, 0, W, H); actx.restore();
  }
  function helix(t) {  /* two luminous strands and their rungs, slowly turning, across the universe */
    actx.save(); actx.translate(W * 0.5, H * 0.5); actx.rotate(-0.42); actx.globalCompositeOperation = "lighter"; actx.lineCap = "round";
    const len = Math.hypot(W, H) * 1.05, amp = Math.min(H * 0.17, 150), N = 120, ph = t * 0.9, pt = (u, k) => [(u - 0.5) * len, Math.sin(u * 22 + ph + k * Math.PI) * amp, Math.cos(u * 22 + ph + k * Math.PI)];
    for (let i = 0; i < N; i += 2) { const a = pt(i / N, 0), b = pt(i / N, 1); actx.strokeStyle = `rgba(255,255,255,${0.08 + 0.2 * Math.abs(a[2])})`; actx.lineWidth = 2; actx.beginPath(); actx.moveTo(a[0], a[1]); actx.lineTo(b[0], b[1]); actx.stroke(); }
    for (let k = 0; k < 2; k++) {
      const col = k ? "255,90,200" : "80,200,255"; actx.beginPath();
      for (let i = 0; i <= N; i++) { const q = pt(i / N, k); if (i) actx.lineTo(q[0], q[1]); else actx.moveTo(q[0], q[1]); }
      actx.strokeStyle = `rgba(${col},.16)`; actx.lineWidth = 16; actx.stroke(); actx.strokeStyle = `rgba(${col},.95)`; actx.lineWidth = 4; actx.stroke();
    }
    actx.restore();
  }
  function person(x, y, h) {  /* a silhouette seen from behind, feet at (x, y) */
    const u = h / 10; actx.fillStyle = "#02030a"; actx.strokeStyle = "#02030a"; actx.lineCap = "round";
    actx.beginPath(); actx.arc(x, y - 9.2 * u, 0.62 * u, 0, 6.2832); actx.fill(); actx.fillRect(x - 0.24 * u, y - 8.7 * u, 0.48 * u, 0.6 * u);
    actx.beginPath(); actx.moveTo(x - 1.15 * u, y - 7.9 * u); actx.quadraticCurveTo(x, y - 8.6 * u, x + 1.15 * u, y - 7.9 * u); actx.lineTo(x + 0.9 * u, y - 4.5 * u); actx.lineTo(x - 0.9 * u, y - 4.5 * u); actx.closePath(); actx.fill();
    actx.lineWidth = 0.55 * u; actx.beginPath(); actx.moveTo(x - 1.2 * u, y - 7.7 * u); actx.lineTo(x - 1.4 * u, y - 4.6 * u); actx.moveTo(x + 1.2 * u, y - 7.7 * u); actx.lineTo(x + 1.4 * u, y - 4.6 * u); actx.stroke();
    actx.lineWidth = 0.85 * u; actx.beginPath(); actx.moveTo(x - 0.45 * u, y - 4.6 * u); actx.lineTo(x - 0.5 * u, y - 0.2 * u); actx.moveTo(x + 0.45 * u, y - 4.6 * u); actx.lineTo(x + 0.5 * u, y - 0.2 * u); actx.stroke();
  }
  function cosmos(t) {  /* one person on a cliff, and a universe: galaxies, a red nebula, a bright horizon; drawn once, then moved a little */
    frozen("cosmos", () => {
      sky("cosmos", 0, 1.6, true, true); actx.globalCompositeOperation = "lighter";
      let g = actx.createRadialGradient(W * 0.78, H * 0.32, 0, W * 0.78, H * 0.32, W * 0.3); g.addColorStop(0, "rgba(255,120,80,.3)"); g.addColorStop(1, "rgba(255,120,80,0)"); actx.fillStyle = g; actx.fillRect(W * 0.4, 0, W * 0.6, H * 0.7);
      const hy = H * 0.62; actx.save(); actx.translate(W * 0.5, hy); actx.scale(1, 0.1); g = actx.createRadialGradient(0, 0, 0, 0, 0, W * 0.55); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(0.12, "rgba(190,210,255,.55)"); g.addColorStop(1, "rgba(80,120,255,0)"); actx.fillStyle = g; actx.beginPath(); actx.arc(0, 0, W * 0.55, 0, 6.2832); actx.fill(); actx.restore();
      actx.globalCompositeOperation = "source-over";
      const lg = actx.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(0.5, "rgba(255,255,255,.95)"); lg.addColorStop(1, "rgba(255,255,255,0)");
      actx.save(); actx.strokeStyle = lg; actx.lineWidth = 2; actx.shadowColor = "rgba(180,210,255,.9)"; actx.shadowBlur = 24; actx.beginPath(); actx.moveTo(0, hy + H * 0.03); actx.quadraticCurveTo(W * 0.5, hy - H * 0.05, W, hy + H * 0.03); actx.stroke(); actx.restore();
      actx.save(); actx.beginPath(); actx.rect(0, hy + H * 0.02, W, H); actx.clip(); actx.translate(0, 2 * hy); actx.scale(1, -1); actx.globalAlpha = 0.5; sky("cosmos", 0, 1.6, true, true); actx.restore();  /* the sky again, upside down, below the horizon */
      const dk = actx.createLinearGradient(0, hy, 0, H); dk.addColorStop(0, "rgba(3,5,18,.1)"); dk.addColorStop(1, "rgba(2,3,10,.55)"); actx.fillStyle = dk; actx.fillRect(0, hy + H * 0.02, W, H);
      const ry = H * 0.8, px = W * 0.3; actx.fillStyle = "#02030a";
      actx.beginPath(); actx.moveTo(0, H); actx.lineTo(0, ry + H * 0.02); actx.lineTo(px - W * 0.16, ry + H * 0.015); actx.lineTo(px + W * 0.07, ry); actx.lineTo(px + W * 0.13, ry + H * 0.03); actx.quadraticCurveTo(px + W * 0.1, ry + H * 0.12, px + W * 0.03, H); actx.fill();
      actx.strokeStyle = "rgba(140,170,255,.22)"; actx.lineWidth = 1.5; actx.beginPath(); actx.moveTo(px - W * 0.16, ry + H * 0.015); actx.lineTo(px + W * 0.07, ry); actx.lineTo(px + W * 0.13, ry + H * 0.03); actx.stroke();
      person(px, ry, H * 0.17);
    }, 0.025, t);
    twinkle(t, 60); shootStar(t);
  }
  function moon(t) {  /* the point aims for a star, curves down and lands on the moon */
    const R = H, cx = W * 0.55, cy = H * 1.55, topAt = (x) => cy - Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));
    frozen("moon", () => {
      sky("moon", 0, 0.9, true, true);
      actx.save(); actx.shadowColor = "rgba(160,190,255,.7)"; actx.shadowBlur = 40; const g = actx.createRadialGradient(cx - R * 0.3, cy - R * 0.55, R * 0.1, cx, cy, R); g.addColorStop(0, "#e2dff0"); g.addColorStop(0.55, "#8d8aa3"); g.addColorStop(1, "#2a2940"); actx.fillStyle = g; actx.beginPath(); actx.arc(cx, cy, R, 0, 6.2832); actx.fill(); actx.restore();
      for (const c of CRATERS) { const x = cx + Math.cos(c.a) * c.d * R, y = cy + Math.sin(c.a) * c.d * R, r = c.r * R; actx.fillStyle = "rgba(40,38,64,.28)"; actx.beginPath(); actx.ellipse(x, y, r, r * 0.55, 0, 0, 6.2832); actx.fill(); actx.strokeStyle = "rgba(255,255,255,.14)"; actx.lineWidth = 1.5; actx.stroke(); }
    }, 0.02, t);
    twinkle(t, 50); shootStar(t);
    const u = clamp(t / 5.2), s = u * u * (3 - 2 * u), E = [W * 0.42, topAt(W * 0.42) - 6], S = [W * 0.1, H * 0.56], C1 = [W * 0.45, -H * 0.12], C2 = [W * 0.97, H * 0.02];
    const at = (v) => { const w = 1 - v; return [w * w * w * S[0] + 3 * w * w * v * C1[0] + 3 * w * v * v * C2[0] + v * v * v * E[0], w * w * w * S[1] + 3 * w * w * v * C1[1] + 3 * w * v * v * C2[1] + v * v * v * E[1]]; };
    const sx = W * 0.6, sy = H * 0.1, near = Math.max(0, 1 - Math.abs(s - 0.5) / 0.15), len = 18 + 40 * near;  /* the star it aims for flares as the point passes */
    actx.globalCompositeOperation = "lighter"; glow(sx, sy, 40 + 70 * near, 0.5 + 0.4 * near); actx.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * near})`; actx.lineWidth = 1.5; actx.beginPath(); actx.moveTo(sx - len, sy); actx.lineTo(sx + len, sy); actx.moveTo(sx, sy - len); actx.lineTo(sx, sy + len); actx.stroke();
    for (let v = Math.max(0, s - 0.4); v < s; v += 0.012) { const [x, y] = at(v), a = (v - (s - 0.4)) / 0.4; actx.fillStyle = `rgba(255,205,160,${0.5 * a})`; actx.beginPath(); actx.arc(x, y, 1 + 3 * a, 0, 6.2832); actx.fill(); }
    actx.globalCompositeOperation = "source-over";
    const [px, py] = at(s); glow(px, py, 55 + 8 * Math.sin(t * 6), 0.9); actx.fillStyle = "#fff3e6"; actx.beginPath(); actx.arc(px, py, 7, 0, 6.2832); actx.fill();
    if (t > 5.2 && t < 6.7) { const r = (t - 5.2) / 1.5; actx.strokeStyle = `rgba(255,225,190,${1 - r})`; actx.lineWidth = 3; actx.beginPath(); actx.ellipse(E[0], E[1] + 6, 20 + r * 220, (20 + r * 220) * 0.25, 0, 0, 6.2832); actx.stroke(); }
  }
  function circuit(t, mode) {  /* a network of lit cells: signals run along its links; `link` grows a new one; `scan` checks the links from left to right */
    sky("plain", t, 0.5, false); actx.globalCompositeOperation = "lighter"; actx.lineCap = "round";
    const sx = mode === "scan" ? clamp(t / 5.5) * W : -1, green = (x) => sx >= 0 && x < sx, P0 = (n) => [NODES[n].x * W, NODES[n].y * H];
    const path = (e) => { const [x1, y1] = P0(e[0]), [x2, y2] = P0(e[1]); return [x1, y1, (x1 + x2) / 2 + (y2 - y1) * e[2], (y1 + y2) / 2 - (x2 - x1) * e[2], x2, y2]; };
    const at = (q, u) => { const w = 1 - u; return [w * w * q[0] + 2 * w * u * q[2] + u * u * q[4], w * w * q[1] + 2 * w * u * q[3] + u * u * q[5]]; };
    for (const e of EDGES) {
      const q = path(e), ok = green((q[0] + q[4]) / 2), c = ok ? "90,240,170" : "60,170,255";
      actx.beginPath(); actx.moveTo(q[0], q[1]); actx.quadraticCurveTo(q[2], q[3], q[4], q[5]); actx.strokeStyle = `rgba(${c},.14)`; actx.lineWidth = 9; actx.stroke(); actx.strokeStyle = `rgba(${c},.6)`; actx.lineWidth = 1.6; actx.stroke();
      const [x, y] = at(q, (t * 0.3 + e[3]) % 1); actx.fillStyle = ok ? "rgba(200,255,230,.95)" : "rgba(170,225,255,.95)"; actx.beginPath(); actx.arc(x, y, 2.8, 0, 6.2832); actx.fill();
    }
    if (mode === "link" || mode === "scan") {
      const q = path([LINK[0], LINK[1], 0.2]), k = mode === "scan" ? 1 : clamp((t - 0.8) / 3.2), ok = green((q[0] + q[4]) / 2);
      actx.setLineDash([10, 10]); actx.strokeStyle = ok ? "rgba(90,240,170,.95)" : "rgba(255,196,150,.95)"; actx.lineWidth = 3; actx.beginPath();
      for (let u = 0; u <= k + 1e-6; u += 0.02) { const [x, y] = at(q, u); if (u) actx.lineTo(x, y); else actx.moveTo(x, y); }
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
  function tumour(t) {  /* the cells of the simulation, 72 hours after radiation, played once */
    sky("plain", t, 0.5, false);
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
    } else if (scene === "cosmos") {
      cosmos(t);
    } else if (scene === "dna") {
      sky("dna", t, 1, true); helix(t);
    } else if (scene === "week") {
      sky("week", t, 0.7, true); days(t);
    } else if (scene === "moon") {
      moon(t);
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
    const title = `CellProof<small>${set.tag}</small>`, card = `<div class="cardbox"><p class="big compact">${title}</p><ol class="what labelled">${set.what.map(([l, w]) => `<li><span class="vlab">${l}</span><span>${w}</span></li>`).join("")}</ol></div>`;
    return [[0, () => { scrollTo("#top"); CPHero.pin(true); CPHero.show(0); root.classList.add("vid-intro", "vid-zoom"); }],
      ...src.map(([t, html, sc, kind]) => [t, () => { setArt(sc || ""); showLine(html, false, sc === "noise", kind); }]),
      [tail, () => { setArt(short ? "circuit" : "dna"); flash(); lines.classList.remove("warn"); showLine(short ? card : title, !short, false, short ? "card" : ""); say(set.cap); }]];
  };
  const end = take[take.length - 1][0] + 5, endShort = takeShort[takeShort.length - 1][0] + 5;  /* the last ten seconds of the video are the terminal, recorded apart */

  /* the button of the header ("Watch the intro") plays the short intro for a visitor: no countdown, the pointer stays, and a button skips it */
  const skip = document.createElement("button");
  skip.type = "button"; skip.className = "vid-skip"; skip.hidden = true; document.body.append(skip);
  skip.addEventListener("click", () => stopTake(true));
  function stopTake(done) {
    ids.splice(0).forEach(clearTimeout); CPBench.stop(); CPHero.pin(false); say(""); count.textContent = ""; root.classList.remove("vid", "vid-pub", "vid-intro", "vid-zoom"); showLine(""); setArt(""); fl.classList.remove("go");
    skip.hidden = true; bar.hidden = !/^#(video|intro)/.test(location.hash); if (done) say("");
  }
  function start(pub) {
    if (root.classList.contains("vid")) return;
    root.classList.add("vid"); bar.hidden = true;
    const run = () => {
      count.textContent = "";
      const hash = location.hash, intro = pub || hash.startsWith("#intro"), short = pub || hash === "#intro-short", plan = intro ? introPlan(short) : hash === "#video-short" ? takeShort : take, stopAt = intro ? plan[plan.length - 1][0] + (short ? 15 : 7) : hash === "#video-short" ? endShort : end;
      plan.forEach(([s, fn]) => ids.push(setTimeout(fn, s * 1000)));
      ids.push(setTimeout(() => { stopTake(true); scrollTo("#top"); }, stopAt * 1000));
    };
    if (pub) { root.classList.add("vid-pub"); skip.textContent = CP.lang() === "el" ? "Παράλειψη ✕" : "Skip ✕"; skip.hidden = false; run(); return; }
    [3, 2, 1].forEach((n, i) => ids.push(setTimeout(() => { count.textContent = String(n); }, i * 1000)));
    ids.push(setTimeout(run, 3000));
  }
  window.CPIntro = { play: () => start(true), stop: () => stopTake(true) };
  const introBtn = $("#introBtn");
  if (introBtn) introBtn.addEventListener("click", () => start(true));
  $("#vidGo").addEventListener("click", () => start());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("vid")) stopTake();
    else if (e.code === "Space" && /^#(video|intro)/.test(location.hash) && !root.classList.contains("vid") &&!/^(BUTTON|INPUT|TEXTAREA|A)$/.test(document.activeElement.tagName)) { e.preventDefault(); start(); }
  });
  /* the buttons exist only in the recording mode: #video in the address */
  const sync = () => { card.hidden = location.hash !== "#card"; const on = /^#(video|intro)/.test(location.hash); bar.hidden = !on || root.classList.contains("vid"); if (!on && root.classList.contains("vid")) stopTake(); };
  addEventListener("hashchange", sync); sync();
})();
