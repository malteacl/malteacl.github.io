(function () {
"use strict";
const D = window.MALTEA, DIMS = D.dims, FAM = D.families;
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\+/g, "mas").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const BEERS = D.beers.map(r => {
  const [brand, name, st, abv, flags, src] = r, b = D.brands[brand], s = D.styles[st];
  /* sexta dimensión derivada: fruta, jugo o esencias añadidas, separada del aroma que da el lúpulo o la levadura */
  const added = st === "honey" ? 4 : st === "fruitipa" ? 3 : (s[1] === "fruta" || s[1] === "radler" || s[1] === "sour" || st === "na_radler") ? 5 : 1;
  const p = s[2].slice(); if (added === 5) p[4] = Math.min(p[4], 2); p.push(added);
  return { id: slug(brand + " " + name), brand, name, full: name.startsWith(brand) ? name : brand + " " + name, st, style: s[0], fam: s[1], p, abv,
    na: flags.includes("n"), gf: flags.includes("g"), chk: flags.includes("c"), ed: flags.includes("e"), ref: flags.includes("r"), src,
    maker: b[0], country: b[1], place: b[2], seg: b[3] };
});
const BY = Object.fromEntries(BEERS.map(b => [b.id, b]));
/* el gusto se mide contra la cerveza promedio del catálogo, no contra un punto fijo */
const MEAN = DIMS.map((_, i) => BEERS.reduce((t, b) => t + b.p[i], 0) / BEERS.length);
const COUNTRIES = [["CL", "Chile", true], ["AR", "Argentina"], ["PE", "Perú"], ["MX", "México"], ["CO", "Colombia"], ["ES", "España"]];
const REGIONS = ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"];
const SEGS = [["all", "Todas"], ["masiva", "Masivas"], ["chilena", "Artesanales y de especialidad chilenas"], ["importada", "Importadas"], ["na", "Sin alcohol"], ["rated", "Las que puntué"], ["wish", "Mi lista"]];
const LEVELS = [[0, "Curioso"], [3, "Aprendiz"], [10, "Catador"], [25, "Conocedor"], [50, "Sommelier"], [100, "Maestro cervecero"], [180, "Leyenda"]];
const MIN = 3, PAGE = 24, LS = "maltea-v1";
const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
/* Tres formas de guardar: dentro de Claude (datos del artefacto), con Supabase (cuentas propias) o solo en el navegador */
const CFG = window.MALTEA_CONFIG || {};
const IN_CLAUDE = !!(window.claude && window.claude.use);
const SUPA = !IN_CLAUDE && !!(CFG.supabaseUrl && CFG.supabaseKey);
const RECOVERY_LINK = SUPA && /type=recovery/.test(location.hash + location.search); /* vino desde el correo para cambiar contraseña */
const SITE = location.origin + location.pathname;
const SUPA_SRC = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js";

const S = { profile: null, scores: {}, wish: [], sug: [], all: {}, cloud: false, db: null, uid: null, editing: false, error: "",
  q: "", seg: "all", fam: "all", pais: "all", sort: "name", shown: PAGE, stale: false, deckSeg: "all", skipped: new Set(), earned: new Set(), level: 0,
  mode: SUPA ? "supa" : "local", user: null, authReady: !SUPA, loading: false, loadErr: false, busy: false, authMsg: "", authEmail: "", confirmDel: false, syncErr: false,
  owner: null, localProfile: null, fetched: {}, statsBase: {}, statsAt: 0, recovery: RECOVERY_LINK, google: false, forgot: false };
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = x => x.toFixed(1).replace(".", ",");
const abvTxt = b => b.na ? "0,0°" : b.abv == null ? "" : num(b.abv) + "°";
const origin = b => (b.place ? b.place + ", " : "") + b.country;
function clean(o) { const r = {}; if (o && typeof o === "object") for (const k in o) { const v = o[k]; if (BY[k] && Number.isInteger(v) && v >= 1 && v <= 5) r[k] = v; } return r; }
function cleanWish(a) { return Array.isArray(a) ? [...new Set(a.filter(x => typeof x === "string" && BY[x]))].slice(0, 300) : []; }
function same(a, b) { const ka = Object.keys(a); return ka.length === Object.keys(b).length && ka.every(k => a[k] === b[k]); }

function loadLocal() { try { const d = JSON.parse(localStorage.getItem(LS) || "null"); if (d) { if (d.profile && typeof d.profile.name === "string") S.profile = d.profile; S.scores = clean(d.scores); S.wish = cleanWish(d.wish); if (Array.isArray(d.sug)) S.sug = d.sug.slice(-20); S.owner = typeof d.owner === "string" ? d.owner : null; } } catch (e) {} }
function saveLocal() { try { localStorage.setItem(LS, JSON.stringify({ profile: S.profile, scores: S.scores, wish: S.wish, sug: S.sug, owner: S.user ? S.user.id : null })); } catch (e) {} }

/* ——— cálculo ——— */
function community() {
  if (S.mode === "supa") { /* totales del servidor sin mis notas, más mis notas actuales */
    const a = {}; for (const id in S.statsBase) a[id] = { t: S.statsBase[id].t, c: S.statsBase[id].c };
    for (const id in S.scores) { const x = a[id] || (a[id] = { t: 0, c: 0 }); x.t += S.scores[id]; x.c++; }
    return a;
  }
  const agg = {}, rows = Object.assign({}, S.all); rows[S.uid || "me"] = S.scores;
  for (const u in rows) for (const id in rows[u]) { const a = agg[id] || (agg[id] = { t: 0, c: 0 }); a.t += rows[u][id]; a.c++; }
  return agg;
}
function taste() { const u = DIMS.map(() => 0); for (const id in S.scores) { const w = S.scores[id] - 3; BY[id].p.forEach((v, i) => u[i] += w * (v - MEAN[i])); } return u; }
function famStats() { const f = {}; for (const id in S.scores) { const k = BY[id].fam, a = f[k] || (f[k] = [0, 0]); a[0] += S.scores[id]; a[1]++; } return f; }
function recommend() {
  const u = taste(), nu = Math.hypot(...u), fs = famStats(), ids = Object.keys(S.scores);
  const liked = ids.filter(id => S.scores[id] >= 4).map(id => BY[id]);
  const likesNA = liked.some(b => b.na), agg = community();
  const c = BEERS.filter(b => !S.scores[b.id] && (!b.na || likesNA)).map(b => {
    const v = b.p.map((x, i) => x - MEAN[i]), nv = Math.hypot(...v) || 1;
    const cos = nu ? v.reduce((a, x, i) => a + x * u[i], 0) / (nv * nu) : 0;
    const f = fs[b.fam], fb = f ? (f[0] / f[1] - 3) / 2 : 0;
    let near = null, best = 1e9;
    liked.forEach(l => { const d = Math.hypot(...l.p.map((x, i) => x - b.p[i])) + (l.fam === b.fam ? 0 : 1); if (d < best) { best = d; near = l; } });
    return { b, score: cos * 0.6 + fb * 0.4, near };
  }).filter(r => r.score > 0.08).sort((a, b) => b.score - a.score || ((agg[b.b.id] || {}).c || 0) - ((agg[a.b.id] || {}).c || 0));
  const out = [], pb = {}, ps = {};
  for (const r of c) { if ((pb[r.b.brand] || 0) >= 2 || (ps[r.b.st] || 0) >= 2) continue; pb[r.b.brand] = (pb[r.b.brand] || 0) + 1; ps[r.b.st] = (ps[r.b.st] || 0) + 1; out.push(r); if (out.length === 6) break; }
  return out;
}
function levelOf(n) { let i = 0; LEVELS.forEach((l, k) => { if (n >= l[0]) i = k; }); return i; }

const BADGES = [
  ["sorbo", "1", "Primer sorbo", "Puntúa tu primera cerveza", c => c.n >= 1],
  ["trio", "3", "Trío", "Puntúa 3 y activa tus recomendaciones", c => c.n >= 3],
  ["decena", "10", "Decena", "Puntúa 10 cervezas", c => c.n >= 10],
  ["cuarto", "25", "Veinticinco", "Puntúa 25 cervezas", c => c.n >= 25],
  ["estilos", "ES", "Explorador", "Prueba 5 familias de estilos", c => c.fams.size >= 5],
  ["mundo", "MU", "Trotamundos", "Prueba cervezas de 5 países", c => c.countries.size >= 5],
  ["barrio", "CL", "Hincha local", "Puntúa 8 chilenas artesanales o de especialidad", c => c.count(b => b.seg === "chilena") >= 8],
  ["oscuro", "NE", "Lado oscuro", "Puntúa 3 stouts o porters", c => c.count(b => b.fam === "stout") >= 3],
  ["lupulo", "LU", "Lupulómano", "Puntúa 3 IPA", c => c.count(b => b.fam === "ipa") >= 3],
  ["trigo", "TR", "Trigueño", "Puntúa 3 cervezas de trigo", c => c.count(b => b.fam === "trigo") >= 3],
  ["cero", "0°", "Conductor designado", "Puntúa una sin alcohol", c => c.count(b => b.na) >= 1],
  ["exigente", "1/5", "Paladar exigente", "Pon una nota 1", c => c.has(1)],
  ["flechazo", "5/5", "Flechazo", "Pon una nota 5", c => c.has(5)],
  ["lista", "LI", "Con ganas", "Guarda 3 cervezas en tu lista", c => c.wish >= 3]
];
function badgeCtx() {
  const ids = Object.keys(S.scores), bs = ids.map(i => BY[i]);
  return { n: ids.length, fams: new Set(bs.map(b => b.fam)), countries: new Set(bs.map(b => b.country)), count: f => bs.filter(f).length, has: v => ids.some(i => S.scores[i] === v), wish: S.wish.length };
}
function syncBadges(silent) {
  const c = badgeCtx(), now = new Set(BADGES.filter(b => b[4](c)).map(b => b[0])), lvl = levelOf(c.n);
  if (!silent) {
    BADGES.forEach(b => { if (now.has(b[0]) && !S.earned.has(b[0])) { toast("Insignia: " + b[2], b[3]); burst(); } });
    if (lvl > S.level) { toast("Subiste de nivel", "Ahora eres " + LEVELS[lvl][1] + "."); burst(); }
  }
  S.earned = now; S.level = lvl;
}

/* ——— piezas de interfaz ——— */
const sw = fam => `<span class="sw" style="--c:${FAM[fam][1]}" aria-hidden="true"></span>`;
function glasses(b, big, withId) {
  const m = S.scores[b.id] || 0;
  return `<div class="glasses${big ? " big" : ""}" role="group" aria-label="Puntuar ${esc(b.full)}">${[1, 2, 3, 4, 5].map(i =>
    `<button type="button" class="g${i <= m ? " on" : ""}"${withId ? ` id="r-${b.id}-${i}"` : ""} data-act="rate" data-b="${b.id}" data-v="${i}" aria-pressed="${i === m}" aria-label="${i} de 5 para ${esc(b.full)}"><span><i></i></span></button>`).join("")}</div>`;
}
const avgHTML = a => a ? `<b>${num(a.t / a.c)}</b> promedio<br>${a.c} ${a.c === 1 ? "voto" : "votos"}` : "Sin votos todavía";
function tagsHTML(b) {
  const t = [];
  if (abvTxt(b)) t.push(`<span class="tag">${abvTxt(b)}</span>`);
  if (b.gf) t.push(`<span class="tag">Sin gluten</span>`);
  if (b.ed) t.push(`<span class="tag">Edición especial</span>`);
  if (b.chk) t.push(`<span class="tag warn">Estilo por confirmar</span>`);
  return t.join("");
}
function wishBtn(b) {
  const on = S.wish.includes(b.id);
  return `<button type="button" class="btn ghost wish" data-act="wish" data-b="${b.id}" aria-pressed="${on}"${S.scores[b.id] ? " hidden" : ""}>${on ? "En tu lista" : "Quiero probarla"}</button>`;
}
function card(b, agg) {
  const m = S.scores[b.id] || 0;
  return `<article class="beer" id="b-${b.id}" data-beer="${b.id}">
    <div class="tags">${sw(b.fam)}<span class="tag style">${esc(b.style)}</span></div>
    <h3>${esc(b.full)}</h3>
    <p class="meta">${esc(b.maker)} · ${esc(origin(b))}</p>
    <div class="tags">${tagsHTML(b)}</div>
    ${wishBtn(b)}
    <div class="rate"><div><div class="mine">${m ? `Tu nota: ${m} de 5` : ""}</div>${glasses(b, false, true)}</div><div class="avg">${avgHTML(agg[b.id])}</div></div>
  </article>`;
}
function paint(id, agg) {
  const m = S.scores[id] || 0, a = (agg || community())[id], on = S.wish.includes(id);
  document.querySelectorAll(`[data-beer="${id}"]`).forEach(el => {
    el.querySelectorAll(".g").forEach(g => { const v = +g.dataset.v; g.classList.toggle("on", v <= m); g.setAttribute("aria-pressed", v === m); });
    const mi = el.querySelector(".mine"); if (mi) mi.textContent = m ? `Tu nota: ${m} de 5` : "";
    const av = el.querySelector(".avg"); if (av) av.innerHTML = avgHTML(a);
    const w = el.querySelector(".wish"); if (w) { w.setAttribute("aria-pressed", on); w.textContent = on ? "En tu lista" : "Quiero probarla"; if (!el.classList.contains("dcard")) w.hidden = !!m; }
  });
}
function refreshAvg() { const agg = community(), seen = new Set(); document.querySelectorAll("[data-beer]").forEach(el => { const id = el.dataset.beer; if (!seen.has(id)) { seen.add(id); paint(id, agg); } }); renderRank(); }

function toast(title, text) {
  const t = document.createElement("div"); t.className = "toast";
  const b = document.createElement("b"); b.textContent = title; t.append(b, document.createTextNode(text));
  $("toasts").append(t); setTimeout(() => t.remove(), 4500);
}

/* ——— cuenta ——— */
function authForm() {
  const pend = Object.keys(S.scores).length;
  if (S.forgot) return `<h2>Recupera tu contraseña</h2>
    <p class="sub">Te enviaremos un enlace para elegir una nueva.</p>
    <form id="forgot" novalidate>
      <label class="f" for="fg-email">Correo de tu cuenta
        <input type="email" id="fg-email" autocomplete="email" value="${esc(S.authEmail)}"></label>
      ${S.error ? `<p class="err" role="alert">${esc(S.error)}</p>` : ""}${S.authMsg ? `<p class="note" role="status">${esc(S.authMsg)}</p>` : ""}
      <div class="row"><button class="btn" type="submit"${S.busy ? " disabled" : ""}>Enviar enlace</button><button class="btn ghost" type="button" data-act="forgotno">Volver</button></div>
    </form>`;
  return `<h2>Entra a Maltea</h2>
    <p class="sub">Con tu cuenta, tus notas y tu lista te siguen a cualquier dispositivo.</p>
    <form id="auth" novalidate>
      <label class="f" for="au-email">Correo
        <input type="email" id="au-email" autocomplete="email" value="${esc(S.authEmail)}"></label>
      <label class="f" for="au-pass">Contraseña
        <input type="password" id="au-pass" autocomplete="current-password" minlength="8"></label>
      ${S.error ? `<p class="err" role="alert">${esc(S.error)}</p>` : ""}${S.authMsg ? `<p class="note" role="status">${esc(S.authMsg)}</p>` : ""}
      <div class="row"><button class="btn" type="submit" data-how="in"${S.busy ? " disabled" : ""}>Entrar</button><button class="btn ghost" type="submit" data-how="up"${S.busy ? " disabled" : ""}>Crear cuenta</button></div>
      ${CFG.recuperarClave ? `<p class="note"><button type="button" class="linkbtn" data-act="forgot">¿Olvidaste tu contraseña?</button></p>` : ""}
      ${S.google ? `<div class="or"><span>o</span></div><button class="btn ghost google" type="button" data-act="google">Entrar con Google</button>` : ""}
      <p class="note">${pend ? `Tienes ${pend} ${pend === 1 ? "nota" : "notas"} en este navegador; ${pend === 1 ? "se guardará" : "se guardarán"} en tu cuenta al entrar. ` : ""}Al crear tu cuenta aceptas la <a href="privacidad.html">política de privacidad</a>.</p>
    </form>`;
}
function sessionLine() {
  if (S.mode !== "supa" || !S.user) return "";
  return `<div class="acct"><span class="note">Sesión: ${esc(S.user.email)}</span><button class="btn ghost" type="button" data-act="signout">Cerrar sesión</button>${
    S.profile && !S.editing && !S.confirmDel ? `<button class="btn ghost" type="button" data-act="export">Descargar mis datos</button>` : ""}${
    S.profile && !S.editing ? (S.confirmDel
      ? `<button class="btn ghost danger" type="button" data-act="delyes">Sí, borrar todo</button><button class="btn ghost" type="button" data-act="delno">Cancelar</button>`
      : `<button class="btn ghost danger" type="button" data-act="delacct">Borrar mi cuenta</button>`) : ""}</div>${
    S.confirmDel ? `<p class="err" role="alert">Se borrarán tu cuenta, tu perfil, tus notas y tu lista. No se puede deshacer.</p>` : ""}`;
}
function renderAccount() {
  const el = $("account"), p = S.profile;
  if (S.mode === "supa" && !S.authReady) { el.innerHTML = `<h2>Maltea</h2><p class="sub">Conectando con tu cuenta…</p>`; return; }
  if (S.mode === "supa" && S.recovery && S.user) { el.innerHTML = `<h2>Elige tu nueva contraseña</h2>
    <p class="sub">Cuenta: ${esc(S.user.email)}</p>
    <form id="newpass" novalidate>
      <label class="f" for="np-pass">Nueva contraseña
        <input type="password" id="np-pass" autocomplete="new-password" minlength="8"></label>
      ${S.error ? `<p class="err" role="alert">${esc(S.error)}</p>` : ""}
      <div class="row"><button class="btn" type="submit"${S.busy ? " disabled" : ""}>Guardar contraseña</button><button class="btn ghost" type="button" data-act="recno">Ahora no</button></div>
    </form>`; return; }
  if (S.mode === "supa" && !S.user) { el.innerHTML = authForm(); return; }
  if (S.mode === "supa" && S.loading) { el.innerHTML = `<h2>Maltea</h2><p class="sub">Cargando tus datos…</p>`; return; }
  if (S.mode === "supa" && S.loadErr) { el.innerHTML = `<h2>Maltea</h2><p class="err" role="alert">No pudimos cargar tus datos. Revisa tu conexión y recarga la página.</p>${sessionLine()}`; return; }
  if (p && !S.editing) {
    const ids = Object.keys(S.scores), n = ids.length, lv = levelOf(n), next = LEVELS[lv + 1];
    const avg = n ? num(ids.reduce((a, i) => a + S.scores[i], 0) / n) : "–";
    const pct = next ? Math.round((n - LEVELS[lv][0]) / (next[0] - LEVELS[lv][0]) * 100) : 100;
    el.innerHTML = `<h2>Hola, ${esc(p.name)}</h2>
      <p class="sub">Compras en Chile${p.region ? " · " + esc(p.region) : ""}</p>
      <div class="stats">
        <div class="stat"><b>${n}</b><span>puntuadas</span></div>
        <div class="stat"><b>${avg}</b><span>tu promedio</span></div>
        <div class="stat"><b>${S.wish.length}</b><span>en tu lista</span></div>
      </div>
      <div class="lvl"><b>Nivel: ${LEVELS[lv][1]}</b><span class="note"> ${next ? `· te faltan ${next[0] - n} para ${next[1]}` : "· nivel máximo"}</span><div class="bar"><i style="width:${pct}%"></i></div></div>
      <p style="margin-top:14px"><a class="btn" href="#cata">Seguir catando</a> <button class="btn ghost" data-act="edit" type="button">Editar perfil</button></p>
      ${sessionLine()}
      <p class="note" style="margin-top:12px">${S.cloud || S.mode === "supa" ? "Tu perfil y tus notas quedan guardados en tu cuenta." : "Tus datos se guardan solo en este navegador."}${S.syncErr ? " Hay cambios que no se pudieron guardar; revisa tu conexión." : ""}${S.stale ? " No pudimos conectar con los datos compartidos; los promedios pueden estar desactualizados." : ""}</p>`;
    return;
  }
  el.innerHTML = `<h2>${p ? "Editar perfil" : "Crea tu perfil"}</h2>
    <p class="sub">Elige el país donde compras. Así ves solo cervezas que puedes encontrar.</p>
    <form id="reg" novalidate>
      <label class="f" for="name">Nombre o apodo
        <input type="text" id="name" maxlength="30" autocomplete="nickname" value="${p ? esc(p.name) : ""}"></label>
      <label class="f" for="country">País donde compras
        <select id="country">${COUNTRIES.map(c => `<option value="${c[0]}"${c[2] ? "" : " disabled"}>${c[1]}${c[2] ? "" : " (próximamente)"}</option>`).join("")}</select></label>
      <label class="f" for="region">Región (opcional)
        <select id="region"><option value="">Sin indicar</option>${REGIONS.map(r => `<option${p && p.region === r ? " selected" : ""}>${esc(r)}</option>`).join("")}</select></label>
      <label class="check" for="adult"><input type="checkbox" id="adult"${p ? " checked" : ""}><span>Tengo 18 años o más, la edad legal para comprar alcohol en Chile.</span></label>
      ${S.error ? `<p class="err" role="alert">${esc(S.error)}</p>` : ""}
      <button class="btn" type="submit">${p ? "Guardar cambios" : "Registrarme en Chile"}</button>
    </form>${sessionLine()}`;
}
function needProfile() {
  const noSession = S.mode === "supa" && !S.user;
  S.error = noSession ? "Entra o crea tu cuenta para puntuar." : "Crea tu perfil para empezar a puntuar."; S.editing = false; renderAccount();
  $("account").scrollIntoView({ block: "center" }); const n = $(noSession ? "au-email" : "name"); if (n) n.focus({ preventScroll: true });
}

/* ——— cata rápida ——— */
const DECK = BEERS.map(b => [b, (b.seg === "masiva" ? 0 : 1) + (b.ref ? 1.5 : 0) + (b.na ? 1 : 0) + Math.random()]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
const deckQueue = () => DECK.filter(b => !S.scores[b.id] && !S.skipped.has(b.id) && !S.wish.includes(b.id) && (S.deckSeg === "all" || b.seg === S.deckSeg));
function renderDeck(anim) {
  const q = deckQueue(), el = $("deck");
  $("deckchips").innerHTML = SEGS.slice(0, 4).map(s => `<button type="button" class="chip" data-act="deckseg" data-s="${s[0]}" aria-pressed="${S.deckSeg === s[0]}">${s[1]}</button>`).join("");
  if (!q.length) {
    el.innerHTML = `<div class="empty" style="height:100%"><span>${S.skipped.size ? "No quedan cervezas por mostrar en esta selección." : "Ya puntuaste todas las cervezas de esta selección."}</span>${S.skipped.size ? `<button class="btn" type="button" data-act="unskip">Volver a ver las que salté</button>` : ""}</div>`;
  } else {
    const b = q[0];
    el.innerHTML = `<article class="dcard${anim && !REDUCED ? " in" : ""}" data-beer="${b.id}" style="--c:${FAM[b.fam][1]}">
      <div class="tags">${sw(b.fam)}<span class="tag style">${esc(b.style)}</span>${tagsHTML(b)}</div>
      <h3>${esc(b.full)}</h3>
      <p class="meta">${esc(b.maker)} · ${esc(origin(b))}</p>
      <p class="note">${esc(FAM[b.fam][0])}: ${esc(FAM[b.fam][2])}</p>
      <p class="q">¿Qué nota le pones?</p>
      ${glasses(b, true)}
      <div class="dacts"><button type="button" class="btn ghost" data-act="skip">No la he probado</button>${wishBtn(b)}</div>
    </article>`;
  }
  renderProgress(q.length);
}
function renderProgress(left) {
  const n = Object.keys(S.scores).length, lv = levelOf(n), next = LEVELS[lv + 1];
  $("progress").innerHTML = `<h3>${n} de ${BEERS.length} puntuadas</h3>
    <div class="lvl"><div class="bar"><i style="width:${Math.max(1, Math.round(n / BEERS.length * 100))}%"></i></div></div>
    <p class="sub">Nivel ${LEVELS[lv][1]}${next ? `. Con ${next[0] - n} más llegas a ${next[1]}.` : "."}</p>
    <p class="sub">${left} por revisar en esta selección${n < MIN ? `. Te faltan ${MIN - n} para activar tus recomendaciones.` : "."}</p>`;
}
function deckNext(dir) {
  const c = document.querySelector("#deck .dcard");
  if (c && !REDUCED) { c.classList.add(dir); setTimeout(() => renderDeck(true), 300); } else renderDeck(true);
}

/* ——— paladar ——— */
function renderPalate() {
  const u = taste(), n = Object.keys(S.scores).length, mx = Math.max(...u.map(Math.abs)) || 1;
  const N = DIMS.length, IDX = DIMS.map((_, i) => i), cx = 180, cy = 160, R = 100, pt = (i, k) => { const a = (-90 + 360 / N * i) * Math.PI / 180; return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k]; };
  const poly = k => IDX.map(i => pt(i, typeof k === "function" ? k(i) : k).map(v => v.toFixed(1)).join(",")).join(" ");
  const vals = i => n ? Math.max(.08, Math.min(1, .5 + .5 * u[i] / mx)) : .5;
  $("radarbox").innerHTML = `<h3>Mapa de sabores</h3>
    <svg class="radar" viewBox="0 0 360 320" role="img" aria-label="Gráfico de tu preferencia por ${DIMS.join(", ")}">
      ${[.25, .5, .75, 1].map(k => `<polygon points="${poly(k)}" fill="none" stroke="var(--line)" stroke-width="${k === .5 ? 1.6 : 1}"/>`).join("")}
      ${IDX.map(i => { const p = pt(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="var(--line)"/>`; }).join("")}
      <polygon points="${poly(vals)}" fill="var(--amber)" fill-opacity="${n ? .35 : .12}" stroke="var(--amber)" stroke-width="2.5" ${n ? "" : 'stroke-dasharray="5 5"'}/>
      ${n ? IDX.map(i => { const p = pt(i, vals(i)); return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="var(--amber)" stroke="var(--surface)" stroke-width="1.5"/>`; }).join("") : ""}
      ${DIMS.map((d, i) => { const p = pt(i, 1.2); return `<text x="${p[0].toFixed(1)}" y="${(p[1] + 4).toFixed(1)}" text-anchor="${Math.abs(p[0] - cx) < 10 ? "middle" : p[0] > cx ? "start" : "end"}">${d}</text>`; }).join("")}
    </svg>
    <p class="note">La línea del medio es neutro. Hacia afuera, lo que buscas; hacia adentro, lo que evitas.</p>`;
  let h = "";
  if (!n) h = `<p>Aún no hay notas. Empieza por la <a href="#cata">cata rápida</a> y verás cómo se dibuja tu mapa.</p>`;
  else {
    const ord = u.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    const up = ord.filter(x => x[0] > 0).slice(0, 2).map(x => DIMS[x[1]].toLowerCase()), dn = ord.filter(x => x[0] < 0).slice(-2).map(x => DIMS[x[1]].toLowerCase());
    const fs = famStats(), favs = Object.keys(fs).map(k => [k, fs[k][0] / fs[k][1], fs[k][1]]).sort((a, b) => b[1] - a[1] || b[2] - a[2]).slice(0, 3);
    h = `<p>${up.length ? `Buscas <b>${up.join(" y ")}</b>` : "Todavía no marcas una preferencia clara"}${dn.length ? `${up.length ? "; " : ". "}evitas <b>${dn.join(" y ")}</b>` : ""}.</p>
      <p class="sub">Tus familias mejor puntuadas: ${favs.map(f => `${sw(f[0])} ${esc(FAM[f[0]][0])} (${num(f[1])})`).join(" · ")}</p>`;
  }
  $("palatetext").innerHTML = h;
  const c = badgeCtx();
  $("badges").innerHTML = BADGES.map(b => { const on = b[4](c); return `<div class="badge${on ? " on" : ""}"><span class="cap" aria-hidden="true">${b[1]}</span><div><b>${b[2]}</b><span>${on ? "Conseguida" : b[3]}</span></div></div>`; }).join("");
}

/* ——— recomendaciones y ranking ——— */
function renderRecs() {
  const el = $("recs"), n = Object.keys(S.scores).length;
  if (!S.profile) { el.innerHTML = `<div class="empty"><span>${S.mode === "supa" && !S.user ? "Entra a tu cuenta" : "Crea tu perfil"} y puntúa ${MIN} cervezas para recibir recomendaciones.</span><a class="btn" href="#account">${S.mode === "supa" && !S.user ? "Entrar" : "Crear perfil"}</a></div>`; return; }
  if (n < MIN) { el.innerHTML = `<div class="empty"><span>Llevas ${n} de ${MIN} notas. Puntúa ${MIN - n} más para ver tus recomendaciones.</span><a class="btn" href="#cata">Ir a la cata rápida</a></div>`; return; }
  const recs = recommend(), agg = community();
  if (!recs.length) { el.innerHTML = `<div class="empty">Tus notas todavía no marcan una preferencia clara. Puntúa algunas cervezas que te gusten mucho o muy poco.</div>`; return; }
  el.innerHTML = `<div class="grid">${recs.map(r => `<article class="beer rec" data-beer="${r.b.id}">
      <div class="tags">${sw(r.b.fam)}<span class="tag style">${esc(r.b.style)}</span>${tagsHTML(r.b)}</div>
      <h3>${esc(r.b.full)}</h3>
      <p class="meta">${esc(r.b.maker)} · ${esc(origin(r.b))}</p>
      <p class="meta">${r.near ? `Se parece a ${esc(r.near.full)}, que puntuaste con ${S.scores[r.near.id]}.` : "Calza con el perfil de tus mejores notas."}</p>
      ${wishBtn(r.b)}
      <div class="rate"><div><div class="mine"></div>${glasses(r.b)}</div><span class="match">${Math.round(Math.min(1, r.score) * 100)}% afín</span></div>
    </article>`).join("")}</div>`;
}
function renderRank() {
  const agg = community(), top = BEERS.filter(b => agg[b.id]).sort((a, b) => agg[b.id].t / agg[b.id].c - agg[a.id].t / agg[a.id].c || agg[b.id].c - agg[a.id].c).slice(0, 6);
  $("rank").innerHTML = top.length ? top.map(b => `<li><div><b>${esc(b.full)}</b><div class="note">${esc(b.style)}</div></div><span>${num(agg[b.id].t / agg[b.id].c)} · ${agg[b.id].c} ${agg[b.id].c === 1 ? "voto" : "votos"}</span></li>`).join("") : `<li style="display:block" class="note">Aún no hay votos. Sé la primera persona en puntuar.</li>`;
}

/* ——— catálogo ——— */
function filtered() {
  const q = S.q.trim().toLowerCase(), agg = community();
  let rows = BEERS.filter(b =>
    (S.seg === "all" || (S.seg === "na" ? b.na : S.seg === "rated" ? !!S.scores[b.id] : S.seg === "wish" ? S.wish.includes(b.id) : b.seg === S.seg)) &&
    (S.fam === "all" || b.fam === S.fam) && (S.pais === "all" || b.country === S.pais) &&
    (!q || (b.full + " " + b.maker + " " + b.style).toLowerCase().includes(q)));
  const av = b => agg[b.id] ? agg[b.id].t / agg[b.id].c : 0, nm = (a, b) => a.full.localeCompare(b.full, "es");
  if (S.sort === "avg") rows.sort((a, b) => av(b) - av(a) || nm(a, b));
  else if (S.sort === "mine") rows.sort((a, b) => (S.scores[b.id] || 0) - (S.scores[a.id] || 0) || nm(a, b));
  else if (S.sort === "abv") rows.sort((a, b) => (b.abv || 0) - (a.abv || 0) || nm(a, b));
  else rows.sort(nm);
  return { rows, agg };
}
function renderList() {
  const { rows, agg } = filtered();
  $("segchips").innerHTML = SEGS.map(s => `<button type="button" class="chip" data-act="seg" data-s="${s[0]}" aria-pressed="${S.seg === s[0]}">${s[1]}</button>`).join("");
  $("count").textContent = `${rows.length} de ${BEERS.length} cervezas`;
  $("list").innerHTML = rows.length ? rows.slice(0, S.shown).map(b => card(b, agg)).join("") : `<div class="empty" style="grid-column:1/-1">Ninguna cerveza coincide con estos filtros.</div>`;
  const left = rows.length - S.shown; $("more").hidden = left <= 0; if (left > 0) $("more").textContent = `Mostrar más (${left} restantes)`;
}
function renderGuide() {
  $("guide").innerHTML = Object.keys(FAM).map(k => {
    const bs = BEERS.filter(b => b.fam === k); if (!bs.length) return "";
    const st = {}; bs.forEach(b => st[b.style] = (st[b.style] || 0) + 1);
    return `<article class="fam"><h3>${sw(k)}${esc(FAM[k][0])}</h3><p>${esc(FAM[k][2])}</p>
      <div class="tags">${Object.keys(st).sort().map(s => `<span class="tag">${esc(s)} · ${st[s]}</span>`).join("")}</div>
      <p><button type="button" class="btn ghost" data-act="fam" data-f="${k}">Ver las ${bs.length} en el catálogo</button></p></article>`;
  }).join("");
}
function renderAll() { renderAccount(); renderDeck(); renderPalate(); renderRecs(); renderRank(); renderList(); }

/* ——— guardado: una escritura a la vez por documento ——— */
let writing = false, dirty = false;
async function pushScores() {
  saveLocal(); if (!S.cloud) return;
  if (writing) { dirty = true; return; }
  writing = true;
  try { do { dirty = false; await S.db.doc("ratings/" + S.uid).set({ country: "CL", scores: Object.assign({}, S.scores), wish: S.wish.slice() }); } while (dirty); }
  catch (e) { S.cloud = false; renderAccount(); }
  finally { writing = false; }
}
async function pushProfile() {
  saveLocal();
  if (S.mode === "supa") { if (!S.user) return; const r = await sb.from("profiles").upsert({ id: S.user.id, name: S.profile.name, country: "CL", region: S.profile.region || null, adult: true }); if (r.error) syncFail(); return; }
  if (!S.cloud) return; try { await S.db.doc("data/users/" + S.uid + "/profile").set(Object.assign({}, S.profile)); } catch (e) { S.cloud = false; renderAccount(); } }

function persist(kind, id) { saveLocal(); if (S.cloud) pushScores(); else if (S.mode === "supa" && S.user) supaWrite(kind, id); }
function afterChange(id) { paint(id); renderAccount(); renderPalate(); renderRecs(); renderRank(); renderProgress(deckQueue().length); syncBadges(false); persist("rating", id); }
function rate(id, v) {
  if (!S.profile) { needProfile(); return false; }
  const hadWish = S.wish.includes(id);
  if (S.scores[id] === v) delete S.scores[id]; else { S.scores[id] = v; S.wish = S.wish.filter(x => x !== id); }
  afterChange(id);
  if (hadWish && !S.wish.includes(id) && S.mode === "supa" && S.user) supaWrite("wish", id);
  return true;
}
function toggleWish(id) {
  if (!S.profile) { needProfile(); return false; }
  const on = S.wish.includes(id); S.wish = on ? S.wish.filter(x => x !== id) : S.wish.concat(id);
  paint(id); renderAccount(); renderPalate(); syncBadges(false); persist("wish", id);
  if (S.seg === "wish") renderList();
  return !on;
}

/* ——— eventos ——— */
document.addEventListener("submit", e => {
  e.preventDefault();
  if (e.target.id === "reg") {
    const name = $("name").value.trim(), region = $("region").value;
    if (!name) { S.error = "Escribe un nombre o apodo."; renderAccount(); $("name").focus(); return; }
    if ($("country").value !== "CL") { S.error = "Por ahora solo puedes registrarte en Chile."; renderAccount(); return; }
    if (!$("adult").checked) { S.error = "Debes confirmar que tienes 18 años o más."; renderAccount(); $("adult").focus(); return; }
    const isNew = !S.profile;
    S.profile = { name: name.slice(0, 30), country: "CL", region, adult: true, since: (S.profile && S.profile.since) || new Date().toISOString().slice(0, 10) };
    S.error = ""; S.editing = false; renderAccount(); renderRecs(); pushProfile();
    if (isNew) toast("Perfil creado", "Parte por la cata rápida y ponle nota a lo que ya conoces.");
  } else if (e.target.id === "auth") {
    if (S.busy || !sb) return;
    const how = (e.submitter && e.submitter.dataset.how) || "in", email = $("au-email").value.trim().toLowerCase(), pass = $("au-pass").value;
    S.authEmail = email; S.authMsg = "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { S.error = "Escribe un correo válido."; renderAccount(); $("au-email").focus(); return; }
    if (pass.length < 8) { S.error = "La contraseña debe tener al menos 8 caracteres."; renderAccount(); $("au-pass").focus(); return; }
    doAuth(how, email, pass);
  } else if (e.target.id === "forgot") {
    if (S.busy || !sb) return;
    const email = $("fg-email").value.trim().toLowerCase(); S.authEmail = email; S.authMsg = "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { S.error = "Escribe un correo válido."; renderAccount(); $("fg-email").focus(); return; }
    S.busy = true; S.error = ""; renderAccount();
    sb.auth.resetPasswordForEmail(email, { redirectTo: SITE }).then(r => {
      S.busy = false;
      if (r.error) S.error = authErr(r.error);
      else S.authMsg = "Si hay una cuenta con ese correo, te llegará un enlace en unos minutos. Revisa también la carpeta de spam.";
      renderAccount();
    }, () => { S.busy = false; S.error = "No pudimos enviar el correo. Inténtalo de nuevo."; renderAccount(); });
  } else if (e.target.id === "newpass") {
    if (S.busy || !sb) return;
    const pass = $("np-pass").value;
    if (pass.length < 8) { S.error = "La contraseña debe tener al menos 8 caracteres."; renderAccount(); $("np-pass").focus(); return; }
    S.busy = true; S.error = ""; renderAccount();
    sb.auth.updateUser({ password: pass }).then(r => {
      S.busy = false;
      if (r.error) { S.error = authErr(r.error); renderAccount(); return; }
      S.recovery = false; S.error = ""; renderAccount(); toast("Contraseña actualizada", "Desde ahora entra con tu nueva contraseña.");
    }, () => { S.busy = false; S.error = "No pudimos guardar la contraseña. Inténtalo de nuevo."; renderAccount(); });
  } else if (e.target.id === "suggest") {
    const n = $("sg-name").value.trim(), msg = $("sg-msg");
    if (!n) { msg.textContent = "Escribe el nombre de la cerveza."; $("sg-name").focus(); return; }
    if (S.mode === "supa") {
      if (!S.user) { msg.textContent = "Entra a tu cuenta para enviar sugerencias."; return; }
      const row = { user_id: S.user.id, name: n.slice(0, 60), brewery: $("sg-brew").value.trim().slice(0, 60) || null, style: $("sg-style").value.trim().slice(0, 40) || null };
      e.target.reset(); msg.textContent = "Enviando…";
      sb.from("suggestions").insert(row).then(r => { msg.textContent = r.error ? "No pudimos enviarla. Inténtalo de nuevo." : "Recibida. La revisaremos antes de sumarla."; });
      return;
    }
    S.sug = S.sug.concat({ n: n.slice(0, 60), b: $("sg-brew").value.trim().slice(0, 60), s: $("sg-style").value.trim().slice(0, 40), t: new Date().toISOString().slice(0, 10) }).slice(-20);
    saveLocal(); e.target.reset();
    if (S.cloud) S.db.doc("suggestions/" + S.uid).set({ items: S.sug }).then(() => { msg.textContent = "Recibida. La revisaremos antes de sumarla."; }, () => { msg.textContent = "No pudimos enviarla. Quedó guardada en este navegador."; });
    else msg.textContent = "Guardada en este navegador. Se enviará cuando Maltea tenga servidor propio.";
  }
});
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act]"); if (!t) return;
  const act = t.dataset.act, inDeck = !!t.closest("#deck");
  if (act === "rate") { if (rate(t.dataset.b, +t.dataset.v) && inDeck) deckNext("out-r"); }
  else if (act === "wish") { const added = toggleWish(t.dataset.b); if (inDeck && added) { toast("Guardada en tu lista", BY[t.dataset.b].full); S.skipped.add(t.dataset.b); deckNext("out-l"); } }
  else if (act === "skip") { const c = t.closest(".dcard"); S.skipped.add(c.dataset.beer); deckNext("out-l"); }
  else if (act === "unskip") { S.skipped.clear(); renderDeck(true); }
  else if (act === "deckseg") { S.deckSeg = t.dataset.s; renderDeck(true); }
  else if (act === "seg") { S.seg = t.dataset.s; S.shown = PAGE; renderList(); }
  else if (act === "fam") { S.fam = t.dataset.f; S.seg = "all"; S.q = ""; S.pais = "all"; S.shown = PAGE; $("fam").value = S.fam; $("q").value = ""; $("pais").value = "all"; renderList(); $("catalogo").scrollIntoView(); }
  else if (act === "edit") { S.editing = true; S.confirmDel = false; renderAccount(); $("name").focus(); }
  else if (act === "google") { if (sb) sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: SITE } }); }
  else if (act === "forgot") { S.forgot = true; S.error = ""; S.authMsg = ""; renderAccount(); const f = $("fg-email"); if (f) f.focus(); }
  else if (act === "forgotno") { S.forgot = false; S.error = ""; S.authMsg = ""; renderAccount(); }
  else if (act === "recno") { S.recovery = false; S.error = ""; renderAccount(); }
  else if (act === "signout") { signOut(); }
  else if (act === "delacct") { S.confirmDel = true; renderAccount(); }
  else if (act === "delno") { S.confirmDel = false; renderAccount(); }
  else if (act === "delyes") { deleteAccount(); }
  else if (act === "export") { exportData(t); }
});
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  const c = document.querySelector("#deck .dcard"); if (!c) return;
  const r = c.getBoundingClientRect(); if (r.bottom < 80 || r.top > innerHeight - 80) return;
  const k = e.key.toLowerCase();
  if (k >= "1" && k <= "5") { if (rate(c.dataset.beer, +k)) deckNext("out-r"); }
  else if (k === "s") { S.skipped.add(c.dataset.beer); deckNext("out-l"); }
  else if (k === "q") { if (toggleWish(c.dataset.beer)) { toast("Guardada en tu lista", BY[c.dataset.beer].full); S.skipped.add(c.dataset.beer); deckNext("out-l"); } }
});
$("q").addEventListener("input", e => { S.q = e.target.value; S.shown = PAGE; renderList(); });
$("fam").addEventListener("change", e => { S.fam = e.target.value; S.shown = PAGE; renderList(); });
$("pais").addEventListener("change", e => { S.pais = e.target.value; S.shown = PAGE; renderList(); });
$("sort").addEventListener("change", e => { S.sort = e.target.value; S.shown = PAGE; renderList(); });
$("more").addEventListener("click", () => { S.shown += PAGE; renderList(); });

