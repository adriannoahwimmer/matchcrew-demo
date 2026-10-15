// Screenshots der echten MatchCrew-Web-Version mit erfundenen Demo-Daten (siehe README.md in diesem Ordner).
// Alle Anfragen an Supabase beantwortet mock.mjs; nichts erreicht ein Supabase-Projekt oder Sentry.
//
//   node shoot.mjs                     Standard-Screens nach ../../screenshots
//   node shoot.mjs chat,profil         nur diese Screens
//   APP_URL=http://localhost:8090 node shoot.mjs   gegen eine lokal gebaute Web-Version
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

import { IDS, rpc, session, table } from "./mock.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = (process.env.APP_URL || "https://matchcrew.expo.app").replace(/\/$/, "");
const OUT = process.env.OUT_DIR || path.join(here, "..", "..", "screenshots");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
/** Name → Route und Größe. `meine` fehlt im Standard, solange der Randfehler offen ist (Backlog im App-Repo). */
const SCREENS = {
  entdecken: { route: "/", size: PHONE },
  gesuch: { route: `/gesuch/${IDS.reqLena}`, size: PHONE },
  helfer: { route: "/helfer", size: PHONE },
  chat: { route: `/chats/${IDS.convLena}`, size: PHONE },
  anfragen: { route: `/gesuch/${IDS.ownReq}/anfragen`, size: PHONE },
  profil: { route: `/nutzer/${IDS.lena}`, size: PHONE },
  desktop: { route: "/", size: DESKTOP },
  chats: { route: "/chats", size: PHONE, optional: true },
  meine: { route: "/meine", size: PHONE, optional: true },
};
const wanted = process.argv[2]
  ? process.argv[2].split(",")
  : Object.keys(SCREENS).filter((name) => !SCREENS[name].optional);
for (const name of wanted) if (!SCREENS[name]) throw new Error(`Unbekannter Screen: ${name}`);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Expose-Headers": "Content-Range",
};
const json = (req, body, status = 200) =>
  req.respond({ status, headers: { ...cors, "Content-Type": "application/json" }, body: body === null ? "" : JSON.stringify(body) });

const unknown = new Set();
let projectRef = null;

/** Beantwortet jede Anfrage an `*.supabase.co` aus mock.mjs. */
function answerSupabase(req) {
  const url = new URL(req.url());
  projectRef ??= url.hostname.split(".")[0];
  const method = req.method();
  if (method === "OPTIONS") return req.respond({ status: 204, headers: cors, body: "" });

  if (url.pathname.startsWith("/auth/v1/")) {
    if (url.pathname.endsWith("/user")) return json(req, session().user);
    if (url.pathname.endsWith("/token")) return json(req, session());
    return json(req, {});
  }
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    const name = url.pathname.split("/").pop();
    let body = {};
    try { body = method === "GET" ? Object.fromEntries(url.searchParams) : JSON.parse(req.postData() || "{}"); } catch {}
    const result = rpc(name, body);
    if (result === undefined) unknown.add(`rpc ${name}`);
    return json(req, result ?? []);
  }
  if (url.pathname.startsWith("/rest/v1/")) {
    const name = url.pathname.split("/").pop();
    if (method !== "GET" && method !== "HEAD") { unknown.add(`${method} ${name}`); return json(req, null, 204); }
    let result = table(name, url.searchParams);
    if (result === undefined) { unknown.add(`table ${name}`); result = []; }
    const single = (req.headers()["accept"] || "").includes("vnd.pgrst.object");
    return json(req, single ? result[0] ?? null : result);
  }
  if (url.pathname.startsWith("/storage/")) return req.respond({ status: 404, headers: cors, body: "" });
  unknown.add(`${method} ${url.pathname}`);
  return json(req, {});
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-first-run", "--lang=de-DE", "--hide-scrollbars"] });

async function newPage({ width, height }, loggedIn) {
  const page = await browser.newPage();
  await page.emulateTimezone("Europe/Berlin");
  const mobile = width < 600;
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  await page.setExtraHTTPHeaders({ "Accept-Language": "de-DE,de;q=0.9" });
  await page.evaluateOnNewDocument((storageKey, sess) => {
    if (sess) localStorage.setItem(storageKey, JSON.stringify(sess));
    // Kein Realtime-Socket zum echten Projekt
    const Real = window.WebSocket;
    window.WebSocket = function (url, protocols) {
      if (String(url).includes("supabase.co")) return { readyState: 0, send() {}, close() {}, addEventListener() {}, removeEventListener() {} };
      return new Real(url, protocols);
    };
    window.WebSocket.prototype = Real.prototype;
    Object.assign(window.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  }, `sb-${projectRef}-auth-token`, loggedIn ? session() : null);
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes(".supabase.co")) return answerSupabase(req);
    if (u.startsWith(APP) || u.startsWith("data:") || u.startsWith("blob:")) return req.continue();
    return req.abort(); // Sentry und alles andere
  });
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("Failed to load resource")) console.log("  Konsole:", m.text().slice(0, 300)); });
  return page;
}

const settle = (ms) => new Promise((r) => setTimeout(r, ms));
async function load(page, route) {
  await page.goto(APP + route, { waitUntil: "networkidle0", timeout: 90_000 });
  await settle(1200);
}

// Erst ohne Anmeldung laden: verrät die Projekt-ID für den Sitzungsschlüssel im Browser-Speicher
const probe = await newPage(PHONE, false);
await load(probe, "/");
await probe.close();
if (!projectRef) throw new Error("Die Web-Version hat Supabase nicht aufgerufen; stimmt APP_URL?");

fs.mkdirSync(OUT, { recursive: true });
for (const name of wanted) {
  const { route, size } = SCREENS[name];
  const page = await newPage(size, true);
  await load(page, route);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  await page.close();
  console.log("gespeichert", path.relative(process.cwd(), file));
}
await browser.close();
if (unknown.size) console.log("Ohne Demo-Daten beantwortet (leere Liste):\n  " + [...unknown].join("\n  "));
