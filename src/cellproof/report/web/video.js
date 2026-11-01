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

  const demoStart = 76, demoEnd = demoStart + CPBench.seconds / SPEED + 1.5, p53 = profile("p53"), wip = profile("Wip1");
  const beat = (n) => () => CPHero.show(n);
  /* seconds from the start of the take; the beats are the header's own, in the order of the script */
  const take = [
    [0, () => { scrollTo("#top"); CPHero.pin(true); CPHero.show(0); say(`Before this week: a published ${genes}-gene model of the DNA damage response, open papers, open-source solvers. Built this week: an agent where Muse Spark reads the papers and an exact solver decides.`); }],
    [13, () => say("")], [14, beat(1)], [20, beat(2)], [27, beat(3)], [36, beat(4)], [46, beat(5)], [56, beat(6)], [66, beat(7)],
    [demoStart, () => { CPHero.pin(false); CPBench.play(SPEED); }],
    ...(SB ? [
      [demoEnd, () => { say(`The solver's whole search on one board: ${offered(P[0])} sets of one or two changes, ${P[0].found.length} kept.`, true); scrollTo("#sx", 130); }],
      ...(p53 >= 0 ? [[demoEnd + 9, () => { click("#sxProfiles .sx-chip", p53); say(`p53 lost: ${offered(P[p53])} sets tried, ${P[p53].found.length ? P[p53].found.length + " kept" : "none leaves only death"}.`, true); }]] : []),
      ...(wip >= 0 ? [[demoEnd + 17, () => { click("#sxProfiles .sx-chip", wip); const other = P[wip].found.every((i) => !P[0].found.includes(i)); say(`WIP1 high: ${P[wip].found.length} kept${other ? ", a different one from the model cell's" : ""}.`, true); }]] : []),
      [demoEnd + 25, () => { say("Limits, plainly: a model of a cell, not of a person. Hypotheses for the lab.", true); scrollTo("#limits", 130); }],
    ] : []),
  ];

  /* ---- the opening: the page's own DNA, slowly closer, and a line of words at a time. #intro is about a minute (for a cut of its own),
     #intro-short about half of that (for the start of the three minutes). Nothing here states a result; it ends on the sentence that says what
     pre-existed and what was built this week. */
  const EN = {
    full: [[0, "Biology is drowning in <em>noise.</em>"], [3.5, "A flood of papers. Endless experiments. <em>Countless</em> combinations."], [8.5, "Trial and error is not enough."],
      [12.5, "There is a feeling you get when you believe in something <em>before anyone else does.</em>"], [18.5, "Before there is <em>proof.</em>"],
      [22, "We felt it at the start of this hackathon: a platform that looked <em>impossible</em> to build in one week."], [29.5, "And yet, here we are."],
      [33, "CellProof does not guess. It <em>checks.</em>"], [37, "An exact solver tries every combination in seconds, and rejects what is wrong."],
      [42.5, "What is left is tested on a virtual tumour."], [47, "We did not find a cure for cancer. We built a way to ask <em>how</em>, exactly."]],
    short: [[0, "There is a feeling you get when you believe in something <em>before anyone else does.</em>"], [6, "Before there is <em>proof.</em>"],
      [9.5, "We felt it at the start of this hackathon: a platform that looked <em>impossible</em> to build in one week."], [17.5, "And yet, here we are."]],
    tag: "From shared uncertainty to solitary conviction.",
    cap: `Before this week: a published ${genes}-gene model, open papers, open-source solvers. This week: an agent where Muse Spark reads the papers and an exact solver decides. Hypotheses for the lab, not treatments.`,
  };
  const EL = {
    full: [[0, "Η βιολογία πνίγεται στον <em>θόρυβο.</em>"], [3.5, "Χείμαρρος άρθρων. Ατελείωτα πειράματα. <em>Αμέτρητοι</em> συνδυασμοί."], [8.5, "Η δοκιμή και το λάθος δεν αρκούν."],
      [12.5, "Υπάρχει ένα συναίσθημα όταν πιστεύεις σε κάτι <em>πριν από κάθε άλλον.</em>"], [18.5, "Πριν υπάρξει <em>απόδειξη.</em>"],
      [22, "Το νιώσαμε στην αρχή αυτού του hackathon: μια πλατφόρμα που φάνταζε <em>αδύνατο</em> να χτιστεί σε μία εβδομάδα."], [29.5, "Κι όμως, είμαστε εδώ."],
      [33, "Το CellProof δεν μαντεύει. <em>Ελέγχει.</em>"], [37, "Ένας ακριβής solver δοκιμάζει κάθε συνδυασμό σε δευτερόλεπτα και απορρίπτει ό,τι είναι λάθος."],
      [42.5, "Ό,τι μένει δοκιμάζεται σε έναν εικονικό όγκο."], [47, "Δεν βρήκαμε τη θεραπεία του καρκίνου. Φτιάξαμε έναν τρόπο να ρωτάμε <em>πώς</em>, με ακρίβεια."]],
    short: [[0, "Υπάρχει ένα συναίσθημα όταν πιστεύεις σε κάτι <em>πριν από κάθε άλλον.</em>"], [6, "Πριν υπάρξει <em>απόδειξη.</em>"],
      [9.5, "Το νιώσαμε στην αρχή αυτού του hackathon: μια πλατφόρμα που φάνταζε <em>αδύνατο</em> να χτιστεί σε μία εβδομάδα."], [17.5, "Κι όμως, είμαστε εδώ."]],
    tag: "From shared uncertainty to solitary conviction.",
    cap: `Πριν από αυτή την εβδομάδα: ένα δημοσιευμένο μοντέλο ${genes} γονιδίων, ανοιχτά papers, solvers ανοιχτού κώδικα. Αυτή την εβδομάδα: ένας agent όπου το Muse Spark διαβάζει τα papers και ένας ακριβής solver αποφασίζει. Υποθέσεις για το εργαστήριο, όχι θεραπείες.`,
  };
  const lines = document.createElement("div"), fl = document.createElement("div");
  lines.className = "vid-lines"; fl.className = "vid-flash"; document.body.append(lines, fl);
  const showLine = (html, big) => { lines.innerHTML = html ? `<p class="${big ? "big" : ""}">${html}</p>` : ""; };
  const flash = () => { fl.classList.remove("go"); void fl.offsetWidth; fl.classList.add("go"); };
  const introPlan = (short) => {
    const set = CP.lang() === "el" ? EL : EN, src = short ? set.short : set.full, tail = src[src.length - 1][0] + 5;
    return [[0, () => { scrollTo("#top"); CPHero.pin(true); CPHero.show(0); root.classList.add("vid-intro", "vid-zoom"); }],
      ...src.map(([t, html]) => [t, () => showLine(html)]),
      [tail, () => { flash(); showLine(`CellProof<small>${set.tag}</small>`, true); say(set.cap); }]];
  };
  const end = take[take.length - 1][0] + 5;  /* the last ten seconds of the video are the terminal, recorded apart */

  function stopTake(done) {
    ids.splice(0).forEach(clearTimeout); CPBench.stop(); CPHero.pin(false); say(""); count.textContent = ""; root.classList.remove("vid", "vid-intro", "vid-zoom"); showLine(""); fl.classList.remove("go");
    bar.hidden = false; if (done) say("");
  }
  function start() {
    if (root.classList.contains("vid")) return;
    root.classList.add("vid"); bar.hidden = true;
    [3, 2, 1].forEach((n, i) => ids.push(setTimeout(() => { count.textContent = String(n); }, i * 1000)));
    ids.push(setTimeout(() => {
      count.textContent = "";
      const intro = location.hash.startsWith("#intro"), plan = intro ? introPlan(location.hash === "#intro-short") : take, stopAt = intro ? plan[plan.length - 1][0] + 7 : end;
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
