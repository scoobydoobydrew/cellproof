/* CellProof report, part 6: the papers. Two parts in one place. Part one is the papers the AI found and read on its own (the open-access corpus, in
   the file the page was built from); part two is a PDF you give it, for a paper it cannot reach, read on your computer by `cellproof serve`.
   Either way a paper becomes a graph: every gene or molecule it names is a dot, every claim a line, and the colour of the line is what the exact
   solver said (results of ingest/graph.py). The page only draws what it is given; without the local server the second part explains itself. */
(() => {
  const root = $("#papers"), PP = D.papers;
  if (!root) return;
  if (!PP || !window.CP) { root.remove(); $$('nav a[href="#papers"]').forEach((a) => a.remove()); return; }
  const { T, num } = CP;

  CP.add({
    en: {
      "pp.eyebrow": "The papers", "pp.h2": "The AI reads papers. <em>You can hand it more.</em>",
      "pp.lede": "Papers say things like “this gene switches that one on”. The AI reads them, and a checker tests every such claim against known lab results. Part one: the papers it found on its own. Part two: a PDF you hand it, for a paper it cannot reach. Either way, a paper becomes a map you can read.",
      "pp.auto": "Found by the AI", "pp.own": "Your PDFs", "pp.autoN": (n) => `${n} papers, read on its own`, "pp.ownN.off": "needs the local server", "pp.ownN.on": (n) => (n ? `${n} on this computer` : "drop one to start"),
      "pp.drop": "Drop a PDF here", "pp.dropsub": "or click to choose one", "pp.off.h": "Some papers sit behind a login.",
      "pp.off.p": "If you have access, you can hand the PDF to the AI: it is read like the others, the checker tests its claims, and its map appears here. That part runs on your computer, because a web page has no key and no checker.",
      "pp.copy": "Copy", "pp.copied": "Copied", "pp.privacy": "Only drop papers you may process. Its text goes to the Meta Model API to be read; the PDF and everything read from it stay on this computer.",
      "pp.base": (p, c, l) => `Your database: ${p} ${p === 1 ? "paper" : "papers"} and ${num(l)} claims.`,
      "pp.example": "Example: a paper the AI found on its own. A PDF of yours is drawn the same way.", "pp.none": "No gene acting on another was found in this paper.",
      "pp.kicker": "What this paper says, drawn as a map",
      "pp.g1.h": "A dot is a gene", "pp.g1.p": "A gene or molecule the paper talks about. Pale dots are in our model of the cell, a map of the genes that decide what a damaged cell does. Dark dots are genes our model does not have.",
      "pp.g2.h": "A line is a claim", "pp.g2.p": "One sentence from the paper: this gene turns that one on (arrow) or off (bar). The AI picked it out.",
      "pp.g3.h": "A colour is the verdict", "pp.g3.p": (n) => `The checker tests each claim against ${n} known lab results. <em class="c-a">Green</em> fits them all, <em class="c-r">red</em> breaks one, <em class="c-p">blue</em> is already known, <em class="c-o">grey</em> cannot be tested yet.`,
      "pp.meta": (g, l) => `${l} ${l === 1 ? "claim" : "claims"} drawn`, "pp.open": "open the paper",
      "pp.v.accepted": "New, and it fits", "pp.v.rejected": "New, but it breaks a result", "pp.v.present": "Already known",
      "pp.v.implied": "Follows from known links", "pp.v.conflict": "Contradicts the published model", "pp.v.outside": "Cannot be tested yet",
      "pp.t.accepted": (n) => `A claim that is new to our model and agrees with all ${n} known lab results.`, "pp.t.rejected": "A new claim that would make our model contradict a known lab result.",
      "pp.t.present": "Our model already contains this claim.", "pp.t.implied": "Our model already reaches this through a longer chain of links.",
      "pp.t.conflict": "The published model says the opposite.", "pp.t.outside": "A gene in this claim is not in our model, so the checker cannot test it yet.",
      "pp.x.accepted": (n) => `New to our model. Adding it keeps all ${n} known results true.`, "pp.x.rejected": (list) => (list ? `Adding it would contradict known lab result ${list}.` : "Adding it would contradict a known lab result."),
      "pp.x.present": "Our model already has this link.", "pp.x.implied": "Our model already reaches this through a longer chain of links.",
      "pp.x.conflict": "The published model says the opposite, so this claim was not added.", "pp.x.outside": (names, k) => `${names} ${k === 1 ? "is" : "are"} not in our model yet, so the checker cannot test this claim.`,
      "pp.sentence": "The sentence from the paper", "pp.found": "What the checker found",
      "pp.act.activates": "turns on", "pp.act.inhibits": "turns off", "pp.act.requires": "needs",
      "pp.hint": "Click a line to see the sentence behind it and what the checker said.", "pp.hover": "Click to keep it open.", "pp.more": (n) => `The paper says this ${n} times.`,
      "pp.n.dots": "Every dot is a gene or molecule this paper mentions.", "pp.n.line": (i, m) => `Claim ${i} of ${m}, read from a sentence in the paper:`, "pp.n.check": (n) => `Now the checker tests each claim against the ${n} known lab results…`,
      "pp.summary": (n, c) => `${n} claims · ${c.accepted} new and fitting every known result · ${c.rejected} new but breaking one · ${c.present + c.implied} already known to our model · ${c.conflict} contradicting the published model · ${c.outside} not testable yet (genes our model does not have)`,
      "pp.s.read": "Reading the PDF", "pp.s.guard": "Checking it is not an audit paper", "pp.s.mechanism": "Muse Spark reads the mechanisms", "pp.s.stimulus": "Muse Spark reads what damage does",
      "pp.s.ground": "Naming the genes", "pp.s.check": "The checker tests each claim",
      "pp.d.read": (p, c) => `${p} ${p === 1 ? "page" : "pages"}, ${num(c)} characters`, "pp.d.claims": (n, usd) => `${n} sentences · $${usd}`, "pp.d.ground": (l) => `${l} claims`, "pp.d.check": (n) => `${n} claims tested`,
      "pp.plan.cost": (usd) => (usd ? `Reading it costs about $${usd} (Muse Spark, two passes).` : "Reading it costs a few cents (Muse Spark, two passes)."), "pp.plan.sent": "Its text will be sent to the Meta Model API.",
      "pp.plan.read": "Read it", "pp.plan.cancel": "Cancel", "pp.plan.doi": "DOI", "pp.plan.nodoi": "no DOI found", "pp.reading": "Reading…",
      "pp.done": (c, l) => `Added to your database: ${l} claims, from ${c} sentences.`, "pp.refused": "Not added.", "pp.failed": "It could not be read.", "pp.nokey": "The server has no key: add MODEL_API_KEY to .env and restart it.",
      "pp.remove": "remove", "pp.sure": "sure?", "pp.badfile": "That is not a PDF.", "pp.again": "Drop another",
      "pp.grapharia": "A map: each gene or molecule of the paper is a dot, each claim a line, coloured by what the checker said.", "pp.droparia": "Drop a PDF here, or press to choose one",
    },
    el: {
      "pp.eyebrow": "Τα papers", "pp.h2": "Το AI διαβάζει papers. <em>Μπορείς να του δώσεις κι άλλα.</em>",
      "pp.lede": "Τα papers λένε πράγματα όπως «αυτό το γονίδιο ανάβει εκείνο». Το AI τα διαβάζει και ένας ελεγκτής δοκιμάζει κάθε τέτοιο ισχυρισμό απέναντι σε γνωστά αποτελέσματα εργαστηρίου. Μέρος πρώτο: τα papers που βρήκε μόνο του. Μέρος δεύτερο: ένα PDF που του δίνεις, για ένα paper που δεν φτάνει. Σε κάθε περίπτωση, ένα paper γίνεται ένας χάρτης που μπορείς να διαβάσεις.",
      "pp.auto": "Βρέθηκαν από το AI", "pp.own": "Τα PDF σου", "pp.autoN": (n) => `${n} papers, διαβασμένα μόνο του`, "pp.ownN.off": "θέλει τον τοπικό server", "pp.ownN.on": (n) => (n ? `${n} σε αυτόν τον υπολογιστή` : "άφησε ένα για να ξεκινήσεις"),
      "pp.drop": "Άφησε ένα PDF εδώ", "pp.dropsub": "ή κάνε κλικ για να διαλέξεις", "pp.off.h": "Κάποια papers είναι πίσω από σύνδεση.",
      "pp.off.p": "Αν έχεις πρόσβαση, μπορείς να δώσεις το PDF στο AI: διαβάζεται όπως τα άλλα, ο ελεγκτής δοκιμάζει τους ισχυρισμούς του και ο χάρτης του εμφανίζεται εδώ. Αυτό το μέρος τρέχει στον υπολογιστή σου, γιατί μια ιστοσελίδα δεν έχει κλειδί ούτε ελεγκτή.",
      "pp.copy": "Αντιγραφή", "pp.copied": "Αντιγράφηκε", "pp.privacy": "Άφησε μόνο papers που επιτρέπεται να επεξεργαστείς. Το κείμενό του πηγαίνει στο Meta Model API για να διαβαστεί· το PDF και ό,τι διαβάστηκε από αυτό μένουν στον υπολογιστή σου.",
      "pp.base": (p, c, l) => `Η βάση σου: ${p} ${p === 1 ? "paper" : "papers"} και ${num(l)} ισχυρισμοί.`,
      "pp.example": "Παράδειγμα: ένα paper που βρήκε το AI μόνο του. Ένα δικό σου PDF σχεδιάζεται με τον ίδιο τρόπο.", "pp.none": "Σε αυτό το paper δεν βρέθηκε γονίδιο που δρα σε άλλο.",
      "pp.kicker": "Τι λέει αυτό το paper, ζωγραφισμένο ως χάρτης",
      "pp.g1.h": "Μια κουκκίδα είναι ένα γονίδιο", "pp.g1.p": "Ένα γονίδιο ή μόριο για το οποίο μιλά το paper. Οι ανοιχτόχρωμες κουκκίδες υπάρχουν στο μοντέλο μας για το κύτταρο, έναν χάρτη των γονιδίων που αποφασίζουν τι κάνει ένα κύτταρο με βλάβη. Οι σκούρες είναι γονίδια που το μοντέλο μας δεν έχει.",
      "pp.g2.h": "Μια γραμμή είναι ένας ισχυρισμός", "pp.g2.p": "Μία πρόταση από το paper: αυτό το γονίδιο ανάβει (βέλος) ή σβήνει (μπάρα) εκείνο. Την επέλεξε το AI.",
      "pp.g3.h": "Ένα χρώμα είναι η κρίση", "pp.g3.p": (n) => `Ο ελεγκτής δοκιμάζει κάθε ισχυρισμό απέναντι σε ${n} γνωστά αποτελέσματα εργαστηρίου. Το <em class="c-a">πράσινο</em> τα ταιριάζει όλα, το <em class="c-r">κόκκινο</em> χαλάει ένα, το <em class="c-p">μπλε</em> είναι ήδη γνωστό, το <em class="c-o">γκρι</em> δεν μπορεί να δοκιμαστεί ακόμα.`,
      "pp.meta": (g, l) => `${l} ${l === 1 ? "ισχυρισμός" : "ισχυρισμοί"} στον χάρτη`, "pp.open": "άνοιξε το paper",
      "pp.v.accepted": "Νέος, και ταιριάζει", "pp.v.rejected": "Νέος, αλλά χαλάει ένα αποτέλεσμα", "pp.v.present": "Ήδη γνωστός",
      "pp.v.implied": "Προκύπτει από γνωστές συνδέσεις", "pp.v.conflict": "Αντιφάσκει με το δημοσιευμένο μοντέλο", "pp.v.outside": "Δεν δοκιμάζεται ακόμα",
      "pp.t.accepted": (n) => `Ένας ισχυρισμός νέος για το μοντέλο μας που συμφωνεί και με τα ${n} γνωστά αποτελέσματα εργαστηρίου.`, "pp.t.rejected": "Ένας νέος ισχυρισμός που θα έκανε το μοντέλο μας να αντιφάσκει με ένα γνωστό αποτέλεσμα εργαστηρίου.",
      "pp.t.present": "Το μοντέλο μας έχει ήδη αυτόν τον ισχυρισμό.", "pp.t.implied": "Το μοντέλο μας φτάνει ήδη εκεί μέσα από μια μακρύτερη αλυσίδα συνδέσεων.",
      "pp.t.conflict": "Το δημοσιευμένο μοντέλο λέει το αντίθετο.", "pp.t.outside": "Ένα γονίδιο αυτού του ισχυρισμού δεν υπάρχει στο μοντέλο μας, οπότε ο ελεγκτής δεν μπορεί να τον δοκιμάσει ακόμα.",
      "pp.x.accepted": (n) => `Νέο για το μοντέλο μας. Αν προστεθεί, και τα ${n} γνωστά αποτελέσματα μένουν αληθή.`, "pp.x.rejected": (list) => (list ? `Αν προστεθεί, θα αντέφασκε με το γνωστό αποτέλεσμα ${list}.` : "Αν προστεθεί, θα αντέφασκε με ένα γνωστό αποτέλεσμα εργαστηρίου."),
      "pp.x.present": "Το μοντέλο μας έχει ήδη αυτή τη σύνδεση.", "pp.x.implied": "Το μοντέλο μας φτάνει ήδη εκεί μέσα από μια μακρύτερη αλυσίδα συνδέσεων.",
      "pp.x.conflict": "Το δημοσιευμένο μοντέλο λέει το αντίθετο, γι' αυτό ο ισχυρισμός δεν προστέθηκε.", "pp.x.outside": (names, k) => `${k === 1 ? "Το γονίδιο" : "Τα γονίδια"} ${names} ${k === 1 ? "δεν υπάρχει" : "δεν υπάρχουν"} ακόμα στο μοντέλο μας, οπότε ο ελεγκτής δεν μπορεί να δοκιμάσει αυτόν τον ισχυρισμό.`,
      "pp.sentence": "Η πρόταση από το paper", "pp.found": "Τι βρήκε ο ελεγκτής",
      "pp.act.activates": "ανάβει", "pp.act.inhibits": "σβήνει", "pp.act.requires": "χρειάζεται",
      "pp.hint": "Κάνε κλικ σε μια γραμμή για να δεις την πρόταση πίσω της και τι είπε ο ελεγκτής.", "pp.hover": "Κάνε κλικ για να μείνει ανοιχτό.", "pp.more": (n) => `Το paper το λέει ${n} φορές.`,
      "pp.n.dots": "Κάθε κουκκίδα είναι ένα γονίδιο ή μόριο που αναφέρει το paper.", "pp.n.line": (i, m) => `Ισχυρισμός ${i} από ${m}, διαβασμένος από μια πρόταση του paper:`, "pp.n.check": (n) => `Τώρα ο ελεγκτής δοκιμάζει κάθε ισχυρισμό απέναντι στα ${n} γνωστά αποτελέσματα εργαστηρίου…`,
      "pp.summary": (n, c) => `${n} ισχυρισμοί · ${c.accepted} νέοι που ταιριάζουν σε κάθε γνωστό αποτέλεσμα · ${c.rejected} νέοι που χαλούν ένα · ${c.present + c.implied} ήδη γνωστοί στο μοντέλο μας · ${c.conflict} που αντιφάσκουν με το δημοσιευμένο μοντέλο · ${c.outside} που δεν δοκιμάζονται ακόμα (γονίδια που το μοντέλο μας δεν έχει)`,
      "pp.s.read": "Διαβάζει το PDF", "pp.s.guard": "Ελέγχει ότι δεν είναι paper του audit", "pp.s.mechanism": "Το Muse Spark διαβάζει τους μηχανισμούς", "pp.s.stimulus": "Το Muse Spark διαβάζει τι κάνει η βλάβη",
      "pp.s.ground": "Δίνει ονόματα στα γονίδια", "pp.s.check": "Ο ελεγκτής δοκιμάζει κάθε ισχυρισμό",
      "pp.d.read": (p, c) => `${p} ${p === 1 ? "σελίδα" : "σελίδες"}, ${num(c)} χαρακτήρες`, "pp.d.claims": (n, usd) => `${n} προτάσεις · $${usd}`, "pp.d.ground": (l) => `${l} ισχυρισμοί`, "pp.d.check": (n) => `${n} ισχυρισμοί δοκιμάστηκαν`,
      "pp.plan.cost": (usd) => (usd ? `Η ανάγνωση κοστίζει περίπου $${usd} (Muse Spark, δύο περάσματα).` : "Η ανάγνωση κοστίζει μερικά σεντς (Muse Spark, δύο περάσματα)."), "pp.plan.sent": "Το κείμενό του θα σταλεί στο Meta Model API.",
      "pp.plan.read": "Διάβασέ το", "pp.plan.cancel": "Άκυρο", "pp.plan.doi": "DOI", "pp.plan.nodoi": "δεν βρέθηκε DOI", "pp.reading": "Διαβάζει…",
      "pp.done": (c, l) => `Προστέθηκε στη βάση σου: ${l} ισχυρισμοί, από ${c} προτάσεις.`, "pp.refused": "Δεν προστέθηκε.", "pp.failed": "Δεν μπόρεσε να διαβαστεί.", "pp.nokey": "Ο server δεν έχει κλειδί: πρόσθεσε το MODEL_API_KEY στο .env και ξαναξεκίνησέ τον.",
      "pp.remove": "διαγραφή", "pp.sure": "σίγουρα;", "pp.badfile": "Αυτό δεν είναι PDF.", "pp.again": "Άφησε άλλο",
      "pp.grapharia": "Ένας χάρτης: κάθε γονίδιο ή μόριο του paper είναι μια κουκκίδα, κάθε ισχυρισμός μια γραμμή, χρωματισμένη με ό,τι είπε ο ελεγκτής.", "pp.droparia": "Άφησε ένα PDF εδώ ή πάτα για να διαλέξεις",
    },
  });
  CP.refresh();

  const VERDICTS = ["accepted", "rejected", "present", "implied", "conflict", "outside"];
  const COLOR = { accepted: "#58e6ac", rejected: "#ff6874", present: "#8fb0ff", implied: "#b9acff", conflict: "#ffaa5c", outside: "rgba(255,255,255,.42)" };
  const MARK = { accepted: "✓", rejected: "✕", conflict: "≠" }, EFFECTS = ["activates", "inhibits", "requires"];
  let W = 760, H = 500;  /* a phone gets a taller, narrower picture, so that the words stay readable */
  const svgEl = $("#ppSvg"), list = $("#ppList"), legend = $("#ppLegend"), detail = $("#ppDetail"), reader = $("#ppReader"), job = $("#ppJob");
  const judged = (c) => c.accepted + c.rejected + c.present + c.implied + c.conflict, total = (c) => VERDICTS.reduce((a, v) => a + c[v], 0);
  const AUTO = PP.auto.slice().sort((a, b) => judged(b.graph.counts) - judged(a.graph.counts) || b.graph.edges.length - a.graph.edges.length);
  const FIRST = AUTO.find((p) => p.graph.edges.length >= 14 && p.graph.edges.length <= 36) || AUTO[0];  /* readable at once: the first one that is neither tiny nor a hairball */
  const OUT = (() => {  /* the genes outside the model get numbers after the model's, the same in every paper; real names come with the Real names button */
    const ids = [...new Set(PP.auto.flatMap((p) => p.graph.nodes.filter((n) => !n.model).map((n) => n.id)))].sort(), start = Math.max(0, ...Object.values(GENE_NO)) + 1;
    return Object.fromEntries(ids.map((id, i) => [id, start + i]));
  })();
  const label = (n, mine) => (n.model ? (mine ? fullName(n.id) : pretty(n.id)) : mine || NAMES ? n.name : `Gene ${OUT[n.id] || "?"}`);

  let part = "auto", paper = null, own = [], served = null, hiddenV = new Set(), token = 0, timers = [], picked = -1, jobState = null, lastCounts = null;
  const later = (ms, fn) => { timers.push(setTimeout(fn, ms)); };
  const stop = () => { token++; timers.forEach(clearTimeout); timers = []; };

  /* ---------------------------------------------------------------- the layout: a force layout that always ends the same way */
  function layout(nodes, edges) {
    const n = nodes.length, index = new Map(nodes.map((d, i) => [d.id, i]));
    const pos = nodes.map((d, i) => { const a = (i / n) * TAU + (d.model ? 0 : 0.37), r = (d.model ? 0.2 : 0.4) * H; return { x: W / 2 + Math.cos(a) * r * 1.5, y: H / 2 + Math.sin(a) * r, dx: 0, dy: 0 }; });
    const links = edges.map((e) => [index.get(e.s), index.get(e.t)]).filter(([a, b]) => a !== undefined && b !== undefined && a !== b);
    const k = Math.sqrt((W * H) / Math.max(n, 1)) * 0.6, iterations = 320;
    for (let it = 0; it < iterations; it++) {
      const temp = (1 - it / iterations) * W * 0.05 + 0.4;
      for (const p of pos) { p.dx = 0; p.dy = 0; }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y, d2 = dx * dx + dy * dy;
        if (d2 < 0.01) { dx = 0.1 * (i - j); dy = 0.1; d2 = dx * dx + dy * dy; }
        const f = (k * k) / d2; pos[i].dx += dx * f; pos[i].dy += dy * f; pos[j].dx -= dx * f; pos[j].dy -= dy * f;
      }
      for (const [a, b] of links) { const dx = pos[a].x - pos[b].x, dy = pos[a].y - pos[b].y, f = Math.hypot(dx, dy) / k; pos[a].dx -= dx * f; pos[a].dy -= dy * f; pos[b].dx += dx * f; pos[b].dy += dy * f; }
      for (const p of pos) {
        p.dx += (W / 2 - p.x) * 0.014; p.dy += (H / 2 - p.y) * 0.02;
        const d = Math.hypot(p.dx, p.dy) || 1, m = Math.min(d, temp);
        p.x = Math.min(W - 60, Math.max(60, p.x + (p.dx / d) * m)); p.y = Math.min(H - 34, Math.max(40, p.y + (p.dy / d) * m));
      }
    }
    return pos;
  }

  /* ---------------------------------------------------------------- the drawing */
  function defs() {
    const d = svg("defs", {}, svgEl);
    for (const v of ["base", ...VERDICTS]) for (const e of EFFECTS) {
      const m = svg("marker", { id: `ppm-${v}-${e}`, viewBox: "-1 -1 10 10", markerWidth: 10, markerHeight: 10, refX: e === "activates" ? 8 : e === "inhibits" ? 6 : 6, refY: 4, orient: "auto", markerUnits: "userSpaceOnUse" }, d);
      const fill = v === "base" ? "rgba(255,255,255,.92)" : COLOR[v];
      if (e === "activates") svg("path", { d: "M0,0 L8,4 L0,8 z", fill }, m);
      else if (e === "inhibits") svg("rect", { x: 4.6, y: -1, width: 2.6, height: 10, rx: 1, fill }, m);
      else svg("circle", { cx: 5, cy: 4, r: 3.2, fill }, m);
    }
  }
  const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const edgeText = (e, p) => `${label(p.nodes[e.s], p.mine)} ${T("pp.act." + e.effect)} ${label(p.nodes[e.t], p.mine)}`;

  function draw(p, animate) {
    stop(); picked = -1; svgEl.replaceChildren(); svgEl.classList.remove("dim");
    const narrow = $("#ppStage").clientWidth < 560; W = narrow ? 460 : 760; H = narrow ? 580 : 500;
    VERDICTS.forEach((v) => svgEl.classList.toggle(`hide-${v}`, hiddenV.has(v)));
    const g = p.graph;
    if (!g.edges.length) { svgEl.setAttribute("viewBox", `0 0 ${W} 120`); const t = svg("text", { x: W / 2, y: 60, "text-anchor": "middle", fill: "rgba(255,255,255,.7)", "font-size": 15 }, svgEl); t.textContent = T("pp.none"); renderLegend(g.counts); detailHint(); return; }
    svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
    defs();
    const nodes = g.nodes, pos = layout(nodes, g.edges), at = new Map(nodes.map((n, i) => [n.id, pos[i]]));
    const degree = new Map();
    for (const e of g.edges) { degree.set(e.s, (degree.get(e.s) || 0) + 1); degree.set(e.t, (degree.get(e.t) || 0) + 1); }
    const rad = (id) => (narrow ? 5.4 : 4.6) + Math.min(5.4, (degree.get(id) || 1) * 0.85);
    p.nodes = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const gE = svg("g", {}, svgEl), gH = svg("g", {}, svgEl), gM = svg("g", {}, svgEl), gN = svg("g", {}, svgEl);
    const els = [], marks = [], nodeEls = new Map();
    g.edges.forEach((e, i) => {
      const a = at.get(e.s), b = at.get(e.t), ra = rad(e.s), rb = rad(e.t), len = Math.hypot(b.x - a.x, b.y - a.y) || 1, [ux, uy] = unit(b.x - a.x, b.y - a.y);
      const bend = (e.s < e.t ? 1 : -1) * Math.min(40, len * 0.17), cx = (a.x + b.x) / 2 - uy * bend, cy = (a.y + b.y) / 2 + ux * bend;
      const [sx, sy] = unit(cx - a.x, cy - a.y), [tx, ty] = unit(b.x - cx, b.y - cy);
      const x0 = a.x + sx * (ra + 1.5), y0 = a.y + sy * (ra + 1.5), x1 = b.x - tx * (rb + 3.2), y1 = b.y - ty * (rb + 3.2), d = `M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
      const el = svg("path", { class: `pp-e v-${e.verdict}`, d, "marker-end": `url(#ppm-base-${e.effect})` }, gE);
      const hit = svg("path", { class: `pp-hit v-${e.verdict}`, d, tabindex: 0, role: "button", "aria-label": edgeText(e, p) }, gH);
      const mk = svg("text", { class: "pp-mk", x: ((x0 + 2 * cx + x1) / 4).toFixed(1), y: ((y0 + 2 * cy + y1) / 4).toFixed(1), fill: COLOR[e.verdict] || "#fff" }, gM);
      mk.textContent = MARK[e.verdict] || "";
      hit.addEventListener("mouseenter", () => showEdge(i, false)); hit.addEventListener("focus", () => showEdge(i, false));
      hit.addEventListener("mouseleave", () => { if (picked < 0) detailHint(); else showEdge(picked, true); });
      hit.addEventListener("click", () => { picked = picked === i ? -1 : i; picked < 0 ? detailHint() : showEdge(i, true); els.forEach((x, j) => x.classList.toggle("sel", j === picked)); });
      els.push(el); marks.push(mk);
    });
    nodes.forEach((n, i) => {
      const q = at.get(n.id), r = rad(n.id), deg = degree.get(n.id) || 0, outer = !n.model && g.nodes.length > 22 && deg < 3;
      const place = svg("g", { transform: `translate(${q.x.toFixed(1)},${q.y.toFixed(1)})` }, gN);  /* the animation moves the inner group, so the place is kept apart */
      const grp = svg("g", { class: `pp-n${n.model ? " model" : ""}${outer ? " quiet" : ""}`, "data-id": n.id, style: `--d:${animate ? (i * 0.014).toFixed(3) : 0}s` }, place);
      svg("circle", { r: r.toFixed(1) }, grp);
      const right = q.x < 130 ? true : q.x > W - 130 ? false : q.x > W / 2, t = svg("text", { x: ((right ? 1 : -1) * (r + 5)).toFixed(1), y: narrow ? 5 : 4, "font-size": narrow ? 15 : 11.5, "text-anchor": right ? "start" : "end" }, grp);
      t.textContent = label(n, p.mine);
      grp.addEventListener("mouseenter", () => near(n.id, g, els, nodeEls, true)); grp.addEventListener("mouseleave", () => near(n.id, g, els, nodeEls, false));
      nodeEls.set(n.id, grp);
    });
    const m = g.edges.length, counts = Object.fromEntries(VERDICTS.map((v) => [v, 0]));
    const finish = (i, instant) => {
      const e = g.edges[i], el = els[i];
      el.style.cssText = ""; el.classList.add("judged"); el.setAttribute("marker-end", `url(#ppm-${e.verdict}-${e.effect})`); marks[i].classList.toggle("on", !!MARK[e.verdict] && !instant);
      if (instant && MARK[e.verdict]) marks[i].style.opacity = 1;
      counts[e.verdict]++; renderLegend(counts);
    };
    if (!animate || reduced) { g.edges.forEach((_, i) => finish(i, true)); renderLegend(g.counts); reading(T("pp.summary", g.edges.length, g.counts), true); detailHint(); return; }
    const mine = token, dt = Math.min(150, 3000 / m), start = 900, span = 380, judge = start + m * dt + span + 250, dj = Math.min(85, 2400 / m);
    renderLegend(counts); reading(T("pp.n.dots"), true);  /* the reading is told in words as it happens: the dots, each claim as it is read, the check, the result */
    els.forEach((el) => { const len = el.getTotalLength(); el.style.strokeDasharray = len; el.style.strokeDashoffset = len; });
    g.edges.forEach((e, i) => {
      later(start + i * dt, () => { if (mine !== token) return; els[i].style.transition = `stroke-dashoffset ${span}ms ease`; els[i].style.strokeDashoffset = "0"; reading(readLine(e, p, i + 1, m), false); });
      later(judge + i * dj, () => { if (mine === token) finish(i, false); });
    });
    later(judge - 120, () => { if (mine === token) reading(T("pp.n.check", CP.facts.cases), true); });
    later(judge + m * dj + 350, () => { if (mine === token) reading(T("pp.summary", m, g.counts), true); });
    detailHint();
  }
  function relabel() {  /* the same graph, other words or real names: no new drawing, no new animation */
    if (!paper || !paper.nodes) return;
    $$(".pp-n", svgEl).forEach((grp) => { const n = paper.nodes[grp.getAttribute("data-id")]; if (n) $("text", grp).textContent = label(n, paper.mine); });
    $$(".pp-hit", svgEl).forEach((hit, i) => hit.setAttribute("aria-label", edgeText(paper.graph.edges[i], paper)));
  }
  function near(id, g, els, nodeEls, on) {
    svgEl.classList.toggle("dim", on);
    const ends = new Set([id]);
    g.edges.forEach((e, i) => { const hit = e.s === id || e.t === id; els[i].classList.toggle("near", on && hit); if (hit) { ends.add(e.s); ends.add(e.t); } });
    nodeEls.forEach((grp, k) => grp.classList.toggle("near", on && ends.has(k)));
  }
  const readLine = (e, p, i, m) => { const s = e.support[0], q = s && (NAMES || p.mine) ? ` · “${esc(s.quote)}”` : ""; return `<small>${esc(T("pp.n.line", i, m))}</small><b>${esc(edgeText(e, p))}</b>${q}`; };  /* the sentence itself, with its gene names, only when asked for */
  function reading(html, calm) { reader.classList.toggle("dim", !!calm); reader.innerHTML = calm ? esc(html) : html; }

  /* ---------------------------------------------------------------- the legend, the detail of a line, the head of the paper */
  function renderLegend(counts) {
    lastCounts = counts; const cases = CP.facts.cases;
    legend.replaceChildren(...VERDICTS.map((v) => {
      const b = h(`<button type="button" class="pp-chip${counts[v] ? "" : " zero"}" aria-pressed="${!hiddenV.has(v)}" style="--c:${COLOR[v]}" title="${esc(T("pp.t." + v, cases))}"><i></i><span>${esc(T("pp.v." + v))}</span><b>${counts[v]}</b></button>`);
      b.addEventListener("click", () => { hiddenV.has(v) ? hiddenV.delete(v) : hiddenV.add(v); svgEl.classList.toggle(`hide-${v}`, hiddenV.has(v)); b.setAttribute("aria-pressed", String(!hiddenV.has(v))); });
      return b;
    }));
  }
  function detailHint() { detail.innerHTML = `<p class="hint">${esc(T("pp.hint"))}</p>`; }
  function explain(e, p) {  /* what the verdict means for this claim, in a sentence */
    if (e.verdict === "rejected") { const m = /^breaks ((?:V\d+(?:, )?)+):/.exec(e.why || ""); return T("pp.x.rejected", m ? m[1] : ""); }
    if (e.verdict === "outside") {
      const missing = [e.s, e.t].filter((id) => !p.nodes[id].model).map((id) => label(p.nodes[id], p.mine));
      return missing.length ? T("pp.x.outside", missing.join(" + "), missing.length) : e.why || T("pp.t.outside");
    }
    return T("pp.x." + e.verdict, CP.facts.cases);
  }
  function showEdge(i, pinned) {
    const e = paper.graph.edges[i], c = COLOR[e.verdict], quotes = e.support.slice(0, 2);
    const found = e.verdict === "rejected" && e.why ? `<details class="pp-more"><summary>${esc(T("pp.found"))}</summary><p class="why">${esc(e.why)}</p></details>` : "";
    const sentence = quotes.length ? `<details class="pp-more"${NAMES || paper.mine ? " open" : ""}><summary>${esc(T("pp.sentence"))}</summary>${quotes.map((s) => `<q>${esc(s.quote)}</q><span class="src">${esc([s.location, s.context].filter(Boolean).join(" · "))}</span>`).join("")}</details>` : "";
    detail.innerHTML = `<div class="line" style="--c:${c}"><b>${esc(edgeText(e, paper))}</b><span class="tag">${esc(T("pp.v." + e.verdict))}</span></div>
      <p class="why">${esc(explain(e, paper))}${e.n > 1 ? ` ${esc(T("pp.more", e.n))}` : ""}</p>${found}${sentence}${pinned ? "" : `<p class="why dim">${esc(T("pp.hover"))}</p>`}`;
  }
  const GLYPHS = [
    '<svg viewBox="0 0 64 44" aria-hidden="true"><circle class="gl-a" cx="20" cy="22" r="8"/><circle class="gl-b" cx="46" cy="22" r="6"/></svg>',
    '<svg viewBox="0 0 64 44" aria-hidden="true"><path class="gl-line" d="M16 31 H43"/><path class="gl-head" d="M42 26.5 L51 31 L42 35.5 z"/><circle class="gl-a" cx="11" cy="31" r="5.5"/><circle class="gl-a" cx="56" cy="31" r="5.5"/><g class="gl-quote"><rect x="16" y="3" width="32" height="15" rx="4"/><path d="M21 8.5 H43 M21 13 H35"/></g></svg>',
    '<svg viewBox="0 0 64 44" aria-hidden="true"><path class="gl-c" style="--to:#58e6ac;--k:0" d="M6 7 H58"/><path class="gl-c" style="--to:#ff6874;--k:1" d="M6 17 H58"/><path class="gl-c" style="--to:#8fb0ff;--k:2" d="M6 27 H58"/><path class="gl-c" style="--to:rgba(255,255,255,.5);--k:3" stroke-dasharray="3 4" d="M6 37 H58"/></svg>',
  ];
  function renderGuide() {  /* how to read the map: three small animated pictures, one line each */
    $("#ppGuide").innerHTML = [1, 2, 3].map((k) => `<li>${GLYPHS[k - 1]}<b>${esc(T(`pp.g${k}.h`))}</b><span>${k === 3 ? T("pp.g3.p", CP.facts.cases) : esc(T(`pp.g${k}.p`))}</span></li>`).join("");
  }
  function head(p) {
    $("#ppTitle").textContent = p.title;
    const g = p.counts ? p.counts.grounded : 0, links = p.graph.edges.length;
    const bits = p.mine ? [p.filename, p.pages ? `${p.pages} p.` : "", p.doi || ""] : [[p.journal, p.year].filter(Boolean).join(" "), p.id];
    const link = p.mine ? "" : ` · <a href="https://europepmc.org/article/PMC/${esc(p.id)}" target="_blank" rel="noopener">${esc(T("pp.open"))}</a>`;
    $("#ppMeta").innerHTML = `${esc(bits.filter(Boolean).join(" · "))} · ${esc(T("pp.meta", g, links))}${link}`;
  }

  /* ---------------------------------------------------------------- the list of papers of the current part */
  function rows() {
    const items = part === "auto" ? AUTO : own;
    list.replaceChildren(...items.map((p) => {
      const c = (p.graph ? p.graph.counts : p.verdicts) || {};
      const bar = VERDICTS.map((v) => ((c[v] || 0) ? `<i style="flex:${c[v]};background:${v === "outside" ? "var(--line)" : COLOR[v]}"></i>` : "")).join("");
      const sub = part === "auto" ? `<span>${esc([p.journal, p.year].filter(Boolean).join(" ") || p.id)}</span><span>${p.graph.edges.length}</span>` : `<span>${esc(p.filename)}</span><span>${p.counts.links}</span>`;
      const li = h(`<li class="pp-li"><button type="button" class="pp-row" data-id="${esc(p.id)}" aria-current="${!!paper && paper.id === p.id}"><b>${esc(p.title)}</b><span class="pp-bar" aria-hidden="true">${bar}</span><small>${sub}</small></button></li>`);
      $("button", li).addEventListener("click", () => choose(p.id, true));
      if (part === "own") {
        const del = h(`<button type="button" class="pp-del">${esc(T("pp.remove"))}</button>`);
        del.addEventListener("click", async () => {
          if (!del.classList.contains("sure")) { del.classList.add("sure"); del.textContent = T("pp.sure"); setTimeout(() => { del.classList.remove("sure"); del.textContent = T("pp.remove"); }, 3500); return; }
          await api(`api/paper/${p.id}`, { method: "DELETE" }); await refreshOwn(); if (paper && paper.id === p.id) paper = null; show(true);
        });
        li.append(del);
      }
      return li;
    }));
  }
  async function choose(id, animate) {
    const p = (part === "auto" ? AUTO : own).find((x) => x.id === id);
    if (!p) return;
    if (!p.graph) { const r = await api(`api/paper/${id}`); if (!r.ok) return; Object.assign(p, await r.json()); }
    paper = p; show(animate);
  }
  function show(animate = false) {  /* the paper of the part, or, for your PDFs before you have dropped one, a paper the AI found: what a PDF of yours will look like */
    if (!paper) {
      const first = part === "own" && own.length ? own[0] : FIRST;
      if (!first.graph) { choose(first.id, animate); return; }
      paper = first;
    }
    $("#ppExample").hidden = !(part === "own" && !paper.mine); head(paper); rows(); draw(paper, animate);
  }

  /* ---------------------------------------------------------------- the two parts */
  function tabs() {
    $("#ppAutoN").textContent = T("pp.autoN", AUTO.length);
    $("#ppOwnN").textContent = served ? T("pp.ownN.on", own.length) : served === false ? T("pp.ownN.off") : "…";
    $$(".pp-tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.part === part)));
    $("#pp").dataset.part = part;
    $("#ppOwn").hidden = part !== "own"; $("#ppDrop").hidden = !served; $("#ppOffline").hidden = served !== false; $("#ppPrivacy").hidden = !served;
    const base = $("#ppBase"); base.hidden = !(served && own.length);
    if (!base.hidden) base.textContent = T("pp.base", own.length, own.reduce((a, p) => a + p.counts.grounded, 0), own.reduce((a, p) => a + p.counts.links, 0));
  }
  function setPart(next) {
    if (next === part) return;
    part = next; paper = null; tabs(); show(true);
  }
  $$(".pp-tab").forEach((b) => b.addEventListener("click", () => setPart(b.dataset.part)));

  /* ---------------------------------------------------------------- your PDFs: only when the local server is there */
  const api = (path, options = {}) => fetch(path, { ...options, headers: { "X-CellProof": "1", ...(options.headers || {}) }, cache: "no-store" });
  async function detect() {
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { served = false; tabs(); return; }  /* a file or a published page has no server to ask */
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 2500);
      const r = await fetch("api/status", { cache: "no-store", signal: ctl.signal }); clearTimeout(t);
      const s = r.ok ? await r.json() : null;
      served = !!(s && s.enabled); if (served) { $("#pp").dataset.key = String(s.key); await refreshOwn(); }
    } catch (e) { served = false; }
    tabs(); if (part === "own") rows();
  }
  async function refreshOwn() { try { const r = await api("api/papers"); own = r.ok ? (await r.json()).papers.map((p) => ({ ...p, mine: true })) : []; } catch (e) { own = []; } tabs(); }
  const drop = $("#ppDrop"), file = $("#ppFile");
  drop.addEventListener("click", () => file.click());
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.click(); } });
  file.addEventListener("change", () => { if (file.files[0]) taken(file.files[0]); file.value = ""; });
  for (const ev of ["dragenter", "dragover"]) $(".pp-side").addEventListener(ev, (e) => { if (!served || part !== "own") return; e.preventDefault(); drop.classList.add("over"); });
  for (const ev of ["dragleave", "drop"]) $(".pp-side").addEventListener(ev, (e) => { drop.classList.remove("over"); if (ev === "drop" && served && part === "own") { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) taken(f); } });
  $("#ppCopy").addEventListener("click", async () => {
    const text = $("#ppCmd").textContent, b = $("#ppCopy");
    try { await navigator.clipboard.writeText(text); b.textContent = T("pp.copied"); } catch (e) { const r = document.createRange(); r.selectNodeContents($("#ppCmd")); getSelection().removeAllRanges(); getSelection().addRange(r); }
    setTimeout(() => { b.textContent = T("pp.copy"); }, 1800);
  });

  const STEPS = ["read", "guard", "mechanism", "stimulus", "ground", "check"];
  function renderJob() {
    if (!jobState) { job.hidden = true; return; }
    job.hidden = false;
    const j = jobState, steps = STEPS.map((s) => {
      const st = (j.steps && j.steps[s]) || {}, state = st.state === "done" ? "done" : st.state === "error" ? "fail" : st.state === "start" ? "run" : "";
      const d = st.state !== "done" ? "" : s === "read" ? T("pp.d.read", st.pages, st.chars) : s === "mechanism" || s === "stimulus" ? T("pp.d.claims", st.counts.grounded, (st.usd || 0).toFixed(2)) : s === "ground" ? T("pp.d.ground", st.links) : s === "check" ? T("pp.d.check", st.in_model) : "";
      return `<li class="${state}"><i></i><span>${esc(T("pp.s." + s))}${d ? `<small>${esc(d)}</small>` : ""}</span></li>`;
    }).join("");
    let top = "", end = "";
    if (j.phase === "plan") {
      const p = j.plan, ok = p.guard.kind === "ok";
      top = `<h4>${esc(p.title)}</h4><p class="meta">${esc(T("pp.d.read", p.pages, p.chars))} · ${esc(p.doi || T("pp.plan.nodoi"))}${p.warnings.length ? `<br>${esc(p.warnings.join("; "))}` : ""}</p>`;
      end = ok ? `<p class="meta">${esc(T("pp.plan.cost", p.estimate_usd))} ${esc(T("pp.plan.sent"))}</p><div class="go"><button class="btn primary small" id="ppRead" type="button">${esc(T("pp.plan.read"))}</button><button class="btn small" id="ppCancel" type="button">${esc(T("pp.plan.cancel"))}</button></div>`
        : `<p class="msg bad">${esc(p.guard.reason)}</p><div class="go"><button class="btn small" id="ppCancel" type="button">${esc(T("pp.again"))}</button></div>`;
      job.innerHTML = top + end;
      const go = $("#ppRead"); if (go) go.addEventListener("click", () => ingest(j.file));
      $("#ppCancel").addEventListener("click", () => { jobState = null; renderJob(); });
      return;
    }
    if (j.state === "done" && j.record) end = `<p class="msg">${esc(T("pp.done", j.record.counts.grounded, j.record.counts.links))}</p>`;
    else if (j.state === "refused") end = `<p class="msg bad"><b>${esc(T("pp.refused"))}</b> ${esc(j.refused.reason)}</p>`;
    else if (j.state === "error") end = `<p class="msg bad"><b>${esc(T("pp.failed"))}</b> ${esc(j.error || "")}</p>`;
    job.innerHTML = `<h4>${esc(j.name)}</h4><ol class="pp-steps">${steps}</ol>${end}`;
  }
  async function taken(f) {
    if (!/pdf$/i.test(f.name) && f.type !== "application/pdf") { jobState = { phase: "plan", plan: { title: f.name, pages: 0, chars: 0, doi: null, warnings: [], guard: { kind: "bad", reason: T("pp.badfile") } }, file: f }; renderJob(); return; }
    jobState = { phase: "wait", name: f.name, steps: { read: { state: "start" } }, state: "running" }; renderJob();
    try {
      const r = await api(`api/plan?name=${encodeURIComponent(f.name)}`, { method: "POST", headers: { "Content-Type": "application/pdf" }, body: f });
      const body = await r.json();
      if (!r.ok) { jobState = { phase: "run", name: f.name, steps: { read: { state: "error" } }, state: "error", error: body.error }; renderJob(); return; }
      jobState = { phase: "plan", plan: body, file: f };
    } catch (e) { jobState = { phase: "run", name: f.name, steps: {}, state: "error", error: String(e.message || e) }; }
    renderJob();
  }
  async function ingest(f) {
    jobState = { phase: "run", name: f.name, steps: {}, state: "running" }; renderJob();
    try {
      const r = await api(`api/ingest?name=${encodeURIComponent(f.name)}`, { method: "POST", headers: { "Content-Type": "application/pdf" }, body: f });
      const body = await r.json();
      if (!r.ok) { jobState = { ...jobState, state: "error", error: body.error }; renderJob(); return; }
      for (;;) {
        await new Promise((ok) => setTimeout(ok, 700));
        const s = await (await api(`api/job/${body.job}`)).json();
        jobState = { phase: "run", name: f.name, steps: s.steps, state: s.state, refused: s.refused, error: s.error };
        if (s.state === "done") { await refreshOwn(); const rec = own.find((p) => p.id === s.paper); jobState.record = rec; renderJob(); if (rec) { part = "own"; paper = null; tabs(); await choose(rec.id, true); } return; }
        renderJob(); if (s.state !== "running") return;
      }
    } catch (e) { jobState = { ...jobState, state: "error", error: String(e.message || e) }; renderJob(); }
  }

  /* ---------------------------------------------------------------- start: the first paper is drawn at once, and drawn again, line by line, when it scrolls into view */
  CP.onLang(() => { tabs(); renderGuide(); if (paper) { head(paper); rows(); relabel(); renderLegend(lastCounts || paper.graph.counts); if (picked >= 0) showEdge(picked, true); else detailHint(); } renderJob(); $("#ppExample").textContent = T("pp.example"); svgEl.setAttribute("aria-label", T("pp.grapharia")); drop.setAttribute("aria-label", T("pp.droparia")); });
  $("#ppExample").textContent = T("pp.example"); renderGuide(); tabs(); show(false);
  let seen = false;
  new IntersectionObserver((es, io) => { if (!seen && es[0].isIntersecting) { seen = true; io.disconnect(); if (paper) draw(paper, true); } }, { threshold: 0.3 }).observe($("#ppStage"));
  detect();
})();
