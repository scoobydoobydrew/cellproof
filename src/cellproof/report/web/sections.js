/* CellProof report, part 2: the headline numbers, the agent, the case files, the evidence, the limits. */
const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const fateChip = (f, absent) => `<span class="chip fate-${f}${absent ? " absent" : ""}"><i></i>${FATE_LABEL[f] || f}</span>`;
const S = D.summary || { runs: {}, new_nodes: [], claims_dropped: {}, edges: 0, why_selected: {} };
const run = (k) => (S.runs || {})[k] || null;
const EXT = D.extraction, quoted = EXT.mechanism.grounded + EXT.stimulus.grounded, proposed = EXT.mechanism.proposed + EXT.stimulus.proposed;
const HO = D.heldout;
const failCount = (arm) => Object.keys(D.verification.matrix[arm] || {}).length;
/* a block that reads on two levels: its heading and one plain sentence, and the details behind a click */
const fold = (card, plain) => {
  if (!card || card.hidden || card.querySelector(":scope > details.deep")) return;
  const head = card.querySelector("h3");
  if (!head) return;
  const rest = [...card.childNodes].filter((n) => n !== head), det = document.createElement("details"), sum = document.createElement("summary");
  det.className = "deep"; sum.append(head); sum.insertAdjacentHTML("beforeend", `<span class="deep-p">${esc(plain)}</span><span class="deep-go"></span>`);
  det.append(sum, ...rest); card.replaceChildren(det);
};
const foldBlock = (el, title, plain) => {  /* the same for a block that is not a card: a title and a plain sentence over it */
  if (!el || el.closest("details.deep")) return;
  const det = document.createElement("details"), sum = document.createElement("summary");
  det.className = "deep"; sum.innerHTML = `<h3>${esc(title)}</h3><span class="deep-p">${esc(plain)}</span><span class="deep-go"></span>`;
  el.replaceWith(det); det.append(sum, el);
};

/* ---------------------------------------------------------------- headline numbers */
(function headline() {
  const v1 = run("verified_min1"), n1 = run("naive_min1");
  const items = [
    [D.meta.corpus_papers, "open-access papers, each read twice by Muse Spark"],
    [fmt(quoted), "claims, each with a quote found word for word in its paper"],
    v1 ? [pct(v1.template_failed, v1.edits_proposed) + "%", `of the changes suggested by papers contradict a result we already know to be true`, true] : null,
    n1 ? [`${n1.verification_cases_failing.length} of 10`, "known results break when those changes are applied without the checker", true] : null,
    [S.new_nodes.length, `genes (kinases) added from the literature: ${S.new_nodes.map(fullName).join(", ")}`],
    HO ? [HO.claims.length, "results from papers the AI never read, kept back to audit the outcome"] : null,
  ].filter(Boolean);
  $("#stats").replaceChildren(...items.map(([b, t, warn]) => h(`<div class="stat${warn ? " warn" : ""}"><b>${esc(b)}</b><span>${esc(t)}</span></div>`)));
  $("#whyStates").innerHTML = `${D.networks.augmented.nodes.length} genes can each be on or off: ${fmt(2 ** D.networks.augmented.nodes.length)} combinations. The checker finds every stable one exactly, and tests all ten known results in about ${D.meta.check_seconds} seconds.<cite style="display:block;margin-top:8px;font-style:normal;font-family:var(--mono);font-size:11.5px;color:var(--fg-3)">2^${D.networks.augmented.nodes.length}; timing measured on the machine that built this page</cite>`;
})();

