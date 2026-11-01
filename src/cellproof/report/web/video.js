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
  const end = take[take.length - 1][0] + 5;  /* the last ten seconds of the video are the terminal, recorded apart */

  function stopTake(done) {
    ids.splice(0).forEach(clearTimeout); CPBench.stop(); CPHero.pin(false); say(""); count.textContent = ""; root.classList.remove("vid");
    bar.hidden = false; if (done) say("");
  }
  function start() {
    if (root.classList.contains("vid")) return;
    root.classList.add("vid"); bar.hidden = true;
    [3, 2, 1].forEach((n, i) => ids.push(setTimeout(() => { count.textContent = String(n); }, i * 1000)));
    ids.push(setTimeout(() => {
      count.textContent = "";
      take.forEach(([s, fn]) => ids.push(setTimeout(fn, s * 1000)));
      ids.push(setTimeout(() => { stopTake(true); scrollTo("#top"); }, end * 1000));
    }, 3000));
  }
  $("#vidGo").addEventListener("click", start);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("vid")) stopTake();
    else if (e.code === "Space" && location.hash === "#video" && !root.classList.contains("vid") &&!/^(BUTTON|INPUT|TEXTAREA|A)$/.test(document.activeElement.tagName)) { e.preventDefault(); start(); }
  });
  /* the buttons exist only in the recording mode: #video in the address */
  const sync = () => { card.hidden = location.hash !== "#card"; const on = location.hash === "#video"; bar.hidden = !on || root.classList.contains("vid"); if (!on && root.classList.contains("vid")) stopTake(); };
  addEventListener("hashchange", sync); sync();
})();
