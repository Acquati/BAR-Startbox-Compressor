const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const inputStatus = document.getElementById('inputStatus');
const outputStatus = document.getElementById('outputStatus');
const btnCompress = document.getElementById('btnCompress');
const btnExample = document.getElementById('btnExample');

const mapFrame = document.getElementById('mapFrame');
const mapImage = document.getElementById('mapImage');
const mapImageInput = document.getElementById('mapImageInput');
const btnClearImage = document.getElementById('btnClearImage');
const btnTeam1 = document.getElementById('btnTeam1');
const btnTeam2 = document.getElementById('btnTeam2');
const btnTeam3 = document.getElementById('btnTeam3');
const btnTeam4 = document.getElementById('btnTeam4');
const teamButtons = [btnTeam1, btnTeam2, btnTeam3, btnTeam4];
const btnUndoSquare = document.getElementById('btnUndoSquare');
const btnClearSquares = document.getElementById('btnClearSquares');
const coordDisplay = document.getElementById('coordDisplay');
const clickMarker = document.getElementById('clickMarker');
const mapCanvas = document.getElementById('mapCanvas');
const squareSizeInput = document.getElementById('squareSizeInput');

const paneLeft = document.getElementById('paneLeft');
const paneRight = document.getElementById('paneRight');
const rightTop = document.getElementById('rightTop');
const rightBottom = document.getElementById('rightBottom');
const splitterV = document.getElementById('splitterV');
const splitterH = document.getElementById('splitterH');

// Per-team squares: each is {x, y} = top-left of a 6×6 square on the 0–200 grid
let teamSquares = [[], [], [], []]; // Teams 1–4
// Raw polygons (from parsed JSON) for teams imported as text; empty = drawn from squares
let teamPolys = [[], [], [], []];
let activeTeam = 0;
let SQUARE_SIZE = Number(squareSizeInput.value) || 6;
squareSizeInput.addEventListener('input', () => {
  SQUARE_SIZE = Math.max(1, Math.min(100, Number(squareSizeInput.value) || 6));
  if (activeTeam !== undefined) setActiveTeam(activeTeam);
  updateJSONFromSquares();
  drawOverlay();
});
const TEAM_COLORS = [
  { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.25)', poly: '#f87171', active: '#059669' },
  { stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.25)', poly: '#c084fc', active: '#2563eb' },
  { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.25)', poly: '#fb923c', active: '#d97706' },
  { stroke: '#f472b6', fill: 'rgba(244, 114, 182, 0.25)', poly: '#e879f9', active: '#db2777' },
];

function setActiveTeam(t) {
  activeTeam = t;
  teamButtons.forEach((btn, i) => {
    if (i === t) {
      btn.style.background = TEAM_COLORS[i].active;
      btn.className = '';
    } else {
      btn.style.background = '';
      btn.className = 'secondary';
    }
    btn.style.padding = '5px 10px';
    btn.style.fontSize = '0.75rem';
  });
  const n = teamSquares[t].length;
  coordDisplay.textContent =
    `Team ${t + 1}` + (n ? ` — ${n} square(s)` : ` — click to place ${SQUARE_SIZE}×${SQUARE_SIZE}`);
}

