#!/usr/bin/env node
/*
 * A tiny static file server for the HTML examples (no dependencies).
 * Serves this repository's folder on http://localhost:8080 and prints the page to open.
 *
 *   node scripts/serve.mjs examples/html/index.html
 *
 * PORT=3000 changes the port. Only for trying the examples on your own computer.
 */
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT ?? 8080);
const start = (process.argv[2] ?? "examples/html/index.html").replace(/\\/g, "/");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  const file = normalize(join(root, path));
  if (!file.startsWith(root + sep) || file.includes(`${sep}node_modules${sep}.`)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  let target = file;
  try {
    if (statSync(target).isDirectory()) target = join(target, "index.html");
    statSync(target);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(target)] ?? "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(target).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`Open http://localhost:${port}/${start}`);
  console.log("Press Ctrl+C to stop.");
});
