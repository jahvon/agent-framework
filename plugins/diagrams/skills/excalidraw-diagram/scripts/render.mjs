#!/usr/bin/env node
// Render an Excalidraw scene to SVG (for publishing) and PNG (for visual review) by driving
// headless Google Chrome over the DevTools protocol. Needs Node 22+ and Chrome; no npm packages.
//
//   node render.mjs <name.skeleton.json | name.excalidraw> [--scale 2] [--no-png]
//
// Skeleton input (elements without `seed`) is expanded with convertToExcalidrawElements and
// saved as <name>.excalidraw so it opens in excalidraw.com. Prints each written path.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const EXCALIDRAW_VERSION = "0.18.1";
const REACT_VERSION = "19.3.1";
const ESM = `https://esm.sh/@excalidraw/excalidraw@${EXCALIDRAW_VERSION}`;
// esm.sh's ?bundle build of 0.18.1 imports a module that 404s; unbundled with pinned React loads.
const ESM_ENTRY = `${ESM}?deps=react@${REACT_VERSION},react-dom@${REACT_VERSION}`;
const TIMEOUT_MS = 90_000;

const args = process.argv.slice(2);
const scaleAt = args.indexOf("--scale");
const scale = scaleAt >= 0 ? Number(args[scaleAt + 1]) || 2 : 2;
const wantPng = !args.includes("--no-png");
const input = args.find((a, i) => !a.startsWith("--") && !(scaleAt >= 0 && i === scaleAt + 1));
if (!input) fail("usage: render.mjs <name.skeleton.json | name.excalidraw> [--scale 2] [--no-png]");

const src = resolve(input);
const scene = JSON.parse(readFileSync(src, "utf8"));
if (!Array.isArray(scene.elements) || !scene.elements.length) fail(`${src}: no elements`);
const isSkeleton = scene.elements.some((el) => el.seed === undefined);
const out = src.replace(/(\.skeleton)?\.json$|\.excalidraw$/, "");

const work = mkdtempSync(join(tmpdir(), "excalidraw-render-"));
const page = join(work, "export.html");
writeFileSync(page, exportPage(scene, isSkeleton));

const chrome = spawn(findChrome(), [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--remote-debugging-port=0",
  `--user-data-dir=${join(work, "profile")}`,
  "about:blank",
], { stdio: "ignore" });

const timer = setTimeout(() => fail(`timed out after ${TIMEOUT_MS / 1000}s`), TIMEOUT_MS);
let cdp;
try {
  cdp = await connect(join(work, "profile", "DevToolsActivePort"));
  let send, value;
  // esm.sh occasionally fails a module fetch, and a page caches that failure, so retry in a fresh tab.
  for (let attempt = 1; ; attempt++) {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    send = (method, params) => cdp.send(method, params, sessionId);
    await send("Page.navigate", { url: pathToFileURL(page).href });
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression: "new Promise(r => { const t = setInterval(() => { if (window.__result) { clearInterval(t); r(window.__result); } }, 50); })",
      awaitPromise: true,
      returnByValue: true,
    });
    if (!exceptionDetails) { value = result.value; break; }
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text;
    if (attempt === 3 || !/Failed to fetch/.test(msg)) fail(`export failed: ${msg}`);
    await cdp.send("Target.closeTarget", { targetId });
    await sleep(1000 * attempt);
  }
  const { svg, elements, width, height } = value;

  if (isSkeleton) {
    const full = { type: "excalidraw", version: 2, source: "https://excalidraw.com", elements, appState: scene.appState ?? {}, files: scene.files ?? {} };
    writeFileSync(`${out}.excalidraw`, JSON.stringify(full, null, 2));
    console.log(`${out}.excalidraw`);
  }
  writeFileSync(`${out}.svg`, svg);
  console.log(`${out}.svg`);

  if (wantPng) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
    await send("Runtime.evaluate", { expression: `document.body.style.margin = 0; document.body.innerHTML = ${JSON.stringify(svg)};` });
    const { data } = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
    writeFileSync(`${out}.png`, Buffer.from(data, "base64"));
    console.log(`${out}.png`);
  }
} finally {
  clearTimeout(timer);
  cdp?.close();
  const exited = new Promise((ok) => chrome.once("exit", ok));
  chrome.kill();
  await exited;
  rmSync(work, { recursive: true, force: true, maxRetries: 5 });
}

function exportPage(scene, isSkeleton) {
  // Fonts load from the same pinned build so exported text is embedded, not system-substituted.
  return `<!doctype html><meta charset="utf-8"><body>
<script>window.EXCALIDRAW_ASSET_PATH = "${ESM}/dist/prod/";</script>
<script type="module">
const scene = ${JSON.stringify(scene).replace(/</g, "\\u003c")};
window.__result = (async () => {
  const { exportToSvg, convertToExcalidrawElements } = await import("${ESM_ENTRY}");
  let elements = scene.elements;
  if (${isSkeleton}) {
    // Text is measured at conversion, before fonts load. A throwaway export embeds the used
    // glyphs as @font-face; install those in the page, then convert again with real metrics.
    const warm = await exportToSvg({ elements: convertToExcalidrawElements(scene.elements), files: {} });
    warm.querySelectorAll("style").forEach((s) => document.head.appendChild(s.cloneNode(true)));
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
    elements = convertToExcalidrawElements(scene.elements);
  }
  const svg = await exportToSvg({
    elements,
    appState: { exportBackground: true, viewBackgroundColor: "#ffffff", ...scene.appState, exportEmbedScene: false },
    files: scene.files ?? {},
    exportPadding: 48,
  });
  return {
    svg: svg.outerHTML,
    elements: ${isSkeleton} ? elements : null,
    width: Math.ceil(Number(svg.getAttribute("width"))),
    height: Math.ceil(Number(svg.getAttribute("height"))),
  };
})();
</script>`;
}

async function connect(portFile) {
  while (!existsSync(portFile) || readFileSync(portFile, "utf8").split("\n").length < 2) await sleep(50);
  const [port, path] = readFileSync(portFile, "utf8").split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error("DevTools connection failed")); });
  let id = 0;
  const pending = new Map();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.ko(new Error(`${msg.error.message} ${msg.error.data ?? ""}`)) : p.ok(msg.result);
  };
  return {
    send: (method, params = {}, sessionId) => new Promise((ok, ko) => {
      pending.set(++id, { ok, ko });
      ws.send(JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) }));
    }),
    close: () => ws.close(),
  };
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) fail("no Chrome or Chromium found; set CHROME_PATH");
  return found;
}

function fail(msg) {
  console.error(`render: ${msg}`);
  process.exit(1);
}
