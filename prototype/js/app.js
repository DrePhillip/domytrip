/* DoMyTrip — estado, navegação e geração do roteiro.
   Todo o estado da app vive em `state`. Ver CLAUDE.md §4. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Ícones: traço por defeito, preenchimento só para os que estão em FILLED. */
function icon(name, size = 20, sw = 1.8) {
  const d = ICONS[name] || ICONS.pin;
  return FILLED.has(name)
    ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`
    : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}
const logo = size => `<svg class="logo-mark" width="${size}" height="${size}" aria-hidden="true"><use href="#dmt-mark"/></svg>`;

const NOW = 9 * 60 + 41;
const DAY_START = 10 * 60;

const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hhmm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const closeMin = p => { const c = toMin(p.fecha); return c < 300 ? c + 1440 : c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const walkMin = (a, b) => Math.max(3, Math.round(dist(a, b) / 9.5));
const eur = n => (n === 0 ? 'Grátis' : `${n.toFixed(2).replace('.', ',')} €`);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dur = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);

function openState(p) {
  const c = closeMin(p);
  if (NOW >= c) return { cls: 'state-shut', txt: 'Fechado' };
  if (c - NOW <= 60) return { cls: 'state-soon', txt: `Fecha às ${p.fecha}` };
  return { cls: 'state-open', txt: `Aberto até às ${p.fecha}` };
}

/* ---------- Estado ---------- */
const state = {
  screen: 'splash',
  onbStep: 0,
  city: 'roma',
  interests: new Set(),
  pace: 'equilibrado',
  budget: 'medio',
  social: true,
  tab: 'explorar',
  pane: 'explorar',
  selected: null,
  plan: [],
  visited: [],
  activeIdx: -1,
  snap: 'peek',
  sheetY: 0,
  joined: new Set(),
};

const SNAPS = { peek: 0.28, half: 0.64, full: 0.93 };

/* ================= Navegação de ecrãs ================= */
function go(screen) {
  state.screen = screen;
  $$('.screen').forEach(s => s.classList.toggle('is-active', s.dataset.screen === screen));
  const darkTop = ['splash', 'building', 'receipt'].includes(screen);
  $('#statusbar').classList.toggle('on-dark', darkTop);
  $('#homebar').classList.toggle('on-dark', screen === 'splash' || screen === 'building');
}

/* ================= Onboarding ================= */
function renderOnboarding() {
  $('#onbBack').innerHTML = icon('back', 22);

  $('#chipsInterests').innerHTML = INTERESTS.map(i => `
    <button class="chip ${state.interests.has(i.id) ? 'on' : ''}" data-interest="${i.id}">
      <span class="cat">${icon(i.id, 17, 1.9)}</span><span class="tick">${icon('check', 17, 2.4)}</span>${i.label}
    </button>`).join('');

  const optionRow = (on, key, val, ico, label, desc, icoHtml) => `
    <button class="option ${on ? 'on' : ''}" data-${key}="${val}">
      <span class="opt-ico">${icoHtml || icon(ico, 22)}</span>
      <span class="opt-txt"><span class="t-body" style="font-weight:650">${label}</span><small>${desc}</small></span>
      <span class="radio"></span>
    </button>`;

  $('#optsCity').innerHTML = CITIES.map(c =>
    optionRow(state.city === c.id, 'city', c.id, c.ico, c.nome, c.sub)).join('');

  $('#optsPace').innerHTML = PACES.map(p =>
    optionRow(state.pace === p.id, 'pace', p.id, p.icon, p.label, p.desc)).join('');

  $('#optsBudget').innerHTML = BUDGETS.map((b, i) =>
    optionRow(state.budget === b.id, 'budget', b.id, null, b.label, b.desc,
      `<span style="font-weight:700;font-size:14px;letter-spacing:-.04em">${'€'.repeat(i + 1)}</span>`)).join('');

  $('#optsSocial').innerHTML = [
    { id: 'sim', label: 'Sim, mostra-me hangouts', desc: 'Grupos pequenos, sempre em sítio público', ico: 'group' },
    { id: 'nao', label: 'Não, prefiro sozinho', desc: 'Nunca te mostramos grupos nem pedidos', ico: 'person' },
  ].map(o => optionRow((state.social ? 'sim' : 'nao') === o.id, 'social', o.id, o.ico, o.label, o.desc)).join('');

  syncOnbStep();
}

const ONB_LAST = 4;

function syncOnbStep() {
  $$('.onb-step').forEach(s => s.classList.toggle('is-active', +s.dataset.step === state.onbStep));
  $$('#onbProgress i').forEach((i, n) => i.classList.toggle('on', n <= state.onbStep));
  $$('.step-count').forEach((s, n) => s.textContent = `Passo ${n + 1} de ${ONB_LAST + 1}`);
  $('#onbBack').style.visibility = state.onbStep === 0 ? 'hidden' : 'visible';

  const btn = $('#onbNext');
  const short = 3 - state.interests.size;
  const blocked = state.onbStep === 1 && short > 0;   // só o passo dos interesses tem mínimo
  btn.disabled = blocked;
  btn.textContent = blocked ? `Escolhe mais ${short}`
    : (state.onbStep === ONB_LAST ? 'Vamos a isto' : 'Continuar');
}

/* ================= Geração do roteiro (ADR-006) ================= */
function scorePoi(p, budget) {
  let s = 0;
  if (state.interests.has(p.cat)) s += 3;          // correspondência de interesses
  s -= p.walk / 12;                                 // custo de deslocação
  if (NOW < closeMin(p)) s += 2;                    // aberto agora
  s += (p.rating - 4.3) * 1.5;
  if (state.pace === 'relaxado' && p.dur > 120) s -= 1;
  if (state.pace === 'intenso' && p.dur > 150) s -= 1;
  if (p.preco > budget.max) s -= 4;
  return s;
}

function generateItinerary() {
  const pace = PACES.find(x => x.id === state.pace);
  const budget = BUDGETS.find(b => b.id === state.budget);
  const ranked = POIS.map(p => ({ p, s: scorePoi(p, budget) })).sort((a, b) => b.s - a.s);

  const chosen = [];
  const perCat = {};
  for (const { p } of ranked) {
    if (chosen.length >= pace.stops) break;
    if (p.preco > budget.max) continue;
    if ((perCat[p.cat] || 0) >= 2) continue;
    chosen.push(p);
    perCat[p.cat] = (perCat[p.cat] || 0) + 1;
  }

  /* Ordem geográfica: vizinho mais próximo a partir de onde estamos. */
  const ordered = [];
  const pool = [...chosen];
  let cur = USER_XY;
  while (pool.length) {
    pool.sort((a, b) => dist(cur, a.xy) - dist(cur, b.xy));
    const next = pool.shift();
    ordered.push(next);
    cur = next.xy;
  }

  let t = DAY_START, from = USER_XY;
  return ordered.map((p, i) => {
    const w = i === 0 ? p.walk : walkMin(from, p.xy);
    t += w;
    const start = t;
    t += p.dur;
    const end = t;
    t += 8;
    from = p.xy;
    return { poi: p, walk: w, start, end };
  });
}

function planTotals() {
  let km = 0, cost = 0, from = USER_XY;
  for (const s of state.plan) { km += dist(from, s.poi.xy) * 0.0084; cost += s.poi.preco; from = s.poi.xy; }
  return {
    km: km.toFixed(1).replace('.', ','),
    cost, stops: state.plan.length,
    start: state.plan.length ? hhmm(state.plan[0].start) : '—',
    end: state.plan.length ? hhmm(state.plan[state.plan.length - 1].end) : '—',
  };
}

function rebuildPlan() { state.plan = generateItinerary(); state.activeIdx = -1; state.visited = []; }
function planPoints() { return [USER_XY, ...state.plan.map(s => s.poi.xy)]; }

/* ================= Mapa ================= */
const nearbyPois = () => [...POIS].sort((a, b) => a.walk - b.walk);

function pinItems() {
  const planIds = state.plan.map(s => s.poi.id);
  const near = nearbyPois()
    .filter(p => state.interests.size === 0 || state.interests.has(p.cat))
    .slice(0, 8).map(p => p.id);
  /* O selecionado entra sempre: pode ter vindo de uma lista e não passar no filtro. */
  const ids = [...new Set([...planIds, ...near])].slice(0, 9);
  if (state.selected && !ids.includes(state.selected)) ids.push(state.selected);
  return ids.map(id => {
    const poi = POIS.find(p => p.id === id);
    const idx = planIds.indexOf(id);
    const st = state.visited.includes(id) ? 'visited'
      : id === state.selected ? 'sel'
      : idx >= 0 ? 'planned' : '';
    return { poi, num: idx >= 0 ? idx + 1 : null, state: st };
  });
}

function refreshMap() { MapView.renderPins(pinItems(), selectPoi); }

function selectPoi(id) {
  state.selected = id;
  state.pane = 'place';
  const p = POIS.find(q => q.id === id);

  /* Numa paragem do roteiro o que interessa é a perna anterior,
     não a distância a partir de onde o dia começou. */
  const idx = state.plan.findIndex(s => s.poi.id === id);
  const from = idx > 0 ? state.plan[idx - 1].poi.xy : USER_XY;
  const mins = idx > 0 ? state.plan[idx].walk : p.walk;
  const desde = idx > 0 ? `desde a paragem ${idx}` : 'de onde estás';

  refreshMap();
  MapView.setRoute(from, p.xy, 'walk');
  MapView.frame(from, p.xy, 300);
  showPill(`${icon('walk', 15)} ${mins} min a pé ${desde}`);
  setSnap('half');
  renderSheet();
  renderMapTop();
}

function closePlace() {
  state.selected = null;
  state.pane = state.tab;
  MapView.clearRoute();
  refreshMap();
  MapView.home();
  hidePill();
  setSnap('peek');
  renderSheet();
  renderMapTop();
}

function showPill(html) { const el = $('#mapPill'); el.innerHTML = html; el.hidden = false; }
function hidePill() { $('#mapPill').hidden = true; }

function renderMapTop() {
  const host = $('#mapTopLeft');
  if (state.pane === 'place') {
    host.innerHTML = `<button class="map-btn" id="backToMap" aria-label="Voltar">${icon('back', 22)}</button>`;
    $('#backToMap').onclick = closePlace;
  } else host.innerHTML = '';
}

/* ================= Bottom sheet ================= */
const sheet = () => $('#sheet');
const phone = () => $('#phone');
const snapY = k => Math.max(0, sheet().offsetHeight - phone().clientHeight * SNAPS[k]);

function positionFloats(y) {
  /* Os flutuantes acompanham a folha mas param à altura de `half`:
     acima disso iam colidir com o avatar no canto superior. */
  const cap = phone().clientHeight * SNAPS.half;
  const visible = Math.min(sheet().offsetHeight - y, cap);
  const atFull = state.snap === 'full';
  const tools = $('#mapTools');
  tools.style.bottom = `${visible + 14}px`;
  tools.style.opacity = atFull ? '0' : '1';
  tools.style.pointerEvents = atFull ? 'none' : 'auto';
  $('#mapPill').style.opacity = atFull ? '0' : '1';
}

function setSnap(k, instant = false) {
  state.snap = k;
  const y = snapY(k);
  state.sheetY = y;
  const s = sheet();
  s.classList.toggle('snapping', !instant);
  s.style.transform = `translateY(${y}px)`;
  s.classList.toggle('is-full', k === 'full');
  updateScrollability();
  positionFloats(y);
}

/* Rola em 'full' sempre, e em 'half' só nos painéis compridos (detalhe e viagem).
   Em 'peek' nunca: o peek é um cartaz, não uma lista. */
function canScroll() {
  return state.snap === 'full'
    || (state.snap === 'half' && (state.pane === 'place' || state.pane === 'active'));
}
function updateScrollability() { sheet().classList.toggle('can-scroll', canScroll()); }

function nextSnap(dir) {
  const order = ['peek', 'half', 'full'];
  const n = clamp(order.indexOf(state.snap) + dir, 0, 2);
  if (order[n] !== state.snap) setSnap(order[n]);
}

function initSheetGestures() {
  const s = sheet();
  let drag = null;

  s.addEventListener('pointerdown', e => {
    const body = $('#sheetBody');
    const onHandle = !!e.target.closest('#sheetHandle');
    if (!onHandle && canScroll() && body.scrollTop > 0) return;
    if (!onHandle && e.target.closest('button, input, a')) return;
    drag = { y: e.clientY, start: state.sheetY, moved: false, t: performance.now() };
    s.classList.remove('snapping');
  });

  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) < 5) return;
    drag.moved = true;
    /* Resistência elástica para lá do último encaixe. */
    let y = drag.start + dy;
    const max = snapY('peek');
    if (y > max) y = max + (y - max) * 0.32;
    if (y < 0) y = y * 0.32;
    state.sheetY = y;
    s.style.transform = `translateY(${y}px)`;
    positionFloats(y);
  });

  window.addEventListener('pointerup', e => {
    if (!drag) return;
    const { moved, start, t } = drag;
    const vy = (e.clientY - drag.y) / Math.max(1, performance.now() - t);  // px/ms
    drag = null;
    s.classList.add('snapping');
    if (!moved) return;
    const order = ['full', 'half', 'peek'];
    /* Um gesto rápido salta um encaixe, mesmo que o dedo tenha andado pouco. */
    let k;
    if (Math.abs(vy) > 0.55) {
      const i = order.indexOf(state.snap === 'full' ? 'full' : state.snap);
      k = order[clamp(order.indexOf(nearestSnap(start)) + (vy > 0 ? 1 : -1), 0, 2)];
    } else k = nearestSnap(state.sheetY);
    setSnap(k);
  });

  function nearestSnap(y) {
    return ['full', 'half', 'peek'].map(k => ({ k, d: Math.abs(snapY(k) - y) })).sort((a, b) => a.d - b.d)[0].k;
  }

  /* Rato: a roda faz o mesmo que o arrasto — é assim que se testa no desktop. */
  let lock = 0;
  s.addEventListener('wheel', e => {
    const body = $('#sheetBody');
    const rolavel = canScroll() && body.scrollHeight > body.clientHeight;
    if (rolavel && !(e.deltaY < 0 && body.scrollTop <= 0)) return;
    e.preventDefault();
    const t = Date.now();
    if (t - lock < 340) return;
    lock = t;
    nextSnap(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  $('#sheetHandle').addEventListener('click', () => nextSnap(state.snap === 'full' ? -2 : 1));
}

/* ================= Separadores ================= */
const TABS = [
  { id: 'explorar', label: 'Explorar', ico: 'pin' },
  { id: 'roteiro', label: 'Roteiro', ico: 'route' },
  { id: 'hangouts', label: 'Hangouts', ico: 'group' },
  { id: 'perfil', label: 'Perfil', ico: 'person' },
];

function renderTabbar() {
  $('#tabbar').innerHTML = TABS.map(t => `
    <button class="tab ${state.tab === t.id && state.pane !== 'active' ? 'on' : ''}" data-tab="${t.id}">
      ${icon(t.ico, 23, state.tab === t.id && state.pane !== 'active' ? 2.1 : 1.7)}<span>${t.label}</span>
    </button>`).join('');
}

function setTab(id) {
  state.tab = id;
  state.pane = id;
  state.selected = null;
  MapView.clearRoute();
  refreshMap();
  hidePill();
  if (id === 'roteiro' && state.plan.length) {
    MapView.setMultiRoute(planPoints());
    MapView.frameAll(planPoints(), 300);
    setSnap('full');
  } else if (id === 'explorar') {
    MapView.home();
    setSnap('peek');
  } else setSnap('full');
  renderTabbar();
  renderSheet();
  renderMapTop();
}

/* ================= Blocos reutilizáveis ================= */
function placeRow(p) {
  const st = openState(p);
  return `<button class="place" data-poi="${p.id}">
    <span class="thumb">${icon(p.cat, 22)}</span>
    <span class="place-main">
      <span class="nm">${p.nome}</span>
      <span class="t-meta" style="display:block">${CAT_LABEL[p.cat]}<span class="dot-sep"></span><span class="${st.cls}">${st.txt}</span></span>
    </span>
    <span class="place-aside">
      <span class="big num">${p.walk} min</span>
      <span class="t-meta" style="display:block">a pé</span>
    </span>
  </button>`;
}

function stepsMarkup(plan, { removable = false, activeIdx = -1 } = {}) {
  return plan.map((s, i) => {
    const done = i < activeIdx;
    const isNow = i === activeIdx;
    const move = i < plan.length - 1
      ? `<div class="step"><div class="step-rail"><span class="wire"></span></div>
         <div class="move">${icon('walk', 16)} ${plan[i + 1].walk} min a pé</div></div>`
      : '';
    return `<div class="step ${done ? 'done' : ''}">
      <div class="step-rail">
        <span class="knob ${done ? 'ghosted' : isNow ? 'now' : ''}">${done ? icon('check', 13, 3) : i + 1}</span>
        ${i < plan.length - 1 ? '<span class="wire"></span>' : ''}
      </div>
      <div class="step-main">
        <div class="step-time">${hhmm(s.start)} – ${hhmm(s.end)}${isNow ? ' · <b>agora</b>' : ''}</div>
        <div class="step-card">
          <span class="thumb ${isNow ? 'brand' : ''}">${icon(s.poi.cat, 22)}</span>
          <span class="place-main">
            <span class="nm">${s.poi.nome}</span>
            <span class="t-meta" style="display:block">${CAT_LABEL[s.poi.cat]}<span class="dot-sep"></span>${eur(s.poi.preco)}</span>
          </span>
          ${removable ? `<button class="step-x" data-remove="${i}" aria-label="Remover">${icon('close', 17, 2.2)}</button>` : ''}
        </div>
      </div>
    </div>${move}`;
  }).join('');
}

function hangoutCard(h) {
  const joined = state.joined.has(h.id);
  return `<div class="hangout ${joined ? 'joined' : ''}">
    <div class="hangout-top">
      <div>
        <div class="t-body" style="font-weight:650">${h.titulo}</div>
        <div class="t-meta" style="margin-top:3px">${h.local}<span class="dot-sep"></span>${h.hora}</div>
      </div>
      <span class="thumb ${joined ? 'brand' : ''}" style="width:42px;height:42px">${icon(h.tag, 21)}</span>
    </div>
    <div class="hangout-foot">
      <div style="display:flex;align-items:center;gap:var(--s2)">
        <span class="faces">${h.iniciais.map(i => `<span class="face">${i}</span>`).join('')}<span class="face more">+${h.pessoas - h.iniciais.length}</span></span>
        <span class="t-meta">${h.pessoas} de ${h.max}</span>
      </div>
      <button class="btn-pill ${joined ? 'is-done' : ''}" data-join="${h.id}">${joined ? 'Inscrito' : 'Juntar-me'}</button>
    </div>
  </div>`;
}

/* ================= Painéis da folha ================= */
function renderSheet() {
  const body = $('#sheetBody');
  const map = {
    explorar: renderExplore, roteiro: renderPlanPane, hangouts: renderHangouts,
    perfil: renderProfile, place: renderPlace, active: renderActive,
  };
  body.innerHTML = (map[state.pane] || renderExplore)();
  body.scrollTop = 0;
  updateScrollability();
  wireSheet();
}

function renderExplore() {
  const t = planTotals();
  const planned = state.plan.map(s => s.poi.id);
  const near = nearbyPois().filter(p => !planned.includes(p.id)).slice(0, 5);
  return `
  <div class="stagger">
    <div class="sheet-section">
      <div class="greet">
        <h2>Bom dia, ${USER.nome}</h2>
        <span class="t-meta">${USER.cidade} · ${USER.bairro}</span>
      </div>
      <button class="search" style="margin-top:var(--s3)" data-act="search">${icon('search', 20)} Onde queres ir?</button>
    </div>

    <div class="sheet-section" style="padding:0;margin-top:var(--s4)">
      <div class="filters">
        ${['Perto de mim', 'Aberto agora', 'Museus', 'Grátis', 'Interior'].map((f, i) =>
          `<span class="chip ${i === 0 ? 'on' : ''}">${i === 0 ? icon('check', 15, 2.4) : ''}${f}</span>`).join('')}
      </div>
    </div>

    <div class="sheet-section" style="margin-top:var(--s5)">
      <div class="day-card">
        <div>
          <div class="t-micro">O teu dia</div>
          <div class="t-heading" style="margin-top:5px;font-size:18px">Roteiro montado para hoje</div>
        </div>
        <div class="day-stats">
          <div><b class="num">${t.stops}</b><span>paragens</span></div>
          <div><b class="num">${t.km} km</b><span>a pé</span></div>
          <div><b class="num">${t.end}</b><span>termina</span></div>
        </div>
        <button class="btn" data-act="openPlan">Ver roteiro</button>
      </div>
    </div>

    <div class="sheet-section">
      <div class="section-head">
        <h3 class="t-heading">Sugerido para hoje</h3>
        <button class="link" data-act="rebuild">Refazer</button>
      </div>
      <div class="steps">${stepsMarkup(state.plan)}</div>
    </div>

    <div class="sheet-section">
      <div class="section-head"><h3 class="t-heading">Perto de ti agora</h3></div>
      <div class="divided">${near.map(placeRow).join('')}</div>
    </div>

    ${state.social ? `
    <div class="sheet-section">
      <div class="section-head">
        <h3 class="t-heading">Hangouts perto de ti</h3>
        <button class="link" data-act="openHangouts">Ver todos</button>
      </div>
      ${HANGOUTS.slice(0, 2).map(hangoutCard).join('')}
    </div>` : ''}

    <div class="sheet-section" style="margin-top:var(--s6)">
      <p class="t-meta dimmer" style="text-align:center">Arrasta para baixo para voltar ao mapa</p>
    </div>
  </div>`;
}

function renderPlace() {
  const p = POIS.find(q => q.id === state.selected);
  if (!p) return renderExplore();

  const st = openState(p);
  const idx = state.plan.findIndex(s => s.poi.id === p.id);
  const step = idx >= 0 ? state.plan[idx] : null;
  const antes = idx > 0 ? state.plan[idx - 1] : null;
  const hang = HANGOUTS.find(h => h.local === p.nome);

  const why = [];
  if (state.interests.has(p.cat)) why.push(`Escolheste ${CAT_LABEL[p.cat].toLowerCase()} no teu perfil`);
  why.push(`Está a ${p.walk} minutos de onde estás agora`);
  why.push(st.txt);
  if (p.preco <= BUDGETS.find(b => b.id === state.budget).max) why.push(`Entra no teu orçamento (${eur(p.preco)})`);

  const linha = (ico, nome, val) => `<div class="place">
    <span class="thumb">${icon(ico, 21)}</span>
    <span class="place-main"><span class="nm">${nome}</span><span class="t-meta" style="display:block">${val}</span></span>
  </div>`;

  return `
  <div class="stagger">
    <div class="sheet-section">
      <div class="detail-head">
        <span class="thumb accent" style="width:52px;height:52px">${icon(p.cat, 25)}</span>
        <div style="flex:1;min-width:0">
          <h2 class="t-title">${p.nome}</h2>
          <p class="t-meta" style="margin-top:4px">${CAT_LABEL[p.cat]}<span class="dot-sep"></span><span class="${st.cls}">${st.txt}</span></p>
        </div>
        <span class="rating">${icon('star', 15)}<span class="num">${p.rating}</span></span>
      </div>
      <p class="t-body dim" style="margin-top:var(--s3)">${p.sub}</p>
    </div>

    ${step ? `
    <div class="sheet-section" style="margin-top:var(--s4)">
      <div class="plan-strip">
        <span class="knob">${idx + 1}</span>
        <div style="flex:1;min-width:0">
          <div class="t-body" style="font-weight:650">Paragem ${idx + 1} de ${state.plan.length}</div>
          <div class="t-meta num">${hhmm(step.start)} – ${hhmm(step.end)}${antes ? ` · ${step.walk} min a pé desde ${antes.poi.nome}` : ''}</div>
        </div>
      </div>
    </div>` : ''}

    <div class="sheet-section" style="margin-top:var(--s4)">
      <div class="facts">
        <div><b class="num">${p.walk} min</b><span>a pé</span></div>
        <div><b class="num">${dur(p.dur)}</b><span>visita</span></div>
        <div><b class="num">${eur(p.preco)}</b><span>entrada</span></div>
      </div>
    </div>

    <div class="sheet-section" style="margin-top:var(--s5)">
      <div class="t-micro" style="margin-bottom:var(--s3)">O que não podes perder</div>
      <ul class="bullets">${p.destaques.map(x => `<li><span class="bul"></span><span>${x}</span></li>`).join('')}</ul>
    </div>

    <div class="sheet-section" style="margin-top:var(--s5)">
      <div class="tip">${icon('spark', 17)}<p>${p.dica}</p></div>
    </div>

    <div class="sheet-section" style="margin-top:var(--s5)">
      <div class="t-micro" style="margin-bottom:var(--s2)">Prático</div>
      <div class="divided">
        ${linha('clock', 'Horário', `${p.abre} – ${p.fecha}`)}
        ${linha('pin', 'Morada', p.morada)}
        ${linha('walk', 'Como chegar', antes ? `${step.walk} min a pé desde ${antes.poi.nome}` : `${p.walk} min a pé desde ${USER.bairro}`)}
      </div>
    </div>

    <div class="sheet-section" style="margin-top:var(--s5)">
      <div class="t-micro" style="margin-bottom:var(--s2)">Porque te sugerimos isto</div>
      <ul class="why">${why.map(w => `<li>${icon('check', 15, 2.4)}<span>${w}</span></li>`).join('')}</ul>
    </div>

    <div class="sheet-section" style="margin-top:var(--s5)">
      ${step
        ? `<button class="btn" data-act="openPlan">Ver no roteiro</button>
           <button class="btn ghost" data-act="removePoi" style="margin-top:var(--s2)">Remover do roteiro</button>`
        : `<button class="btn" data-act="addToPlan">${icon('plus', 19, 2.2)} Adicionar ao roteiro</button>`}
    </div>

    ${hang && state.social ? `
    <div class="sheet-section">
      <div class="section-head"><h3 class="t-heading">Alguém vai lá estar</h3></div>
      ${hangoutCard(hang)}
    </div>` : ''}

    <div class="sheet-section">
      <div class="section-head"><h3 class="t-heading">Também aqui perto</h3></div>
      <div class="divided">${nearbyPois().filter(q => q.id !== p.id).slice(0, 3).map(placeRow).join('')}</div>
    </div>
  </div>`;
}

function renderPlanPane() {
  const t = planTotals();
  if (!state.plan.length) {
    return `<div class="sheet-section"><h2 class="t-title">Sem roteiro</h2>
      <p class="t-body dim" style="margin:var(--s3) 0 var(--s5)">Removeste tudo. Podemos montar outro em segundos.</p>
      <button class="btn" data-act="rebuild">Montar um dia</button></div>`;
  }
  return `
  <div class="stagger">
    <div class="sheet-section">
      <h2 class="t-title">O teu dia em ${USER.cidade}</h2>
      <p class="t-meta" style="margin-top:3px">Das ${t.start} às ${t.end}</p>
    </div>
    <div class="sheet-section" style="margin-top:var(--s4)">
      <div class="facts">
        <div><b class="num">${t.stops}</b><span>paragens</span></div>
        <div><b class="num">${t.km} km</b><span>a pé</span></div>
        <div><b class="num">${eur(t.cost)}</b><span>estimado</span></div>
      </div>
    </div>
    <div class="sheet-section" style="margin-top:var(--s6)">
      <div class="steps">${stepsMarkup(state.plan, { removable: true })}</div>
    </div>
    <div class="sheet-section">
      <button class="btn accent" data-act="start">Começar roteiro</button>
      <button class="btn ghost" data-act="rebuild" style="margin-top:var(--s2)">Refazer o dia</button>
    </div>
  </div>`;
}

function renderHangouts() {
  if (!state.social) {
    return `<div class="sheet-section"><h2 class="t-title">Hangouts desligados</h2>
      <p class="t-body dim" style="margin:var(--s3) 0 var(--s5)">Escolheste explorar sozinho. Podes ligar quando quiseres.</p>
      <button class="btn" data-act="enableSocial">Ligar hangouts</button></div>`;
  }
  return `
  <div class="stagger">
    <div class="sheet-section">
      <h2 class="t-title">Hangouts perto de ti</h2>
      <p class="t-meta" style="margin-top:3px">Grupos pequenos, sempre em sítio público</p>
    </div>
    <div class="sheet-section" style="margin-top:var(--s5)">${HANGOUTS.map(hangoutCard).join('')}</div>
    <div class="sheet-section"><button class="btn ghost" data-act="newHangout">${icon('plus', 19, 2.2)} Criar hangout</button></div>
  </div>`;
}

function renderProfile() {
  const pace = PACES.find(p => p.id === state.pace);
  const budget = BUDGETS.find(b => b.id === state.budget);
  const row = (ico, nm, sub, val) => `<div class="place">
    <span class="thumb">${icon(ico, 22)}</span>
    <span class="place-main"><span class="nm">${nm}</span><span class="t-meta" style="display:block">${sub}</span></span>
    <span class="place-aside"><span class="big">${val}</span></span></div>`;
  return `
  <div class="stagger">
    <div class="sheet-section" style="text-align:center">
      <div class="avatar-btn" style="width:76px;height:76px;font-size:28px;margin:0 auto">${USER.iniciais}</div>
      <h2 class="t-title" style="margin-top:var(--s3)">${USER.nome}</h2>
      <p class="t-meta">Em ${USER.cidade} · ${USER.chegada.toLowerCase()}</p>
    </div>

    <div class="sheet-section" style="margin-top:var(--s6)">
      <div class="section-head"><h3 class="t-heading">Os teus gostos</h3><span class="t-meta">toca para mudar</span></div>
      <div class="chips">
        ${INTERESTS.map(i => `<button class="chip ${state.interests.has(i.id) ? 'on' : ''}" data-interest="${i.id}">
          <span class="cat">${icon(i.id, 17, 1.9)}</span><span class="tick">${icon('check', 17, 2.4)}</span>${i.label}</button>`).join('')}
      </div>
    </div>

    <div class="sheet-section">
      <div class="section-head"><h3 class="t-heading">Preferências</h3></div>
      <div class="divided">
        ${row('pace', 'Ritmo', pace.desc, pace.label)}
        ${row('euro', 'Orçamento', budget.desc, budget.label)}
        ${row('group', 'Hangouts', 'Grupos perto de ti', state.social ? 'Ligados' : 'Desligados')}
      </div>
    </div>

    <div class="sheet-section">
      <div class="section-head"><h3 class="t-heading">Histórico</h3></div>
      <button class="place" data-act="receipt"><span class="thumb">${icon('receipt', 22)}</span>
        <span class="place-main"><span class="nm">Roma · hoje</span><span class="t-meta" style="display:block">${planTotals().stops} paragens</span></span>
        <span class="place-aside">${icon('chevron', 20)}</span></button>
    </div>
  </div>`;
}

function renderActive() {
  const i = state.activeIdx;
  const s = state.plan[i];
  if (!s) return renderPlanPane();
  const p = s.poi;
  const last = i === state.plan.length - 1;
  return `
  <div class="stagger">
    <div class="sheet-section">
      <div class="greet">
        <h2>${p.nome}</h2>
        <span class="t-meta num">${s.walk} min a pé</span>
      </div>
      <p class="t-meta" style="margin-top:2px">Paragem ${i + 1} de ${state.plan.length}<span class="dot-sep"></span>chegada às ${hhmm(s.start)}</p>
      <button class="btn accent" style="margin-top:var(--s3)" data-act="arrive">${last ? 'Terminar o dia' : 'Cheguei, seguir'}</button>
    </div>
    <div class="sheet-section" style="margin-top:var(--s4)">
      <div class="facts">
        <div><b class="num">${dur(p.dur)}</b><span>visita</span></div>
        <div><b class="num">${eur(p.preco)}</b><span>entrada</span></div>
        <div><b class="num">${state.plan.length - i - 1}</b><span>a seguir</span></div>
      </div>
      <button class="btn ghost" data-act="skip" style="margin-top:var(--s3)">Saltar esta paragem</button>
    </div>
    <div class="sheet-section" style="margin-top:var(--s6)">
      <div class="section-head"><h3 class="t-heading">Resto do dia</h3></div>
      <div class="steps">${stepsMarkup(state.plan, { activeIdx: i })}</div>
    </div>
  </div>`;
}

/* ================= Viagem ativa ================= */
function startTrip() {
  state.pane = 'active';
  state.activeIdx = 0;
  state.visited = [];
  updateActiveMap();
  setSnap('peek');          // a andar na rua, o que interessa é o mapa
  renderSheet();
  renderTabbar();
  renderNavBar();
}

function updateActiveMap() {
  const from = state.activeIdx === 0 ? USER_XY : state.plan[state.activeIdx - 1].poi.xy;
  const pts = [from, ...state.plan.slice(state.activeIdx).map(s => s.poi.xy)];
  state.selected = state.plan[state.activeIdx]?.poi.id || null;
  refreshMap();
  MapView.setMultiRoute(pts);
  if (pts.length > 1) MapView.frame(pts[0], pts[1], 290);
}

function renderNavBar() {
  const bar = $('#navBar');
  const s = state.plan[state.activeIdx];
  if (state.pane !== 'active' || !s) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.innerHTML = `
    <span class="nb-ico">${icon('walk', 21)}</span>
    <div class="nb-main"><small>A caminho de</small>
      <div class="t-body" style="font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.poi.nome}</div>
    </div>
    <div class="nb-eta"><small>Chegada</small><div class="t-body num" style="font-weight:650">${hhmm(s.start)}</div></div>`;
}

function arrive() {
  const s = state.plan[state.activeIdx];
  if (s) state.visited.push(s.poi.id);
  if (state.activeIdx >= state.plan.length - 1) return finishDay();
  state.activeIdx++;
  updateActiveMap();
  renderSheet();
  renderNavBar();
}

function skipStop() {
  if (state.activeIdx >= state.plan.length - 1) return finishDay();
  state.activeIdx++;
  updateActiveMap();
  renderSheet();
  renderNavBar();
}

function finishDay() { $('#navBar').hidden = true; renderReceipt(); go('receipt'); }

/* ================= Recibo ================= */
function renderReceipt() {
  const t = planTotals();
  const entradas = state.plan.reduce((a, s) => a + s.poi.preco, 0);
  const transporte = 4.5;

  $('#receiptScroll').innerHTML = `
  <div class="receipt-head">
    <div class="logo-lockup" style="font-size:19px">${logo(24)}<span>DoMyTrip <span style="font-weight:500;opacity:.65">Recibo</span></span></div>
    <button class="icon-btn" data-act="closeReceipt" style="color:#fff">${icon('close', 22, 2.2)}</button>
  </div>

  <div class="receipt-card stagger" style="margin-top:calc(var(--s4) * -1.5)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--s3)">
      <h2 class="t-title">${USER.nome}, obrigado<br>por hoje</h2>
      <span class="t-meta num">22.09.2026</span>
    </div>
    <p class="t-meta" style="margin-top:var(--s2)">O teu dia em ${USER.cidade}, das ${t.start} às ${t.end}.</p>
    <div class="total-row" style="margin-top:var(--s6)">
      <span class="t-title">Total</span><span class="amt num">${eur(entradas + transporte)}</span>
    </div>
    <div style="margin-top:var(--s3)">
      <div class="line-row"><span class="t-body dim">Entradas · ${t.stops} paragens</span><span class="t-body num">${eur(entradas)}</span></div>
      <div class="line-row"><span class="t-body dim">Transportes</span><span class="t-body num">${eur(transporte)}</span></div>
    </div>
  </div>

  <div class="tear" style="margin-top:var(--s4)"></div>

  <div class="receipt-card" style="margin-top:0">
    <div class="t-micro">Percurso</div>
    <p class="t-meta" style="margin:var(--s2) 0 var(--s4)">${t.stops} paragens · ${t.km} km a pé</p>
    <div class="mini-map" id="receiptMap"></div>
    <div class="steps" style="margin-top:var(--s5)">${stepsMarkup(state.plan)}</div>
  </div>

  ${state.joined.size ? `
  <div class="receipt-card">
    <div class="t-micro" style="margin-bottom:var(--s3)">Estiveste com</div>
    <div style="display:flex;align-items:center;gap:var(--s3)">
      <span class="faces"><span class="face">M</span><span class="face">L</span><span class="face">S</span></span>
      <span class="t-body">${state.joined.size} hangout${state.joined.size > 1 ? 's' : ''} hoje</span>
    </div>
  </div>` : ''}

  <div style="padding:var(--s4) var(--s4) 0"><button class="btn" data-act="closeReceipt">Voltar ao mapa</button></div>`;

  renderMiniMap($('#receiptMap'), planPoints());
  $$('[data-act="closeReceipt"]').forEach(b => b.onclick = () => {
    rebuildPlan();
    state.pane = 'explorar'; state.tab = 'explorar'; state.selected = null;
    refreshMap(); MapView.clearRoute(); MapView.home();
    setSnap('peek'); renderSheet(); renderTabbar(); renderNavBar();
    go('home');
  });
}

/* ================= Ligações de eventos na folha ================= */
function wireSheet() {
  const body = $('#sheetBody');

  $$('[data-poi]', body).forEach(b => b.onclick = () => selectPoi(b.dataset.poi));

  $$('[data-interest]', body).forEach(b => b.onclick = () => {
    const id = b.dataset.interest;
    state.interests.has(id) ? state.interests.delete(id) : state.interests.add(id);
    if (!state.interests.size) state.interests.add(id);
    rebuildPlan(); refreshMap(); renderSheet();
  });

  $$('[data-join]', body).forEach(b => b.onclick = e => {
    e.stopPropagation();
    const id = b.dataset.join;
    state.joined.has(id) ? state.joined.delete(id) : state.joined.add(id);
    renderSheet();
  });

  $$('[data-remove]', body).forEach(b => b.onclick = e => {
    e.stopPropagation();
    state.plan.splice(+b.dataset.remove, 1);
    refreshMap(); renderSheet();
    if (state.plan.length) MapView.setMultiRoute(planPoints(), { draw: false }); else MapView.clearRoute();
  });

  const acts = {
    search: () => setSnap('full'),
    openPlan: () => setTab('roteiro'),
    openHangouts: () => setTab('hangouts'),
    rebuild: () => {
      rebuildPlan(); refreshMap(); renderSheet();
      if (state.pane === 'roteiro') { MapView.setMultiRoute(planPoints()); MapView.frameAll(planPoints(), 300); }
    },
    start: startTrip,
    arrive, skip: skipStop,
    receipt: () => { renderReceipt(); go('receipt'); },
    enableSocial: () => { state.social = true; renderSheet(); },
    newHangout: () => {},
    removePoi: () => {
      const k = state.plan.findIndex(s => s.poi.id === state.selected);
      if (k >= 0) state.plan.splice(k, 1);
      closePlace();
    },
    addToPlan: () => {
      const p = POIS.find(q => q.id === state.selected);
      const from = state.plan[state.plan.length - 1] || null;
      const w = from ? walkMin(from.poi.xy, p.xy) : p.walk;
      const start = (from ? from.end + 8 : DAY_START) + w;
      state.plan.push({ poi: p, walk: w, start, end: start + p.dur });
      setTab('roteiro');
    },
  };
  $$('[data-act]', body).forEach(b => {
    const fn = acts[b.dataset.act];
    if (fn) b.onclick = e => { e.stopPropagation(); fn(); };
  });
}

/* ================= Arranque ================= */
function initHome() {
  MapView.init($('#map'));
  refreshMap();
  MapView.moveTo(USER_XY[0], USER_XY[1], { scale: 1, sy: 844 * 0.3, instant: true });
  $('#recenterBtn').innerHTML = icon('crosshair', 22);
  $('#recenterBtn').onclick = () => MapView.home();
  $('#zoomIn').onclick = () => MapView.zoomBy(1.6);
  $('#zoomOut').onclick = () => MapView.zoomBy(1 / 1.6);
  $('#zoomIn').innerHTML = icon('plus', 22, 2.2);
  $('#zoomOut').innerHTML = icon('minus', 22, 2.2);
  $('#avatarBtn').onclick = () => setTab('perfil');
  MapView.enableGestures();
  $('#map').addEventListener('click', () => {
    if (MapView.panned) return;                      // foi um arrasto, não um toque
    if (state.pane === 'place') closePlace();
  });
  $('#tabbar').addEventListener('click', e => {
    const t = e.target.closest('[data-tab]');
    if (t) setTab(t.dataset.tab);
  });
  renderTabbar();
  renderSheet();
  setSnap('peek', true);
  initSheetGestures();
}

const BUILD_STEPS = [
  'A ver o que está aberto perto de ti',
  'A cruzar com os teus gostos',
  'A ordenar pelo caminho mais curto',
  'Pronto — o teu dia está montado',
];

function runBuildingSequence() {
  go('building');
  $('#buildSteps').innerHTML = BUILD_STEPS.map(s =>
    `<div class="build-line"><span class="dot">${icon('check', 12, 3)}</span><span>${s}</span></div>`).join('');
  const lines = $$('#buildSteps .build-line');
  let i = 0;
  const tick = () => {
    lines.forEach((l, n) => l.classList.toggle('on', n <= i));
    if (i === lines.length - 1) $('#buildTitle').textContent = 'O teu dia em Roma está pronto';
    i++;
    if (i < lines.length) setTimeout(tick, 560);
    else setTimeout(() => {
      initHome();
      go('home');
      const t = planTotals();
      showPill(`${icon('spark', 15)} ${t.stops} paragens · ${t.km} km a pé`);
      setTimeout(hidePill, 4200);
    }, 700);
  };
  tick();
}

function init() {
  const leave = () => { if (state.screen === 'splash') go('login'); };
  $('#splashScreen').onclick = leave;

  /* O splash só começa a contar depois da porta: senão o visitante
     passa a porta e já está no login sem ter visto nada. */
  const arrancar = () => setTimeout(leave, 1900);
  if (window.__gateOpen) arrancar();
  else window.addEventListener('dmt:unlock', arrancar, { once: true });

  $('#loginGo').onclick = () => { renderOnboarding(); go('onboarding'); };
  $$('[data-login]').forEach(b => b.onclick = () => { renderOnboarding(); go('onboarding'); });

  $('#onbBack').onclick = () => { state.onbStep = Math.max(0, state.onbStep - 1); syncOnbStep(); };
  $('#onbSkip').onclick = () => {
    ['museus', 'historia', 'comida'].forEach(i => state.interests.add(i));
    rebuildPlan(); runBuildingSequence();
  };
  $('#onbNext').onclick = () => {
    if (state.onbStep < ONB_LAST) { state.onbStep++; syncOnbStep(); $('.onb-body').scrollTop = 0; }
    else { rebuildPlan(); runBuildingSequence(); }
  };

  document.addEventListener('click', e => {
    const c = e.target.closest('#chipsInterests [data-interest]');
    if (c) {
      const id = c.dataset.interest;
      state.interests.has(id) ? state.interests.delete(id) : state.interests.add(id);
      c.classList.toggle('on');
      syncOnbStep();
    }
    for (const key of ['city', 'pace', 'budget', 'social']) {
      const el = e.target.closest(`[data-${key}]`);
      if (!el) continue;
      const v = el.dataset[key];
      if (key === 'social') state.social = v === 'sim'; else state[key] = v;
      $$(`[data-${key}]`).forEach(x => x.classList.toggle('on', x === el));
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
