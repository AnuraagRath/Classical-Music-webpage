// ===== PARALLAX =====
const parallaxBgs = document.querySelectorAll('.parallax-bg');
window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  parallaxBgs.forEach(bg => {
    const section = bg.parentElement;
    const rect = section.getBoundingClientRect();
    const offset = (rect.top + rect.height / 2) / window.innerHeight;
    bg.style.transform = `translateY(${(offset - 0.5) * 80}px)`;
  });
}, { passive: true });

// ===== TIMELINE =====
const MIN_YEAR = 950, MAX_YEAR = 2030;
const YEAR_SPAN = MAX_YEAR - MIN_YEAR;
const BASE_W = 2800;

function buildTimeline() {
  const viewport = document.getElementById('tlViewport');
  const world    = document.getElementById('tlWorld');
  if (!viewport) return;

  function px(year) { return ((year - MIN_YEAR) / YEAR_SPAN) * BASE_W; }

  const ERA_BANDS = [
    { label:"Early Music",   start:1000, end:1400, page:"early-music.html" },
    { label:"Renaissance",   start:1400, end:1600, page:"renaissance.html" },
    { label:"Baroque",       start:1600, end:1750, page:"baroque.html" },
    { label:"Classical Era", start:1750, end:1820, page:"classical-era.html" },
    { label:"Romantic Era",  start:1810, end:1920, page:"romantic.html" },
    { label:"Nationalism",   start:1830, end:1920, page:"nationalism.html" },
    { label:"Modern Era",    start:1900, end:1950, page:"modern.html" },
    { label:"Contemporary",  start:1950, end:2030, page:"contemporary.html" }
  ];

  const ROW_H = 22, LABEL_H = 30, PAD = 12;
  const byEra = {};
  COMPOSERS.forEach(c => { (byEra[c.era] = byEra[c.era] || []).push(c); });

  // Axis (top + bottom) — built after world width is known
  ['tlAxisTop','tlAxisBot'].forEach(id => {
    const axis = document.getElementById(id);
    axis.style.width = BASE_W + 'px';
    for (let y = 1000; y <= 2000; y += 100) {
      const lbl = document.createElement('div');
      lbl.className = 'tl-axis-label';
      lbl.style.left = px(y) + 'px';
      lbl.textContent = y;
      if (y === 1500) lbl.style.color = '#c0392b';
      axis.appendChild(lbl);
    }
  });
  // Assign each era to a lane so overlapping eras don't collide
  const laneEnds = []; // tracks the end-year of the last era placed in each lane
  ERA_BANDS.forEach(era => {
    let lane = laneEnds.findIndex(end => end <= era.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = era.end;
    era.lane = lane;
  });

  // Compute cumulative top offsets per lane based on max blob height in that lane
  const laneCount = laneEnds.length;
  const laneTops = new Array(laneCount).fill(0);
  // First pass: compute max height per lane
  const laneMaxH = new Array(laneCount).fill(0);
  ERA_BANDS.forEach(era => {
    const h = LABEL_H + (byEra[era.label] || []).length * ROW_H + PAD;
    laneMaxH[era.lane] = Math.max(laneMaxH[era.lane], h);
  });
  // Second pass: stack lane tops
  const LANE_GAP = 16;
  for (let i = 1; i < laneCount; i++) {
    laneTops[i] = laneTops[i - 1] + laneMaxH[i - 1] + LANE_GAP;
  }
  const totalH = laneTops[laneCount - 1] + laneMaxH[laneCount - 1] + 20;

  world.style.width = BASE_W + 'px';
  world.style.height = totalH + 'px';

  ERA_BANDS.forEach(era => {
    const composers = byEra[era.label] || [];
    const blobH = LABEL_H + composers.length * ROW_H + PAD;
    const blobLeft = px(era.start);
    const blobW    = px(era.end) - blobLeft;
    const blobTop  = laneTops[era.lane];

    const blob = document.createElement('div');
    blob.className = 'tl-blob';
    blob.style.cssText = `left:${blobLeft}px;top:${blobTop}px;width:${blobW}px;height:${blobH}px;`;

    const lbl = document.createElement('div');
    lbl.className = 'tl-era-label';
    lbl.textContent = era.label;
    blob.appendChild(lbl);

    composers.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = 'tl-composer-row';
      row.style.top = (LABEL_H + i * ROW_H) + 'px';

      const barLeft = px(c.born) - blobLeft;
      const barW    = Math.max(24, px(c.died || 2026) - px(c.born));

      const bar = document.createElement('span');
      bar.className = 'tl-composer-bar';
      bar.style.cssText = `left:${barLeft}px;width:${barW}px;`;
      if (c.name === 'Hildegard of Bingen') bar.style.background = '#e88fa0';

      const name = document.createElement('span');
      name.className = 'tl-composer-name';
      name.dataset.short = c.name.split(' ').pop();
      name.dataset.full  = c.name;
      name.textContent = c.name.split(' ').pop();
      name.style.left = (barLeft + barW + 4) + 'px';

      row.appendChild(bar);
      row.appendChild(name);

      const tt = document.getElementById('tooltip');
      row.addEventListener('mouseenter', e => {
        tt.style.display = 'block';
        tt.innerHTML = `<div class="tt-name">${c.name}</div><div class="tt-dates">${c.born}–${c.died||'present'}</div><div class="tt-work">${c.work}</div>`;
        positionTooltip(e, tt);
      });
      row.addEventListener('mousemove', e => positionTooltip(e, tt));
      row.addEventListener('mouseleave', () => tt.style.display = 'none');
      row.addEventListener('click', () => window.location.href = era.page);
      blob.appendChild(row);
    });

    world.appendChild(blob);
  });

  // ── Pan & Zoom ──
  let scale = 1, tx = 0, ty = 0;
  let isPanning = false, startX, startY, startTx, startTy;

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function applyTransform() {
    // Clamp so content can't be dragged fully off-screen
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const contentW = BASE_W * scale, contentH = world.scrollHeight * scale;
    tx = clamp(tx, Math.min(0, vw - contentW), 0);
    ty = clamp(ty, Math.min(0, vh - contentH - 60), 0);
    const t = `translate(${tx}px,${ty}px) scale(${scale})`;
    world.style.transform = t;
    document.getElementById('tlAxisTop').style.transform = t;
    document.getElementById('tlAxisBot').style.transform = t;

    // Dynamic label visibility based on zoom level
    world.classList.toggle('tl-zoom-low',    scale < 0.6);
    world.classList.toggle('tl-zoom-mid',    scale >= 0.6 && scale < 1.2);
    world.classList.toggle('tl-zoom-high',   scale >= 1.2);

    // Swap short/full name text based on zoom
    world.querySelectorAll('.tl-composer-name').forEach(el => {
      el.textContent = scale >= 1.2 ? el.dataset.full : el.dataset.short;
    });
  }

  // Wheel zoom (Ctrl+scroll) or plain scroll pan
  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = viewport.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = clamp(scale * delta, 0.3, 4);
      tx = mx - (mx - tx) * (newScale / scale);
      ty = my - (my - ty) * (newScale / scale);
      scale = newScale;
    } else {
      tx -= e.deltaX;
      ty -= e.deltaY;
    }
    applyTransform();
  }, { passive: false });

  // Mouse drag pan
  viewport.addEventListener('mousedown', e => {
    isPanning = true; startX = e.clientX; startY = e.clientY;
    startTx = tx; startTy = ty;
    viewport.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    tx = startTx + (e.clientX - startX);
    ty = startTy + (e.clientY - startY);
    applyTransform();
  });
  window.addEventListener('mouseup', () => { isPanning = false; viewport.style.cursor = 'grab'; });

  // Touch pan & pinch zoom
  let lastDist = null, lastTouchMid = null;
  viewport.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isPanning = true;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      startTx = tx; startTy = ty;
    }
    if (e.touches.length === 2) {
      isPanning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist = Math.hypot(dx, dy);
      lastTouchMid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
    }
  }, { passive: true });
  viewport.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning) {
      tx = startTx + (e.touches[0].clientX - startX);
      ty = startTy + (e.touches[0].clientY - startY);
      applyTransform();
    }
    if (e.touches.length === 2 && lastDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const rect = viewport.getBoundingClientRect();
      const mid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
      };
      const delta = dist / lastDist;
      const newScale = clamp(scale * delta, 0.3, 4);
      tx = mid.x - (mid.x - tx) * (newScale / scale);
      ty = mid.y - (mid.y - ty) * (newScale / scale);
      scale = newScale;
      lastDist = dist;
      applyTransform();
    }
  }, { passive: false });
  viewport.addEventListener('touchend', () => { isPanning = false; lastDist = null; });

  // Zoom buttons
  document.getElementById('tlZoomIn') .addEventListener('click', () => { scale = clamp(scale * 1.25, 0.3, 4); applyTransform(); });
  document.getElementById('tlZoomOut').addEventListener('click', () => { scale = clamp(scale * 0.8,  0.3, 4); applyTransform(); });
  document.getElementById('tlReset')  .addEventListener('click', () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  // Apply initial zoom class
  applyTransform();
}

