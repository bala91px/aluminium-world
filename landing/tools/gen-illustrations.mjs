/**
 * Generates the three isometric CAD line-art illustrations used behind the
 * "What we do" switcher. Run: node landing/tools/gen-illustrations.mjs
 *
 * These are drawn with true isometric projection rather than hand-tuned paths,
 * so the three products share one camera and read as a single set.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'img');

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

/** Isometric projection: world (x right, y up, z toward viewer) -> screen. */
const P = (x, y, z) => [(x - z) * COS30, (x + z) * SIN30 - y];

/* ---------- drawing surface ---------- */

function surface() {
  const parts = [];
  const pts = [];
  const n = (v) => Math.round(v * 100) / 100;

  const track = (p) => {
    pts.push(p);
    return p;
  };

  const api = {
    /** Straight segment between two world-space points. */
    line(a, b, attrs = '') {
      const A = track(P(...a));
      const B = track(P(...b));
      parts.push(`<path d="M${n(A[0])} ${n(A[1])}L${n(B[0])} ${n(B[1])}"${attrs}/>`);
    },
    /** Polyline / polygon through world-space points. */
    poly(points, { close = false, attrs = '' } = {}) {
      const d = points
        .map((p, i) => {
          const S = track(P(...p));
          return `${i ? 'L' : 'M'}${n(S[0])} ${n(S[1])}`;
        })
        .join('');
      parts.push(`<path d="${d}${close ? 'Z' : ''}"${attrs}/>`);
    },
    /** Axis-aligned rectangle on a constant-z plane. */
    rectXY(x0, y0, x1, y1, z, opts) {
      api.poly(
        [
          [x0, y0, z],
          [x1, y0, z],
          [x1, y1, z],
          [x0, y1, z],
        ],
        { close: true, ...opts }
      );
    },
    /** Connects the same rectangle at two depths into a wireframe box. */
    boxXY(x0, y0, x1, y1, zNear, zFar, opts) {
      api.rectXY(x0, y0, x1, y1, zNear, opts);
      api.rectXY(x0, y0, x1, y1, zFar, opts);
      for (const [cx, cy] of [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
      ]) {
        api.line([cx, cy, zNear], [cx, cy, zFar], opts?.attrs ?? '');
      }
    },
    /** Diagonal hatch reading as glazing in an elevation drawing. */
    glass(x0, y0, x1, y1, z, step = 90) {
      const w = x1 - x0;
      const h = y1 - y0;
      for (let o = step; o < w + h; o += step) {
        // 45-degree line clipped to the pane rectangle
        let ax = x0 + Math.min(o, w);
        let ay = y0 + Math.max(0, o - w);
        let bx = x0 + Math.max(0, o - h);
        let by = y0 + Math.min(o, h);
        if (ay > y1 || bx > x1) continue;
        api.line([ax, ay, z], [bx, by, z], ' class="hair"');
      }
    },
    /** CAD dimension line with tick serifs and extension legs. */
    dimension(x0, x1, y, z, drop = 90) {
      api.line([x0, y, z], [x0, y - drop, z], ' class="hair"');
      api.line([x1, y, z], [x1, y - drop, z], ' class="hair"');
      const dy = y - drop * 0.6;
      api.line([x0, dy, z], [x1, dy, z], ' class="hair"');
      for (const x of [x0, x1]) {
        api.line([x - 22, dy - 22, z], [x + 22, dy + 22, z], ' class="hair"');
      }
    },
    render(id) {
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const pad = 60;
      const minX = Math.min(...xs) - pad;
      const minY = Math.min(...ys) - pad;
      const w = Math.max(...xs) - minX + pad;
      const h = Math.max(...ys) - minY + pad;
      return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(minX)} ${n(minY)} ${n(w)} ${n(h)}"`,
        ` fill="none" stroke="#9E0119" stroke-width="5" stroke-linejoin="round"`,
        ` stroke-linecap="round" role="img" aria-label="${id}">`,
        `<style>.hair{stroke-width:3;stroke:#AE0220}.solid{fill:#C10020;stroke:none}.thick{stroke-width:8}</style>`,
        parts.join(''),
        `</svg>`,
      ].join('');
    },
  };
  return api;
}

/* ---------- 1. Windows & doors: three-panel slider with fixed top light ---------- */