/* ——— efectos ——— */
function burst() {
  if (REDUCED) return;
  const cv = $("fx"), ctx = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
  const cols = ["#e0930f", "#fff6dc", "#1d5438", "#f0a92b"], ps = [];
  for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI - Math.PI, v = 4 + Math.random() * 7; ps.push({ x: cv.width / 2, y: cv.height * .62, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, r: 3 + Math.random() * 4, c: cols[i % 4], l: 60 + Math.random() * 30 }); }
  (function step() {
    ctx.clearRect(0, 0, cv.width, cv.height); let alive = false;
    ps.forEach(p => { if (p.l <= 0) return; alive = true; p.x += p.vx; p.y += p.vy; p.vy += .25; p.l--; ctx.globalAlpha = Math.min(1, p.l / 30); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1; if (alive) requestAnimationFrame(step); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}
function bubbles() {
  if (REDUCED) return;
  const cv = $("bubbles"), ctx = cv.getContext("2d"); let w = 0, h = 0, on = true, raf = 0;
  const bs = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 7, v: .0008 + Math.random() * .0022, s: Math.random() * 6 }));
  const size = () => { const r = cv.getBoundingClientRect(); w = cv.width = Math.round(r.width); h = cv.height = Math.round(r.height); };
  function step(t) {
    ctx.clearRect(0, 0, w, h); ctx.strokeStyle = "rgba(255,246,220,.55)"; ctx.lineWidth = 1.2;
    bs.forEach(b => { b.y -= b.v; if (b.y < -.05) { b.y = 1.05; b.x = Math.random(); } const x = b.x * w + Math.sin(t / 900 + b.s) * 6; ctx.beginPath(); ctx.arc(x, b.y * h, b.r, 0, 7); ctx.stroke(); });
    if (on && !document.hidden) raf = requestAnimationFrame(step); else raf = 0;
  }
  size(); addEventListener("resize", size);
  const kick = () => { if (!raf && on && !document.hidden) raf = requestAnimationFrame(step); };
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { on = es[0].isIntersecting; kick(); }).observe(cv);
  document.addEventListener("visibilitychange", kick); kick();
}

