// Expands the shorthand skeleton format (roles, kinds, auto-routed arrows) into plain
// Excalidraw skeleton elements that convertToExcalidrawElements accepts. Pure: no I/O.

const SHAPES = new Set(["rectangle", "ellipse", "diamond"]);
const SHORTHAND = ["role", "kind", "color", "from", "to", "via", "path", "cx", "cy", "r", "dashed", "title"];

export function isSkeleton(scene) {
  return scene.elements.some((el) => el.seed === undefined);
}

export function expandScene(scene, palette) {
  const color = (name, fallback) => resolveColor(name ?? fallback, palette);
  const out = [];
  const shapes = new Map();

  for (const el of scene.elements) {
    for (const x of expandElement(el, palette, color)) {
      if (x.id && SHAPES.has(x.type)) shapes.set(x.id, x);
      out.push(x);
    }
  }
  for (const x of out) {
    if (x.type === "arrow" && (x.__from || x.__to)) routeArrow(x, shapes);
  }
  return {
    ...scene,
    appState: { viewBackgroundColor: palette.canvas, ...scene.appState },
    elements: out.map(strip),
  };
}

function expandElement(el, palette, color) {
  const role = el.role && palette.roles[el.role];
  if (el.role && !role) throw new Error(`unknown role "${el.role}" (known: ${Object.keys(palette.roles).join(", ")})`);

  switch (el.kind) {
    case "code": {
      const multiline = String(el.text ?? el.label?.text).includes("\n");
      const text = String(el.text ?? el.label?.text);
      return [{
        type: "rectangle",
        strokeColor: palette.code.stroke,
        backgroundColor: palette.code.fill,
        fillStyle: "solid",
        roundness: { type: 3 },
        ...el,
        label: {
          fontSize: 16,
          fontFamily: 3,
          strokeColor: color(el.color, palette.code.text),
          textAlign: multiline ? "left" : "center",
          ...el.label,
          text: multiline ? text.split("\n").map((l) => ` ${l}`).join("\n") : text,
        },
      }];
    }
    case "zone": {
      const titleColor = color(el.color, role?.stroke ?? "fg");
      return [
        {
          type: "rectangle",
          strokeColor: palette.colors.faint,
          backgroundColor: "transparent",
          strokeStyle: "dashed",
          strokeWidth: 2,
          roundness: { type: 3 },
          ...el,
        },
        ...(el.title ? [{ type: "text", x: el.x + 20, y: el.y + 14, text: el.title, fontSize: 20, strokeColor: titleColor }] : []),
      ];
    }
    case "caption": {
      // A transparent container so Excalidraw centers the text on cx.
      const fontSize = el.fontSize ?? 16;
      const lines = String(el.text).split("\n").length;
      const width = el.width ?? 200;
      return [{
        type: "rectangle",
        x: el.cx - width / 2,
        y: el.y,
        width,
        height: fontSize * 1.5 * lines,
        strokeColor: "transparent",
        backgroundColor: "transparent",
        label: { text: el.text, fontSize, fontFamily: el.fontFamily, strokeColor: color(el.color, "note") },
      }];
    }
    case "dot": {
      const r = el.r ?? 10;
      const c = color(el.color, role?.stroke ?? "line");
      return [{ type: "ellipse", x: el.cx - r, y: el.cy - r, width: 2 * r, height: 2 * r, strokeColor: c, backgroundColor: c, fillStyle: "solid", ...el }];
    }
    case undefined:
      break;
    default:
      throw new Error(`unknown kind "${el.kind}" (known: code, zone, caption, dot)`);
  }

  if (SHAPES.has(el.type)) {
    return [{
      ...(role && { strokeColor: role.stroke, backgroundColor: role.fill, fillStyle: "solid" }),
      strokeWidth: 2,
      roundness: el.type === "rectangle" ? { type: 3 } : undefined,
      ...el,
      ...(el.label && { label: { fontSize: 20, strokeColor: color(el.label.color, "fg"), ...el.label } }),
    }];
  }
  if (el.type === "text") {
    return [{ fontSize: 16, ...el, strokeColor: el.strokeColor ?? color(el.color, role?.stroke ?? "fg") }];
  }
  if (el.type === "arrow" || el.type === "line") {
    const stroke = el.strokeColor ?? color(el.color, role?.stroke ?? (el.type === "arrow" ? "line" : "faint"));
    const base = { strokeWidth: 2, ...el, strokeColor: stroke, ...(el.dashed && { strokeStyle: "dashed" }) };
    if (el.from || el.to) return [{ ...base, __from: el.from, __to: el.to, __via: el.via ?? [] }];
    if (el.path) return [{ ...base, ...relativePoints(el.path) }];
    return [base];
  }
  return [el];
}