const EXAMPLE = `{"startboxes":[
  {"poly":[
    {"x": 65, "y": 29},
    {"x": 71, "y": 29},
    {"x": 126, "y": 28},
    {"x": 132, "y": 28},
    {"x": 132, "y": 34},
    {"x": 163, "y": 73},
    {"x": 169, "y": 73},
    {"x": 169, "y": 79},
    {"x": 170, "y": 125},
    {"x": 170, "y": 131},
    {"x": 164, "y": 131},
    {"x": 137, "y": 166},
    {"x": 137, "y": 172},
    {"x": 131, "y": 172},
    {"x": 131, "y": 166},
    {"x": 78, "y": 166},
    {"x": 78, "y": 172},
    {"x": 72, "y": 172},
    {"x": 72, "y": 166},
    {"x": 36, "y": 133},
    {"x": 30, "y": 133},
    {"x": 30, "y": 127},
    {"x": 30, "y": 79},
    {"x": 30, "y": 73},
    {"x": 36, "y": 73},
    {"x": 36, "y": 79},
    {"x": 30, "y": 79},
    {"x": 30, "y": 127},
    {"x": 36, "y": 127},
    {"x": 36, "y": 133},
    {"x": 72, "y": 166},
    {"x": 78, "y": 166},
    {"x": 131, "y": 166},
    {"x": 137, "y": 166},
    {"x": 164, "y": 131},
    {"x": 164, "y": 125},
    {"x": 170, "y": 125},
    {"x": 169, "y": 79},
    {"x": 163, "y": 79},
    {"x": 163, "y": 73},
    {"x": 132, "y": 34},
    {"x": 126, "y": 34},
    {"x": 126, "y": 28},
    {"x": 71, "y": 29},
    {"x": 71, "y": 35},
    {"x": 65, "y": 35}
  ]},
  {"poly":[
    {"x": 97, "y": 57},
    {"x": 103, "y": 57},
    {"x": 103, "y": 63},
    {"x": 124, "y": 68},
    {"x": 130, "y": 68},
    {"x": 130, "y": 74},
    {"x": 139, "y": 96},
    {"x": 145, "y": 96},
    {"x": 145, "y": 102},
    {"x": 139, "y": 102},
    {"x": 132, "y": 124},
    {"x": 132, "y": 130},
    {"x": 126, "y": 130},
    {"x": 106, "y": 139},
    {"x": 106, "y": 145},
    {"x": 100, "y": 145},
    {"x": 100, "y": 139},
    {"x": 80, "y": 136},
    {"x": 74, "y": 136},
    {"x": 74, "y": 130},
    {"x": 67, "y": 102},
    {"x": 61, "y": 102},
    {"x": 61, "y": 96},
    {"x": 67, "y": 96},
    {"x": 68, "y": 75},
    {"x": 68, "y": 69},
    {"x": 74, "y": 69},
    {"x": 74, "y": 75},
    {"x": 68, "y": 75},
    {"x": 67, "y": 96},
    {"x": 67, "y": 102},
    {"x": 74, "y": 130},
    {"x": 80, "y": 130},
    {"x": 80, "y": 136},
    {"x": 100, "y": 139},
    {"x": 106, "y": 139},
    {"x": 126, "y": 130},
    {"x": 126, "y": 124},
    {"x": 132, "y": 124},
    {"x": 139, "y": 102},
    {"x": 139, "y": 96},
    {"x": 130, "y": 74},
    {"x": 124, "y": 74},
    {"x": 124, "y": 68},
    {"x": 103, "y": 63},
    {"x": 97, "y": 63}
  ]}
]}`;

async function compress(text) {
  if (typeof CompressionStream !== 'undefined') {
    const stream = new CompressionStream('deflate');
    const writer = stream.writable.getWriter();
    writer.write(new TextEncoder().encode(text));
    writer.close();
    const compressed = await new Response(stream.readable).arrayBuffer();
    return arrayBufferToBase64Url(compressed);
  }
  throw new Error('CompressionStream not supported in this browser. Use Chrome/Edge/Firefox 113+.');
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function doCompress() {
  const raw = inputEl.value.trim();
  inputStatus.textContent = '';
  outputStatus.textContent = '';
  outputEl.value = '';

  if (!raw) {
    inputStatus.textContent = 'empty';
    inputStatus.className = 'status err';
    return;
  }

  try {
    JSON.parse(raw);
    inputStatus.textContent = 'valid JSON';
    inputStatus.className = 'status ok';
  } catch (e) {
    inputStatus.textContent = 'invalid JSON';
    inputStatus.className = 'status err';
    outputStatus.textContent = e.message;
    outputStatus.className = 'status err';
    return;
  }

  if (teamSquares.every((s) => s.length === 0)) {
    teamPolys = polysFromJSON(raw);
    drawOverlay();
  }

  btnCompress.disabled = true;
  try {
    const encoded = await compress(raw);
    const result = '!bset mapmetadata_startbox_override ' + encoded;
    outputEl.value = result;
    try {
      await navigator.clipboard.writeText(result);
      outputStatus.textContent = 'copied! (' + encoded.length + ' chars)';
    } catch {
      outputEl.select();
      document.execCommand('copy');
      outputStatus.textContent = encoded.length + ' chars (encoded)';
    }
    outputStatus.className = 'status ok';
  } catch (e) {
    outputStatus.textContent = e.message;
    outputStatus.className = 'status err';
  } finally {
    btnCompress.disabled = false;
  }
}

btnCompress.addEventListener('click', doCompress);

function polysFromJSON(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return [[], [], [], []];
  }
  const boxes = Array.isArray(data && data.startboxes) ? data.startboxes : [];
  const result = [[], [], [], []];
  for (let i = 0; i < boxes.length && i < result.length; i++) {
    const poly = boxes[i] && boxes[i].poly;
    result[i] = Array.isArray(poly)
      ? poly.map((p) => ({
          x: Math.round(Number(p.x)) || 0,
          y: Math.round(Number(p.y)) || 0,
        }))
      : [];
  }
  return result;
}

