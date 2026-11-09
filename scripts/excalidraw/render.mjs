#!/usr/bin/env node
// Render Excalidraw diagrams to SVG (publish) and PNG (review), and lint their layout.
//
//   render.mjs <file-or-dir> [--scale 2] [--png=false] [--strict]
//
// A directory renders every *.skeleton.json in it, plus any *.excalidraw without a skeleton.
// A skeleton also writes <name>.excalidraw, the full scene that opens in excalidraw.com.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { lint } from "./lib/lint.mjs";
import { openSession } from "./lib/chrome.mjs";
import { expandScene, isSkeleton } from "./lib/scene.mjs";

const SKELETON = /\.skeleton\.json$/;

const opts = parseArgs(process.argv.slice(2));
if (Number(process.versions.node.split(".")[0]) < 22) die(`needs Node 22+, found ${process.versions.node}`);
const palette = JSON.parse(readFileSync(join(dirname(new URL(import.meta.url).pathname), "palette.json"), "utf8"));
const files = collect(opts.target);
if (!files.length) die(`nothing to render in ${opts.target}`);

const session = await openSession().catch((e) => die(e.message));
let failed = 0;
let findings = 0;
try {
  for (const file of files) {
    const name = file.replace(SKELETON, "").replace(/\.excalidraw$/, "");
    try {
      const scene = JSON.parse(readFileSync(file, "utf8"));
      if (!Array.isArray(scene.elements) || !scene.elements.length) throw new Error("no elements");
      const convert = isSkeleton(scene);
      const input = convert ? expandScene(scene, palette) : scene;
      const out = await session.render(input, { convert });

      const written = [];
      if (convert) {
        const full = { type: "excalidraw", version: 2, source: "https://excalidraw.com", elements: out.elements, appState: input.appState, files: input.files ?? {} };
        writeFileSync(`${name}.excalidraw`, `${JSON.stringify(full, null, 2)}\n`);
        written.push("excalidraw");
      }
      writeFileSync(`${name}.svg`, out.svg);
      written.push("svg");
      if (opts.png) {
        writeFileSync(`${name}.png`, await session.screenshot(out.svg, { width: out.width, height: out.height, scale: opts.scale }));
        written.push("png");
      }

      const found = lint(out.elements);
      findings += found.length;
      console.log(`${found.length ? "⚠" : "✓"} ${name}.{${written.join(",")}}  ${out.width}×${out.height}`);
      for (const f of found) console.log(`    ${f.message}`);
    } catch (e) {
      failed++;
      console.log(`✗ ${file}\n    ${e.message.split("\n")[0]}`);
    }
  }
} finally {
  await session.close();
}

if (files.length > 1) console.log(`${files.length - failed}/${files.length} rendered, ${findings} layout finding(s)`);
process.exit(failed || (opts.strict && findings) ? 1 : 0);

function collect(target) {
  const path = resolve(target);
  if (!existsSync(path)) die(`not found: ${path}`);
  if (!statSync(path).isDirectory()) return [path];
  const names = readdirSync(path).sort();
  const skeletons = names.filter((n) => SKELETON.test(n));
  const bases = new Set(skeletons.map((n) => n.replace(SKELETON, "")));
  const scenes = names.filter((n) => n.endsWith(".excalidraw") && !bases.has(basename(n, ".excalidraw")));
  return [...skeletons, ...scenes].map((n) => join(path, n));
}

function parseArgs(args) {
  const o = { scale: 2, png: true, strict: false, target: undefined };
  for (let i = 0; i < args.length; i++) {
    const [flag, inline] = args[i].split("=");
    const value = () => inline ?? args[++i];
    if (flag === "--scale") o.scale = Number(value()) || 2;
    else if (flag === "--png") o.png = value() !== "false";
    else if (flag === "--no-png") o.png = false;
    else if (flag === "--strict") o.strict = inline === undefined ? true : inline !== "false";
    else if (flag.startsWith("--")) die(`unknown flag ${flag}`);
    else o.target = args[i];
  }
  if (!o.target) die("usage: render.mjs <file-or-dir> [--scale 2] [--png=false] [--strict]");
  return o;
}

function die(msg) {
  console.error(`render: ${msg}`);
  process.exit(1);
}
