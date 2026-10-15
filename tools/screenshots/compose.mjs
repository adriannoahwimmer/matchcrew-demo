// Titelbild für die README (hero.png, Englisch) und Link-Vorschau der Landingpage (og.png, Deutsch) aus den
// Screenshots entdecken.png, gesuch.png und chat.png. Vorher `node shoot.mjs` laufen lassen.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "..", "screenshots");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const template = pathToFileURL(path.join(here, "compose.html")).href;

const IMAGES = [
  { file: "hero.png", lang: "en", scale: 2 },
  { file: "og.png", lang: "de", scale: 1 },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
for (const { file, lang, scale } of IMAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 640, deviceScaleFactor: scale });
  await page.goto(`${template}?lang=${lang}&w=1280&h=640`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.close();
  console.log("gespeichert", file);
}
await browser.close();