function squaresFromChain(poly) {
  const runs = [];
  let run = null;
  let prev = null;
  for (const raw of poly) {
    const x = Math.round(Number(raw.x)) || 0;
    const y = Math.round(Number(raw.y)) || 0;
    if (prev && x === prev.x && y === prev.y) continue;
    const hop = prev ? Math.abs(x - prev.x) + Math.abs(y - prev.y) : 0;
    const adjacent = hop === 2 && (x === prev.x || y === prev.y);
    if (run && adjacent) {
      const minX = Math.min(run.minX, x);
      const maxX = Math.max(run.maxX, x);
      const minY = Math.min(run.minY, y);
      const maxY = Math.max(run.maxY, y);
      if (maxX - minX <= 2 && maxY - minY <= 2) {
        run.minX = minX;
        run.maxX = maxX;
        run.minY = minY;
        run.maxY = maxY;
        run.corners++;
        prev = { x, y };
        continue;
      }
    }
    run = { minX: x, maxX: x, minY: y, maxY: y, corners: 1 };
    runs.push(run);
    prev = { x, y };
  }
  const result = [];
  const seen = new Set();
  for (const r of runs) {
    if (r.corners < 3) continue;
    const key = r.minX + ',' + r.minY;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      x: Math.max(0, Math.min(200 - SQUARE_SIZE, r.minX)),
      y: Math.max(0, Math.min(200 - SQUARE_SIZE, r.minY)),
    });
  }
  return result;
}

function squaresFromJSON(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return [[], [], [], []];
  }
  const boxes = Array.isArray(data && data.startboxes) ? data.startboxes : [];
  const result = [[], [], [], []];
  for (let i = 0; i < boxes.length && i < result.length; i++) {
    const poly = boxes[i] && boxes[i].poly;
    result[i] = Array.isArray(poly) ? squaresFromChain(poly) : [];
  }
  return result;
}

btnExample.addEventListener('click', () => {
  inputEl.value = EXAMPLE;
  teamSquares = squaresFromJSON(EXAMPLE);
  teamPolys = [[], [], [], []];
  setActiveTeam(activeTeam);
  drawOverlay();
  doCompress();
});

inputEl.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    doCompress();
  }
});

// ---- Map: 6×6 square placer + polygon builder ----
function getImageRect() {
  if (!mapImage.src || !mapImage.naturalWidth) return null;
  const frameRect = mapFrame.getBoundingClientRect();
  const imgAspect = mapImage.naturalWidth / mapImage.naturalHeight;
  const frameAspect = frameRect.width / frameRect.height;
  let drawW, drawH, offsetX, offsetY;
  if (imgAspect > frameAspect) {
    drawW = frameRect.width;
    drawH = frameRect.width / imgAspect;
    offsetX = 0;
    offsetY = (frameRect.height - drawH) / 2;
  } else {
    drawH = frameRect.height;
    drawW = frameRect.height * imgAspect;
    offsetX = (frameRect.width - drawW) / 2;
    offsetY = 0;
  }
  return {
    left: frameRect.left + offsetX,
    top: frameRect.top + offsetY,
    width: drawW,
    height: drawH,
  };
}

function clientToGrid(clientX, clientY) {
  const imgRect = getImageRect();
  if (imgRect) {
    const relX = (clientX - imgRect.left) / imgRect.width;
    const relY = (clientY - imgRect.top) / imgRect.height;
    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return null;
    return {
      x: Math.round(Math.max(0, Math.min(1, relX)) * 200),
      y: Math.round(Math.max(0, Math.min(1, relY)) * 200),
      imgRect,
    };
  }
  const rect = mapFrame.getBoundingClientRect();
  const cx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const cy = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  return { x: Math.round(cx * 200), y: Math.round(cy * 200), imgRect: null };
}

function squareVertices(s) {
  // Clockwise from top-left: TL, TR, BR, BL
  return [
    { x: s.x, y: s.y },
    { x: s.x + SQUARE_SIZE, y: s.y },
    { x: s.x + SQUARE_SIZE, y: s.y + SQUARE_SIZE },
    { x: s.x, y: s.y + SQUARE_SIZE },
  ];
}

