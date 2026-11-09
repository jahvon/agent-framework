// Layout checks on converted Excalidraw elements (text already measured). Pure: no I/O.
// Each finding is { id, message }; they catch what a glance at the PNG tends to miss.

const SHAPES = new Set(["rectangle", "ellipse", "diamond"]);
const TOLERANCE = 8;

export function lint(elements) {
  const live = elements.filter((e) => !e.isDeleted);
  const byId = new Map(live.map((e) => [e.id, e]));
  const texts = live.filter((e) => e.type === "text");
  // Zones (dashed, unfilled) and caption holders (invisible) are backdrops, not obstacles.
  const backdrop = (e) => e.backgroundColor === "transparent" && (e.strokeStyle === "dashed" || e.strokeColor === "transparent");
  const solidShapes = live.filter((e) => SHAPES.has(e.type) && !backdrop(e));
  const arrows = live.filter((e) => e.type === "arrow");
  const findings = [];
  const add = (el, message) => findings.push({ id: el.id, message });
  const labels = new Map(texts.filter((t) => t.containerId).map((t) => [t.containerId, t]));
  const name = (el) => {
    if (labels.has(el.id)) return quote(labels.get(el.id));
    if (el.type === "text") return quote(el);
    if (el.type === "arrow") {
      const free = [el.points[0], el.points.at(-1)].map(([x, y]) => `(${Math.round(el.x + x)}, ${Math.round(el.y + y)})`);
      const ends = [el.startBinding, el.endBinding].map((b, i) => (b && byId.get(b.elementId) ? name(byId.get(b.elementId)) : free[i]));
      return `arrow ${ends[0]} → ${ends[1]}`;
    }
    return `${el.type} at (${Math.round(el.x)}, ${Math.round(el.y)})`;
  };

  for (const t of texts) {
    if (!t.containerId) continue;
    const box = byId.get(t.containerId);
    if (!box) continue;
    if (t.text.split("\n").length > t.originalText.split("\n").length) {
      add(box, `label ${quote(t)} wraps; widen the box or shorten the label`);
    }
    if (t.height > box.height - 4) add(box, `label ${quote(t)} is taller than its box (${Math.ceil(t.height)} > ${box.height})`);
  }

  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (overlap(rect(texts[i]), rect(texts[j])) > 4) add(texts[i], `text ${quote(texts[i])} overlaps ${quote(texts[j])}`);
    }
  }

  for (const t of texts.filter((t) => !t.containerId)) {
    const r = rect(t);
    for (const s of solidShapes) {
      const o = overlap(r, rect(s));
      if (o > 4 && !contains(rect(s), r)) add(t, `text ${quote(t)} crosses the edge of ${name(s)}`);
    }
  }

  for (const a of arrows) {
    const pts = a.points.map(([x, y]) => [a.x + x, a.y + y]);
    for (const [binding, p] of [[a.startBinding, pts[0]], [a.endBinding, pts.at(-1)]]) {
      const target = binding && byId.get(binding.elementId);
      if (target && distanceToRect(p, rect(target)) > TOLERANCE) {
        add(a, `${name(a)} ends ${Math.round(distanceToRect(p, rect(target)))}px from ${name(target)}`);
      }
    }
    const ends = new Set([a.startBinding?.elementId, a.endBinding?.elementId]);
    for (const s of solidShapes) {
      if (ends.has(s.id)) continue;
      if (segments(pts).some(([p, q]) => segmentHitsRect(p, q, shrink(rect(s), 2)))) add(a, `${name(a)} crosses ${name(s)}`);
    }
    for (const t of texts) {
      if (t.containerId === a.id) continue;
      if (segments(pts).some(([p, q]) => segmentHitsRect(p, q, shrink(rect(t), 3)))) add(a, `${name(a)} runs through text ${quote(t)}`);
    }
  }
  return dedupe(findings);
}

function quote(t) {
  const s = t.originalText.replace(/\n/g, " ");
  // Single quotes stay unescaped in flow's logfmt logs.
  return `'${s.length > 32 ? `${s.slice(0, 31)}…` : s}'`;
}

function rect(e) {
  return { x: e.x, y: e.y, w: Math.abs(e.width), h: Math.abs(e.height) };
}

function shrink(r, d) {
  return { x: r.x + d, y: r.y + d, w: Math.max(0, r.w - 2 * d), h: Math.max(0, r.h - 2 * d) };
}

function overlap(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function contains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
}

function distanceToRect([px, py], r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

function segments(pts) {
  return pts.slice(1).map((q, i) => [pts[i], q]);
}

// Liang–Barsky clip: does segment p→q pass through rectangle r?
function segmentHitsRect([x0, y0], [x1, y1], r) {
  if (r.w === 0 || r.h === 0) return false;
  const dx = x1 - x0;
  const dy = y1 - y0;
  let t0 = 0;
  let t1 = 1;
  for (const [p, q] of [[-dx, x0 - r.x], [dx, r.x + r.w - x0], [-dy, y0 - r.y], [dy, r.y + r.h - y0]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}

function dedupe(findings) {
  const seen = new Set();
  return findings.filter((f) => !seen.has(`${f.id}|${f.message}`) && seen.add(`${f.id}|${f.message}`));
}
