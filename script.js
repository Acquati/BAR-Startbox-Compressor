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

const paneLeft = document.getElementById('paneLeft');
const paneRight = document.getElementById('paneRight');
const rightTop = document.getElementById('rightTop');
const rightBottom = document.getElementById('rightBottom');
const splitterV = document.getElementById('splitterV');
const splitterH = document.getElementById('splitterH');

// Per-team squares: each is {x, y} = top-left of a 2×2 square on the 0–200 grid
let teamSquares = [[], [], [], []]; // Teams 1–4
let activeTeam = 0;
const SQUARE_SIZE = 2;
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
  coordDisplay.textContent = `Team ${t + 1}` + (n ? ` — ${n} square(s)` : ' — click to place 2×2');
}

const EXAMPLE = `{
  "startboxes": [
    {
      "poly": [
        {"x": 0, "y": 107},
        {"x": 75, "y": 125},
        {"x": 105, "y": 132},
        {"x": 121, "y": 139},
        {"x": 200, "y": 165},
        {"x": 200, "y": 200},
        {"x": 0, "y": 200}
      ]
    },
    {
      "poly": [
        {"x": 0, "y": 0},
        {"x": 200, "y": 0},
        {"x": 200, "y": 44},
        {"x": 127, "y": 52},
        {"x": 117, "y": 53},
        {"x": 102, "y": 54},
        {"x": 67, "y": 58},
        {"x": 0, "y": 65},
        {"x": 0, "y": 50},
        {"x": 0, "y": 8}
      ]
    }
  ]
}`;

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

btnExample.addEventListener('click', () => {
  inputEl.value = EXAMPLE;
  doCompress();
});

inputEl.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    doCompress();
  }
});

// ---- Map: 2×2 square placer + polygon builder ----
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
    const poly = buildPolygon(teamSquares[t]);
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
    if (squares.length === 0) continue;
    const col = TEAM_COLORS[t];

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

mapImageInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  mapImage.onload = () => drawOverlay();
  mapImage.src = url;
  mapFrame.classList.add('has-image');
  clickMarker.style.display = 'none';
  setActiveTeam(activeTeam);
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
  setActiveTeam(activeTeam);
  inputEl.value = '';
  inputStatus.textContent = '';
  drawOverlay();
});

mapFrame.addEventListener('click', (e) => {
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