function dist(a, b) {
  const dx = a.x - b.x,
    dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function closestVertexPair(sqA, sqB) {
  const va = squareVertices(sqA);
  const vb = squareVertices(sqB);
  let best = { d: Infinity, ia: 0, ib: 0 };
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const d = dist(va[i], vb[j]);
      if (d < best.d) best = { d, ia: i, ib: j };
    }
  }
  return best;
}

/**
 * Build a single polygon connecting all squares in placement order.
 * Each new square connects to the previous one (last completed) via closest vertices.
 */
function buildPolygon(squares) {
  if (!squares || squares.length === 0) return [];
  if (squares.length === 1) return squareVertices(squares[0]);

  const links = [];
  for (let i = 1; i < squares.length; i++) {
    const pair = closestVertexPair(squares[i - 1], squares[i]);
    links.push({ from: i - 1, to: i, ia: pair.ia, ib: pair.ib });
  }

  const adj = Array.from({ length: squares.length }, () => []);
  links.forEach((L, li) => {
    adj[L.from].push({ other: L.to, myVert: L.ia, otherVert: L.ib, linkIdx: li });
    adj[L.to].push({ other: L.from, myVert: L.ib, otherVert: L.ia, linkIdx: li });
  });

  const poly = [];
  const visitedLink = new Set();

  function walkSquare(sqIdx, entryVert, isRoot) {
    const verts = squareVertices(squares[sqIdx]);
    for (let step = 0; step < 4; step++) {
      const vi = (entryVert + step) % 4;
      poly.push({ x: verts[vi].x, y: verts[vi].y });

      for (const edge of adj[sqIdx]) {
        if (edge.myVert !== vi) continue;
        if (visitedLink.has(edge.linkIdx)) continue;
        visitedLink.add(edge.linkIdx);
        walkSquare(edge.other, edge.otherVert, false);
        poly.push({ x: verts[vi].x, y: verts[vi].y });
      }
    }
    if (!isRoot) {
      poly.push({ x: verts[entryVert].x, y: verts[entryVert].y });
    }
  }

  walkSquare(0, 0, true);
  return poly;
}

function updateJSONFromSquares() {
  const startboxes = [];
  for (let t = 0; t < teamSquares.length; t++) {
    if (teamSquares[t].length > 0) teamPolys[t] = [];
    const poly = teamPolys[t].length > 0 ? teamPolys[t] : buildPolygon(teamSquares[t]);
    if (poly.length > 0) startboxes.push({ poly });
  }
  if (startboxes.length === 0) {
    inputEl.value = '';
    inputStatus.textContent = '';
    return;
  }
  const lines = ['{"startboxes":['];
  startboxes.forEach((box, bi) => {
    lines.push('  {"poly":[');
    box.poly.forEach((p, pi) => {
      const comma = pi < box.poly.length - 1 ? ',' : '';
      lines.push(`    {"x": ${p.x}, "y": ${p.y}}${comma}`);
    });
    const boxComma = bi < startboxes.length - 1 ? ',' : '';
    lines.push(`  ]}${boxComma}`);
  });
  lines.push(']}');
  inputEl.value = lines.join('\n');
  const counts = teamSquares.map((s, i) => `T${i + 1}:${s.length}`);
  const total = teamSquares.reduce((a, s) => a + s.length, 0);
  inputStatus.textContent = `${counts.join(' ')} (${total} sq)`;
  inputStatus.className = 'status ok';
}

function gridToFramePercent(gx, gy) {
  // Convert 0–200 grid to % position within mapFrame
  const imgRect = getImageRect();
  const frameRect = mapFrame.getBoundingClientRect();
  if (imgRect) {
    const px = imgRect.left + (gx / 200) * imgRect.width;
    const py = imgRect.top + (gy / 200) * imgRect.height;
    return {
      x: ((px - frameRect.left) / frameRect.width) * 100,
      y: ((py - frameRect.top) / frameRect.height) * 100,
    };
  }
  return { x: (gx / 200) * 100, y: (gy / 200) * 100 };
}