function windows() {
  const s = surface();
  const W = 1500;
  const H = 880;
  const D = 170;
  const T = 52; // frame face width
  const TRANSOM = 600; // height of the operable band

  s.boxXY(0, 0, W, H, 0, D, { attrs: ' class="thick"' });
  s.rectXY(T, T, W - T, H - T, 0);
  s.line([0, TRANSOM, 0], [W, TRANSOM, 0]);
  s.line([0, TRANSOM, D], [W, TRANSOM, D]);
  s.line([0, TRANSOM, 0], [0, TRANSOM, D]);
  s.line([W, TRANSOM, 0], [W, TRANSOM, D]);

  // fixed light above the transom
  s.rectXY(T + 26, TRANSOM + 26, W - T - 26, H - T - 26, 0);
  s.glass(T + 26, TRANSOM + 26, W - T - 26, H - T - 26, 0, 130);

  // three sliding leaves below
  const bay = (W - 2 * T) / 3;
  for (let i = 0; i < 3; i++) {
        const x0 = T + i * bay;
    const x1 = x0 + bay;
    const zLeaf = i === 1 ? D * 0.55 : D * 0.2; // centre leaf rides the outer track
    s.rectXY(x0 + 14, T + 20, x1 - 14, TRANSOM - 20, zLeaf);
    s.rectXY(x0 + 46, T + 52, x1 - 46, TRANSOM - 52, zLeaf);
    if (i !== 2) s.glass(x0 + 46, T + 52, x1 - 46, TRANSOM - 52, zLeaf, 120);
    // interlock stile
    s.line([x1 - 14, T + 20, zLeaf], [x1 - 14, TRANSOM - 20, zLeaf], ' class="thick"');
  }

  // pull handle on the centre leaf
  const hx = T + bay * 2 - 90;
  const hz = D * 0.55;
  s.rectXY(hx, 300, hx + 30, 420, hz, { attrs: ' class="solid"' });
  s.rectXY(hx - 12, 288, hx + 42, 432, hz);

  // bottom track rails
  s.line([T, T + 6, D * 0.2], [W - T, T + 6, D * 0.2], ' class="hair"');
  s.line([T, T + 6, D * 0.55], [W - T, T + 6, D * 0.55], ' class="hair"');

  s.dimension(0, W, -40, 0);
  return s.render('Aluminium sliding window assembly');
}

/* ---------- 2. Partitions & facades: glazed curtain wall bay with a door ---------- */

function partitions() {
  const s = surface();
  const W = 1680;
  const H = 1000;
  const D = 130;
  const COLS = 4;
  const ROWS = 3;
  const cw = W / COLS;
  const rh = H / ROWS;

  s.boxXY(0, 0, W, H, 0, D, { attrs: ' class="thick"' });

  // mullions carry the depth; transoms sit on the face only
  for (let c = 1; c < COLS; c++) {
    const x = c * cw;
    s.line([x, 0, 0], [x, H, 0], ' class="thick"');
    s.line([x, 0, D], [x, H, D]);
    s.line([x, 0, 0], [x, 0, D], ' class="hair"');
    s.line([x, H, 0], [x, H, D], ' class="hair"');
  }
  for (let r = 1; r < ROWS; r++) {
    const y = r * rh;
    s.line([0, y, 0], [W, y, 0]);
    s.line([0, y, D], [W, y, D], ' class="hair"');
  }

  // glazing: hatch a diagonal set of bays so the field stays readable
  const hatched = [
    [0, 2],
    [1, 1],
    [2, 2],
    [3, 0],
    [3, 2],
  ];
  for (const [c, r] of hatched) {
    s.glass(c * cw + 40, r * rh + 40, (c + 1) * cw - 40, (r + 1) * rh - 40, 0, 140);
  }
  // spandrel infill panel
  s.rectXY(1 * cw + 34, 0 * rh + 34, 2 * cw - 34, 1 * rh - 34, 0, { attrs: ' class="solid"' });

  // entrance door occupying the first bay, lower two rows
  const dx0 = 34;
  const dx1 = cw - 34;
  const dy1 = rh * 2 - 34;
  s.rectXY(dx0, 34, dx1, dy1, 0, { attrs: ' class="thick"' });
  s.rectXY(dx0 + 40, 74, dx1 - 40, dy1 - 40, 0);
  // elevation swing symbol: hinge on the left stile
  s.poly(
    [
      [dx1 - 10, 34, 0],
      [dx0 + 10, (34 + dy1) / 2, 0],
      [dx1 - 10, dy1, 0],
    ],
    { attrs: ' class="hair" stroke-dasharray="26 22"' }
  );
  // lever handle
  s.rectXY(dx1 - 130, rh * 0.82, dx1 - 60, rh * 0.92, 0, { attrs: ' class="solid"' });

  s.dimension(0, W, -40, 0);
  return s.render('Aluminium curtain wall and partition bay');
}

