#!/usr/bin/env node

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const repoRoot = resolve(root, "..");

const read = (path) => readFile(path, "utf8");
const readBase64 = async (path) => (await readFile(path)).toString("base64");

const [html, css, app, lucide, pdfLib, jszip, pdfjs, pdfjsWorker] = await Promise.all([
  read(resolve(root, "index.html")),
  read(resolve(root, "src/styles.css")),
  read(resolve(root, "src/app.js")),
  read(resolve(root, "vendor/lucide.min.js")),
  read(resolve(root, "vendor/pdf-lib.min.js")),
  read(resolve(root, "vendor/jszip.min.js")),
  read(resolve(root, "vendor/pdfjs/pdf.min.mjs")),
  read(resolve(root, "vendor/pdfjs/pdf.worker.min.mjs")),
]);

const sampleData = {
  ordered: await readBase64(resolve(root, "assets/samples/ordered-example.pdf")),
  unordered: await readBase64(resolve(root, "assets/samples/unordered-example.pdf")),
  auto: await readBase64(resolve(root, "assets/samples/auto-example.pdf")),
};

const inlineScripts = [
  `<script>${lucide}</script>`,
  `<script>${pdfLib}</script>`,
  `<script>${jszip}</script>`,
  `<script type="text/plain" id="pdfjs-source">${pdfjs}</script>`,
  `<script type="text/plain" id="pdfjs-worker-source">${pdfjsWorker}</script>`,
  `<script type="module">
    const libUrl = URL.createObjectURL(new Blob([document.getElementById("pdfjs-source").textContent], { type: "text/javascript" }));
    const workerUrl = URL.createObjectURL(new Blob([document.getElementById("pdfjs-worker-source").textContent], { type: "text/javascript" }));
    const pdfjs = await import(libUrl);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    window.PDFJS = pdfjs;
    window.dispatchEvent(new Event("pdfjs-ready"));
  </script>`,
  `<script>window.__EMBEDDED_SAMPLE_PDFS__ = ${JSON.stringify(sampleData)};</script>`,
  `<script>${app}</script>`,
].join("\n");

let output = html.replace(
  /<link rel="stylesheet" href="\.\/src\/styles\.css">/,
  () => `<style>\n${css}\n</style>`,
);

output = output.replace(
  /  <script src="\.\/vendor\/lucide\.min\.js"><\/script>[\s\S]*?  <script src="\.\/src\/app\.js"><\/script>/,
  () => inlineScripts,
);

const distDir = resolve(root, "dist");
await mkdir(distDir, { recursive: true });
const distFile = resolve(distDir, "index.html");
await writeFile(distFile, output);
await copyFile(distFile, resolve(repoRoot, "文档拆分与重组原型.html"));

console.log(distFile);
