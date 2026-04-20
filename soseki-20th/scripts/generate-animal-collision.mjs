/**
 * PNG アルファから最大連結成分の外周をトレースし、Douglas–Peucker で間引いた頂点を JSON に書き出す。
 * 頂点は画像中心基準の無次元座標（描画の drawImage(..., -r,-r,2r,2r) と整合）で、多角形の重心を原点に合わせる。
 *
 * Usage: node scripts/generate-animal-collision.mjs [--epsilon=12] [--convex]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INPUT_DIR = path.join(ROOT, 'public/games/animals');
const OUT_FILE = path.join(ROOT, 'data/games/animal-tower-collision.json');

const ALPHA_THRESHOLD = 128;
const MAX_RAW_CONTOUR = 8000;

function parseArgs(argv) {
  let epsilon = 12;
  let convex = false;
  for (const a of argv) {
    if (a === '--convex') convex = true;
    else if (a.startsWith('--epsilon=')) epsilon = Number(a.slice('--epsilon='.length));
  }
  if (!Number.isFinite(epsilon) || epsilon <= 0) epsilon = 12;
  return { epsilon, convex };
}

/** @param {Uint8Array} mask row-major w*h, values 0|1 */
function largestComponentMask(mask, w, h) {
  const visited = new Uint8Array(w * h);
  let bestMask = /** @type {Uint8Array | null} */ (null);
  let bestSize = 0;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = py * w + px;
      if (!mask[i] || visited[i]) continue;

      const comp = new Uint8Array(w * h);
      const stack = [i];
      visited[i] = 1;
      let size = 0;

      while (stack.length) {
        const cur = stack.pop();
        comp[cur] = 1;
        size++;
        const x = cur % w;
        const y = (cur / w) | 0;
        const n = y * w + (x + 1);
        const w_ = y * w + (x - 1);
        const s = (y + 1) * w + x;
        const nn = (y - 1) * w + x;
        if (x + 1 < w && mask[n] && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
        if (x > 0 && mask[w_] && !visited[w_]) {
          visited[w_] = 1;
          stack.push(w_);
        }
        if (y + 1 < h && mask[s] && !visited[s]) {
          visited[s] = 1;
          stack.push(s);
        }
        if (y > 0 && mask[nn] && !visited[nn]) {
          visited[nn] = 1;
          stack.push(nn);
        }
      }

      if (size > bestSize) {
        bestSize = size;
        bestMask = comp;
      }
    }
  }
  return bestMask;
}

/** Moore 近傍（外周トレース）。mask は 0/1 */
function traceOuterContour(mask, w, h) {
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? mask[y * w + x] : 0);

  let startX = -1;
  let startY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (get(x, y) && !get(x, y - 1)) {
        startX = x;
        startY = y;
        y = h;
        break;
      }
    }
  }
  if (startX < 0) return [];

  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  const contour = [];
  let x = startX;
  let y = startY;
  /** @type {number} 直前に「どの方向へ」進んだか（dirs のインデックス） */
  let dir = 7;

  const maxIter = w * h * 10 + 50;
  for (let iter = 0; iter < maxIter; iter++) {
    contour.push([x, y]);
    const startCheck = (dir + 5) % 8;
    let found = false;
    for (let i = 0; i < 8; i++) {
      const d = (startCheck + i) % 8;
      const nx = x + dirs[d][0];
      const ny = y + dirs[d][1];
      if (get(nx, ny)) {
        x = nx;
        y = ny;
        dir = d;
        found = true;
        break;
      }
    }
    if (!found) break;
    if (x === startX && y === startY && contour.length > 1) break;
  }

  return contour;
}

function perpendicularDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const nx = t <= 0 ? x1 : t >= 1 ? x2 : x1 + t * dx;
  const ny = t <= 0 ? y1 : t >= 1 ? y2 : y1 + t * dy;
  return Math.hypot(px - nx, py - ny);
}

