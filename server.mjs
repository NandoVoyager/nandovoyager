import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { subscribe } from "./api/subscribe.mjs";
import { youtube } from "./api/youtube.mjs";
import { apply } from "./api/apply.mjs";

const root = resolve(".");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".mp4": "video/mp4", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8" };
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/subscribe" && req.method === "POST") return subscribe(req, res);
  if (url.pathname === "/api/youtube" && req.method === "GET") return youtube(req, res);
  if (url.pathname === "/api/apply" && req.method === "POST") return apply(req, res);
  let pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  if (!extname(pathname)) pathname = pathname.replace(/\/?$/, "/index.html"); // /consultoria → consultoria/index.html, as on Vercel
  const file = resolve(root, `.${pathname}`);
  if (!file.startsWith(`${root}/`)) { res.writeHead(403).end("Forbidden"); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    // Same as Vercel: the custom 404.html, or plain text if it's missing.
    const page = await readFile(resolve(root, "404.html")).catch(() => null);
    res.writeHead(404, { "Content-Type": page ? mime[".html"] : "text/plain; charset=utf-8" }).end(page || "Not found");
  }
});
server.listen(process.env.PORT || 4173, "127.0.0.1", () => console.log(`Nando Voyager listening on http://127.0.0.1:${process.env.PORT || 4173}`));