/* ---------------------------------------------------------------- the agent */
(function agent() {
  const v1 = run("verified_min1"), r1 = run("repaired_min1");
  const steps = [
    { n: "Read", big: fmt(quoted), d: `claims quoted from ${D.meta.corpus_papers} papers` },
    { n: "Name the genes", big: S.new_nodes.length, d: "genes added to the model" },
    { n: "Write rules", big: v1 ? v1.edits_proposed : "–", d: "changes to the model, from a fixed template" },
    { n: "Check", big: v1 ? pct(v1.template_failed, v1.edits_proposed) + "%" : "–", d: "of them contradict something already known" },
    { n: "Repair", big: r1 ? `${r1.repaired} of ${r1.template_failed}` : "–", d: "rejected changes fixed by Muse Spark" },
    { n: "Audit", big: HO ? HO.claims.length : "–", d: "results the system never saw" },
  ];
  const flow = $("#flow"); let cur = 0;
  steps.forEach((s, i) => { const b = h(`<button class="stepbtn" type="button" aria-pressed="${i === 0}"><span class="dot">${i + 1}</span><b>${s.n}</b><span class="big">${esc(s.big)}</span><span class="d">${esc(s.d)}</span></button>`); b.addEventListener("click", () => { cur = i; $$(".stepbtn", flow).forEach((x, j) => x.setAttribute("aria-pressed", String(j === i))); detail(i); }); flow.appendChild(b); });
  const claim = ((D.docket.repaired_min1 || []).find((r) => r.id === "CHK1|inhibits|Cdc25") || (D.docket.repaired_min1 || [])[0] || {}).support?.[0];
  const ex = D.grounding_examples || [];
  function detail(i) {
    const box = $("#stepDetail"); let html = "";
    if (i === 0) {
      const rows = [["molecule on molecule", EXT.mechanism], ["DNA damage on molecule", EXT.stimulus]].map(([l, e]) => `<tr><td>${l}</td><td class="num">${e.proposed}</td><td class="num">${e.grounded}</td><td class="num">${e.ungrounded}</td><td class="num">${fmt(e.input_tokens)} / ${fmt(e.output_tokens)}</td></tr>`).join("");
      html = `<h3>Muse Spark reads each paper, twice</h3><div class="cols">
        <div class="claimcard"><span class="pill accent">one real claim</span><div class="mono">CHK1 inhibits CDC25C</div><div class="q">“${esc(claim ? claim.quote : "")}”</div><div class="faint mono">${claim ? esc(claim.pmcid) + " · " + esc(claim.context) : ""}</div></div>
        <div class="scroll-x"><table class="tbl"><thead><tr><th>pass</th><th>claims</th><th>quote found</th><th>not found</th><th>tokens in / out</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        <p class="muted">The first pass asks for one molecule acting on another. The second asks what DNA damage does to a molecule, which is what connects new kinases to the model's input. A claim whose quote is not in the paper word for word is thrown away. Finding the quote shows that the model copied faithfully. Whether it read correctly is measured separately, by a person: ${D.labels.labelled} of ${D.labels.sampled} sampled claims are labelled, and ${D.labels.correct} of them were read correctly.</p>`;
    } else if (i === 1) {
      const why = S.why_selected || {};
      const sel = Object.entries(why).map(([g, w]) => `<tr><td><b>${esc(fullName(g))}</b></td><td>${w.in.slice(0, 3).map(([e, n]) => esc(e.split("|")[0] === "DNA_damage" ? "DNA damage" : fullName(e.split("|")[0])) + ` (${n})`).join(", ")}</td><td>${w.out.slice(0, 3).map(([e, n]) => esc(fullName(e.split("|")[2])) + ` (${n})`).join(", ")}</td></tr>`).join("");
      html = `<h3>Names become genes; only well-connected genes join the model</h3><div class="cols">
        <div class="scroll-x"><table class="tbl"><thead><tr><th>as written in a paper</th><th>becomes</th></tr></thead><tbody>${ex.map((e) => `<tr><td class="mono">${esc(e.name)}</td><td>${e.kind === "base" || e.kind === "new" ? `<span class="pill ${e.kind === "new" ? "accent" : ""}">${esc(e.kind === "new" ? "new gene" : "in the model")}</span> ${esc(fullName(e.node))}` : `<span class="pill">left out</span> <span class="faint">${esc(e.detail || e.kind)}</span>`}</td></tr>`).join("")}</tbody></table></div>
        <div class="scroll-x"><table class="tbl"><thead><tr><th>new gene</th><th>switched on by (papers)</th><th>acts on (papers)</th></tr></thead><tbody>${sel}</tbody></table></div></div>
        <p class="muted">Names are matched through HGNC, the official gene nomenclature. Where a name misleads (HGNC lists “ROS” as an alias of a gene, but papers mean reactive oxygen species) a listed exception keeps it out. A gene joins the model only if at least two papers connect it to the model in each direction.</p>`;
    } else if (i === 2) {
      const k = r1 ? r1.skipped : {};
      html = `<h3>A fixed template turns each claim into one change of one rule</h3><div class="cols">
        <div class="scroll-x"><table class="tbl"><thead><tr><th>claim</th><th>rule change</th></tr></thead><tbody>
          <tr><td>A activates B</td><td class="mono">B := (B) | A</td></tr><tr><td>A inhibits B</td><td class="mono">B := (B) &amp; !A</td></tr><tr><td>A needs B</td><td class="mono">A := (A) &amp; B</td></tr></tbody></table></div>
        <div class="callout"><b>Not every claim becomes a change.</b><span class="muted">${k.present || 0} were already in the model, ${k.implied || 0} follow from a longer route that is already there, and ${k.conflict || 0} say the opposite of what the published model justifies. Those are reported, not changed.</span></div></div>
        <p class="muted">The template is deliberately naive. It is the “AI only” arm of the experiment: its changes are the ones the checker then judges. In a rule, <code>|</code> means “or”, <code>&amp;</code> means “and” and <code>!</code> means “not”.</p>`;
    } else if (i === 3) {
      const cases = D.verification.cases.map((c) => `<tr><td class="mono">${c.id}</td><td>${esc(c.origin)}</td><td class="mono">${Object.entries(c.setting).map(([n, v]) => esc(fullName(n)) + "=" + v).join(" ")}</td><td>${c.expected.map((f) => fateChip(f)).join(" ")}${c.match === "covers" ? " <span class='faint'>at least</span>" : ""}</td></tr>`).join("");
      html = `<h3>An exact checker tests ten known results the model must keep</h3><div class="scroll-x"><table class="tbl"><thead><tr><th>test</th><th>where it comes from</th><th>setting</th><th>outcomes expected</th></tr></thead><tbody>${cases}</tbody></table></div>
        <p class="muted">For each test the checker works out every end state of the changed model and names it. A mismatch comes back as a counterexample: the test, what was expected, what was found, and one end state that shows it. Checking all ten takes about ${D.meta.check_seconds} seconds. The tests come from the same paper as the base model, so they check that a change does not break what that paper reports.</p>`;
    } else if (i === 4) {
      html = `<h3>Muse Spark gets the counterexample and tries again</h3><div class="cols">
        <div class="callout"><b>What the AI sees</b><span class="muted">The claim and its quotes, the gene's current rule, the template that failed, and the checker's counterexamples. Never the audit results.</span></div>
        <div class="callout"><b>What the checker then requires</b><span class="muted">The rule must act on the target in the direction the claim says, keep every influence the old rule had, pass all ten tests, and change at least one prediction. A rule that passes only because its new condition is never true is refused as <i>vacuous</i> (empty).</span></div></div>
        ${r1 ? `<p class="muted">${r1.llm_calls} AI answers in the main run. ${r1.vacuous_attempts} were refused as vacuous. Up to three attempts per change.</p>` : ""}`;
    } else {
      const c = HO ? HO.categories : {};
      html = `<h3>A final exam on results the AI never read</h3><p class="muted">Each result comes from a paper kept out of the corpus. The set was fixed and tagged in git before any model was scored. ${HO ? `Of ${HO.all_claims} claims, ${HO.claims.length} can be scored by a model that predicts cell fates but not survival.` : ""}</p><p><a class="btn small" href="#evidence">See the audit</a></p>`;
      void c;
    }
    box.innerHTML = html;
  }
  detail(0);
  /* where the claims go */
  const dropped = Object.values(S.claims_dropped || {}).reduce((a, b) => a + b, 0);
  const inModel = r1 ? r1.edits_proposed + Object.values(r1.skipped).reduce((a, b) => a + b, 0) : 0;
  const rows = [
    ["Claims with a quote from the paper", [[quoted, ""]], quoted],
    ["Both genes recognised", [[quoted - dropped, ""]], quoted - dropped],
    ["Different gene-to-gene links", [[S.edges, ""]], S.edges],
  ];
  if (r1) {
    const k = r1.skipped;
    rows.push(["Links between genes our model has", [[inModel, ""]], inModel]);
    rows.push(["What each of those links needs", [[k.present || 0, "g"], [k.implied || 0, "g"], [k.conflict || 0, "b"], [r1.edits_proposed, "a"]], inModel]);
    rows.push(["How the proposed changes ended", [[r1.accepted - r1.repaired, ""], [r1.repaired, "a"], [r1.rejected, "b"]], r1.edits_proposed]);
  }
  const top = quoted || 1;
  $("#funnel").replaceChildren(...rows.map(([label, segs, total]) => {
    const wd = Math.max(5, (100 * total) / top);
    return h(`<div class="frow"><div class="lab-t">${esc(label)}</div><div class="fbar" style="width:${wd}%" title="${esc(label)}: ${total}">${segs.filter((s) => s[0] > 0).map(([n, c]) => `<span class="${c}" style="flex:${n}" title="${n}"></span>`).join("")}<em>${fmt(total)}</em></div></div>`);
  }));
  $("#funnelLegend").innerHTML = r1 ? `<span><i style="background:var(--fg-3);opacity:.5"></i>already there, or implied</span><span><i style="background:var(--bad)"></i>contradicts the published model, or rejected</span><span><i style="background:var(--accent)"></i>proposed as a change, or repaired by Muse Spark</span><span><i style="background:var(--fg);opacity:.85"></i>accepted as written</span>` : "";
})();

