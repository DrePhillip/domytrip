/* DoMyTrip — mapa SVG plano, desenhado por código. Ver DESIGN.md §4 e ADR-004/016.
   Mundo: 1200 × 1200 unidades, visto de cima. Sem projeção e sem relevo:
   o mapa é fundo; quem carrega informação são o boneco, os pins e a rota.  */

const NS = 'http://www.w3.org/2000/svg';
const WORLD = 1200;
const VIEW_W = 390;
const VIEW_H = 844;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function el(tag, attrs = {}, styles = {}) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  for (const k in styles) n.style.setProperty(k, styles[k]);
  return n;
}

function roundedPolyline(pts, r) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
    const d1 = Math.hypot(cx - px, cy - py) || 1, d2 = Math.hypot(nx - cx, ny - cy) || 1;
    const r1 = Math.min(r, d1 / 2), r2 = Math.min(r, d2 / 2);
    const a = [cx + (px - cx) / d1 * r1, cy + (py - cy) / d1 * r1];
    const b = [cx + (nx - cx) / d2 * r2, cy + (ny - cy) / d2 * r2];
    d += ` L${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${cx} ${cy} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  return d + ` L${last[0]} ${last[1]}`;
}

/* Rota em L: não é cálculo de percurso, é o desenho que lê como tal. */
function routeThrough(a, b) {
  const mx = a[0] + (b[0] - a[0]) * 0.55;
  return [a, [mx, a[1]], [mx, b[1]], b];
}

/* O Tibre é uma polilinha: serve para desenhar e para excluir quarteirões. */
const RIVER = [[352, -60], [430, 180], [462, 412], [492, 560], [502, 648],
               [470, 800], [466, 898], [492, 1060], [494, 1260]];
const riverX = y => {
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [x0, y0] = RIVER[i], [x1, y1] = RIVER[i + 1];
    if (y >= y0 && y <= y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0);
  }
  return y < RIVER[0][1] ? RIVER[0][0] : RIVER[RIVER.length - 1][0];
};

const PARKS = [
  { x: 596, y: 286, w: 190, h: 156, rx: 30 },
  { x: 344, y: 596, w: 74, h: 190, rx: 26 },
  { x: 786, y: 688, w: 120, h: 96, rx: 24 },
  { x: 646, y: 690, w: 54, h: 48, rx: 14 },
  { x: 470, y: 316, w: 62, h: 54, rx: 16 },
];

const PIN_R = 13, PIN_ICON = 0.62;
const TAP_SLOP = 9;          // unidades: um dedo nunca fica parado, 4 cancelava toques
const MIN_S = 0.55, MAX_S = 3.2;       // limites de zoom
const MARKER_REF = 1.05;               // escala em que os marcadores têm o tamanho desenhado
const clampScale = v => Math.max(MIN_S, Math.min(MAX_S, v));
const USER_HEADING = -34;          // graus: para onde o boneco está virado

const MapView = {
  svg: null, world: null, layers: {}, pins: new Map(),
  cam: { tx: 0, ty: 0, s: 1 },
  panned: false,          // houve arrasto entre o último pointerdown e o click?

  init(svgEl) {
    this.svg = svgEl;
    svgEl.setAttribute('viewBox', `0 0 ${VIEW_W} ${VIEW_H}`);
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svgEl.innerHTML = '';

    const defs = el('defs');
    defs.innerHTML =
      `<linearGradient id="coneGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-44">
         <stop offset="0" style="stop-color:var(--accent);stop-opacity:.42"/>
         <stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/>
       </linearGradient>`;
    svgEl.appendChild(defs);

    this.world = el('g', { id: 'world' });
    svgEl.appendChild(this.world);
    this.layers = {};
    this.pins.clear();

    for (const n of ['land', 'blocks', 'roads', 'water', 'labels', 'route', 'pins', 'user']) {
      const g = el('g', { 'data-layer': n });
      this.layers[n] = g;
      this.world.appendChild(g);
    }

    this.drawLand();
    this.drawBlocks();
    this.drawRoads();
    this.drawLabels();
    this.drawUser();
  },

  drawLand() {
    const L = this.layers.land;
    L.appendChild(el('rect', { x: -600, y: -600, width: WORLD + 1200, height: WORLD + 1200 },
      { fill: 'var(--map-land)' }));
    for (const p of PARKS)
      L.appendChild(el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, rx: p.rx }, { fill: 'var(--map-park)' }));
  },

  /* Quarteirões planos: textura discreta, não o assunto do ecrã. */
  drawBlocks() {
    const rnd = mulberry32(20260922);
    const B = this.layers.blocks;
    const CELL = 72;

    for (let gx = 24; gx < 1200; gx += CELL) {
      for (let gy = 24; gy < 1200; gy += CELL) {
        const inset = 12 + rnd() * 7;
        const bx = gx + inset, by = gy + inset;
        const bw = CELL - inset - (10 + rnd() * 7);
        const bd = CELL - inset - (10 + rnd() * 7);
        const cx = bx + bw / 2, cy = by + bd / 2;

        if (Math.abs(cx - riverX(cy)) < 44) continue;
        if (PARKS.some(p => cx > p.x - 6 && cx < p.x + p.w + 6 && cy > p.y - 6 && cy < p.y + p.h + 6)) continue;
        if (rnd() < 0.14) continue;                      // praças e vazios

        B.appendChild(el('rect', {
          x: bx.toFixed(1), y: by.toFixed(1), width: bw.toFixed(1), height: bd.toFixed(1), rx: 3,
        }, { fill: 'var(--map-block)' }));
      }
    }
  },

  drawRoads() {
    const R = this.layers.roads, W = this.layers.water;
    const road = (x1, y1, x2, y2, w) => el('line', { x1, y1, x2, y2, 'stroke-linecap': 'round' },
      { stroke: 'var(--map-road)', 'stroke-width': w });

    const CELL = 72;
    for (let i = -300; i < WORLD + 300; i += CELL) {
      R.appendChild(road(-360, i, WORLD + 360, i, 8));
      R.appendChild(road(i, -360, i, WORLD + 360, 8));
    }
    for (let i = -288; i < WORLD + 300; i += CELL * 3) {
      R.appendChild(road(-360, i, WORLD + 360, i, 16));
      R.appendChild(road(i, -360, i, WORLD + 360, 16));
    }
    R.appendChild(road(180, -60, 980, 900, 13));
    R.appendChild(road(900, 60, 260, 940, 13));
    for (const [cx, cy, r] of [[598, 470, 36], [668, 604, 26]])
      R.appendChild(el('circle', { cx, cy, r }, { fill: 'var(--map-road)' }));

    W.appendChild(el('path', { d: roundedPolyline(RIVER, 60), fill: 'none' },
      { stroke: 'var(--map-water)', 'stroke-width': 30 }));
    for (const y of [418, 604, 760, 900, 262])
      W.appendChild(el('line', { x1: riverX(y) - 38, y1: y, x2: riverX(y) + 38, y2: y, 'stroke-linecap': 'butt' },
        { stroke: 'var(--map-road)', 'stroke-width': 15 }));
  },

  drawLabels() {
    const L = this.layers.labels;
    const inv = (MARKER_REF / this.cam.s).toFixed(3);

    const rotulo = (nome, xy, cls, rot = 0) => {
      const outer = el('g', { transform: `translate(${xy[0]} ${xy[1]}) rotate(${rot})` });
      const zoom = el('g', { class: 'label-zoom', transform: `scale(${inv})` });
      const t = el('text', { x: 0, y: 0, 'text-anchor': 'middle', class: cls });
      t.textContent = nome;
      zoom.appendChild(t);
      outer.appendChild(zoom);
      L.appendChild(outer);
    };

    for (const h of HOODS) rotulo(h.nome, h.xy, 'map-label map-hood');
    for (const s of STREETS) rotulo(s.nome, s.xy, 'map-label map-street', s.rot);
  },

  /* ---- O boneco ----
     Não é um ponto genérico: é um disco com a inicial do utilizador, um cone
     que diz para onde está virado, e o halo de precisão. É o único elemento
     do mapa que é *ele*, por isso é o único que pode ter personalidade. */
  drawUser() {
    const [x, y] = USER_XY;
    const outer = el('g', { class: 'user-marker', transform: `translate(${x} ${y})` });
    const g = el('g', { class: 'user-zoom' });          // contra-escala do zoom
    outer.appendChild(g);

    g.appendChild(el('circle', { class: 'user-halo', cx: 0, cy: 0, r: 34 }));

    const cone = el('g', { transform: `rotate(${USER_HEADING})` });
    cone.appendChild(el('path', { class: 'user-cone', d: 'M0 0 L-19 -40 A 45 45 0 0 1 19 -40 Z' },
      { fill: 'url(#coneGrad)' }));
    g.appendChild(cone);

    g.appendChild(el('circle', { class: 'user-puck', cx: 0, cy: 0, r: 19 }));
    g.appendChild(el('circle', { class: 'user-avatar', cx: 0, cy: 0, r: 15 }));
    const t = el('text', { class: 'user-initial', x: 0, y: 5.4 });
    t.textContent = USER.iniciais;
    g.appendChild(t);

    this.layers.user.appendChild(outer);
  },

  /* ---- Pins: mínimos. Um disco, um aro branco, um glifo ou um número. ---- */
  renderPins(items, onTap) {
    this.layers.pins.innerHTML = '';
    this.pins.clear();

    items.forEach((it, i) => {
      const p = it.poi;
      const g = el('g', { class: `pin ${it.state || ''}`, transform: `translate(${p.xy[0]} ${p.xy[1]})` });
      /* Três níveis: posição (atributo), contra-escala do zoom, e seleção (com transição).
         Separados porque a contra-escala muda a cada frame e a seleção tem mola. */
      const zoom = el('g', { class: 'pin-zoom', transform: `scale(${(MARKER_REF / this.cam.s).toFixed(3)})` });
      const inner = el('g', { class: 'pin-scale', transform: 'scale(.4)' });
      inner.style.opacity = '0';
      inner.style.transitionDelay = `${i * 38}ms`;

      inner.appendChild(el('circle', { class: 'pin-dot', cx: 0, cy: 0, r: PIN_R }));
      if (it.num) {
        const t = el('text', { class: 'pin-num', x: 0, y: 4.2 });
        t.textContent = it.num;
        inner.appendChild(t);
      } else {
        const off = 12 * PIN_ICON;
        inner.appendChild(el('path', {
          class: 'pin-ico', d: ICONS[p.cat] || ICONS.pin,
          transform: `translate(${-off} ${-off}) scale(${PIN_ICON})`,
        }));
      }
      inner.appendChild(el('circle', { class: 'pin-hit', cx: 0, cy: 0, r: 27 }));

      zoom.appendChild(inner);
      g.appendChild(zoom);
      g.addEventListener('click', e => { if (MapView.panned) return; e.stopPropagation(); onTap(p.id); });
      this.layers.pins.appendChild(g);
      this.pins.set(p.id, g);

      requestAnimationFrame(() => {
        inner.style.opacity = '1';
        inner.setAttribute('transform', `scale(${it.state === 'sel' ? 1.3 : 1})`);
      });
    });

    const sel = items.find(i => i.state === 'sel');
    if (sel) this.layers.pins.appendChild(this.pins.get(sel.poi.id));
  },

  /* ---- Rota ---- */
  clearRoute() { this.layers.route.innerHTML = ''; },

  animateDraw(pathEl, delay = 0) {
    const len = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = `${len}`;
    pathEl.style.strokeDashoffset = `${len}`;
    requestAnimationFrame(() => {
      pathEl.style.transition = `stroke-dashoffset var(--dur-xslow) var(--ease-out) ${delay}ms`;
      pathEl.style.strokeDashoffset = '0';
    });
  },

  drawPath(points, { mode = 'walk', draw = true } = {}) {
    let d = '';
    for (let i = 0; i < points.length - 1; i++) d += roundedPolyline(routeThrough(points[i], points[i + 1]), 22) + ' ';

    const glow = el('path', { d, class: 'route-glow' });
    const line = el('path', { d, class: `route-line ${mode}` });
    this.layers.route.append(glow, line);

    if (draw) {
      this.animateDraw(glow);
      line.style.opacity = '0';
      requestAnimationFrame(() => {
        line.style.transition = 'opacity var(--dur-slow) var(--ease) 180ms';
        line.style.opacity = '1';
      });
    }
  },

  setRoute(from, to, mode = 'walk') { this.clearRoute(); this.drawPath([from, to], { mode }); },
  setMultiRoute(points, opts) { this.clearRoute(); if (points.length > 1) this.drawPath(points, opts); },

  /* ---- Câmara: coloca o ponto do mundo (wx,wy) no ponto de ecrã (sx,sy). ---- */
  moveTo(wx, wy, { scale = 1, sx = VIEW_W / 2, sy = VIEW_H * 0.32, instant = false } = {}) {
    scale = clampScale(scale);
    this.cam = { tx: sx - wx * scale, ty: sy - wy * scale, s: scale };
    this.applyCam(instant);
  },

  applyCam(instant = false) {
    const { tx, ty, s } = this.cam;
    this.world.style.transition = instant ? 'none' : `transform var(--dur-xslow) var(--ease-out)`;
    this.world.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s})`);
    this.rescaleMarkers();
  },

  /* Os marcadores mantêm o tamanho no ecrã, como em qualquer mapa a sério:
     sem isto, a 3x os pins ficam do tamanho de um quarteirão. */
  rescaleMarkers() {
    const inv = (MARKER_REF / this.cam.s).toFixed(3);
    for (const g of this.pins.values()) {
      const z = g.querySelector('.pin-zoom');
      if (z) z.setAttribute('transform', `scale(${inv})`);
    }
    const u = this.layers.user && this.layers.user.querySelector('.user-zoom');
    if (u) u.setAttribute('transform', `scale(${inv})`);
    if (this.layers.labels)
      for (const z of this.layers.labels.querySelectorAll('.label-zoom'))
        z.setAttribute('transform', `scale(${inv})`);
  },

  /* Trava a câmara dentro do mundo: sem isto arrasta-se para o cinzento infinito. */
  clampCam() {
    const s = this.cam.s;
    const LO = -220, HI = 1420;
    this.cam.tx = Math.min(-LO * s, Math.max(VIEW_W - HI * s, this.cam.tx));
    this.cam.ty = Math.min(-LO * s, Math.max(VIEW_H - HI * s, this.cam.ty));
  },

  /* Gestos do mapa: arrastar, pinça, roda e duplo clique.
     O limiar de 4 unidades separa um toque de um arrasto — sem ele, arrastar
     por cima de um pin abria-o ao levantar o dedo. */
  enableGestures() {
    const svg = this.svg;
    const pts = new Map();        // ponteiros ativos
    let g = null;                 // gesto em curso

    /* Coordenadas do cliente para unidades do viewBox. */
    const toView = (cx, cy) => {
      const r = svg.getBoundingClientRect();
      const k = (r.width / VIEW_W) || 1;
      return { x: (cx - r.left) / k, y: (cy - r.top) / k, k };
    };

    /* Zoom ancorado num ponto: o que está debaixo do dedo fica debaixo do dedo. */
    const zoomAt = (fx, fy, next, animate = false) => {
      const s = clampScale(next);
      if (s === this.cam.s) return;
      const wx = (fx - this.cam.tx) / this.cam.s;
      const wy = (fy - this.cam.ty) / this.cam.s;
      this.cam.tx = fx - wx * s;
      this.cam.ty = fy - wy * s;
      this.cam.s = s;
      this.clampCam();
      if (animate) {
        this.world.style.transition = `transform var(--dur-slow) var(--ease-out)`;
        const { tx, ty } = this.cam;
        this.world.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s})`);
        this.rescaleMarkers();
      } else this.applyCam(true);
    };

    svg.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pts.size === 1) {
        this.panned = false;
        const v = toView(e.clientX, e.clientY);
        g = { mode: 'pan', x: e.clientX, y: e.clientY, tx: this.cam.tx, ty: this.cam.ty, k: v.k, moved: false };
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        g = { mode: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: this.cam.s };
        this.panned = true;                 // uma pinça nunca é um toque
        for (const id of pts.keys()) { try { svg.setPointerCapture(id); } catch {} }
        svg.classList.add('is-panning');
      }
    });

    svg.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!g) return;

      if (g.mode === 'pinch' && pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = toView((a.x + b.x) / 2, (a.y + b.y) / 2);
        zoomAt(mid.x, mid.y, g.s0 * (d / g.d0));
        return;
      }

      if (g.mode === 'pan') {
        const dx = (e.clientX - g.x) / g.k;
        const dy = (e.clientY - g.y) / g.k;
        if (!g.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
        if (!g.moved) {
          g.moved = true;
          this.panned = true;
          try { svg.setPointerCapture(e.pointerId); } catch {}
          svg.classList.add('is-panning');
        }
        this.cam.tx = g.tx + dx;
        this.cam.ty = g.ty + dy;
        this.clampCam();
        this.applyCam(true);
      }
    });

    const up = e => {
      pts.delete(e.pointerId);
      if (pts.size === 0) { g = null; svg.classList.remove('is-panning'); return; }
      /* Levantar um dedo da pinça: continua a arrastar com o que ficou. */
      const [only] = [...pts.values()];
      const v = toView(only.x, only.y);
      g = { mode: 'pan', x: only.x, y: only.y, tx: this.cam.tx, ty: this.cam.ty, k: v.k, moved: true };
    };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);

    /* Roda do rato: zoom. O trackpad manda pinça como wheel com ctrlKey. */
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const v = toView(e.clientX, e.clientY);
      const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0022));
      zoomAt(v.x, v.y, this.cam.s * f);
    }, { passive: false });

    svg.addEventListener('dblclick', e => {
      const v = toView(e.clientX, e.clientY);
      zoomAt(v.x, v.y, this.cam.s * 1.7, true);
    });
  },


  /* Zoom pelos botões: ancorado no meio da faixa de mapa que a folha deixa ver. */
  zoomBy(f) {
    const fx = VIEW_W / 2, fy = VIEW_H * 0.3;
    const s = clampScale(this.cam.s * f);
    if (s === this.cam.s) return;
    const wx = (fx - this.cam.tx) / this.cam.s;
    const wy = (fy - this.cam.ty) / this.cam.s;
    this.cam = { tx: fx - wx * s, ty: fy - wy * s, s };
    this.clampCam();
    this.world.style.transition = `transform var(--dur-slow) var(--ease-out)`;
    this.world.setAttribute('transform', `translate(${this.cam.tx.toFixed(1)} ${this.cam.ty.toFixed(1)}) scale(${s})`);
    this.rescaleMarkers();
  },

  frame(a, b, visibleH = VIEW_H * 0.44) {
    const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
    const dx = Math.abs(a[0] - b[0]) + 150;
    const dy = Math.abs(a[1] - b[1]) + 170;
    const s = Math.max(0.5, Math.min(1.2, Math.min(VIEW_W / dx, visibleH / dy)));
    this.moveTo(cx, cy, { scale: s, sy: visibleH / 2 + 46 });
  },

  frameAll(points, visibleH = VIEW_H * 0.44) {
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    this.frame([Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)], visibleH);
  },

  home() { this.moveTo(USER_XY[0], USER_XY[1], { scale: 1.05, sy: VIEW_H * 0.3 }); },
};

/* Mini-mapa estático para o recibo. */
function renderMiniMap(host, points) {
  host.innerHTML = '';
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const pad = 46;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const w = maxX - minX, h = maxY - minY;

  const s = el('svg', {
    viewBox: `${minX} ${minY} ${w} ${h}`,
    preserveAspectRatio: 'xMidYMid meet', width: '100%', height: '100%',
  });
  const OVER = 1600;
  s.appendChild(el('rect', { x: minX - OVER, y: minY - OVER, width: w + OVER * 2, height: h + OVER * 2 },
    { fill: 'var(--map-land)' }));
  const road = { stroke: 'var(--map-road)', 'stroke-width': 6 };
  for (let i = Math.floor((minX - OVER) / 60) * 60; i <= maxX + OVER; i += 60)
    s.appendChild(el('line', { x1: i, y1: minY - OVER, x2: i, y2: maxY + OVER }, road));
  for (let i = Math.floor((minY - OVER) / 60) * 60; i <= maxY + OVER; i += 60)
    s.appendChild(el('line', { x1: minX - OVER, y1: i, x2: maxX + OVER, y2: i }, road));

  let d = '';
  for (let i = 0; i < points.length - 1; i++) d += roundedPolyline(routeThrough(points[i], points[i + 1]), 20) + ' ';
  s.appendChild(el('path', { d, class: 'route-glow' }));
  s.appendChild(el('path', { d, class: 'route-line' }));

  s.appendChild(el('circle', { cx: points[0][0], cy: points[0][1], r: 13, class: 'user-puck' }));
  s.appendChild(el('circle', { cx: points[0][0], cy: points[0][1], r: 10, class: 'user-avatar' }));

  const last = points[points.length - 1];
  s.appendChild(el('circle', { cx: last[0], cy: last[1], r: 13, class: 'pin-dot' }));
  host.appendChild(s);
}
