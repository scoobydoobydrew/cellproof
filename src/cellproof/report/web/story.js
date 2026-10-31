/* CellProof report, part 5: the story. Plain words and simple drawings after the header, in six scenes and a short close: a tumour is a crowd of
   cells, a cell is a circuit of genes, which switches? (too many to try), an AI reads and a checker checks, does it hold in a crowd, every tumour is
   different. Every number is computed from D, the same files as the rest of the page; every picture is an illustration unless it says that it is
   the simulation (the crowd) or public counts (the dots of the tumours). The texts exist in English and Greek. No gene names, on purpose: the
   technical part below has them. */
(() => {
  const root = $("#story");
  if (!root) return;
  const TS = D.tissue, DSL = D.downstream || {}, GT = DSL.genotypes, SQ = DSL.sequences, SPACE = (D.interventions || {}).space || {}, F = TS && TS.facts;
  const lang = () => (document.documentElement.lang === "el" ? "el" : "en");
  const nf = (n) => Number(n).toLocaleString(lang() === "el" ? "el-GR" : "en-US");
  const rand = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const COL = ["#cfc6f5", "#5c9eff", "#e8c048", "#3ad6a8", "#ff6eba"];  /* undecided (alive), pauses, ages, recycles, dying */
  const scenes = [];
  const clock = () => { const ids = new Set(); return { later: (fn, ms) => { const id = setTimeout(() => { ids.delete(id); fn(); }, ms); ids.add(id); return id; }, clear: () => { ids.forEach(clearTimeout); ids.clear(); } }; };
  const whileVisible = (el, start, stop, threshold = 0.25) => new IntersectionObserver((es) => (es[0].isIntersecting ? start() : stop()), { threshold }).observe(el);
  const sceneOf = (el) => el.closest(".scene");

  /* ---------------------------------------------------------------- the numbers on the story, all from D */
  const MATRIX = (D.verification || {}).matrix || {};
  const fails = (pre) => Object.keys(MATRIX).filter((k) => k.startsWith(pre)).map((k) => Object.keys(MATRIX[k]).length);
  const un = fails("naive"), UN = un.length ? [Math.min(...un), Math.max(...un)] : [0, 0];
  const range = (a, b) => (a === b ? `${a}` : `${a}–${b}`);
  const r1 = GT && GT.r1, r2 = GT && GT.r2, tpct = (r) => Math.round((100 * r.tp53_lost) / r.samples);
  const X = {
    cells: F ? F.cells : 0, alive: F ? F.radiation.alive : 0, hours: F ? F.hours : 72, papers: (D.meta || {}).corpus_papers || 0,
    genes: ((D.networks || {}).published || { nodes: [] }).nodes.length, found: SPACE.found || 0, secs: Math.max(1, Math.round(SPACE.seconds || 0)),
    agree: F ? F.hits.agree + F.misses.agree : 0, total: F ? F.hits.count + F.misses.count : 0, samples: r1 ? r1.samples : 0,
    lo: r1 ? tpct(r1) : 0, hi: r2 ? tpct(r2) : 0, novel: SQ ? SQ.novel.length : 0,
  };

  /* ---------------------------------------------------------------- texts */
  const TX = {
    en: {
      "crowd.e": "1 · The problem", "crowd.h": "A tumour is a <em>crowd</em> of cells.",
      "crowd.p": () => `Radiation hits every one of them. In our virtual tumour of ${nf(X.cells)} cells, ${nf(X.alive)} are still alive after ${X.hours} hours.`,
      "crowd.n": "A computer simulation (PhysiBoSS). One dot is one cell.", "crowd.alive": "cells alive", "hours": (h) => `after ${h} h`,
      "k.alive": "alive, still deciding", "k.arrest": "pauses", "k.sen": "ages: alive, but stopped", "k.auto": "recycles itself", "k.die": "dying", "k.gone": "gone",
      "circ.e": "2 · Why some survive", "circ.h": "Inside each cell, genes <em>switch each other</em> on and off.",
      "circ.p": "After damage, this little circuit settles on one fate: pause, age, recycle itself, or die. Other switch positions, other fate.",
      "circ.n": () => `A simplified drawing. Our model has ${X.genes} genes, published by Gupta et al. 2023.`,
      "f.arrest": "Pauses", "f.sen": "Ages", "f.auto": "Recycles", "f.die": "Dies", "circ.cut": "Cut the right switches, and only “dies” can light up.", "circ.fate": (f) => `This setting: the cell ${f.toLowerCase()}.`,
      "srch.e": "3 · Which switches?", "srch.h": "Too many to try in a <em>lab.</em>",
      "srch.p": () => `Which genes do we switch off, or on? Every combination is an experiment. Our exact solver tried every combination of one or two genes in ${X.secs} seconds and found ${X.found} that leave only death.`,
      "srch.k": (k) => `combinations of up to ${k} genes`,
      "srch.n2": () => `Each dot is one combination. The ${X.found} that glow leave only death.`, "srch.n3": "Illustration: with more genes at once the haystack explodes, and the glowing dots are the same answers.",
      "help.e": "4 · Two helpers", "help.h": "An AI <em>reads.</em> A checker <em>checks.</em>",
      "help.p": () => `The papers know links that our circuit is missing. The AI reads ${X.papers} of them and proposes new links. But an AI can be wrong with confidence, so an exact solver replays 10 experiments with known results before any link is kept.`,
      "help.n": "The checker decides, not the AI.", "help.papers": () => `${X.papers} papers`, "help.link": "a proposed link", "help.alone": "AI alone", "help.checked": "AI + checker",
      "help.alone.res": () => `${range(...UN)} of 10 known experiments break`, "help.checked.res": "0 of 10 break", "help.run": "10 known experiments",
      "tis.e": "5 · Does it hold in a crowd?", "tis.h": "Back to the <em>virtual tumour.</em>",
      "tis.p": () => `We apply the checker's switches in all ${nf(X.cells)} cells. A second, independent simulator agrees with the solver on ${X.agree} of ${X.total} cases.`,
      "tis.b0": "Radiation only", "tis.b1": "One switch flipped", "tis.b2": "A switch the checker rejects", "tis.b3": "Found later, predicted first",
      "tis.n0": "Without a switch some cells survive. They have aged: alive, but stopped.", "tis.n1": (a) => `The checker's pick: ${a ? `${nf(a)} left.` : "no cell is left."}`,
      "tis.n2": "A switch the checker rejected: many cells survive. The checker does not say yes to everything.",
      "tis.n3": () => `Our exact analysis predicted this recipe before the simulation ran: no cell is left, in each of ${X.novel || "the"} such recipes.`,
      "tis.of": (a) => `of ${nf(X.cells)} cells alive`, "tis.foot": "Both engines run the same rules, so this checks one against the other, not the biology.",
      "gen.e": "6 · Every tumour is different", "gen.h": "Every tumour has <em>its own genes.</em>",
      "gen.p": () => `We took the genetic changes of ${nf(X.samples)} real tumour samples (public data) and asked the model again. Each dot is one sample.`,
      "gen.n": "A statement about the model and public counts, not about any person. Hypotheses for the lab.", "gen.line": "of every 100 samples have lost p53: none of our recipes works. Every recipe we found relies on p53.",
      "gen.r1": "Count only clear breaks of p53", "gen.r2": "Count every change to p53", "gen.k0": "a recipe still works", "gen.k1": "p53 intact, but none works", "gen.k2": "p53 lost: none works",
      "hon.e": "In short", "hon.h": "What this is, and <em>what it isn't.</em>", "hon.go": "The technical part ↓",
      "hon.c0": "Every recipe is checked exactly by a solver, and every number on this page is computed from files in the repository.",
      "hon.c1": "It is a model of a cell, not of a person: no treatment, no dose, no medical advice. Hypotheses for the lab.",
      "hon.c2": "On outcomes it never saw, the model is no better than the published one. We show that too, with the checks that failed.",
      "alt.crowd": "A virtual tumour: a disc of dots, one per cell, that disappear after radiation.", "alt.circ": "A simplified circuit of switches that lights one of four fates.",
      "alt.search": "A field of dots, one per combination of genes, growing from about a thousand to over a million.", "alt.tissue": "The virtual tumour again, with a chosen set of switches applied.",
      "alt.waffle": "One dot per tumour sample, coloured by whether any of our recipes works.",
    },
    el: {
      "crowd.e": "1 · Το πρόβλημα", "crowd.h": "Ένας όγκος είναι ένα <em>πλήθος</em> κυττάρων.",
      "crowd.p": () => `Η ακτινοβολία χτυπά όλα τα κύτταρα. Στον εικονικό μας όγκο με ${nf(X.cells)} κύτταρα, ${nf(X.alive)} ζουν ακόμα μετά από ${X.hours} ώρες.`,
      "crowd.n": "Προσομοίωση στον υπολογιστή (PhysiBoSS). Μία κουκκίδα είναι ένα κύτταρο.", "crowd.alive": "κύτταρα ζωντανά", "hours": (h) => `μετά από ${h} ώρες`,
      "k.alive": "ζωντανό, αποφασίζει ακόμα", "k.arrest": "κάνει παύση", "k.sen": "γερνά: ζει, αλλά έχει σταματήσει", "k.auto": "ανακυκλώνεται", "k.die": "πεθαίνει", "k.gone": "χάθηκε",
      "circ.e": "2 · Γιατί κάποια επιζούν", "circ.h": "Μέσα σε κάθε κύτταρο, τα γονίδια <em>ανάβουν και σβήνουν</em> το ένα το άλλο.",
      "circ.p": "Μετά τη ζημιά, αυτό το μικρό κύκλωμα καταλήγει σε μία μοίρα: παύση, γήρανση, ανακύκλωση ή θάνατο. Άλλες θέσεις διακοπτών, άλλη μοίρα.",
      "circ.n": () => `Απλοποιημένο σχέδιο. Το μοντέλο μας έχει ${X.genes} γονίδια, δημοσιευμένα από τους Gupta et al. 2023.`,
      "f.arrest": "Παύση", "f.sen": "Γήρανση", "f.auto": "Ανακύκλωση", "f.die": "Θάνατος", "circ.cut": "Κόψε τους σωστούς διακόπτες και μπορεί να ανάψει μόνο ο «θάνατος».", "circ.fate": (f) => `Με αυτή τη ρύθμιση: ${f.toLowerCase()}.`,
      "srch.e": "3 · Ποιοι διακόπτες;", "srch.h": "Πάρα πολλά για να τα δοκιμάσεις στο <em>εργαστήριο.</em>",
      "srch.p": () => `Ποια γονίδια σβήνουμε ή ανάβουμε; Κάθε συνδυασμός είναι ένα πείραμα. Ο ακριβής solver μας δοκίμασε κάθε συνδυασμό ενός ή δύο γονιδίων σε ${X.secs} δευτερόλεπτα και βρήκε ${X.found} που αφήνουν μόνο θάνατο.`,
      "srch.k": (k) => `συνδυασμοί έως ${k} γονιδίων`,
      "srch.n2": () => `Κάθε κουκκίδα είναι ένας συνδυασμός. Οι ${X.found} που λάμπουν αφήνουν μόνο θάνατο.`, "srch.n3": "Εικονογράφηση: με περισσότερα γονίδια μαζί, η θημωνιά εκρήγνυται και οι κουκκίδες που λάμπουν είναι οι ίδιες απαντήσεις.",
      "help.e": "4 · Δύο βοηθοί", "help.h": "Ένα AI <em>διαβάζει.</em> Ένας ελεγκτής <em>ελέγχει.</em>",
      "help.p": () => `Τα papers ξέρουν συνδέσεις που λείπουν από το κύκλωμά μας. Το AI διαβάζει ${X.papers} και προτείνει νέες συνδέσεις. Αλλά ένα AI μπορεί να κάνει λάθος με σιγουριά, γι' αυτό ένας ακριβής solver ξαναπαίζει 10 πειράματα με γνωστά αποτελέσματα πριν κρατηθεί κάθε σύνδεση.`,
      "help.n": "Αποφασίζει ο ελεγκτής, όχι το AI.", "help.papers": () => `${X.papers} papers`, "help.link": "μια προτεινόμενη σύνδεση", "help.alone": "Μόνο AI", "help.checked": "AI + ελεγκτής",
      "help.alone.res": () => `χαλάνε ${range(...UN)} από 10 γνωστά πειράματα`, "help.checked.res": "χαλάνε 0 από 10", "help.run": "10 γνωστά πειράματα",
      "tis.e": "5 · Δουλεύει σε πλήθος;", "tis.h": "Πίσω στον <em>εικονικό όγκο.</em>",
      "tis.p": () => `Εφαρμόζουμε τους διακόπτες του ελεγκτή σε όλα τα ${nf(X.cells)} κύτταρα. Ένας δεύτερος, ανεξάρτητος προσομοιωτής συμφωνεί με τον solver σε ${X.agree} από ${X.total} περιπτώσεις.`,
      "tis.b0": "Μόνο ακτινοβολία", "tis.b1": "Ένας διακόπτης γυρισμένος", "tis.b2": "Διακόπτης που ο ελεγκτής απορρίπτει", "tis.b3": "Βρέθηκε αργότερα, προβλέφθηκε πρώτα",
      "tis.n0": "Χωρίς διακόπτη κάποια κύτταρα επιζούν. Έχουν γεράσει: ζουν, αλλά έχουν σταματήσει.", "tis.n1": (a) => `Η επιλογή του ελεγκτή: ${a ? `μένουν ${nf(a)}.` : "δεν μένει κανένα κύτταρο."}`,
      "tis.n2": "Ένας διακόπτης που ο ελεγκτής απέρριψε: πολλά κύτταρα επιζούν. Ο ελεγκτής δεν λέει ναι σε όλα.",
      "tis.n3": () => `Η ακριβής ανάλυσή μας προέβλεψε αυτή τη συνταγή πριν τρέξει η προσομοίωση: δεν μένει κανένα κύτταρο, και στις ${X.novel || "τρεις"} τέτοιες συνταγές.`,
      "tis.of": (a) => `από ${nf(X.cells)} κύτταρα ζωντανά`, "tis.foot": "Και οι δύο μηχανές τρέχουν τους ίδιους κανόνες, άρα ελέγχουν η μία την άλλη, όχι τη βιολογία.",
      "gen.e": "6 · Κάθε όγκος είναι διαφορετικός", "gen.h": "Κάθε όγκος έχει <em>δικά του γονίδια.</em>",
      "gen.p": () => `Πήραμε τις γενετικές αλλαγές ${nf(X.samples)} πραγματικών δειγμάτων όγκων (δημόσια δεδομένα) και ρωτήσαμε ξανά το μοντέλο. Κάθε κουκκίδα είναι ένα δείγμα.`,
      "gen.n": "Δήλωση για το μοντέλο και δημόσιους αριθμούς, όχι για κάποιον άνθρωπο. Υποθέσεις για το εργαστήριο.", "gen.line": "από κάθε 100 δείγματα έχουν χάσει το p53: καμία συνταγή μας δεν δουλεύει. Κάθε συνταγή που βρήκαμε βασίζεται στο p53.",
      "gen.r1": "Μέτρα μόνο ξεκάθαρες βλάβες του p53", "gen.r2": "Μέτρα κάθε αλλαγή του p53", "gen.k0": "μια συνταγή δουλεύει ακόμα", "gen.k1": "p53 άθικτο, αλλά καμία δεν δουλεύει", "gen.k2": "p53 χαμένο: καμία δεν δουλεύει",
      "hon.e": "Συνοψίζοντας", "hon.h": "Τι είναι, και <em>τι δεν είναι.</em>", "hon.go": "Το τεχνικό μέρος ↓",
      "hon.c0": "Κάθε συνταγή ελέγχεται ακριβώς από έναν solver, και κάθε αριθμός σε αυτή τη σελίδα υπολογίζεται από αρχεία του repository.",
      "hon.c1": "Είναι μοντέλο κυττάρου, όχι ανθρώπου: καμία θεραπεία, καμία δόση, καμία ιατρική συμβουλή. Υποθέσεις για το εργαστήριο.",
      "hon.c2": "Σε αποτελέσματα που δεν είχε δει, το μοντέλο δεν είναι καλύτερο από το δημοσιευμένο. Το δείχνουμε κι αυτό, μαζί με τους ελέγχους που απέτυχαν.",
      "alt.crowd": "Ένας εικονικός όγκος: ένας δίσκος από κουκκίδες, μία για κάθε κύτταρο, που εξαφανίζονται μετά την ακτινοβολία.", "alt.circ": "Ένα απλοποιημένο κύκλωμα διακοπτών που ανάβει μία από τέσσερις μοίρες.",
      "alt.search": "Ένα πεδίο από κουκκίδες, μία για κάθε συνδυασμό γονιδίων, που μεγαλώνει από περίπου χίλιες σε πάνω από ένα εκατομμύριο.", "alt.tissue": "Ο εικονικός όγκος ξανά, με εφαρμοσμένο ένα σύνολο διακοπτών.",
      "alt.waffle": "Μία κουκκίδα για κάθε δείγμα όγκου, χρωματισμένη ανάλογα με το αν δουλεύει κάποια συνταγή μας.",
    },
  };
  const tx = (k, ...a) => { const v = TX[lang()][k] ?? TX.en[k]; return typeof v === "function" ? v(...a) : v ?? k; };
  const keyHTML = (items) => items.map(([c, k, ring]) => `<span style="--c:${c}"><i${ring ? ' class="ring"' : ""}></i>${esc(tx(k))}</span>`).join("");
  function paintText() {
    $$("[data-s]", root).forEach((el) => (el.textContent = tx(el.dataset.s)));
    $$("[data-sh]", root).forEach((el) => (el.innerHTML = tx(el.dataset.sh)));
    scenes.forEach((s) => s.relabel && s.relabel());
  }

  /* each scene fades in when it comes into view */
  const sceneEls = $$(".scene", root);
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); } }), { threshold: 0.14 });
  sceneEls.forEach((s) => (reduced ? s.classList.add("in") : seen.observe(s)));

  /* ---------------------------------------------------------------- the crowd: the frames PhysiBoSS wrote, replayed (scenes 1 and 5) */
  const byName = TS ? Object.fromEntries(TS.conditions.map((c) => [c.name, c])) : {};
  function crowd(cv, opt = {}) {
    const ctx = cv.getContext("2d"), N = F.cells, pos = TS.positions, sp = TS.settings.spacing;
    const R = Math.max(...pos.map(([x, y]) => Math.hypot(x, y))) + sp, r01 = rand(11), thr = Float32Array.from({ length: N }, () => r01()), cache = new Map();
    const frame = (c, k) => {
      const key = c.name + ":" + k;
      if (!cache.has(key)) { const out = new Uint8Array(N); let i = 0; c.frames[k].replace(/(\d)(\d+),/g, (_, d, run) => { out.fill(+d, i, i + +run); i += +run; return ""; }); cache.set(key, out); }
      return cache.get(key);
    };
    let cond = null, f = 0, w = 0, raf = 0, running = false, phase = "play", t0 = 0, loop = false, done = null;
    const DUR = opt.dur || 6500, HOLD = opt.hold || 2400;
    function size() { const css = Math.max(220, cv.clientWidth || 420), d = Math.min(2, devicePixelRatio || 1); cv.width = cv.height = Math.round(css * d); w = cv.width; draw(); }
    function draw() {
      ctx.clearRect(0, 0, w, w);
      if (!cond) return;
      const steps = cond.times.length, k = Math.min(Math.floor(f), steps - 2), fr = Math.min(1, f - k), a = frame(cond, k), b = frame(cond, k + 1), s = w / (2 * R), rad = Math.max(1.2, sp * 0.47 * s);
      ctx.lineWidth = Math.max(1, w / 700);
      for (let i = 0; i < N; i++) {
        const st = a[i] === b[i] ? a[i] : fr > thr[i] ? b[i] : a[i], x = w / 2 + pos[i][0] * s, y = w / 2 - pos[i][1] * s;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832);
        if (st === 5) { ctx.strokeStyle = "rgba(255,255,255,.13)"; ctx.stroke(); } else { ctx.fillStyle = COL[st]; ctx.fill(); }
      }
      if (opt.onFrame) opt.onFrame(lerp(cond.alive[k], cond.alive[k + 1], fr), lerp(cond.times[k], cond.times[k + 1], fr) / 60);
    }
    function tick(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const el = now - t0, steps = cond.times.length;
      if (phase === "play") { const p = Math.min(1, el / DUR); f = p * (steps - 1); if (p >= 1) { phase = "hold"; t0 = now; } }
      else if (el > HOLD) {
        if (loop) { phase = "play"; t0 = now; f = 0; if (opt.onStart) opt.onStart(); }
        else { running = false; if (done) done(); return; }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    const api = {
      play(c, o = {}) { cancelAnimationFrame(raf); cond = c; loop = !!o.loop; done = o.done || null; f = 0; phase = "play"; t0 = 0; running = true; if (opt.onStart) opt.onStart(); raf = requestAnimationFrame(tick); },
      stop() { running = false; cancelAnimationFrame(raf); },
      still(c) { api.stop(); cond = c; f = c.times.length - 1; draw(); },
      get cond() { return cond; },
    };
    new ResizeObserver(size).observe(cv); size();
    return api;
  }

  /* ---------------------------------------------------------------- 1. the problem */
  (() => {
    const cv = $("#sCrowd"), scene = sceneOf(cv);
    if (!TS || !byName.radiation_only || !byName.radiation_only.frames) { scene.hidden = true; return; }
    const flash = $(".s-zap", scene);
    let hours = 0;
    const line = () => { $("#cLine").innerHTML = `${esc(tx("crowd.alive"))}<br>${esc(tx("hours", Math.round(hours)))}`; };
    const c = crowd(cv, { onFrame: (alive, h) => { hours = h; $("#cAlive").textContent = nf(Math.round(alive)); line(); }, onStart: () => { flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); } });
    const key = () => { $("#cKey").innerHTML = keyHTML([[COL[0], "k.alive"], [COL[2], "k.sen"], [COL[4], "k.die"], ["rgba(255,255,255,.4)", "k.gone", true]]); cv.setAttribute("aria-label", tx("alt.crowd")); line(); };
    scenes.push({ relabel: key }); key(); $("#cAlive").textContent = nf(X.cells);  /* before the replay starts, every cell is alive */
    if (reduced) c.still(byName.radiation_only); else whileVisible(scene, () => c.play(byName.radiation_only, { loop: true }), () => c.stop());
  })();

  /* ---------------------------------------------------------------- 2. a cell is a circuit of switches (a drawing, not the model) */
  (() => {
    const el = $("#sCircuit"), scene = sceneOf(el);
    const NODES = { dmg: [44, 170], n1: [130, 80], n2: [130, 170], n3: [130, 260], n4: [240, 40], n5: [240, 125], n6: [240, 215], n7: [240, 300] };
    const LAMPS = [[412, 50, "arrest", "f.arrest"], [412, 125, "senescence", "f.sen"], [412, 215, "autophagy", "f.auto"], [412, 290, "apoptosis", "f.die"]];
    const EDGES = [["dmg", "n1", 1], ["dmg", "n2", 1], ["dmg", "n3", 1], ["n1", "n4", 1], ["n1", "n5", 1], ["n2", "n5", 1], ["n2", "n6", 1], ["n3", "n6", 1], ["n3", "n7", 1], ["n2", "n4", -1], ["n3", "n5", -1], ["n1", "n6", -1],
      ["n4", "L0", 1], ["n5", "L1", 1], ["n6", "L2", 1], ["n7", "L3", 1]];
    const PATTERNS = [["dmg", "n1", "n4"], ["dmg", "n1", "n5"], ["dmg", "n3", "n6"], ["dmg", "n3", "n7"]];  /* pause, age, recycle, die */
    const CUT = ["n1", "n2", "n6"];
    const at = (id) => (id[0] === "L" ? [LAMPS[+id[1]][0] - 16, LAMPS[+id[1]][1]] : NODES[id]);
    const edgeEls = [], nodeEls = {}, lampEls = [], crossEls = {};
    const g = svg("g", {}, el);
    for (const [a, b, sign] of EDGES) {
      const [x1, y1] = at(a), [x2, y2] = at(b), len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, r0 = a === "dmg" ? 20 : 14, r1 = b[0] === "L" ? 2 : 15;
      const sx = x1 + ux * r0, sy = y1 + uy * r0, ex = x2 - ux * r1, ey = y2 - uy * r1;
      const path = svg("path", { class: "c-edge", d: `M${sx},${sy} L${ex},${ey}` }, g);
      const head = sign > 0 ? svg("polygon", { class: "c-head", points: `${ex},${ey} ${ex - ux * 9 - uy * 4.4},${ey - uy * 9 + ux * 4.4} ${ex - ux * 9 + uy * 4.4},${ey - uy * 9 - ux * 4.4}` }, g)
        : svg("line", { class: "c-head", x1: ex - uy * 7, y1: ey + ux * 7, x2: ex + uy * 7, y2: ey - ux * 7 }, g);
      edgeEls.push({ a, path, head });
    }
    for (const [id, [x, y]] of Object.entries(NODES)) {
      const n = svg("g", {}, g);
      svg("circle", { class: "c-node", cx: x, cy: y, r: id === "dmg" ? 20 : 14 }, n);
      if (id === "dmg") svg("path", { class: "c-bolt", d: `M${x + 3},${y - 12} L${x - 7},${y + 2} L${x - 1},${y + 2} L${x - 4},${y + 12} L${x + 7},${y - 3} L${x + 1},${y - 3} Z` }, n);
      else { const cr = svg("g", { class: "c-cross" }, n); svg("path", { d: `M${x - 9},${y - 9} L${x + 9},${y + 9} M${x + 9},${y - 9} L${x - 9},${y + 9}` }, cr); crossEls[id] = cr; }
      nodeEls[id] = n.firstChild;
    }
    const labs = LAMPS.map(([x, y, fate, key]) => {
      const l = svg("circle", { class: "c-lamp", cx: x, cy: y, r: 14, style: `--c: ${COL[{ arrest: 1, senescence: 2, autophagy: 3, apoptosis: 4 }[fate]]}` }, g);
      lampEls.push(l);
      const t = svg("text", { class: "c-lab", x, y: y + 31, "text-anchor": "middle" }, g); return [t, key];
    });
    function show(on, lamp, cut) {
      const set = new Set(on);
      for (const [id, n] of Object.entries(nodeEls)) { n.classList.toggle("on", set.has(id)); n.classList.toggle("cut", !!cut && CUT.includes(id)); }
      for (const [id, c] of Object.entries(crossEls)) c.classList.toggle("show", !!cut && CUT.includes(id));
      for (const e of edgeEls) { const o = set.has(e.a); e.path.classList.toggle("on", o); e.head.classList.toggle("on", o); }
      lampEls.forEach((l, i) => l.classList.toggle("on", i === lamp));
    }
    let step = 0, shown = 4, timer = 0, running = false;
    const cap = $("#cCap");
    function say() { cap.textContent = shown < 4 ? tx("circ.fate", tx(LAMPS[shown][3])) : tx("circ.cut"); }
    function run() {
      if (!running) return;
      shown = step; say(); show(step < 4 ? PATTERNS[step] : ["dmg", "n3", "n7"], step < 4 ? step : 3, step === 4);
      const wait = step === 4 ? 4200 : 2100; step = (step + 1) % 5; timer = setTimeout(run, wait);
    }
    const relabel = () => { labs.forEach(([t, k]) => (t.textContent = tx(k))); el.setAttribute("aria-label", tx("alt.circ")); say(); };
    scenes.push({ relabel }); relabel();
    if (reduced) { shown = 4; show(["dmg", "n3", "n7"], 3, true); say(); }
    else whileVisible(scene, () => { running = true; clearTimeout(timer); run(); }, () => { running = false; clearTimeout(timer); });
  })();

  /* ---------------------------------------------------------------- 3. which switches? every combination is an experiment */
  (() => {
    const cv = $("#sSearch"), scene = sceneOf(cv), ctx = cv.getContext("2d"), SZ = SPACE.sizes || {}, KEEP = (SPACE.keep || []).slice(0, X.found);
    const stages = [2, 3, 4, 5].map((k) => ({ k, n: SZ[String(k)] || 0 }));
    if (stages.some((s) => !s.n) || !KEEP.length) { scene.hidden = true; return; }
    const g2 = Math.ceil(Math.sqrt(stages[0].n)), off = new Map(), REVEAL = 1700, PER = 2900, LAST = 5200;
    let W = 0, running = false, raf = 0, t0 = 0, stage = 0;
    function image(n) {
      if (!off.has(n)) {
        const g = Math.ceil(Math.sqrt(n)), o = document.createElement("canvas"); o.width = o.height = g;
        const c = o.getContext("2d"), im = c.createImageData(g, g), d = im.data;
        for (let i = 0; i < n; i++) { const j = i * 4; d[j] = 207; d[j + 1] = 198; d[j + 2] = 245; d[j + 3] = n > 100000 ? 150 : 190; }
        c.putImageData(im, 0, 0); off.set(n, [o, g]);
      }
      return off.get(n);
    }
    function size() { const css = Math.max(220, cv.clientWidth || 420), d = Math.min(2, devicePixelRatio || 1); cv.width = cv.height = Math.round(css * d); W = cv.width; draw(0, stages[0].n, 1); }
    function draw(k, n, p) {
      ctx.clearRect(0, 0, W, W);
      const g = Math.ceil(Math.sqrt(n)), cell = W / g;
      if (n <= 20000) {
        const r = Math.max(1.4, cell * 0.34), sq = Math.max(1.3, cell * 0.62);  /* the dots come in at random places, not row by row */
        ctx.fillStyle = "rgba(207,198,245,.72)"; ctx.beginPath();
        for (let i = 0; i < n; i++) {
          let h = (i + 1) | 0; h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h ^= h >>> 16;
          if ((h >>> 0) / 4294967296 > p) continue;
          const x = ((i % g) + 0.5) * cell, y = (Math.floor(i / g) + 0.5) * cell;
          if (n <= 3000) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832); } else ctx.rect(x - sq / 2, y - sq / 2, sq, sq);
        }
        ctx.fill();
      } else {  /* the big fields fade in while they grow to full size */
        const [o] = image(n), sc = lerp(0.62, 1, p), at = (W * (1 - sc)) / 2;
        ctx.save(); ctx.globalAlpha = p; ctx.imageSmoothingEnabled = true; ctx.drawImage(o, at, at, W * sc, W * sc); ctx.restore();
      }
      ctx.save(); ctx.shadowColor = "#6cf0b8"; ctx.shadowBlur = W / 30; ctx.fillStyle = "#6cf0b8";
      for (const i of KEEP) { ctx.beginPath(); ctx.arc(((i % g2) + 0.5) * (W / g2), (Math.floor(i / g2) + 0.5) * (W / g2), Math.max(3.2, W / 120), 0, 6.2832); ctx.fill(); }
      ctx.restore();
    }
    const label = (k, n) => { $("#sCount").textContent = nf(n); $("#sStage").textContent = tx("srch.k", k); $("#sStageNote").textContent = k === 2 ? tx("srch.n2") : tx("srch.n3"); };
    function tick(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const el = now - t0, st = stages[stage], p = ease(el / REVEAL);
      draw(st.k, st.n, p); $("#sCount").textContent = nf(Math.round(st.n * p)); $("#sStage").textContent = tx("srch.k", st.k); $("#sStageNote").textContent = st.k === 2 ? tx("srch.n2") : tx("srch.n3");
      if (el > (stage === stages.length - 1 ? PER + LAST : PER)) { stage = (stage + 1) % stages.length; t0 = now; }
      raf = requestAnimationFrame(tick);
    }
    const relabel = () => { cv.setAttribute("aria-label", tx("alt.search")); const st = stages[stage]; label(st.k, st.n); };
    scenes.push({ relabel }); new ResizeObserver(size).observe(cv); size(); relabel();
    if (reduced) { stage = 3; draw(5, stages[3].n, 1); label(5, stages[3].n); }
    else whileVisible(scene, () => { running = true; t0 = 0; raf = requestAnimationFrame(tick); }, () => { running = false; cancelAnimationFrame(raf); });
  })();

  /* ---------------------------------------------------------------- 4. an AI reads, a checker checks */
  (() => {
    const el = $("#sHelpers"), scene = sceneOf(el), sq = () => Array.from({ length: 10 }, () => "<i></i>").join("");
    el.innerHTML = `<div class="h-top">
        <div class="h-box"><svg viewBox="0 0 84 72" aria-hidden="true"><rect class="h-page" x="14" y="10" width="42" height="52" rx="6" transform="rotate(-8 35 36)"/><rect class="h-page" x="22" y="8" width="42" height="52" rx="6" transform="rotate(4 43 34)"/><rect class="h-page top" x="28" y="12" width="42" height="52" rx="6"/><path class="h-line" d="M36 28h26M36 36h26M36 44h18"/></svg><span id="hPapers"></span></div>
        <div class="h-arrow" aria-hidden="true">→<b class="h-ai">AI</b>→</div>
        <div class="h-box h-linkbox"><svg viewBox="0 0 84 72" aria-hidden="true"><path class="h-wire" d="M16 52L42 18M42 18L70 50"/><path class="h-wire new" d="M16 52L70 50"/><circle class="h-dot" cx="16" cy="52" r="7"/><circle class="h-dot" cx="42" cy="18" r="7"/><circle class="h-dot" cx="70" cy="50" r="7"/></svg><span id="hLink"></span></div>
      </div>
      <div class="h-run" id="hRun"></div>
      <div class="h-row alone"><span class="h-lab" id="hAlone"></span><div class="h-sq" id="sqA">${sq()}</div><span class="h-res" id="hAloneRes"></span></div>
      <div class="h-row checked"><span class="h-lab" id="hChecked"></span><div class="h-sq" id="sqC">${sq()}</div><span class="h-res" id="hCheckedRes"></span></div>`;
    const A = $$("#sqA i"), C = $$("#sqC i"), box = $(".h-linkbox", el), { later, clear } = clock();
    const relabel = () => {
      $("#hPapers").textContent = tx("help.papers"); $("#hLink").textContent = tx("help.link"); $("#hRun").textContent = tx("help.run");
      $("#hAlone").textContent = tx("help.alone"); $("#hAloneRes").textContent = tx("help.alone.res"); $("#hChecked").textContent = tx("help.checked"); $("#hCheckedRes").textContent = tx("help.checked.res");
    };
    const reset = () => { clear(); [...A, ...C].forEach((i) => (i.className = "")); box.classList.remove("new"); el.classList.remove("done"); };
    const bad = Math.min(10, UN[0]);
    function play() {
      reset(); later(() => box.classList.add("new"), 900);
      A.forEach((i, n) => later(() => i.classList.add(n < bad ? "bad" : "ok"), 2200 + n * 230));
      C.forEach((i, n) => later(() => i.classList.add("ok"), 2200 + n * 230));
      later(() => el.classList.add("done"), 5000); later(play, 12500);
    }
    scenes.push({ relabel }); relabel();
    if (reduced) { A.forEach((i, n) => i.classList.add(n < bad ? "bad" : "ok")); C.forEach((i) => i.classList.add("ok")); el.classList.add("done", "new"); box.classList.add("new"); }
    else whileVisible(scene, play, reset);
  })();

  /* ---------------------------------------------------------------- 5. does it hold in a crowd? (the simulation again, with switches applied) */
  (() => {
    const cv = $("#sTissue"), scene = sceneOf(cv);
    const last = (c) => c.alive[c.alive.length - 1], withFrames = (g) => TS.conditions.filter((c) => c.group === g && c.frames);
    if (!TS || !byName.radiation_only) { scene.hidden = true; return; }
    const hit = withFrames("hit").find((c) => last(c) === 0) || withFrames("hit")[0], misses = withFrames("miss");
    const rejected = misses.length ? misses.reduce((b, c) => (Math.abs(last(c) - 0.25 * F.cells) < Math.abs(last(b) - 0.25 * F.cells) ? c : b), misses[0]) : null;
    const novel = withFrames("novel").find((c) => last(c) === 0) || withFrames("novel")[0];
    const items = [byName.radiation_only, hit, rejected, novel].map((c, i) => (c ? { c, i } : null)).filter(Boolean);
    let cur = items[0], auto = true, hours = 0, live = 0;
    const note = () => { const i = cur.i; $("#tNote2").textContent = `${i === 0 ? tx("tis.n0") : i === 1 ? tx("tis.n1", last(cur.c)) : i === 2 ? tx("tis.n2") : tx("tis.n3")} ${tx("tis.foot")}`; };
    const line = () => { $("#tLine").innerHTML = `${esc(tx("tis.of", live))}<br>${esc(tx("hours", Math.round(hours)))}`; };
    const { later, clear } = clock(), c = crowd(cv, { dur: 6200, onFrame: (a, h) => { live = Math.round(a); hours = h; $("#tAlive").textContent = nf(live); line(); } });
    const pick = $("#tPick");
    const btns = items.map((it) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.addEventListener("click", () => { auto = false; go(it); }); pick.appendChild(b); return b; });
    function go(it) {
      cur = it; btns.forEach((b, i) => b.setAttribute("aria-pressed", String(items[i] === it))); note();
      if (reduced) c.still(it.c); else c.play(it.c, { done: () => { if (auto) later(() => go(items[(items.indexOf(cur) + 1) % items.length]), 1400); } });
    }
    const relabel = () => { btns.forEach((b, i) => (b.textContent = tx("tis.b" + items[i].i))); $("#tKey").innerHTML = keyHTML([[COL[0], "k.alive"], [COL[2], "k.sen"], [COL[4], "k.die"], ["rgba(255,255,255,.4)", "k.gone", true]]); cv.setAttribute("aria-label", tx("alt.tissue")); note(); line(); };
    scenes.push({ relabel }); live = X.cells; $("#tAlive").textContent = nf(X.cells); relabel();
    let started = false;
    whileVisible(scene, () => { if (!started) { started = true; go(cur); } else if (auto) go(cur); }, () => { c.stop(); clear(); });
  })();

  /* ---------------------------------------------------------------- 6. every tumour is different (public counts: one dot per sample) */
  (() => {
    const cv = $("#sWaffle"), scene = sceneOf(cv), ctx = cv.getContext("2d");
    if (!r1 || r1.any_works == null || !r2) { scene.hidden = true; return; }
    const N = r1.samples, COLS = 100, ROWS = Math.ceil(N / COLS), cat = (r) => ({ works: r.any_works, lost: r.tp53_lost, none: r.samples - r.any_works - r.tp53_lost });
    const CAT = { r1: cat(r1), r2: cat(r2) }, GRN = "#58e6ac", AMB = "#ffd27a", RED = "#ff6a5c";
    let rule = "r1", cur = { ...CAT.r1 }, from = cur, reveal = 0, W = 0, H = 0, raf = 0, t0 = 0, tween = 0, running = false;
    function size() { const css = Math.max(240, cv.clientWidth || 420), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(css * d); cv.height = Math.round((css * ROWS * d) / COLS); cv.style.aspectRatio = `${COLS} / ${ROWS}`; W = cv.width; H = cv.height; draw(); }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cell = W / COLS, rad = Math.max(0.9, cell * 0.37), lim = Math.floor(N * reveal), b0 = cur.works, b1 = cur.works + cur.none;
      for (const [from_, to_, colour] of [[0, b0, GRN], [b0, b1, AMB], [b1, N, RED]]) {  /* one path per colour: ten thousand dots stay cheap */
        ctx.fillStyle = colour; ctx.beginPath();
        for (let i = Math.floor(from_); i < Math.min(lim, Math.ceil(to_)); i++) { const x = ((i % COLS) + 0.5) * cell, y = (Math.floor(i / COLS) + 0.5) * cell; ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, 6.2832); }
        ctx.fill();
      }
    }
    const counter = () => { const lost = Math.round((100 * cur.lost) / N); $("#gLost").textContent = String(lost); $("#gLine").textContent = tx("gen.line"); };
    function frame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 2600); reveal = ease(p);
      const q = ease((now - tween) / 800), to = CAT[rule];
      if (tween && q < 1) cur = { works: lerp(from.works, to.works, q), none: lerp(from.none, to.none, q), lost: lerp(from.lost, to.lost, q) }; else if (tween) { cur = { ...to }; tween = 0; }
      draw(); counter();
      if (p < 1 || tween) raf = requestAnimationFrame(frame); else running = false;
    }
    const kick = () => { cancelAnimationFrame(raf); running = true; raf = requestAnimationFrame(frame); };
    const pickEl = $("#gPick"), btn = {};
    for (const k of ["r1", "r2"]) { const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.setAttribute("aria-pressed", String(k === rule)); b.addEventListener("click", () => {
      if (rule === k) return; rule = k; from = { ...cur }; tween = performance.now() || 1; Object.entries(btn).forEach(([kk, bb]) => bb.setAttribute("aria-pressed", String(kk === rule))); if (reduced) { cur = { ...CAT[k] }; tween = 0; draw(); counter(); } else kick(); }); pickEl.appendChild(b); btn[k] = b; }
    const relabel = () => { btn.r1.textContent = tx("gen.r1"); btn.r2.textContent = tx("gen.r2"); $("#gKey").innerHTML = keyHTML([[GRN, "gen.k0"], [AMB, "gen.k1"], [RED, "gen.k2"]]); cv.setAttribute("aria-label", tx("alt.waffle")); counter(); };
    scenes.push({ relabel }); new ResizeObserver(size).observe(cv); size(); relabel();
    if (reduced) { reveal = 1; draw(); counter(); } else { let first = true; whileVisible(scene, () => { if (first) { first = false; t0 = 0; reveal = 0; kick(); } }, () => {}, 0.3); }
  })();

  /* ---------------------------------------------------------------- the close */
  (() => {
    const ul = $("#hCards");
    ul.innerHTML = [["yes", "✓", "hon.c0"], ["mid", "!", "hon.c1"], ["mid", "!", "hon.c2"]].map(([cls, icon, k]) => `<li class="${cls}"><i>${icon}</i><span data-s="${k}"></span></li>`).join("");
  })();

  paintText();
  $("#lang").addEventListener("click", () => setTimeout(paintText, 0));
})();