/* ---------------------------------------------------------------- case files */
(function cases() {
  const arms = Object.keys(D.docket); if (!arms.length) { $("#casefile").innerHTML = "<p class='muted'>No decision logs yet. Run <code>cellproof augment</code>.</p>"; return; }
  const st = { arm: arms.includes("repaired_min2") ? "repaired_min2" : arms[0], filter: "no", sel: null, animate: false };
  const armLabel = { repaired_min2: "backed by 2+ papers", repaired_min1: "backed by any paper" };
  const kindOf = (r) => r.status === "accepted" ? (r.repaired ? "repaired" : r.effect === "introduces" ? "gene" : "ok") : r.status === "rejected" ? "no" : "skip";
  const pillOf = (r) => ({ repaired: ["Repaired", "accent"], gene: ["New gene", "good"], ok: ["Accepted", "good"], no: ["Rejected", "bad"] }[kindOf(r)] || ({ skipped_present: ["Already in the model", ""], skipped_implied: ["Implied by a longer route", ""], skipped_conflict: ["Contradicts the published model", "bad"], skipped_not_available: ["Waiting for a gene", ""], skipped_input: ["Input is not regulated", ""] }[r.status] || [r.status, ""]));
  const judged = (r) => r.status === "accepted" || r.status === "rejected";
  const failedFirst = (r) => judged(r) && r.attempts && r.attempts[0] && r.attempts[0].source === "template" && !r.attempts[0].accepted;
  const label = (id) => { const [s, e, t] = id.split("|"); return e === "requires" ? `${fullName(s)} needs ${fullName(t)}` : `${fullName(s)} ${edgeSign[e]} ${fullName(t)}`; };
  const recs = () => D.docket[st.arm];
  const visible = () => recs().filter((r) => st.filter === "all" || (st.filter === "no" && failedFirst(r)) || (st.filter === "ok" && judged(r) && !failedFirst(r)) || (st.filter === "skip" && !judged(r)));
  function tabs() {
    $("#armTabs").replaceChildren(...arms.map((a) => { const b = h(`<button class="tab" type="button" aria-pressed="${a === st.arm}">${esc(armLabel[a] || a)}</button>`); b.addEventListener("click", () => { st.arm = a; st.sel = null; draw(); }); return b; }));
    const f = [["no", "Checker said no"], ["ok", "Accepted as written"], ["skip", "Not changed"], ["all", "All"]];
    $("#statusTabs").replaceChildren(...f.map(([k, l]) => { const n = recs().filter((r) => k === "all" || (k === "no" && failedFirst(r)) || (k === "ok" && judged(r) && !failedFirst(r)) || (k === "skip" && !judged(r))).length; const b = h(`<button class="tab" type="button" aria-pressed="${k === st.filter}">${l} · ${n}</button>`); b.addEventListener("click", () => { st.filter = k; draw(); }); return b; }));
  }
  function draw() {
    tabs();
    const list = visible();
    if (!list.find((r) => r.id === st.sel)) st.sel = (list.find((r) => r.id === "CHK1|inhibits|Cdc25") || list.find((r) => r.repaired) || list[0] || {}).id || null;
    $("#rows").replaceChildren(...list.map((r) => { const [pl, cls] = pillOf(r); const b = h(`<button class="row" type="button" aria-current="${r.id === st.sel}"><div class="t"><span>${esc(label(r.id))}</span><span class="dots" title="${r.papers} papers">${"●".repeat(Math.min(8, r.papers))}</span></div><div><span class="pill ${cls}">${esc(pl)}</span></div></button>`); b.addEventListener("click", () => { st.sel = r.id; st.animate = true; draw(); $("#casefile").scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }); return b; }));
    file();
  }
  const plain = (r) => esc(r || "");
  const problemText = { unexpected: "an extra fate appears", missing: "an expected fate disappears", unclassified: "an end state matches no fate", oscillation: "the model never settles", g2_arrest: "G2 arrest changes" };
  function failureHTML(f, tmplRule) {
    if (!f.case) return `<div class="muted" style="font-size:14px">${esc(f.text)}</div>`;
    const involved = new Set(toks(tmplRule));
    const lamps = f.witness ? Object.entries(f.witness).map(([n, v]) => `<span class="lamp${v ? " on" : ""}${involved.has(n) ? " key" : ""}">${esc(fullName(n))}</span>`).join("") : "";
    return `<div class="verdict bad"><div><span class="pill bad">${esc(f.case)}</span> <b>${esc(f.origin)}</b> <span class="faint">· ${Object.entries(f.setting).map(([n, v]) => esc(fullName(n)) + "=" + v).join(", ")}</span></div>
      <div class="fatepair"><span class="faint">expected${f.match === "covers" ? " at least" : ""}</span> ${f.expected.map((x) => fateChip(x)).join("")} <span class="faint">found</span> ${f.found.length ? f.found.map((x) => fateChip(x)).join("") : "<span class='chip absent'>no fate</span>"} <span class="pill bad">${esc(problemText[f.problem] || f.problem)}</span></div>
      ${lamps ? `<div><div class="faint" style="font-size:12px;margin-bottom:4px">an end state that shows it (lit genes are on; outlined genes are in the rule being changed)</div><div class="lamps">${lamps}</div></div>` : ""}</div>`;
  }
  function file() {
    const r = recs().find((x) => x.id === st.sel), box = $("#casefile");
    if (!r) { box.innerHTML = "<p class='muted'>Nothing matches this filter.</p>"; return; }
    const [pl, cls] = pillOf(r);
    let html = `<div><div class="stepno">${esc(armLabel[st.arm] || st.arm)}</div><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><h3>${esc(label(r.id))}</h3><button class="btn small" id="replay" type="button">Replay</button></div><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="pill ${cls}">${esc(pl)}</span><span class="faint">${r.papers} paper${r.papers === 1 ? "" : "s"}${r.effect ? " · effect: " + (r.effect === "active" ? "changes at least one prediction" : r.effect === "neutral" ? "consistent, changes none" : "new gene") : ""}</span></div></div>`;
    const blocks = [];
    blocks.push(`<div><div class="stepno">1 · the papers</div><div class="evid">${r.support.map((s) => `<div class="claimcard"><div class="q">“${esc(s.quote)}”</div><div class="faint mono"><a href="https://europepmc.org/article/PMC/${esc(s.pmcid)}" target="_blank" rel="noopener">${esc(s.pmcid)}</a> · ${esc(s.context)}</div></div>`).join("")}${r.detail ? `<div class="muted">${esc(r.detail)}</div>` : ""}</div></div>`);
    if (r.template) {
      blocks.push(`<div><div class="stepno">2 · the rule change</div><div class="faint" style="font-size:13px;margin-bottom:6px">${esc(fullName(r.node))} now: </div><div class="rule">${plain(r.old)}</div><div class="faint" style="font-size:13px;margin:8px 0 6px">becomes</div><div class="rule">${r.old ? ruleHTML(r.old, r.template) : plain(r.template)}</div></div>`);
      const att = r.attempts, t = att[0];
      if (t && t.accepted) blocks.push(`<div><div class="stepno">3 · the checker</div><div class="final">The checker accepted it as written. All ten known results still hold${t.effect ? ` and the change ${t.effect === "active" ? "changes at least one prediction" : t.effect === "neutral" ? "changes none of the tested scenarios" : "adds a gene"}` : ""}.</div></div>`);
      else if (t) blocks.push(`<div><div class="stepno">3 · the checker says no</div><div class="evid">${t.failures.slice(0, 2).map((f) => failureHTML(f, r.template)).join("")}</div></div>`);
      if (att.length > 1) {
        let n = 0; const parts = [];
        for (const a of att.slice(1)) {
          if (a.source === "explanation") { parts.push(`<div class="attempt"><div class="stepno" style="margin:0">Muse Spark</div><div class="say">${esc(a.text)}</div></div>`); continue; }
          n++;
          const verdict = a.accepted ? `<span class="pill good">accepted by the checker</span>` : `<span class="pill bad">${a.reasons.includes("vacuous") ? "refused: vacuous" : a.reasons.includes("gave_up") ? "the model gave up" : "rejected: " + esc(a.reasons.join(", "))}</span>`;
          parts.push(`<div class="attempt${a.accepted ? " ok" : ""}"><div>${verdict}${a.effect ? ` <span class="faint">${a.effect === "active" ? "changes at least one prediction" : a.effect === "neutral" ? "changes no tested prediction" : ""}</span>` : ""}</div>${a.rule ? `<div class="rule">${r.old ? ruleHTML(r.old, a.rule) : plain(a.rule)}</div>` : ""}${a.accepted || a.reasons.includes("vacuous") || a.reasons.includes("gave_up") ? "" : a.failures.slice(0, 1).map((f) => failureHTML(f, a.rule)).join("")}</div>`);
        }
        blocks.push(`<div><div class="stepno">4 · the repair, attempt by attempt</div><div class="evid">${parts.join("")}</div></div>`);
      }
      if (r.status === "accepted") blocks.push(`<div><div class="final"><b>${r.repaired ? "Repaired and accepted" : "Accepted"}</b><span>Final rule of ${esc(fullName(r.node))}</span><div class="rule" style="background:transparent">${r.old ? ruleHTML(r.old, r.final) : plain(r.final)}</div><span class="faint" style="font-size:13px">Accepted means: it agrees with all ten tests and, here, ${r.effect === "active" ? "changes at least one tested outcome" : "changes none of the outcomes tested"}. It does not mean true.</span></div></div>`);
      else blocks.push(`<div><div class="final bad"><b>Rejected</b><span>${r.attempts.some((a) => a.reasons && a.reasons.includes("gave_up")) ? "Muse Spark could not find a rule that expresses the claim and passes the tests." : "No attempt passed the checker within three tries."} The published rule stays as it is.</span></div></div>`);
    } else {
      blocks.push(`<div><div class="stepno">2 · why nothing was edited</div><div class="final" style="background:var(--raised)">${esc(pl)}${r.detail ? ". " + esc(r.detail) : ""}</div></div>`);
    }
    box.innerHTML = html + `<div class="${st.animate ? "reveal" : ""}" id="blocks">${blocks.join("")}</div>`;  /* the first view is complete at rest; only a click on a row plays the reveal */
    st.animate = false;
    $("#replay").addEventListener("click", () => { const b = $("#blocks"); b.classList.remove("reveal"); void b.offsetWidth; b.classList.add("reveal"); });
  }
  draw();
})();