/** @param {number[][]} pts [x,y][] closed or open polyline */
function douglasPeucker(pts, epsilon) {
  if (pts.length <= 2) return pts.slice();
  let maxDist = 0;
  let index = 0;
  const end = pts.length - 1;
  const [x1, y1] = pts[0];
  const [x2, y2] = pts[end];
  for (let i = 1; i < end; i++) {
    const [px, py] = pts[i];
    const d = perpendicularDistance(px, py, x1, y1, x2, y2);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(pts.slice(0, index + 1), epsilon);
    const right = douglasPeucker(pts.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [pts[0], pts[end]];
}

function cross(o, a, b) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Andrew monotone chain — 出力は反時計回りの閉じないリスト（最後の点は最初と重複しない） */
function convexHull(points) {
  const pts = [...points].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  if (pts.length <= 2) return pts;
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/** 閉じた多角形の幾何学的重心（ピクセル座標） */
function polygonCentroid(pts) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  const n = pts.length;
  if (n < 3) return [0, 0];
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const c = x0 * y1 - x1 * y0;
    a += c;
    cx += (x0 + x1) * c;
    cy += (y0 + y1) * c;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-6) {
    let sx = 0;
    let sy = 0;
    for (const [x, y] of pts) {
      sx += x;
      sy += y;
    }
    return [sx / n, sy / n];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function subsampleRing(ring, maxPts) {
  if (ring.length <= maxPts) return ring;
  const step = ring.length / maxPts;
  const out = [];
  for (let i = 0; i < maxPts; i++) {
    out.push(ring[(i * step) | 0]);
  }
  return out;
}

function normalizeToJsonShape(ringPx, w, h) {
  const closed = ringPx.length > 0 && (ringPx[0][0] !== ringPx[ringPx.length - 1][0] || ringPx[0][1] !== ringPx[ringPx.length - 1][1]) ? [...ringPx, ringPx[0]] : ringPx;

  let [cx, cy] = polygonCentroid(closed.slice(0, -1));
  const verts = closed.slice(0, -1).map(([px, py]) => {
    const nx = (px / w - 0.5) * 2;
    const ny = (py / h - 0.5) * 2;
    return { x: nx, y: ny };
  });
  const cxN = (cx / w - 0.5) * 2;
  const cyN = (cy / h - 0.5) * 2;
  for (const v of verts) {
    v.x -= cxN;
    v.y -= cyN;
  }

  let halfExtent = 0;
  for (const v of verts) {
    halfExtent = Math.max(halfExtent, Math.abs(v.x), Math.abs(v.y));
  }

  return { vertices: verts, halfExtent };
}

async function processPng(filePath, { epsilon, convex }) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const channels = info.channels;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = data[i * channels + channels - 1];
    mask[i] = a > ALPHA_THRESHOLD ? 1 : 0;
  }

  const comp = largestComponentMask(mask, w, h);
  if (!comp) {
    throw new Error('前景が見つかりません');
  }

  let ring = traceOuterContour(comp, w, h);
  if (ring.length < 3) {
    throw new Error('輪郭が短すぎます');
  }

  ring = subsampleRing(ring, MAX_RAW_CONTOUR);
  let simplified = douglasPeucker(ring, epsilon);
  if (simplified.length > 0) {
    const f = simplified[0];
    const l = simplified[simplified.length - 1];
    if (f[0] === l[0] && f[1] === l[1]) simplified = simplified.slice(0, -1);
  }

  if (convex) {
    simplified = convexHull(simplified);
  }

  if (simplified.length < 3) {
    throw new Error('簡略化後の頂点数が不足しています');
  }

  return normalizeToJsonShape(simplified, w, h);
}

async function main() {
  const { epsilon, convex } = parseArgs(process.argv.slice(2));
  const files = (await fs.readdir(INPUT_DIR))
    .filter((f) => f.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.error('No PNG files in', INPUT_DIR);
    process.exit(1);
  }

  /** @type {Record<string, { vertices: { x: number; y: number }[]; halfExtent: number }>} */
  const out = {};

  for (const f of files) {
    const full = path.join(INPUT_DIR, f);
    try {
      out[f] = await processPng(full, { epsilon, convex });
      console.log(`${f}: ${out[f].vertices.length} verts, halfExtent=${out[f].halfExtent.toFixed(3)}`);
    } catch (e) {
      console.error(`${f}:`, e);
      process.exit(1);
    }
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log('Wrote', OUT_FILE);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
