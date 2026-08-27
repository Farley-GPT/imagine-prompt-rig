const rank = { low: 1, mid: 2, high: 3 };
const ids = ["age","archetype","body","skin","hair","eyes","style","situation","pose","expression","clothes","fail","cover","camera","light","finish"];
const subjectIds = ["age","archetype","body","skin","hair","eyes"];
let L = null;
const stateHist = [];
const pins = new Set(["age","archetype","body","skin","hair","eyes"]);

function opt(sel, items) {
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = items.map(it => `<option value="${it.id}">${it.label}</option>`).join("");
  if (items.some(it => it.id === cur)) sel.value = cur;
}
function get(list, id) { return (list || []).find(x => x.id === id) || {}; }
function val(id) { const el = document.getElementById(id); return el ? el.value : ""; }
function checked(id) { const el = document.getElementById(id); return !!(el && el.checked); }
function labelOf(list, id) { return get(list, id).label || id; }
function sitList() {
  const pack = val("pack") || "all";
  const list = L.situations.filter(s => pack === "all" || s.pack === pack);
  return list.length ? list : L.situations;
}
function fill() {
  const ages = [{ id: "unknown", label: "Unknown" }];
  for (let a = 18; a <= 99; a++) ages.push({ id: String(a), label: String(a) });
  opt(document.getElementById("age"), ages);
  document.getElementById("age").value = "29";
  opt(document.getElementById("archetype"), L.archetypes);
  opt(document.getElementById("body"), L.bodies);
  opt(document.getElementById("skin"), L.skins);
  opt(document.getElementById("hair"), L.hair);
  opt(document.getElementById("eyes"), L.eyes);
  opt(document.getElementById("style"), L.styles);
  opt(document.getElementById("pack"), L.packs);
  fillSituations();
  opt(document.getElementById("pose"), L.poses);
  opt(document.getElementById("expression"), L.expressions);
  opt(document.getElementById("clothes"), L.clothes);
  opt(document.getElementById("fail"), L.fails);
  opt(document.getElementById("cover"), L.covers);
  opt(document.getElementById("camera"), L.cameras);
  opt(document.getElementById("light"), L.lights);
  opt(document.getElementById("finish"), L.finishes);
  paintPickers();
  paintStrip();
}
function fillSituations() {
  opt(document.getElementById("situation"), sitList());
  paintPickers();
}
function clauseOf(listName, id) { return get(L[listName], id).clause || ""; }
function sceneRisk() {
  const parts = [
    get(L.styles, val("style")).risk,
    get(L.situations, val("situation")).risk,
    get(L.poses, val("pose")).risk,
    get(L.clothes, val("clothes")).risk
  ].filter(Boolean);
  return parts.reduce((m, r) => rank[r] > rank[m] ? r : m, "low");
}
function assemble(safer) {
  const bits = [];
  const style = clauseOf("styles", val("style"));
  bits.push(style ? style + " of" : "Cinematic photograph of");
  const age = val("age");
  const who = [];
  if (age === "unknown") who.push("an adult fictional woman");
  else who.push(`a ${age}-year-old fictional woman`);
  if (checked("useNick") && document.getElementById("nick").value.trim()) {
    who.push(`called ${document.getElementById("nick").value.trim()}`);
  }
  ["archetype","hair","eyes","body","skin"].forEach(k => {
    const map = { archetype: "archetypes", hair: "hair", eyes: "eyes", body: "bodies", skin: "skins" };
    const c = clauseOf(map[k], val(k));
    if (c) who.push(c);
  });
  bits.push(who.join(", "));
  const pose = clauseOf("poses", val("pose"));
  if (pose) bits.push(pose);
  let clothes = clauseOf("clothes", val("clothes"));
  const fail = clauseOf("fails", val("fail"));
  if (clothes) {
    if (safer && L.synonyms) {
      Object.entries(L.synonyms).forEach(([k, v]) => {
        clothes = clothes.replace(new RegExp(k, "ig"), v);
      });
    }
    bits.push("wearing " + clothes + (fail ? ", " + fail : ""));
  }
  const cover = clauseOf("covers", val("cover"));
  if (cover) bits.push(cover);
  const sit = clauseOf("situations", val("situation"));
  if (sit) bits.push(sit);
  ["expressions","cameras","lights","finishes"].forEach((list, i) => {
    const key = ["expression","camera","light","finish"][i];
    const c = clauseOf(list, val(key));
    if (c) bits.push(c);
  });
  const extra = document.getElementById("custom").value.trim();
  if (extra) bits.push(extra);
  const hot = get(L.clothes, val("clothes")).hot || sceneRisk() === "high";
  if (checked("noPhoto") && hot) bits.push("stylized cinematic look, not photorealistic");
  bits.push("clearly adult fictional character, elegant composition, highly detailed, no watermark");
  return bits.filter(Boolean).join(", ") + ".";
}
function paintStrip() {
  const el = document.getElementById("strip");
  if (!el) return;
  const bits = [
    ["age", val("age") === "unknown" ? "Adult" : val("age")],
    ["archetype", labelOf(L.archetypes, val("archetype"))],
    ["body", labelOf(L.bodies, val("body"))],
    ["skin", labelOf(L.skins, val("skin"))],
    ["hair", labelOf(L.hair, val("hair"))],
    ["eyes", labelOf(L.eyes, val("eyes"))]
  ];
  el.innerHTML = bits.map(([k, lab]) =>
    `<button type="button" class="token${pins.has(k) ? " on" : ""}" data-pin="${k}"><span>${lab}</span><i>${pins.has(k) ? "pinned" : "pin"}</i></button>`
  ).join("");
}
function paintPickers() {
  drawPicker("pose", L.poses, document.getElementById("poseQ")?.value || "");
  drawPicker("situation", sitList(), document.getElementById("sitQ")?.value || "");
}
function drawPicker(kind, list, q) {
  const box = document.getElementById(kind === "pose" ? "poseHits" : "sitHits");
  const hidden = document.getElementById(kind);
  if (!box || !hidden) return;
  const needle = q.trim().toLowerCase();
  const hits = list.filter(it => !needle || (it.label + " " + (it.clause || "") + " " + (it.pack || "") + " " + (it.cat || "")).toLowerCase().includes(needle));
  box.innerHTML = hits.slice(0, 48).map(it =>
    `<button type="button" class="hit${it.id === hidden.value ? " sel" : ""}" data-kind="${kind}" data-id="${it.id}"><b>${it.label}</b><small>${it.cat || it.pack || it.risk || ""}</small></button>`
  ).join("") || `<p class="empty">No matches</p>`;
}
function render() {
  const cap = val("riskCap");
  const risk = sceneRisk();
  const blocked = rank[risk] > rank[cap];
  document.getElementById("desired").textContent = assemble(false);
  document.getElementById("safer").textContent = assemble(true);
  const meter = document.getElementById("meter");
  meter.className = "meter " + (risk === "high" ? "high" : risk === "mid" ? "mid" : "");
  const risklab = document.getElementById("risklab");
  if (risklab) risklab.textContent = risk;
  document.getElementById("warn").textContent = blocked
    ? "Over risk cap. Copy Safer, or raise the cap / drop clothing rung."
    : "";
  paintStrip();
  paintPickers();
}
function pick(list) { return list[Math.floor(Math.random() * list.length)].id; }
function lockedField(id) {
  if (subjectIds.includes(id) && (checked("lockSubject") || pins.has(id))) return true;
  if (["style","situation","pose","expression"].includes(id) && checked("lockScene")) return true;
  if (["clothes","fail","cover"].includes(id) && checked("lockClothes")) return true;
  if (["camera","light","finish"].includes(id) && checked("lockCam")) return true;
  return false;
}
function roll() {
  if (!lockedField("archetype")) document.getElementById("archetype").value = pick(L.archetypes);
  if (!lockedField("body")) document.getElementById("body").value = pick(L.bodies);
  if (!lockedField("skin")) document.getElementById("skin").value = pick(L.skins);
  if (!lockedField("hair")) document.getElementById("hair").value = pick(L.hair);
  if (!lockedField("eyes")) document.getElementById("eyes").value = pick(L.eyes);
  if (!lockedField("situation")) document.getElementById("situation").value = pick(sitList());
  if (!lockedField("pose")) document.getElementById("pose").value = pick(L.poses);
  if (!lockedField("expression")) document.getElementById("expression").value = pick(L.expressions);
  if (!lockedField("style")) document.getElementById("style").value = pick(L.styles);
  if (!lockedField("clothes")) document.getElementById("clothes").value = pick(L.clothes);
  if (!lockedField("fail")) document.getElementById("fail").value = pick(L.fails);
  if (!lockedField("cover")) document.getElementById("cover").value = pick(L.covers);
  if (!lockedField("camera")) document.getElementById("camera").value = pick(L.cameras);
  if (!lockedField("light")) document.getElementById("light").value = pick(L.lights);
  if (!lockedField("finish")) document.getElementById("finish").value = pick(L.finishes);
  remember();
  render();
}
function escalate() {
  const order = L.clothes.map(c => c.id);
  const i = order.indexOf(val("clothes"));
  if (i >= 0 && i < order.length - 1) document.getElementById("clothes").value = order[i + 1];
  remember();
  render();
}
function remember() {
  const snap = {
    text: assemble(false),
    pose: labelOf(L.poses, val("pose")),
    sit: labelOf(L.situations, val("situation")),
    risk: sceneRisk()
  };
  stateHist.unshift(snap);
  if (stateHist.length > 16) stateHist.pop();
  document.getElementById("hist").innerHTML = stateHist.map((t, i) =>
    `<button type="button" class="frame" data-i="${i}"><em>${t.pose}</em><span>${t.sit}</span><b class="${t.risk}">${t.risk}</b></button>`
  ).join("");
}
function onHit(e) {
  const b = e.target.closest("[data-kind]");
  if (!b) return;
  document.getElementById(b.dataset.kind).value = b.dataset.id;
  render();
}
function bind() {
  ids.concat(["riskCap","pack","useNick","noPhoto"]).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => {
      if (id === "pack") fillSituations();
      render();
    });
  });
  document.getElementById("custom").addEventListener("input", render);
  document.getElementById("nick").addEventListener("input", render);
  document.getElementById("lucky").onclick = roll;
  document.getElementById("escalate").onclick = escalate;
  document.getElementById("mutatePlace").onclick = () => { document.getElementById("situation").value = pick(sitList()); remember(); render(); };
  document.getElementById("mutatePose").onclick = () => { document.getElementById("pose").value = pick(L.poses); remember(); render(); };
  document.getElementById("copyDesired").onclick = () => navigator.clipboard.writeText(document.getElementById("desired").textContent);
  document.getElementById("copySafer").onclick = () => navigator.clipboard.writeText(document.getElementById("safer").textContent);
  document.getElementById("hist").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    document.getElementById("desired").textContent = stateHist[+b.dataset.i].text;
  });
  document.getElementById("strip").addEventListener("click", e => {
    const b = e.target.closest("[data-pin]");
    if (!b) return;
    const k = b.dataset.pin;
    if (pins.has(k)) pins.delete(k); else pins.add(k);
    paintStrip();
  });
  document.getElementById("poseQ").addEventListener("input", paintPickers);
  document.getElementById("sitQ").addEventListener("input", paintPickers);
  document.getElementById("poseHits").addEventListener("click", onHit);
  document.getElementById("sitHits").addEventListener("click", onHit);
  document.getElementById("toggleMix").onclick = () => document.body.classList.toggle("mix-open");
  document.getElementById("closeMix").onclick = () => document.body.classList.remove("mix-open");
  document.getElementById("veil").onclick = () => document.body.classList.remove("mix-open");
}
async function boot() {
  try {
    if (typeof EMBEDDED_LIB !== "undefined") L = EMBEDDED_LIB;
    else throw new Error("missing lib");
  } catch (err) {
    document.getElementById("desired").textContent = "Library failed to load.";
    return;
  }
  fill();
  bind();
  render();
  remember();
}
boot();
