/* CellProof report, part 7: the end of the front page and the door to the technical part. Three short cards say what this is and what it is not; below them
   everything technical (the interactive cell, the agent, every rule it judged, the evidence, the tissue, the limits) waits behind one button and opens in
   place. A link or a button that points into it opens it first. */
(() => {
  const tech = $("#tech");
  if (!tech) return;
  const btns = $$("[data-tech-toggle]"), behavior = reduced ? "auto" : "smooth";
  let open = false, settle = 0;
  const set = (on, instant) => {  /* a visitor who is sent deep into it does not need to watch it open: the door opens at once, so that the scroll finds the target where it will stay */
    open = on; clearTimeout(settle); tech.dataset.open = on ? "1" : "0"; tech.classList.remove("settled"); tech.classList.toggle("instant", !!instant);
    btns.forEach((b) => b.setAttribute("aria-expanded", String(on)));
    const go = $("#techGo"); if (go && window.CP) { go.dataset.i18n = on ? "tech.close" : "tech.go"; go.textContent = CP.T(go.dataset.i18n); }  /* the button under the cards says what a click does now */
    const done = () => { tech.classList.add("settled"); dispatchEvent(new Event("resize")); };  /* once open, nothing clips it: sticky parts stick again */
    if (on) { if (instant || reduced) done(); else settle = setTimeout(done, 900); }
  };
  const to = (el, delay) => setTimeout(() => el.scrollIntoView({ behavior, block: "start" }), delay);
  const openTech = (target) => { const was = open, el = (target && $(target)) || tech, deep = el !== tech; set(true, deep && !was); to(el, was || reduced || deep ? 0 : 350); };
  window.CPTech = { open: openTech, close: () => set(false) };
  btns.forEach((b) => b.addEventListener("click", () => { if (open) { set(false); $("#honest").scrollIntoView({ behavior, block: "center" }); } else openTech("#tech"); }));
  document.addEventListener("click", (e) => {  /* a link into the technical part opens it first */
    const a = e.target.closest('a[href^="#"]'), id = a && a.getAttribute("href");
    if (!id || id.length < 2) return;
    const el = document.getElementById(id.slice(1));
    if (el && (id === "#tech" || tech.contains(el))) { e.preventDefault(); openTech(id); }
  });
  if (location.hash && !/^#(video|intro|card)/.test(location.hash)) { const el = document.getElementById(location.hash.slice(1)); if (el && tech.contains(el)) { openTech(location.hash); if (document.readyState !== "complete") addEventListener("load", () => to(el, 0)); } }  /* the scripts after this one may still move what is above it */

  /* the three cards come in one after the other */
  const cards = $$(".hon-cards li"), io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.3 });
  cards.forEach((c, i) => { c.style.setProperty("--i", i); if (reduced) c.classList.add("in"); else io.observe(c); });
})();