function positionTooltip(e, el) {
  const x = e.clientX + 14, y = e.clientY - 10;
  el.style.left = (x + 230 > window.innerWidth ? x - 250 : x) + 'px';
  el.style.top = y + 'px';
}

buildTimeline();

// ===== GRAPH VIEW =====
const canvas = document.getElementById('graphCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let nodes = [], eraNodes = [], allNodes = [];
  let activeFilter = 'all';
  let dragging = null, dragOffX = 0, dragOffY = 0;
  let hoveredNode = null;
  const gTooltip = document.getElementById('graphTooltip');

  // Camera state
  let camX = 0, camY = 0, camScale = 1;
  let isPanning = false, panStartX, panStartY, panStartCamX, panStartCamY;

  function clampScale(s) { return Math.max(0.2, Math.min(5, s)); }

  // Convert screen coords → world coords
  function toWorld(sx, sy) {
    return { x: (sx - camX) / camScale, y: (sy - camY) / camScale };
  }

  function initGraph() {
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const eraList = Object.keys(ERA_COLORS);
    const cx = W / 2, cy = H / 2;
    const eraRadius = Math.min(W, H) * 0.32;

    eraNodes = eraList.map((era, i) => {
      const angle = (i / eraList.length) * Math.PI * 2 - Math.PI / 2;
      return {
        id: 'era_' + era, era, isEra: true,
        name: era, page: ERA_PAGES[era],
        x: cx + Math.cos(angle) * eraRadius,
        y: cy + Math.sin(angle) * eraRadius,
        vx: 0, vy: 0
      };
    });

    nodes = COMPOSERS.map((c, i) => {
      const hub = eraNodes.find(e => e.era === c.era);
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 80;
      return {
        ...c, i, isEra: false,
        x: hub.x + Math.cos(angle) * dist,
        y: hub.y + Math.sin(angle) * dist,
        vx: 0, vy: 0
      };
    });

    allNodes = [...eraNodes, ...nodes];
    simulate();
    requestAnimationFrame(drawGraph);
  }

  function simulate() {
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    for (let iter = 0; iter < 120; iter++) {
      allNodes.forEach(n => { n.vx = 0; n.vy = 0; });
      for (let a = 0; a < allNodes.length; a++) {
        for (let b = a + 1; b < allNodes.length; b++) {
          const dx = allNodes[b].x - allNodes[a].x, dy = allNodes[b].y - allNodes[a].y;
          const d = Math.sqrt(dx*dx + dy*dy) || 1;
          const minD = allNodes[a].isEra || allNodes[b].isEra ? 80 : 35;
          if (d < minD) {
            const f = (minD - d) / d * 0.6;
            allNodes[a].vx -= dx * f; allNodes[a].vy -= dy * f;
            allNodes[b].vx += dx * f; allNodes[b].vy += dy * f;
          }
        }
      }
      nodes.forEach(n => {
        const hub = eraNodes.find(e => e.era === n.era);
        n.vx += (hub.x - n.x) * 0.04;
        n.vy += (hub.y - n.y) * 0.04;
      });
      allNodes.forEach(n => {
        if (n.isEra) return;
        n.x = Math.max(20, Math.min(W - 20, n.x + n.vx));
        n.y = Math.max(20, Math.min(H - 20, n.y + n.vy));
      });
    }
  }

  function getVisible() {
    if (activeFilter === 'all') return allNodes;
    return [...eraNodes.filter(e => e.era === activeFilter), ...nodes.filter(n => n.era === activeFilter)];
  }

  function drawGraph() {
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(camScale, camScale);

    const visible = getVisible();
    const visibleComposerIds = new Set(visible.filter(n => !n.isEra).map(n => n.i));

    // Composer → era hub edges
    nodes.forEach(n => {
      if (activeFilter !== 'all' && n.era !== activeFilter) return;
      const hub = eraNodes.find(e => e.era === n.era);
      ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(hub.x, hub.y);
      ctx.strokeStyle = hoveredNode === n || hoveredNode === hub ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 0.8 / camScale;
      ctx.stroke();
    });

    // Influence edges
    INFLUENCES.forEach(([a, b]) => {
      if (!visibleComposerIds.has(a) || !visibleComposerIds.has(b)) return;
      ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5 / camScale;
      ctx.stroke();
    });

    // Composer nodes
    visible.filter(n => !n.isEra).forEach(n => {
      const isHov = hoveredNode === n;
      ctx.beginPath(); ctx.arc(n.x, n.y, isHov ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isHov ? '#fff' : 'rgba(180,180,180,0.85)';
      ctx.fill();
      ctx.font = `${isHov ? 'bold ' : ''}${11 / camScale}px Helvetica Neue, sans-serif`;
      ctx.fillStyle = isHov ? '#fff' : 'rgba(200,200,200,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(n.name, n.x + 7, n.y + 4);
    });

    // Era hub nodes
    visible.filter(n => n.isEra).forEach(n => {
      const isHov = hoveredNode === n;
      const r = isHov ? 28 : 20;
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, isHov ? 16 : 12, 0, Math.PI * 2);
      ctx.fillStyle = isHov ? '#fff' : 'rgba(230,230,230,0.9)'; ctx.fill();
      ctx.font = `bold ${12 / camScale}px Helvetica Neue, sans-serif`;
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(n.name, n.x, n.y + 28);
      ctx.textAlign = 'left';
    });

    ctx.restore();
    requestAnimationFrame(drawGraph);
  }

  // ── Hit test in world space ──
  function hitTest(sx, sy) {
    const w = toWorld(sx, sy);
    for (const n of getVisible()) {
      const dx = n.x - w.x, dy = n.y - w.y;
      const hitR = (n.isEra ? 16 : 10) / camScale;
      if (dx*dx + dy*dy < hitR*hitR) return n;
    }
    return null;
  }

  // ── Mouse events ──
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;

    if (dragging) {
      const w = toWorld(sx, sy);
      dragging.x = w.x - dragOffX; dragging.y = w.y - dragOffY;
      return;
    }
    if (isPanning) {
      camX = panStartCamX + (sx - panStartX);
      camY = panStartCamY + (sy - panStartY);
      return;
    }

    hoveredNode = hitTest(sx, sy);
    if (hoveredNode && !hoveredNode.isEra) {
      gTooltip.style.display = 'block';
      gTooltip.innerHTML = `<div class="gt-name">${hoveredNode.name}</div><div class="gt-era">${hoveredNode.era} · ${hoveredNode.born}–${hoveredNode.died||'present'}</div><div class="gt-work">${hoveredNode.work}</div>`;
      positionTooltip(e, gTooltip);
    } else { gTooltip.style.display = 'none'; }
    canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
  });

  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const hit = hitTest(sx, sy);
    if (hit) {
      const w = toWorld(sx, sy);
      dragging = hit; dragOffX = w.x - hit.x; dragOffY = w.y - hit.y;
    } else {
      isPanning = true; panStartX = sx; panStartY = sy;
      panStartCamX = camX; panStartCamY = camY;
      canvas.style.cursor = 'grabbing';
    }
  });
  window.addEventListener('mouseup', () => { dragging = null; isPanning = false; canvas.style.cursor = 'grab'; });

  canvas.addEventListener('click', e => {
    if (hoveredNode?.page) window.location.href = hoveredNode.page;
  });

  // ── Wheel zoom ──
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = clampScale(camScale * delta);
    camX = sx - (sx - camX) * (newScale / camScale);
    camY = sy - (sy - camY) * (newScale / camScale);
    camScale = newScale;
  }, { passive: false });

  // ── Touch pinch zoom + pan ──
  let lastTouchDist = null;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      isPanning = true;
      panStartX = t.clientX - rect.left; panStartY = t.clientY - rect.top;
      panStartCamX = camX; panStartCamY = camY;
    }
    if (e.touches.length === 2) {
      isPanning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1 && isPanning) {
      camX = panStartCamX + (e.touches[0].clientX - rect.left - panStartX);
      camY = panStartCamY + (e.touches[0].clientY - rect.top  - panStartY);
    }
    if (e.touches.length === 2 && lastTouchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const newScale = clampScale(camScale * dist / lastTouchDist);
      camX = mx - (mx - camX) * (newScale / camScale);
      camY = my - (my - camY) * (newScale / camScale);
      camScale = newScale; lastTouchDist = dist;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', () => { isPanning = false; lastTouchDist = null; });

  // ── Zoom buttons ──
  document.getElementById('gZoomIn') .addEventListener('click', () => { const c = clampScale(camScale * 1.25); camX = canvas.offsetWidth/2  - (canvas.offsetWidth/2  - camX) * c/camScale; camY = canvas.offsetHeight/2 - (canvas.offsetHeight/2 - camY) * c/camScale; camScale = c; });
  document.getElementById('gZoomOut').addEventListener('click', () => { const c = clampScale(camScale * 0.8);  camX = canvas.offsetWidth/2  - (canvas.offsetWidth/2  - camX) * c/camScale; camY = canvas.offsetHeight/2 - (canvas.offsetHeight/2 - camY) * c/camScale; camScale = c; });
  document.getElementById('gReset')  .addEventListener('click', () => { camX = 0; camY = 0; camScale = 1; });

  // ── Filter buttons ──
  document.querySelectorAll('.graph-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.graph-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
    });
  });

  initGraph();
  window.addEventListener('resize', initGraph);
}
