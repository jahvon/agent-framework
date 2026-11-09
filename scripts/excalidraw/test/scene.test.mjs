import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { anchor, expandScene, isSkeleton } from "../lib/scene.mjs";

const palette = JSON.parse(readFileSync(new URL("../palette.json", import.meta.url), "utf8"));
const expand = (elements) => expandScene({ elements }, palette).elements;
const box = (id, x, y, w = 100, h = 50) => ({ type: "rectangle", id, x, y, width: w, height: h });

test("roles fill stroke and background; explicit props win", () => {
  const [a, b] = expand([
    { ...box("a", 0, 0), role: "machine" },
    { ...box("b", 0, 0), role: "machine", strokeColor: "#000000" },
  ]);
  assert.equal(a.strokeColor, palette.roles.machine.stroke);
  assert.equal(a.backgroundColor, palette.roles.machine.fill);
  assert.equal(b.strokeColor, "#000000");
  assert.equal(a.role, undefined);
});

test("unknown role, color, kind, and arrow target are errors", () => {
  assert.throws(() => expand([{ ...box("a", 0, 0), role: "nope" }]), /unknown role/);
  assert.throws(() => expand([{ type: "text", x: 0, y: 0, text: "t", color: "nope" }]), /unknown color/);
  assert.throws(() => expand([{ kind: "nope" }]), /unknown kind/);
  assert.throws(() => expand([box("a", 0, 0), { type: "arrow", from: "a", to: "missing" }]), /unknown shape "missing"/);
});

test("code blocks center one line and indent several", () => {
  const [one, many] = expand([
    { kind: "code", x: 0, y: 0, width: 200, height: 40, text: "$ ls" },
    { kind: "code", x: 0, y: 0, width: 200, height: 80, text: "a:\n  b" },
  ]);
  assert.equal(one.label.textAlign, "center");
  assert.equal(one.label.fontFamily, 3);
  assert.equal(one.text, undefined);
  assert.equal(many.label.textAlign, "left");
  assert.equal(many.label.text, " a:\n   b");
});

test("zones add a title; captions center on cx", () => {
  const els = expand([
    { kind: "zone", x: 10, y: 20, width: 300, height: 200, title: "home", role: "network" },
    { kind: "caption", cx: 100, y: 0, width: 80, text: "x" },
  ]);
  assert.equal(els.length, 3);
  assert.equal(els[0].strokeStyle, "dashed");
  assert.deepEqual([els[1].type, els[1].text, els[1].strokeColor], ["text", "home", palette.roles.network.stroke]);
  assert.equal(els[2].x, 60);
  assert.equal(els[2].strokeColor, "transparent");
});

test("arrows route from the facing edges", () => {
  const els = expand([
    box("src", 0, 100),
    box("up", 300, 0),
    box("down", 300, 200),
    { type: "arrow", from: "src", to: "up" },
    { type: "arrow", from: "src", to: "down" },
  ]);
  for (const a of els.filter((e) => e.type === "arrow")) {
    assert.deepEqual([a.x, a.y], [100, 125], "starts on src's right edge");
    assert.equal(a.x + a.points.at(-1)[0], 300, "ends on the target's left edge");
    assert.ok(a.start.id === "src" && a.end.id);
  }
});

test("arrows through waypoints leave and enter toward the waypoints", () => {
  const [, , a] = expand([
    box("top", 400, 0, 200, 60),
    box("bottom", 0, 300, 200, 60),
    { type: "arrow", from: "top", to: "bottom", via: [[500, 200], [100, 200]] },
  ]);
  const abs = a.points.map(([x, y]) => [a.x + x, a.y + y]);
  assert.deepEqual(abs, [[500, 60], [500, 200], [100, 200], [100, 300]]);
});

test("a diagonal direct arrow enters on the side facing its source", () => {
  const [, , a] = expand([
    box("ci", 0, 240, 260, 80),
    box("docs", 400, 350, 340, 64),
    { type: "arrow", from: "ci", to: "docs" },
  ]);
  assert.deepEqual([a.x, a.y], [260, 280]);
  assert.deepEqual([a.x + a.points[1][0], a.y + a.points[1][1]], [400, 382]);
});

test("anchor prefers the side a shape lies beside", () => {
  const s = { x: 0, y: 0, width: 260, height: 80 };
  assert.deepEqual(anchor(s, { x: 400, y: 110, width: 340, height: 64 }), [260, 40]);
  assert.deepEqual(anchor(s, { x: 50, y: 200, width: 0, height: 0 }), [130, 80]);
});

test("paths become relative points; isSkeleton spots unconverted scenes", () => {
  const [l] = expand([{ type: "line", path: [[10, 10], [110, 10]] }]);
  assert.deepEqual([l.x, l.y, l.points], [10, 10, [[0, 0], [100, 0]]]);
  assert.equal(isSkeleton({ elements: [{ type: "text" }] }), true);
  assert.equal(isSkeleton({ elements: [{ type: "text", seed: 1 }] }), false);
});