/* ——— datos compartidos (solo dentro de Claude) ——— */
async function connect() {
  if (!(window.claude && window.claude.use)) return;
  const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
  if (!db || !user) return;
  const uid = await user.id(); if (!uid) return;
  S.db = db; S.uid = uid; S.cloud = true;
  try {
    const snap = await db.doc("data/users/" + uid + "/profile").get(), d = snap.exists && snap.data();
    if (d && typeof d.name === "string") S.profile = { name: d.name.slice(0, 30), country: "CL", region: REGIONS.includes(d.region) ? d.region : "", adult: true, since: d.since || "" };
    else if (S.profile) pushProfile();
    const sg = await db.doc("suggestions/" + uid).get(), sd = sg.exists && sg.data();
    if (sd && Array.isArray(sd.items)) S.sug = sd.items.slice(-20);
  } catch (e) {}
  renderAccount(); renderRecs();
  let first = true;
  const timer = setTimeout(() => { S.stale = true; renderAccount(); }, 10000);
  db.collection("ratings").onSnapshot(snap => {
    if (!snap.metadata.fromCache) { clearTimeout(timer); if (S.stale) { S.stale = false; renderAccount(); } }
    const all = {}; let mine = null;
    snap.docs.forEach(d => { const x = d.data() || {}; if (d.id === uid) mine = x; else all[d.id] = clean(x.scores); });
    S.all = all;
    if (mine && (first || (!writing && !dirty))) {
      const sc = clean(mine.scores), wi = cleanWish(mine.wish);
      if (!same(sc, S.scores) || wi.join() !== S.wish.join()) { S.scores = sc; S.wish = wi; saveLocal(); renderAll(); syncBadges(true); } else refreshAvg();
    } else { if (first && !mine && (Object.keys(S.scores).length || S.wish.length)) pushScores(); refreshAvg(); }
    first = false;
  }, () => { clearTimeout(timer); S.stale = true; renderAccount(); });
}

