// One headless Chrome session, driven over the DevTools protocol, that converts and exports
// Excalidraw scenes. Needs Node 22+ (global WebSocket) and Chrome or Chromium; no npm packages.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

export const EXCALIDRAW_VERSION = "0.18.1";
const REACT_VERSION = "19.3.1";
const ESM = `https://esm.sh/@excalidraw/excalidraw@${EXCALIDRAW_VERSION}`;
// esm.sh's ?bundle build of 0.18.1 imports a module that 404s; unbundled with pinned React loads.
const ESM_ENTRY = `${ESM}?deps=react@${REACT_VERSION},react-dom@${REACT_VERSION}`;
const LOAD_ATTEMPTS = 3;

export async function openSession({ timeoutMs = 90_000 } = {}) {
  const work = mkdtempSync(join(tmpdir(), "excalidraw-render-"));
  const cacheDir = join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "agent-framework", "excalidraw");
  mkdirSync(cacheDir, { recursive: true });
  const page = join(work, "render.html");
  writeFileSync(page, PAGE);

  const chrome = spawn(findChrome(), [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--remote-debugging-port=0",
    `--user-data-dir=${join(work, "profile")}`,
    // Shared across runs so esm.sh modules and fonts load from disk after the first render.
    `--disk-cache-dir=${cacheDir}`,
    "about:blank",
  ], { stdio: "ignore" });
  const exited = new Promise((ok) => chrome.once("exit", ok));
  let cdp;
  let send;

  const close = async () => {
    cdp?.close();
    chrome.kill();
    await exited;
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  };

  try {
    cdp = await withTimeout(connect(join(work, "profile", "DevToolsActivePort")), timeoutMs, "connecting to Chrome");
    // A page caches a failed module import, so retry esm.sh hiccups in a fresh tab.
    for (let attempt = 1; ; attempt++) {
      const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
      send = (method, params) => cdp.send(method, params, sessionId);
      await send("Page.navigate", { url: pathToFileURL(page).href });
      const res = await withTimeout(evaluate(send, "window.__ready"), timeoutMs, "loading Excalidraw from esm.sh");
      if (!res.error) break;
      if (attempt === LOAD_ATTEMPTS || !/Failed to fetch/.test(res.error)) throw new Error(`loading Excalidraw: ${res.error}`);
      await cdp.send("Target.closeTarget", { targetId });
      await sleep(1000 * attempt);
    }
  } catch (e) {
    await close();
    throw e;
  }

  return {
    async render(scene, { convert }) {
      const res = await withTimeout(
        evaluate(send, `window.renderScene(${JSON.stringify(scene)}, ${convert})`),
        timeoutMs,
        "rendering",
      );
      if (res.error) throw new Error(res.error);
      return res.value;
    },
    async screenshot(svg, { width, height, scale }) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
      await evaluate(send, `window.showSvg(${JSON.stringify(svg)})`);
      const { data } = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
      return Buffer.from(data, "base64");
    },
    close,
  };
}

const PAGE = `<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><body>
<script>window.EXCALIDRAW_ASSET_PATH = "${ESM}/dist/prod/";</script>
<script type="module">
window.__ready = import("${ESM_ENTRY}").then(({ exportToSvg, convertToExcalidrawElements }) => {
  window.renderScene = async (scene, convert) => {
    let elements = scene.elements;
    if (convert) {
      // Text is measured at conversion, before fonts load. A throwaway export embeds the used
      // glyphs as @font-face; install those in the page, then convert again with real metrics.
      const warm = await exportToSvg({ elements: convertToExcalidrawElements(elements), files: {} });
      warm.querySelectorAll("style").forEach((s) => document.head.appendChild(s.cloneNode(true)));
      await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
      elements = convertToExcalidrawElements(scene.elements);
    }
    const svg = await exportToSvg({
      elements,
      appState: { exportBackground: true, ...scene.appState, exportEmbedScene: false },
      files: scene.files ?? {},
      exportPadding: 48,
    });
    return {
      svg: svg.outerHTML,
      elements,
      width: Math.ceil(Number(svg.getAttribute("width"))),
      height: Math.ceil(Number(svg.getAttribute("height"))),
    };
  };
  window.showSvg = (svg) => { document.body.innerHTML = svg; };
  return true;
});
</script>`;

async function evaluate(send, expression) {
  const { result, exceptionDetails } = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) return { error: exceptionDetails.exception?.description ?? exceptionDetails.text };
  return { value: result.value };
}

async function connect(portFile) {
  while (!existsSync(portFile) || readFileSync(portFile, "utf8").split("\n").length < 2) await sleep(50);
  const [port, path] = readFileSync(portFile, "utf8").split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((ok, ko) => {
    ws.onopen = ok;
    ws.onerror = () => ko(new Error("DevTools connection failed"));
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) p.ko(new Error(`${msg.error.message} ${msg.error.data ?? ""}`.trim()));
    else p.ok(msg.result);
  };
  return {
    send: (method, params = {}, sessionId) => new Promise((ok, ko) => {
      pending.set(++id, { ok, ko });
      ws.send(JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) }));
    }),
    close: () => ws.close(),
  };
}

function withTimeout(promise, ms, what) {
  let timer;
  const timeout = new Promise((_, ko) => { timer = setTimeout(() => ko(new Error(`timed out after ${ms / 1000}s ${what}`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const apps = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  const onPath = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].flatMap((bin) =>
    (process.env.PATH ?? "").split(delimiter).map((dir) => join(dir, bin)));
  const found = [...apps, ...onPath].find((p) => existsSync(p));
  if (!found) throw new Error("no Chrome or Chromium found; install one or set CHROME_PATH");
  return found;
}