/* ---------------------------------------------------------------- evidence */
(function evidence() {
  /* three things to remember, each computed from the same files as the detail below */
  (function takeaways() {
    const v = run("verified_min1"), r = run("repaired_min1"), items = [];
    if (v) items.push([pct(v.template_failed, v.edits_proposed) + "%", `of the changes suggested by papers contradict something we already know. Applied without the checker, ${run("naive_min1") ? run("naive_min1").verification_cases_failing.length : "several"} of the ten known results break.`, true]);
    if (r) items.push([`${r.repaired} of ${r.template_failed}`, `rejected changes were repaired by Muse Spark and accepted by the checker. ${r.vacuous_attempts} “fixes” that only passed by making the change do nothing were refused.`]);
    if (HO) { const can = HO.claims.filter((c) => c.verdicts.base !== "not_expressible"), hollow = can.filter((c) => c.no_stable_state.base).length, real = can.filter((c) => !c.no_stable_state.base), ok = real.filter((c) => c.verdicts.base === "correct").length;
      items.push([`${hollow} of ${can.length}`, `audit results the published model can address fall where it gives no answer at all: it never settles when p53 is removed. On the other ${real.length} it gets ${ok} right, no better than ignoring the change. The added kinases changed none of it.`]); }
    $("#take").replaceChildren(...items.map(([b, t, warn]) => h(`<div class="stat${warn ? " warn" : ""}"><b>${esc(b)}</b><span>${esc(t)}</span></div>`)));
  })();
  /* A. verification heat map */
  const V = D.verification, ids = V.cases.map((c) => c.id);
  const ARM = { published: "Published model", naive_min1: "Not checked, any paper", naive_min2: "Not checked, 2+ papers", verified_min1: "Checked, any paper", verified_min2: "Checked, 2+ papers", repaired_min1: "Checked and repaired, any paper", repaired_min2: "Checked and repaired, 2+ papers" };
  const unchecked = V.arms.filter((a) => a.key.startsWith("naive")).map((a) => failCount(a.key));
  const checked = V.arms.filter((a) => a.key.startsWith("verified") || a.key.startsWith("repaired")).map((a) => failCount(a.key));
  $("#heatTitle").textContent = unchecked.length ? `Without the checker, ${Math.min(...unchecked)} to ${Math.max(...unchecked)} of the ten known results break.` : "Verification cases";
  $("#heatNote").textContent = `Each row is a version of the model built from the same changes taken from papers. ${checked.length && Math.max(...checked) === 0 ? "With the checker in the loop, every version passes all ten tests." : ""} Hover a red cell for what went wrong.`;
  const head = h(`<div class="hrow"><div></div>${ids.map((i) => `<div class="hhead">${i}</div>`).join("")}<div></div></div>`);
  const rows = V.arms.map((a) => { const f = V.matrix[a.key] || {}; const n = Object.keys(f).length; return h(`<div class="hrow"><div class="hl">${esc(ARM[a.key] || a.label)}</div>${ids.map((i) => f[i] ? `<div class="hcell fail" title="${i}: ${esc(f[i].join(", "))}">✕</div>` : `<div class="hcell" title="${i}: passes">✓</div>`).join("")}<div class="hcount${n ? " bad" : ""}">${n ? n + " fail" : "all pass"}</div></div>`); });
  $("#heat").replaceChildren(head, ...rows);

  /* B. how often a paper's rule contradicts the model */
  const v1 = run("verified_min1"), v2 = run("verified_min2");
  const bar = (label, a, b, cls) => `<div class="frow" style="grid-template-columns:150px 1fr"><div class="lab-t">${esc(label)}</div><div class="fbar"><span class="${cls}" style="flex:${a}"></span><span style="flex:${Math.max(0, b)};opacity:.35"></span><em>${a} of ${a + b}</em></div></div>`;
  $("#ruleStats").innerHTML = v1 ? `<h3>How often a change from a paper breaks something known</h3><div class="bigline"><b>${pct(v1.template_failed, v1.edits_proposed)}%</b><span class="muted">of ${v1.edits_proposed} changes (links backed by at least one paper) break at least one of the ten known results.</span></div>${bar("any paper", v1.template_failed, v1.edits_proposed - v1.template_failed, "b")}${v2 ? bar("2+ papers", v2.template_failed, v2.edits_proposed - v2.template_failed, "b") : ""}<p class="muted">Breaking means: applied by itself to the published model, the change alters what a known experiment shows. The best-supported claim in the corpus, CHK1 inhibits CDC25C (6 papers), is one of them.</p>` : "<h3>Rule edits</h3><p class='muted'>Not run yet.</p>";

  /* C. what the model did with the rejected ones */
  const r1 = run("repaired_min1"), r2 = run("repaired_min2"), W = D.wonder;
  const one = (r) => r ? `<tr><td>${esc(r.__l)}</td><td class="num">${r.template_failed}</td><td class="num">${r.repaired}</td><td class="num">${r.vacuous_attempts}</td><td class="num">${r.template_failed - r.repaired}</td></tr>` : "";
  const spark = [r1 && { ...r1, __l: "Muse Spark · any paper" }, r2 && { ...r2, __l: "Muse Spark · 2+ papers" }].filter(Boolean);
  const wonder = W ? [["repaired_wonder_min1", "Muse Wonder · any paper"], ["repaired_wonder_min2", "Muse Wonder · 2+ papers"]].map(([k, l]) => W.runs[k] && { ...W.runs[k], __l: l }).filter(Boolean) : [];
  $("#repairStats").innerHTML = spark.length ? `<h3>What the AI did with the rejected changes</h3><div class="bigline"><b>${r1 ? r1.repaired : 0}<span style="font-size:.45em"> of ${r1 ? r1.template_failed : 0}</span></b><span class="muted">rejected changes repaired and accepted, using every link.</span></div><div class="scroll-x"><table class="tbl"><thead><tr><th>AI model</th><th>rejected</th><th>repaired</th><th>refused (vacuous)</th><th>still rejected</th></tr></thead><tbody>${[...spark, ...wonder].map(one).join("")}</tbody></table></div><p class="muted">A repair counts only if the checker accepts it and it changes at least one prediction. “Refused (vacuous)” counts attempts where the rule passed the tests only because its new condition never applies where it matters. The first version of this loop accepted those.</p>` : "<h3>Repair</h3><p class='muted'>Not run yet.</p>";

  /* D. held-out audit */
  const box = $("#audit");
  if (!HO) { box.innerHTML = "<p class='muted'>The held-out set has not been scored.</p>"; }
  else {
    const cols = ["base", "naive_min2", "verified_min2", "repaired_min2"].filter((c) => HO.networks.includes(c));
    const names = { base: "Published", naive_min2: "Not checked", verified_min2: "Checked", repaired_min2: "Checked + repaired" };
    const vl = { correct: "correct", wrong: "wrong", not_expressible: "no gene" };
    const N = HO.claims.length, can = HO.claims.filter((c) => c.verdicts.base !== "not_expressible"), changed = can.filter((c) => c.verdicts.repaired_min2 !== c.verdicts.base).length;
    const added = HO.claims.filter((c) => c.verdicts.base === "not_expressible" && c.verdicts.repaired_min2 !== "not_expressible"), addedOk = added.filter((c) => c.verdicts.repaired_min2 === "correct").length;
    const baseOk = can.filter((c) => c.verdicts.base === "correct").length, base = HO.baseline.correct;
    const cat = HO.categories, tot = HO.all_claims, sc = (cat.scoreable || 0) + (cat.scoreable_with_new_nodes || 0), part = cat.direction_only || 0, surv = cat.survival_level || 0;
    const hollow = can.filter((c) => c.no_stable_state.base), real = can.filter((c) => !c.no_stable_state.base);
    const realOk = real.filter((c) => c.verdicts.base === "correct").length, realBase = real.filter((c) => c.baseline === "correct").length;
    const holeGenes = [...new Set(hollow.flatMap((c) => Object.keys(c.perturbation).map(fullName)))];
    const reading = [`On ${hollow.length} of the ${can.length} claims it can address, the published model gives no answer at all.`,
      `The model never settles in those settings (${holeGenes.join(", ")} changed, with damage). By the scoring rule fixed before the audit, nothing then counts as present, so those verdicts, marked *, are artifacts and not predictions. On the other ${real.length} claims it gets ${realOk} right; a rule that ignores the change gets ${realBase} of the same ${real.length}.`,
      `Adding the changes from papers alters ${changed} of the ${can.length} verdicts and makes ${added.length} more claims answerable, ${addedOk} of them correctly. Across all ${N} scoreable claims, ignoring the change gets ${base} right.`];
    const star = (c, k) => (c.no_stable_state[k] ? " *" : "");
    void baseOk;
    box.innerHTML = `<div class="catbar" role="img" aria-label="What the ${tot} held-out claims measure"><span style="flex:${sc};background:var(--fg)">${sc} can be scored</span><span style="flex:${part};background:var(--fg-3)">${part} partial</span><span style="flex:${surv};background:repeating-linear-gradient(135deg,var(--fg-3) 0 5px,var(--fg-2) 5px 9px)">${surv} are about survival</span></div>
      <p class="muted" style="margin-bottom:16px">${tot} claims from ${HO.papers} papers. A model of fates cannot say whether cells survive a dose, so most radiosensitisation results cannot be scored. ${part} more are partial changes (“reduced by 24%”) and are not scored either.</p>
      <div class="scroll-x"><table class="tbl" id="auditTbl"><thead><tr><th>claim</th><th>asks</th>${cols.map((c) => `<th>${names[c]}</th>`).join("")}<th>Ignore the change</th></tr></thead><tbody>${HO.claims.map((c, i) => `<tr class="claimrow" data-i="${i}"><td class="mono">${c.id}</td><td>${esc(Object.entries(c.perturbation).map(([n, v]) => fullName(n) + (v ? " on" : " out")).join(" + "))} → ${esc(FATE_LABEL[c.readout] || (c.readout === "g2_arrest" ? "G2 arrest" : c.readout))} ${esc(c.polarity)}</td>${cols.map((k) => `<td><span class="verd ${c.verdicts[k]}"${c.no_stable_state[k] ? ' title="the model gives no answer in this setting"' : ""}>${vl[c.verdicts[k]]}${star(c, k)}</span></td>`).join("")}<td><span class="verd ${c.baseline}">${vl[c.baseline]}</span></td></tr>`).join("")}
      <tr><td colspan="2"><b>Correct</b></td>${cols.map((k) => `<td class="num"><b>${HO.totals[k].correct}</b> of ${N}</td>`).join("")}<td class="num"><b>${base}</b> of ${N}</td></tr></tbody></table></div>
      <div class="callout" style="margin-top:16px"><b>${reading[0]}</b><span>${reading[1]} ${reading[2]}</span><span class="muted">* means the model never settles in that setting, so it gives no answer. The audit shows where a published model gives no answer, or a different one from the papers. It does not show that the added changes predict better, and ${N} claims could not show that in any case.</span><span class="faint" style="font-size:13px">Set frozen before scoring (sha256 ${esc((D.meta.heldout_sha256 || "").slice(0, 12))}…). A person has not yet checked that each quote supports its claim, so these verdicts are provisional.</span></div>`;
    $$("#auditTbl .claimrow").forEach((tr) => tr.addEventListener("click", () => {
      const nxt = tr.nextElementSibling; if (nxt && nxt.classList.contains("claimdetail")) { nxt.remove(); return; }
      const c = HO.claims[+tr.dataset.i]; const d = document.createElement("tr"); d.className = "claimdetail";
      d.innerHTML = `<td colspan="${cols.length + 3}"><div style="display:grid;gap:6px"><div>${esc(c.statement)}</div><div class="claimcard"><div class="q">“${esc(c.quote)}”</div><div class="faint mono">${esc(c.cite)} · <a href="https://europepmc.org/article/PMC/${esc(c.pmcid)}" target="_blank" rel="noopener">${esc(c.pmcid)}</a> · scored by ${c.mode === "contrast" ? "comparing with the same cells without the perturbation" : "asking whether the fate is present"}</div></div></div></td>`;
      tr.after(d);
    }));
  }

  if (HO) fold($("#auditCard"), `${HO.claims.length} results from papers the AI never read, used as a final exam. The published model gets ${HO.totals.base?.correct ?? "–"} of ${HO.claims.length} right, the versions changed from papers get ${HO.totals.repaired_min2?.correct ?? "–"}, and a rule that ignores the change entirely gets ${HO.baseline.correct}. The exam does not show that the changes improve predictions, and ${HO.claims.length} results could not show that anyway.`);

  /* E. interventions */
  const I = D.interventions, setName = (s) => s.map(([n, v]) => `${fullName(n)} ${v ? "on" : "out"}`).join(" + ");
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pub = I.published || [], aug = I.augmented || [];
  const paperSets = [[["TUG1", 0]], [["miR221", 1]]].filter((s) => pub.some((p) => same(p, s)));
  $("#intervCard").innerHTML = `<h3>Which changes leave only cell death (apoptosis)?</h3><p class="muted">The checker tried every set of up to two genes switched off or on (genes that only report the outcome are left out) and kept the smallest sets that leave a damaged cell with one fate: programmed death. ${paperSets.length === 2 ? "Both searches rediscover the two single changes the base paper itself reports: TUG1 knocked out and miR-221 forced on. " : ""}These are hypotheses about the model, for lab testing, not treatments.</p>
    <div><div class="faint" style="font-size:12.5px;margin-bottom:6px">Published model: ${pub.length} sets · Checked and repaired: ${aug.length} sets</div><div class="presets" id="sets"></div></div>`;
  $("#sets").replaceChildren(...aug.slice(0, 14).map((s) => { const isOld = pub.some((p) => same(p, s)); const b = h(`<button class="tab" type="button" title="Try it in the cell">${esc(setName(s))}${isOld ? "" : " · new"}</button>`); b.addEventListener("click", () => window.CPLab.apply(isOld ? "augmented" : "augmented", s.map((x) => [...x]))); return b; }));
  /* how the search grows, and what the model alone does when asked for the answer: the evidence behind the header's last three beats */
  const SP = I.space, AI = D.llm_search, knockouts = aug.filter((s) => s.every(([, v]) => v === 0)).length;
  const span = (s) => (s < 90 ? `${Math.round(s)} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${(Math.round(s / 360) / 10).toString()} h`);
  if (SP && SP.sizes) {
    const rowsK = Object.keys(SP.sizes).filter((k) => +k >= 2).map((k) => `<tr><td>up to ${k} changes at once</td><td class="num">${fmt(SP.sizes[k])}</td><td class="num">${+k === 2 ? `${SP.seconds} s, measured` : `≈ ${span(SP.projected_seconds[k])}, projected`}</td></tr>`).join("");
    const ks = Object.keys(SP.sizes).map(Number).filter((k) => k >= 2), kmax = Math.max(...ks);
    $("#intervCard").insertAdjacentHTML("beforeend", `<details class="deep" style="margin-top:22px"><summary><h3>How fast the search grows</h3><span class="deep-p">${esc(`Trying every change gets expensive fast: up to 2 changes means ${fmt(SP.sizes[2])} sets (${SP.seconds} s, measured); up to ${kmax} would mean ${fmt(SP.sizes[kmax])} sets, about ${span(SP.projected_seconds[kmax])} (projected).`)}</span><span class="deep-go"></span></summary>
      <table class="tbl"><thead><tr><th>changes allowed</th><th>sets to try</th><th>time for the full search here</th></tr></thead><tbody>${rowsK}</tbody></table>
      <p class="muted" style="margin-top:8px">${SP.genes} genes can be changed (readout genes excluded), each knocked out or forced on. Projected time = the measured time for up to two changes times the ratio of the counts, at the same speed; it is not a measurement. Steering a network like this is, in general, a problem that gets very hard as it grows (“NP-hard”; <a href="https://doi.org/10.1016/j.jtbi.2006.09.023" target="_blank" rel="noopener">Akutsu et al. 2007</a>), and exhaustive search is feasible on small networks only (<a href="https://doi.org/10.3389/fphys.2019.00241" target="_blank" rel="noopener">Sedghamiz et al. 2019</a>). Here it is feasible: all of them in seconds. Of the ${aug.length} sets that stay, ${knockouts} are knock-outs only; the rest force a gene on, so the goal is to switch genes off <em>or</em> on.</p></details>`);
  }
  if (AI && AI.arms) {
    const p = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "n/a"), arms = Object.values(AI.arms), s0 = arms[0].summary;
    $("#intervCard").insertAdjacentHTML("beforeend", `<details class="deep" style="margin-top:22px"><summary><h3>The same search, with the AI alone</h3><span class="deep-p">${esc(`Asked on its own, with no checker, the AI named ${s0.distinct ?? arms[0].summary.distinct} different sets. ${arms[0].summary.works} of them (${p(arms[0].summary.works, arms[0].summary.distinct)}) really leave only cell death (a random set: ${p(s0.working_candidates, s0.candidates)}), and ${arms[0].summary.minimal_hits} of the ${s0.minimal} smallest sets were among its answers. The exact search finds all ${s0.minimal}.`)}</span><span class="deep-go"></span></summary>
      <p class="muted">${esc(arms[0].model)}, no tools, was asked for ten sets of one or two changes after which an irradiated cell has apoptosis as its only fate, with the rules shown in a different order for each request. The exact checker judged every answer. A request that ran out of its length limit before finishing is reported and not counted as a wrong guess.</p>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>thinking effort</th>${arms.map((a) => `<th>${esc(a.effort)}</th>`).join("")}</tr></thead><tbody>
        <tr><td>requests answered within the budget</td>${arms.map((a) => `<td class="num">${a.summary.answered} of ${a.summary.requests}</td>`).join("")}</tr>
        <tr><td>further requests that never returned (not counted)</td>${arms.map((a) => `<td class="num">${a.stalled || 0}</td>`).join("")}</tr>
        <tr><td>distinct valid sets named</td>${arms.map((a) => `<td class="num">${a.summary.distinct}</td>`).join("")}</tr>
        <tr><td>of those, leave only apoptosis</td>${arms.map((a) => `<td class="num">${a.summary.works} (${p(a.summary.works, a.summary.distinct)})</td>`).join("")}</tr>
        <tr><td>of those, among the ${s0.minimal} minimal sets the search finds</td>${arms.map((a) => `<td class="num">${a.summary.minimal_hits}</td>`).join("")}</tr>
        <tr><td>for comparison: a random candidate set leaves only apoptosis</td>${arms.map(() => `<td class="num">${p(s0.working_candidates, s0.candidates)}</td>`).join("")}</tr>
        <tr><td>for comparison: a random candidate set is a minimal one</td>${arms.map(() => `<td class="num">${p(s0.minimal, s0.candidates)}</td>`).join("")}</tr>
      </tbody></table></div></details>`);
  }

  /* F. cost */
  const A = D.api, B = D.bench;
  $("#costCard").innerHTML = `<h3>What this cost</h3><div class="bigline"><b>$${A.estimated_usd}</b><span class="muted">estimated from the public price table, for ${fmt(A.requests)} API calls</span></div>
    <table class="tbl"><tbody><tr><td>Text read (input tokens)</td><td class="num">${fmt(A.input_tokens)}</td></tr><tr><td>Text written (output tokens)</td><td class="num">${fmt(A.output_tokens)}</td></tr><tr><td>of which hidden thinking</td><td class="num">${fmt(A.reasoning_tokens)} (${pct(A.reasoning_tokens, A.output_tokens)}%)</td></tr></tbody></table>
    <p class="muted">Hidden thinking is billed like written text, so it dominates the bill. Every answer is cached on disk, which is why <code>make verify</code> replays everything for free.</p>${B ? `<table class="tbl"><thead><tr><th>one repair call</th><th>seconds</th><th>output tokens</th><th>USD</th></tr></thead><tbody>${Object.entries(B).map(([m, b]) => `<tr><td>${esc(m)}</td><td class="num">${b.median_seconds}</td><td class="num">${fmt(b.median_output_tokens)}</td><td class="num">${b.median_cost_usd}</td></tr>`).join("")}</tbody></table>` : ""}`;

  /* G. scaling */
  if (D.scaling && D.scaling.length) {
    $("#scalingCard").hidden = false;
    const limit = Math.max(...D.scaling.filter((r) => r.status === "timeout").map((r) => r.seconds), 0);
    const rows = D.scaling.map((r) => ({ ...r, t: r.status === "ok" ? r.mpbn_s + r.aeon_s : r.seconds })), fam = ["cascade", "random"], xs = [...new Set(rows.map((r) => r.nodes))].sort((a, b) => a - b), W2 = 760, H2 = 300, m = { l: 56, r: 20, t: 16, b: 40 };
    const tmax = Math.max(...rows.map((r) => r.t)), ymin = 0.01, ymax = 10 ** Math.ceil(Math.log10(Math.max(tmax, 1)));
    const X = (n) => m.l + ((Math.log10(n) - Math.log10(xs[0])) / (Math.log10(xs[xs.length - 1]) - Math.log10(xs[0]) || 1)) * (W2 - m.l - m.r), Y = (s) => m.t + (1 - (Math.log10(Math.max(s, ymin)) - Math.log10(ymin)) / (Math.log10(ymax) - Math.log10(ymin))) * (H2 - m.t - m.b);
    const colour = { cascade: "var(--f-arrest)", random: "var(--f-senescence)" };
    let s = `<svg viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Seconds to find all end states against model size, log scale"><g class="axis">`;
    for (let p = Math.log10(ymin); p <= Math.log10(ymax); p++) s += `<line class="gridl" x1="${m.l}" x2="${W2 - m.r}" y1="${Y(10 ** p)}" y2="${Y(10 ** p)}"/><text x="${m.l - 8}" y="${Y(10 ** p) + 4}" text-anchor="end">${10 ** p >= 1 ? 10 ** p : 10 ** p}s</text>`;
    xs.forEach((n) => (s += `<text x="${X(n)}" y="${H2 - 14}" text-anchor="middle">${n}</text>`));
    s += `<text x="${(m.l + W2 - m.r) / 2}" y="${H2 - 0}" text-anchor="middle">genes</text></g>`;
    fam.forEach((f) => {
      const pts = xs.map((n) => { const r = rows.filter((x) => x.family === f && x.nodes === n); return r.length ? [n, Math.max(...r.map((x) => x.t)), r.some((x) => x.status !== "ok")] : null; }).filter(Boolean);
      s += `<polyline fill="none" stroke="${colour[f]}" stroke-width="2" points="${pts.map((p) => X(p[0]) + "," + Y(p[1])).join(" ")}"/>`;
      pts.forEach((p) => (s += p[2] ? `<path d="M${X(p[0]) - 5},${Y(p[1]) - 5} l10,10 m0,-10 l-10,10" stroke="${colour[f]}" stroke-width="2.4"/>` : `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4" fill="${colour[f]}"/>`));
      const last = pts[pts.length - 1]; if (last) s += `<text x="${Math.min(W2 - 8, X(last[0]) + 8)}" y="${Y(last[1]) - 8}" text-anchor="end" fill="${colour[f]}" style="font:500 12px var(--sans)">${f === "cascade" ? "chains added to the base network" : "random networks"}</text>`;
    });
    const slow = rows.filter((r) => r.family === "cascade" && r.status === "ok"), top = slow.length ? slow.reduce((a, b) => (b.nodes > a.nodes ? b : a)) : null;
    $("#scaling").innerHTML = s + `</svg><p class="muted">Compute time of the slowest of three seeds at each size (about two seconds of process start-up not included). A cross marks a run that hit the ${limit} s limit. ${top ? `Chains of effectors added to the base network stay tractable up to ${top.nodes} nodes, where finding the end states takes milliseconds and the check that nothing loops forever takes most of the time. ` : ""}Random networks are hard on purpose, and most time out from 50 nodes. This measures the checker, not biology: no larger published model was tried.</p>`;
    fold($("#scalingCard"), `The checker stays fast on chains of genes added to the model${top ? ` up to ${top.nodes} genes` : ""}; random networks, which are hard on purpose, mostly time out from 50 genes. This measures the checker, not biology.`);
  }

  /* limits */
  const L2 = [
    ["The model is an abstraction", "Genes are on or off. There is no dose, no time and no frequency, so a claim such as “reduced by 24%” cannot be tested and is not scored."],
    ["One base model", "Everything depends on one published network and the choices in it. The paper contradicts itself about PUMA in the apoptosis readout; this build follows its Section 3.2."],
    ["An AI read the papers", `A quote found word for word shows faithful copying, not correct reading. A person (one, no second reader) labelled ${D.labels.labelled} of ${D.labels.sampled} randomly sampled claims: ${D.labels.correct} were read correctly and ${D.labels.labelled - D.labels.correct} were not. That is a precision on a small sample; it says nothing about claims the model missed.`],
    ["Passing the checks is not being right", "Accepted means: it agrees with ten tests and changes some outcome. An AI can word a rule so that it passes. The case files show what it changed."],
    ["The audit is small", HO ? `${HO.all_claims} claims, ${HO.claims.length} scoreable, chosen by the assistant who knew the base rules, and not yet checked by a person. Counts are shown, never percentages of improvement.` : "Not scored."],
    ["Hypotheses, not treatments", "CellProof ranks experiments to try. It has no patient-facing output and makes no clinical claim."],
  ];
  $("#limitsGrid").replaceChildren(...L2.map(([t, p]) => h(`<div class="limit"><h4>${esc(t)}</h4><p>${esc(p)}</p></div>`)));
  $("#footKv").innerHTML = `<span>commit</span><b>${esc(D.meta.commit)}</b><span>held-out set</span><b>${esc(D.meta.heldout_sha256)}</b><span>git tags</span><b>${esc(D.meta.tags.join(", "))}</b><span>page built</span><b>${esc(D.meta.built)}</b>`;
})();