/* ——— cuentas propias con Supabase (fuera de Claude) ——— */
let sb = null; const chains = {};
function syncFail() { if (!S.syncErr) { S.syncErr = true; toast("No pudimos guardar", "Revisa tu conexión. Tus cambios siguen en este navegador."); renderAccount(); } }
function supaWrite(kind, id) {
  const key = kind + ":" + id, uid = S.user.id;
  chains[key] = (chains[key] || Promise.resolve()).then(async () => {
    if (!S.user || S.user.id !== uid) return;
    let q;
    if (kind === "rating") {
      const v = S.scores[id];
      q = v ? sb.from("ratings").upsert({ user_id: uid, beer_id: id, score: v, country: "CL", updated_at: new Date().toISOString() }, { onConflict: "user_id,beer_id" })
            : sb.from("ratings").delete().eq("user_id", uid).eq("beer_id", id);
    } else {
      q = S.wish.includes(id) ? sb.from("wishlist").upsert({ user_id: uid, beer_id: id }, { onConflict: "user_id,beer_id" })
                              : sb.from("wishlist").delete().eq("user_id", uid).eq("beer_id", id);
    }
    const r = await q;
    if (r.error) syncFail(); else if (S.syncErr) { S.syncErr = false; renderAccount(); }
  }).catch(syncFail);
}
async function loadStats() {
  const r = await sb.rpc("beer_stats"); if (r.error || !Array.isArray(r.data)) return;
  const base = {};
  r.data.forEach(x => { if (!BY[x.beer_id]) return; let t = +x.total, c = +x.votes; const m = S.fetched[x.beer_id]; if (m) { t -= m; c -= 1; } if (c > 0 && t > 0) base[x.beer_id] = { t, c }; });
  S.statsBase = base; S.statsAt = Date.now();
}
function authErr(e) {
  const c = e.code || "", m = e.message || "";
  if (c === "invalid_credentials" || /invalid login/i.test(m)) return "Correo o contraseña incorrectos.";
  if (c === "user_already_exists" || /already registered/i.test(m)) return "Ese correo ya tiene cuenta. Usa «Entrar».";
  if (c === "weak_password") return "Elige una contraseña más difícil de adivinar.";
  if (c === "same_password") return "La nueva contraseña debe ser distinta de la anterior.";
  if (c === "email_not_confirmed") return "Falta confirmar tu correo. Revisa tu bandeja de entrada.";
  if (c === "over_email_send_rate_limit" || e.status === 429) return "Hay muchas solicitudes en este momento. Inténtalo en unos minutos.";
  if (c === "signup_disabled") return "El registro de cuentas nuevas está cerrado por ahora.";
  return "No pudimos completar la operación. " + m;
}
async function doAuth(how, email, pass) {
  S.busy = true; S.error = ""; renderAccount();
  let res; try { res = how === "up" ? await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: SITE } }) : await sb.auth.signInWithPassword({ email, password: pass }); } catch (e) { res = { error: e }; }
  S.busy = false;
  if (res.error) { S.error = authErr(res.error); renderAccount(); const f = $("au-pass"); if (f) f.focus(); return; }
  if (how === "up" && !(res.data && res.data.session)) { S.authMsg = "Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego entra aquí."; renderAccount(); return; }
  handleSession(res.data.session);
}
function handleSession(session) {
  const u = session && session.user;
  if (u) { if (!S.user || S.user.id !== u.id) signedIn(u); return; }
  if (S.user) { signedOut(); return; }
  if (!S.authReady) {
    S.authReady = true;
    if (S.owner) { S.scores = {}; S.wish = []; S.sug = []; S.owner = null; try { localStorage.removeItem(LS); } catch (e) {} } /* datos de una sesión que ya no está */
    renderAll(); syncBadges(true); loadStats().then(refreshAvg);
  }
}
async function signedIn(u) {
  const uid = u.id, anon = !S.owner, mine = anon || S.owner === uid;
  const localScores = mine ? S.scores : {}, localWish = mine ? S.wish : [], localProfile = anon ? S.localProfile : null;
  S.user = { id: uid, email: u.email || "" }; S.forgot = false; S.authReady = true; S.loading = true; S.loadErr = false; S.error = ""; S.authMsg = ""; S.busy = false; S.profile = null;
  renderAccount();
  let p, r, w;
  try {
    [p, r, w] = await Promise.all([
      sb.from("profiles").select("name,region,created_at").eq("id", uid).maybeSingle(),
      sb.from("ratings").select("beer_id,score").eq("user_id", uid),
      sb.from("wishlist").select("beer_id").eq("user_id", uid)]);
  } catch (e) { p = { error: e }; r = {}; w = {}; }
  if (!S.user || S.user.id !== uid) return;
  S.loading = false;
  if (p.error || r.error || w.error) { S.loadErr = true; renderAccount(); return; }
  const cs = {}; (r.data || []).forEach(x => { cs[x.beer_id] = x.score; });
  const cloud = clean(cs), cw = cleanWish((w.data || []).map(x => x.beer_id));
  S.fetched = Object.assign({}, cloud);
  const upS = Object.keys(localScores).filter(id => !cloud[id]);
  S.scores = Object.assign({}, localScores, cloud);
  const upW = localWish.filter(id => !cw.includes(id) && !S.scores[id]);
  S.wish = cleanWish(cw.concat(upW)).filter(id => !S.scores[id]);
  if (p.data) S.profile = { name: String(p.data.name || "").slice(0, 30), country: "CL", region: REGIONS.includes(p.data.region) ? p.data.region : "", adult: true, since: String(p.data.created_at || "").slice(0, 10) };
  else if (localProfile) { S.profile = localProfile; pushProfile(); }
  S.owner = uid; S.localProfile = null; saveLocal();
  renderAll(); syncBadges(true);
  if (upS.length) {
    const up = await sb.from("ratings").upsert(upS.map(id => ({ user_id: uid, beer_id: id, score: S.scores[id], country: "CL" })), { onConflict: "user_id,beer_id" });
    if (up.error) syncFail(); else toast("Notas guardadas en tu cuenta", `Subimos ${upS.length} que tenías en este navegador.`);
  }
  if (upW.length) { const up = await sb.from("wishlist").upsert(upW.map(id => ({ user_id: uid, beer_id: id })), { onConflict: "user_id,beer_id" }); if (up.error) syncFail(); }
  await loadStats(); refreshAvg();
}
function signedOut() {
  S.recovery = false; S.forgot = false; S.user = null; S.profile = null; S.scores = {}; S.wish = []; S.sug = []; S.fetched = {}; S.owner = null; S.localProfile = null;
  S.editing = false; S.confirmDel = false; S.loading = false; S.loadErr = false; S.syncErr = false; S.error = ""; S.skipped.clear();
  try { localStorage.removeItem(LS); } catch (e) {}
  renderAll(); syncBadges(true); loadStats().then(refreshAvg);
}
async function signOut() { try { await sb.auth.signOut(); } catch (e) {} if (S.user) signedOut(); }
async function deleteAccount() {
  const r = await sb.rpc("delete_my_account");
  if (r.error) { S.confirmDel = false; renderAccount(); toast("No pudimos borrar la cuenta", "Inténtalo de nuevo en unos minutos."); return; }
  try { await sb.auth.signOut({ scope: "local" }); } catch (e) {}
  if (S.user) signedOut();
  toast("Cuenta borrada", "Eliminamos tu perfil, tus notas y tu lista.");
}
async function exportData(btn) {
  if (!S.user || !sb) return;
  btn.disabled = true;
  const sg = await sb.from("suggestions").select("name,brewery,style,created_at").eq("user_id", S.user.id);
  btn.disabled = false;
  if (sg.error) { toast("No pudimos preparar tus datos", "Inténtalo de nuevo en unos minutos."); return; }
  const data = {
    generado: new Date().toISOString(), responsable: "Maltea SA", contacto: "malteasa.cerveza@gmail.com",
    cuenta: { correo: S.user.email },
    perfil: S.profile ? { nombre: S.profile.name, pais: S.profile.country, region: S.profile.region || null, mayor_de_edad: true, desde: S.profile.since || null } : null,
    notas: Object.keys(S.scores).sort().map(id => ({ cerveza: BY[id].full, id, nota: S.scores[id] })),
    lista: S.wish.map(id => ({ cerveza: BY[id].full, id })),
    sugerencias: (sg.data || []).map(x => ({ cerveza: x.name, cerveceria: x.brewery, estilo: x.style, fecha: x.created_at }))
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "maltea-mis-datos.json"; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function supaDown() { /* sin conexión con Supabase: seguir en modo local */
  if (S.authReady) return;
  S.mode = "local"; S.authReady = true; S.profile = S.localProfile; S.localProfile = null; renderAll(); syncBadges(true);
}
function connectSupa() {
  const sc = document.createElement("script"); sc.src = SUPA_SRC; sc.onerror = supaDown;
  sc.onload = () => {
    try { sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey); } catch (e) { supaDown(); return; }
    /* nunca esperar llamadas a Supabase dentro de este aviso: se difiere con setTimeout */
    sb.auth.onAuthStateChange((ev, session) => { if (ev === "PASSWORD_RECOVERY") S.recovery = true; setTimeout(() => { if (S.mode === "supa") { handleSession(session); if (ev === "PASSWORD_RECOVERY") renderAccount(); } }, 0); });
    /* muestra «Entrar con Google» solo si está activado en Supabase */
    fetch(CFG.supabaseUrl.replace(/\/$/, "") + "/auth/v1/settings", { headers: { apikey: CFG.supabaseKey } }).then(r => r.json()).then(d => {
      if (d && d.external && d.external.google) { S.google = true; if (!S.user) renderAccount(); }
    }).catch(() => {});
    sb.auth.getSession().then(r => { if (S.mode === "supa") handleSession(r.data && r.data.session); }, supaDown);
  };
  document.head.append(sc);
  setTimeout(supaDown, 10000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden || S.mode !== "supa" || !sb || Date.now() - S.statsAt < 60000) return;
    if (S.user) S.fetched = Object.assign({}, S.scores);
    loadStats().then(refreshAvg);
  });
}