function resolveColor(name, palette) {
  if (!name) return undefined;
  if (name.startsWith("#") || name === "transparent") return name;
  if (palette.colors[name]) return palette.colors[name];
  if (palette.roles[name]) return palette.roles[name].stroke;
  throw new Error(`unknown color "${name}" (use #hex, ${Object.keys(palette.colors).join("/")}, or a role)`);
}

function relativePoints(path) {
  const [[x0, y0]] = path;
  return { x: x0, y: y0, points: path.map(([x, y]) => [x - x0, y - y0]) };
}

// Start and end on the edge of each shape that faces the next point, so arrows always touch.
function routeArrow(arrow, shapes) {
  const lookup = (id) => {
    const s = shapes.get(id);
    if (!s) throw new Error(`arrow ${arrow.id ?? ""} references unknown shape "${id}"`);
    if (s.width === undefined || s.height === undefined) throw new Error(`shape "${id}" needs width and height to route arrows`);
    return s;
  };
  const via = arrow.__via;
  const a = arrow.__from && lookup(arrow.__from);
  const b = arrow.__to && lookup(arrow.__to);
  let start;
  let end;
  if (a && b && !via.length) {
    // A direct arrow leaves and enters on facing sides, so it never cuts a corner.
    const s = side(a, b);
    start = edge(a, s);
    end = edge(b, OPPOSITE[s]);
  } else {
    // With one end free, the other end faces the free end's path point.
    const freeStart = arrow.path?.[0] && point(arrow.path[0]);
    const freeEnd = arrow.path?.at(-1) && point(arrow.path.at(-1));
    const first = via[0] ? point(via[0]) : (b ?? freeEnd);
    const last = via.length ? point(via.at(-1)) : (a ?? freeStart);
    start = a ? (first ? anchor(a, first) : null) : arrow.path?.[0];
    end = b ? (last ? anchor(b, last) : null) : arrow.path?.at(-1);
  }
  if (!start || !end) throw new Error("an arrow with only from or to needs a path for its free end");
  Object.assign(arrow, relativePoints([start, ...via, end]));
  if (a) arrow.start = { id: a.id };
  if (b) arrow.end = { id: b.id };
}

function point([x, y]) {
  return { x, y, width: 0, height: 0 };
}

// The edge of s that faces `toward` (a shape or a point): a side when `toward` lies wholly
// beside s, top or bottom when wholly above or below, else whichever axis dominates.
export function anchor(s, toward) {
  return edge(s, side(s, toward));
}

const OPPOSITE = { left: "right", right: "left", top: "bottom", bottom: "top" };

function side(s, toward) {
  const right = toward.x >= s.x + s.width;
  const left = toward.x + toward.width <= s.x;
  const below = toward.y >= s.y + s.height;
  const above = toward.y + toward.height <= s.y;
  const horizontal = (right || left) && (!(above || below) || horizontalDominates(s, toward));
  if (horizontal) return right ? "right" : "left";
  if (above || below) return below ? "bottom" : "top";
  const dx = toward.x + toward.width / 2 - (s.x + s.width / 2);
  const dy = toward.y + toward.height / 2 - (s.y + s.height / 2);
  if (horizontalDominates(s, toward)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "bottom" : "top";
}

function edge(s, which) {
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2;
  return {
    left: [s.x, cy],
    right: [s.x + s.width, cy],
    top: [cx, s.y],
    bottom: [cx, s.y + s.height],
  }[which];
}

function horizontalDominates(s, t) {
  const dx = t.x + t.width / 2 - (s.x + s.width / 2);
  const dy = t.y + t.height / 2 - (s.y + s.height / 2);
  return Math.abs(dx) / s.width >= Math.abs(dy) / s.height;
}

function strip(el) {
  const out = {};
  for (const [k, v] of Object.entries(el)) {
    if (v === undefined || k.startsWith("__") || SHORTHAND.includes(k)) continue;
    if (k === "text" && el.type !== "text") continue;
    out[k] = v;
  }
  return out;
}
