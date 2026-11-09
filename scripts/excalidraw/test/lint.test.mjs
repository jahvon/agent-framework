import assert from "node:assert/strict";
import { test } from "node:test";
import { lint } from "../lib/lint.mjs";

const rect = (id, x, y, w, h, extra = {}) => ({ id, type: "rectangle", x, y, width: w, height: h, backgroundColor: "#2d353b", ...extra });
const text = (id, x, y, w, h, t, extra = {}) => ({ id, type: "text", x, y, width: w, height: h, text: t, originalText: t, ...extra });
const arrow = (id, pts, start, end) => ({
  id,
  type: "arrow",
  x: pts[0][0],
  y: pts[0][1],
  points: pts.map(([x, y]) => [x - pts[0][0], y - pts[0][1]]),
  startBinding: start && { elementId: start },
  endBinding: end && { elementId: end },
});
const messages = (els) => lint(els).map((f) => f.message);

test("a clean layout has no findings", () => {
  assert.deepEqual(messages([
    rect("a", 0, 0, 100, 50),
    text("la", 10, 15, 80, 20, "alpha", { containerId: "a" }),
    rect("b", 200, 0, 100, 50),
    arrow("ab", [[100, 25], [200, 25]], "a", "b"),
  ]), []);
});

test("wrapped and too-tall labels name the label", () => {
  const found = messages([
    rect("a", 0, 0, 100, 30),
    text("la", 5, 0, 90, 40, "two\nlines", { originalText: "two lines", containerId: "a" }),
  ]);
  assert.ok(found.some((m) => /'two lines' wraps/.test(m)));
  assert.ok(found.some((m) => /taller than its box/.test(m)));
});

test("overlapping text and text across a shape edge", () => {
  const found = messages([
    text("t1", 0, 0, 100, 20, "first"),
    text("t2", 50, 5, 100, 20, "second"),
    rect("box", 120, 0, 100, 50),
    text("l", 130, 15, 80, 20, "inside", { containerId: "box" }),
  ]);
  assert.ok(found.some((m) => /'first' overlaps 'second'/.test(m)));
  assert.ok(found.some((m) => /'second' crosses the edge of 'inside'/.test(m)));
});

test("arrows that stop short, cross a shape, or run through text", () => {
  const found = messages([
    rect("a", 0, 0, 100, 50),
    rect("mid", 150, 0, 50, 50),
    rect("b", 300, 0, 100, 50),
    text("cap", 220, 15, 40, 20, "via"),
    arrow("ab", [[100, 25], [270, 25]], "a", "b"),
  ]);
  assert.ok(found.some((m) => /ends 30px from/.test(m)));
  assert.ok(found.some((m) => /crosses rectangle at \(150, 0\)/.test(m)));
  assert.ok(found.some((m) => /runs through text 'via'/.test(m)));
});

test("an unfilled box in the path is an obstacle", () => {
  const found = messages([
    rect("a", 0, 0, 100, 50),
    rect("hollow", 150, 0, 50, 50, { backgroundColor: "transparent" }),
    rect("b", 300, 0, 100, 50),
    arrow("ab", [[100, 25], [300, 25]], "a", "b"),
  ]);
  assert.ok(found.some((m) => /crosses rectangle at \(150, 0\)/.test(m)));
});

test("zones, caption holders, and an arrow's own label are not obstacles", () => {
  assert.deepEqual(messages([
    rect("zone", -50, -50, 500, 200, { backgroundColor: "transparent", strokeStyle: "dashed" }),
    rect("cap", 150, 0, 50, 50, { backgroundColor: "transparent", strokeColor: "transparent" }),
    rect("a", 0, 0, 100, 50),
    rect("b", 300, 0, 100, 50),
    arrow("ab", [[100, 25], [300, 25]], "a", "b"),
    text("lab", 180, 15, 40, 20, "go", { containerId: "ab" }),
  ]), []);
});