/* ——— arranque ——— */
const famKeys = Object.keys(FAM).filter(k => BEERS.some(b => b.fam === k));
$("fam").innerHTML = `<option value="all">Todas las familias</option>` + famKeys.map(k => `<option value="${k}">${esc(FAM[k][0])}</option>`).join("");
$("pais").innerHTML = `<option value="all">Todos los países</option>` + [...new Set(BEERS.map(b => b.country))].sort((a, b) => a === "Chile" ? -1 : b === "Chile" ? 1 : a.localeCompare(b, "es")).map(c => `<option>${esc(c)}</option>`).join("");
$("countries").innerHTML = COUNTRIES.map(c => `<li class="${c[2] ? "live" : ""}">${c[1]}${c[2] ? " · disponible" : " · próximamente"}</li>`).join("");
$("nums").innerHTML = [[BEERS.length, "cervezas"], [Object.keys(D.brands).length, "marcas"], [new Set(BEERS.map(b => b.style)).size, "estilos"], [new Set(BEERS.map(b => b.country)).size, "países de origen"]].map(x => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join("");
loadLocal();
if (SUPA) { S.localProfile = S.owner ? null : S.profile; S.profile = null; $("privacy").hidden = false; }
renderAll(); renderGuide(); syncBadges(true); bubbles();
if (SUPA) connectSupa(); else connect();
})();