function drawOverlay() {
  const rect = mapFrame.getBoundingClientRect();
  mapCanvas.width = rect.width;
  mapCanvas.height = rect.height;
  const ctx = mapCanvas.getContext('2d');
  ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

  for (let t = 0; t < teamSquares.length; t++) {
    const squares = teamSquares[t];
    const rawPoly = teamPolys[t];
    if (squares.length === 0 && rawPoly.length === 0) continue;
    const col = TEAM_COLORS[t];

    if (rawPoly.length > 0) {
      ctx.strokeStyle = col.poly;
      ctx.fillStyle = col.fill;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < rawPoly.length; i++) {
        const p = gridToFramePercent(rawPoly[i].x, rawPoly[i].y);
        const px = (p.x / 100) * mapCanvas.width;
        const py = (p.y / 100) * mapCanvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      continue;
    }

    ctx.strokeStyle = col.stroke;
    ctx.fillStyle = col.fill;
    ctx.lineWidth = 2;
    for (const s of squares) {
      const tl = gridToFramePercent(s.x, s.y);
      const br = gridToFramePercent(s.x + SQUARE_SIZE, s.y + SQUARE_SIZE);
      const x = (tl.x / 100) * mapCanvas.width;
      const y = (tl.y / 100) * mapCanvas.height;
      const w = ((br.x - tl.x) / 100) * mapCanvas.width;
      const h = ((br.y - tl.y) / 100) * mapCanvas.height;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    }

    const poly = buildPolygon(squares);
    if (poly.length >= 2) {
      ctx.strokeStyle = col.poly;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < poly.length; i++) {
        const p = gridToFramePercent(poly[i].x, poly[i].y);
        const px = (p.x / 100) * mapCanvas.width;
        const py = (p.y / 100) * mapCanvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

function placeSquare(gx, gy) {
  const x = Math.max(0, Math.min(200 - SQUARE_SIZE, gx));
  const y = Math.max(0, Math.min(200 - SQUARE_SIZE, gy));
  teamSquares[activeTeam].push({ x, y });
  const n = teamSquares[activeTeam].length;
  coordDisplay.textContent = `Team ${activeTeam + 1} — square ${n}: (${x},${y})–(${x + SQUARE_SIZE},${y + SQUARE_SIZE})`;
  updateJSONFromSquares();
  drawOverlay();
}

function loadMapImage(url) {
  mapImage.onload = () => drawOverlay();
  mapImage.src = url;
  mapFrame.classList.add('has-image');
  clickMarker.style.display = 'none';
  setActiveTeam(activeTeam);
}

mapImageInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  loadMapImage(URL.createObjectURL(file));
});

btnClearImage.addEventListener('click', () => {
  mapImage.src = '';
  mapFrame.classList.remove('has-image');
  mapImageInput.value = '';
  clickMarker.style.display = 'none';
  setActiveTeam(activeTeam);
  drawOverlay();
});

teamButtons.forEach((btn, i) => {
  btn.addEventListener('click', () => setActiveTeam(i));
});

btnUndoSquare.addEventListener('click', () => {
  if (teamSquares[activeTeam].length === 0) return;
  teamSquares[activeTeam].pop();
  setActiveTeam(activeTeam);
  updateJSONFromSquares();
  drawOverlay();
});

btnClearSquares.addEventListener('click', () => {
  teamSquares = [[], [], [], []];
  teamPolys = [[], [], [], []];
  setActiveTeam(activeTeam);
  inputEl.value = '';
  inputStatus.textContent = '';
  drawOverlay();
});

// ---- Drag to move a placed square (or an imported poly chain) ----
// Press any team's square/poly and hold+move to reposition it. Dragging does
// not switch the active team. Only an actual move suppresses the click that
// follows the release (so it doesn't drop an extra square).
let dragState = null;
let suppressNextClick = false;

function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function hitTestGrid(gx, gy) {
  // Squares first (most recent wins), then imported poly chains; any team may
  // be grabbed without switching the active team.
  for (let t = 0; t < 4; t++) {
    for (let i = teamSquares[t].length - 1; i >= 0; i--) {
      const s = teamSquares[t][i];
      if (gx >= s.x && gx < s.x + SQUARE_SIZE && gy >= s.y && gy < s.y + SQUARE_SIZE) {
        return { team: t, index: i, isPoly: false };
      }
    }
  }
  for (let t = 0; t < 4; t++) {
    if (teamPolys[t].length > 0 && pointInPoly(gx, gy, teamPolys[t])) {
      return { team: t, index: 0, isPoly: true };
    }
  }
  return null;
}

mapFrame.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  suppressNextClick = false;
  const g = clientToGrid(e.clientX, e.clientY);
  if (!g) return;
  const hit = hitTestGrid(g.x, g.y);
  if (!hit) return;

  dragState = {
    team: hit.team,
    index: hit.index,
    isPoly: hit.isPoly,
    startGX: g.x,
    startGY: g.y,
    moved: false,
    startPos: hit.isPoly
      ? teamPolys[hit.team].map((p) => ({ ...p }))
      : { ...teamSquares[hit.team][hit.index] },
  };
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!dragState) return;
  const g = clientToGrid(e.clientX, e.clientY);
  if (!g) return;
  const d = dragState;
  if (g.x !== d.startGX || g.y !== d.startGY) d.moved = true;
  const dx = g.x - d.startGX;
  const dy = g.y - d.startGY;

  let label;
  if (d.isPoly) {
    teamPolys[d.team] = d.startPos.map((p) => ({
      x: Math.max(0, Math.min(200, p.x + dx)),
      y: Math.max(0, Math.min(200, p.y + dy)),
    }));
    label = `Team ${d.team + 1} — chain dragged (${teamPolys[d.team].length} pts)`;
  } else {
    const s = teamSquares[d.team][d.index];
    s.x = Math.max(0, Math.min(200 - SQUARE_SIZE, d.startPos.x + dx));
    s.y = Math.max(0, Math.min(200 - SQUARE_SIZE, d.startPos.y + dy));
    label = `Team ${d.team + 1} — square at (${s.x},${s.y})–(${s.x + SQUARE_SIZE},${s.y + SQUARE_SIZE})`;
  }
  coordDisplay.textContent = label;
  updateJSONFromSquares();
  drawOverlay();
});