/* ---------- 3. Railings & louvres: balustrade run plus a louvre blade stack ---------- */

function railings() {
  const s = surface();
  const RUN = 1500;
  const HR = 620; // handrail height
  const DEPTH = 240;
  const POSTS = 6;

  // floor slab edge for grounding
  s.rectXY(-60, -110, RUN + 60, -10, 0, { attrs: ' class="hair"' });
  s.line([-60, -10, 0], [-60, -10, DEPTH], ' class="hair"');
  s.line([RUN + 60, -10, 0], [RUN + 60, -10, DEPTH], ' class="hair"');
  s.line([-60, -10, DEPTH], [RUN + 60, -10, DEPTH], ' class="hair"');

  // handrail drawn as a tube: two rails plus depth edges
  for (const z of [0, 70]) {
    s.line([0, HR, z], [RUN, HR, z], ' class="thick"');
    s.line([0, HR - 46, z], [RUN, HR - 46, z]);
  }
  s.rectXY(0, HR - 46, 0, HR, 0); // cap line
  s.line([0, HR, 0], [0, HR, 70], ' class="hair"');
  s.line([0, HR - 46, 0], [0, HR - 46, 70], ' class="hair"');
  s.line([RUN, HR, 0], [RUN, HR, 70], ' class="hair"');
  s.line([RUN, HR - 46, 0], [RUN, HR - 46, 70], ' class="hair"');

  // bottom rail
  s.line([0, 120, 0], [RUN, 120, 0]);
  s.line([0, 120, 70], [RUN, 120, 70], ' class="hair"');

  // posts with base plates in the floor plane
  const gap = RUN / (POSTS - 1);
  for (let i = 0; i < POSTS; i++) {
    const x = i * gap;
    const w = 26;
    s.boxXY(x - w, 0, x + w, HR - 46, 0, 70, { attrs: i % 2 === 0 ? ' class="thick"' : '' });
    // base plate footprint
    s.poly(
      [
        [x - 70, 2, -50],
        [x + 70, 2, -50],
        [x + 70, 2, 120],
        [x - 70, 2, 120],
      ],
      { close: true, attrs: ' class="hair"' }
    );
  }

  // vertical infill balusters between posts
  for (let i = 0; i < POSTS - 1; i++) {
    for (let b = 1; b <= 4; b++) {
      const x = i * gap + (gap * b) / 5;
      s.line([x, 120, 35], [x, HR - 46, 35], ' class="hair"');
    }
  }

  // louvre screen standing beside the run — deliberately narrower than the
  // balustrade so the two products stay legible as separate things
  const BLADES = 5;
  const bladeW = 260;
  const rake = 0.7;
  for (let i = 0; i < BLADES; i++) {
    const y = HR + 210 + i * 104;
    const x0 = RUN * 0.52;
    const x1 = x0 + RUN * 0.46;
    s.poly(
      [
        [x0, y, 0],
        [x1, y, 0],
        [x1, y + bladeW * rake * 0.5, bladeW],
        [x0, y + bladeW * rake * 0.5, bladeW],
      ],
      { close: true, attrs: i % 3 === 1 ? ' class="hair"' : '' }
    );
  }
  // louvre end carriers, dropped to the handrail so the screen is supported
  for (const x of [RUN * 0.52, RUN * 0.52 + RUN * 0.46]) {
    s.line([x, HR, 0], [x, HR + 210 + BLADES * 104, 0], ' class="thick"');
    s.line([x, HR, bladeW], [x, HR + 210 + BLADES * 104, bladeW], ' class="hair"');
  }

  s.dimension(0, RUN, -160, 0);
  return s.render('Aluminium balustrade and louvre assembly');
}

mkdirSync(OUT, { recursive: true });
const files = {
  'windows.svg': windows(),
  'partitions.svg': partitions(),
  'railings.svg': railings(),
};
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(resolve(OUT, name), svg);
  console.log(`${name}  ${(svg.length / 1024).toFixed(1)} KB`);
}
