const rank = { low: 1, mid: 2, high: 3 };
const ids = ["age","archetype","body","skin","hair","eyes","style","situation","pose","expression","clothes","fail","cover","camera","light","finish"];
let L = null;
const stateHist = [];

function opt(sel, items) {
  sel.innerHTML = items.map(it => `<option value="${it.id}">${it.label}</option>`).join("");
}
function get(list, id) { return (list || []).find(x => x.id === id) || {}; }
function val(id) { return document.getElementById(id).value; }
function checked(id) { return document.getElementById(id).checked; }

function fill() {
  const ages = [{ id: "unknown", label: "Unknown / adult only" }];
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
}

function fillSituations() {
  const pack = val("pack") || "all";
  const list = L.situations.filter(s => pack === "all" || s.pack === pack);
  opt(document.getElementById("situation"), list.length ? list : L.situations);
}

function clauseOf(listName, id) {
  return get(L[listName], id).clause || "";
}

function sceneRisk() {
  const rankMap = { low: 1, mid: 2, high: 3 };
  const parts = [
    get(L.styles, val("style")).risk,
    get(L.situations, val("situation")).risk,
    get(L.poses, val("pose")).risk,
    get(L.clothes, val("clothes")).risk
  ].filter(Boolean);
  return parts.reduce((m, r) => rankMap[r] > rankMap[m] ? r : m, "low");
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
  const exp = clauseOf("expressions", val("expression"));
  if (exp) bits.push(exp);
  const cam = clauseOf("cameras", val("camera"));
  if (cam) bits.push(cam);
  const light = clauseOf("lights", val("light"));
  if (light) bits.push(light);
  const finish = clauseOf("finishes", val("finish"));
  if (finish) bits.push(finish);
  const extra = document.getElementById("custom").value.trim();
  if (extra) bits.push(extra);
  const hot = get(L.clothes, val("clothes")).hot || sceneRisk() === "high";
  if (checked("noPhoto") && hot) bits.push("stylized cinematic look, not photorealistic");
  bits.push("clearly adult fictional character, elegant composition, highly detailed, no watermark");
  return bits.filter(Boolean).join(", ") + ".";
}

function render() {
  const cap = val("riskCap");
  const risk = sceneRisk();
  const blocked = rank[risk] > rank[cap];
  document.getElementById("desired").textContent = assemble(false);
  document.getElementById("safer").textContent = assemble(true);
  const meter = document.getElementById("meter");
  meter.className = "meter " + (risk === "high" ? "high" : risk === "mid" ? "mid" : "");
  document.getElementById("warn").textContent = blocked
    ? "Over risk cap. Copy Safer, or raise the cap / drop clothing rung."
    : "";
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)].id;
}

function roll() {
  const pack = val("pack");
  if (!checked("lockSubject")) {
    document.getElementById("archetype").value = pick(L.archetypes);
    document.getElementById("body").value = pick(L.bodies);
    document.getElementById("skin").value = pick(L.skins);
    document.getElementById("hair").value = pick(L.hair);
    document.getElementById("eyes").value = pick(L.eyes);
  }
  if (!checked("lockScene")) {
    const sits = L.situations.filter(s => pack === "all" || s.pack === pack);
    document.getElementById("situation").value = pick(sits.length ? sits : L.situations);
    document.getElementById("pose").value = pick(L.poses);
    document.getElementById("expression").value = pick(L.expressions);
    document.getElementById("style").value = pick(L.styles);
  }
  if (!checked("lockClothes")) {
    document.getElementById("clothes").value = pick(L.clothes);
    document.getElementById("fail").value = pick(L.fails);
    document.getElementById("cover").value = pick(L.covers);
  }
  if (!checked("lockCam")) {
    document.getElementById("camera").value = pick(L.cameras);
    document.getElementById("light").value = pick(L.lights);
    document.getElementById("finish").value = pick(L.finishes);
  }
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
  stateHist.unshift(assemble(false));
  if (stateHist.length > 20) stateHist.pop();
  document.getElementById("hist").innerHTML = stateHist.map((t, i) =>
    `<button data-i="${i}">${t.slice(0, 90)}\u2026</button>`
  ).join("");
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
  document.getElementById("mutatePlace").onclick = () => {
    const pack = val("pack");
    const sits = L.situations.filter(s => pack === "all" || s.pack === pack);
    document.getElementById("situation").value = pick(sits.length ? sits : L.situations);
    remember(); render();
  };
  document.getElementById("mutatePose").onclick = () => {
    document.getElementById("pose").value = pick(L.poses);
    remember(); render();
  };
  document.getElementById("copyDesired").onclick = () => navigator.clipboard.writeText(document.getElementById("desired").textContent);
  document.getElementById("copySafer").onclick = () => navigator.clipboard.writeText(document.getElementById("safer").textContent);
  document.getElementById("hist").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    document.getElementById("desired").textContent = stateHist[+b.dataset.i];
  });
}

async function boot() {
  try {
    if (typeof EMBEDDED_LIB !== "undefined") {
      L = EMBEDDED_LIB;
    } else {
      const res = await fetch("lib.js");
      throw new Error("lib.js must define EMBEDDED_LIB");
    }
  } catch (err) {
    document.getElementById("desired").textContent = "Library failed to load. Need lib.js on Pages.";
    return;
  }
  fill();
  bind();
  render();
  remember();
}
boot();