document.addEventListener('mouseup', () => {
  if (!dragState) return;
  if (dragState.moved) suppressNextClick = true;
  dragState = null;
  clickMarker.style.display = 'none';
});

mapFrame.addEventListener('click', (e) => {
  // After a real drag, ignore the trailing click so it doesn't place a square
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  const g = clientToGrid(e.clientX, e.clientY);
  if (!g) return;
  placeSquare(g.x, g.y);

  // Marker at click
  const frameRect = mapFrame.getBoundingClientRect();
  if (g.imgRect) {
    const cx = g.x / 200;
    const cy = g.y / 200;
    const markerX =
      ((g.imgRect.left - frameRect.left + cx * g.imgRect.width) / frameRect.width) * 100;
    const markerY =
      ((g.imgRect.top - frameRect.top + cy * g.imgRect.height) / frameRect.height) * 100;
    clickMarker.style.left = markerX + '%';
    clickMarker.style.top = markerY + '%';
  } else {
    clickMarker.style.left = (g.x / 200) * 100 + '%';
    clickMarker.style.top = (g.y / 200) * 100 + '%';
  }
  clickMarker.style.display = 'block';
});

// Redraw overlay when pane is resized
const resizeObs = new ResizeObserver(() => drawOverlay());
resizeObs.observe(mapFrame);

setActiveTeam(0);

loadMapImage('public/maps/Krakatoa.png');

// ---- Resizable splitters ----
function makeSplitter(el, direction) {
  let startPos = 0;
  let startSizeA = 0;
  let startSizeB = 0;

  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    el.classList.add('active');
    if (direction === 'v') {
      document.body.classList.add('dragging');
      startPos = e.clientX;
      startSizeA = paneLeft.getBoundingClientRect().width;
      startSizeB = paneRight.getBoundingClientRect().width;
    } else {
      document.body.classList.add('dragging-h');
      startPos = e.clientY;
      startSizeA = rightTop.getBoundingClientRect().height;
      startSizeB = rightBottom.getBoundingClientRect().height;
    }

    function onMove(ev) {
      if (direction === 'v') {
        const dx = ev.clientX - startPos;
        const total = startSizeA + startSizeB;
        let newA = startSizeA + dx;
        newA = Math.max(120, Math.min(total - 200, newA));
        const pctA = (newA / total) * 100;
        const pctB = 100 - pctA;
        paneLeft.style.flex = `0 0 ${pctA}%`;
        paneRight.style.flex = `0 0 ${pctB}%`;
      } else {
        const dy = ev.clientY - startPos;
        const total = startSizeA + startSizeB;
        let newA = startSizeA + dy;
        newA = Math.max(80, Math.min(total - 100, newA));
        rightTop.style.flex = `0 0 ${newA}px`;
        rightBottom.style.flex = `1 1 auto`;
      }
    }

    function onUp() {
      el.classList.remove('active');
      document.body.classList.remove('dragging', 'dragging-h');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

makeSplitter(splitterV, 'v');
makeSplitter(splitterH, 'h');
