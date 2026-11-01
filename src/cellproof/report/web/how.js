/* CellProof report, part 6: how it works, in one picture. Six steps in a row, each with its number counting up as it lights, and a light that runs along
   the links between them: papers read, links proposed, known experiments that check every link, changes tried, virtual cells, candidates. Every number is
   read from the same data as the rest of the page (CP.facts). */
(() => {
  const flow = $("#howFlow");
  if (!flow || !window.CP) return;
  const F = CP.facts, steps = $$(".how-step", flow), vals = [F.papers, F.claims, F.cases, F.tried, F.cells, F.found];
  steps.forEach((li, i) => { if (!vals[i]) li.hidden = true; });
  const words = () => { const li = steps[2]; if (li && !li.hidden) $("small", li).textContent = CP.T("how.s3b", F.broken); };
  CP.onLang(words); words();
  const count = (el, to, ms) => {
    if (reduced) { el.textContent = CP.num(to); return; }
    const t0 = performance.now(), tick = (now) => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = CP.num(Math.round(to * e)); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const run = () => steps.forEach((li, i) => { if (li.hidden) return; setTimeout(() => { li.classList.add("on"); count($("b", li), vals[i], 1300); }, reduced ? 0 : i * 520); });
  if (reduced) run();
  else new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); flow.classList.add("go"); run(); } }, { threshold: 0.35 }).observe(flow);
})();
