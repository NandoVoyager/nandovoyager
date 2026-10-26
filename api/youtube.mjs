// Latest long-form videos from the channel's public RSS feed (no API key). Vercel's CDN caches the answer for an hour.
// Channel ID of @NandoVoyager; YOUTUBE_CHANNEL_ID overrides it. Without an ID it would be read from the handle's page,
// which YouTube sometimes serves as a consent or bot-check page instead.
const handle = process.env.YOUTUBE_HANDLE || "NandoVoyager";
let channelId = process.env.YOUTUBE_CHANNEL_ID || "UCqW3NTDBn9esY-oD7iCQhAQ";

/*
 * Curation on top of the automatic list. Titles match by a piece of the title (case and accents ignored).
 * hide: videos left out. pin: videos always shown at a position (1 = first).
 * A pin comes from the feed while it is recent enough to be there; after that, from one of `ids` (video links of the
 * channel, matched to the pin by title) or, failing that, from the channel's videos page.
 */
const curation = {
  hide: ["todo mundo estudou em harvard", "desde quando ser honesto virou se gabar"],
  pin: [
    { title: "esse é o motivo que eu quero ficar rico", position: 2 },
    { title: "tentaram comprar minha alma", position: 4 },
    { title: "isso parece um dorama", position: 6 }
  ],
  ids: ["5EB6yb3nOd8", "7B1WwaPGxBc", "k4PESsXzN1E"]
};
const LIMIT = 12;

export default youtube;

const decode = (text) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");

const pick = (block, pattern) => block.match(pattern)?.[1] ?? "";

export function parseFeed(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, entry]) => ({
      id: pick(entry, /<yt:videoId>([\w-]{11})<\/yt:videoId>/),
      title: decode(pick(entry, /<title>([\s\S]*?)<\/title>/)),
      published: pick(entry, /<published>([^<]+)<\/published>/),
      link: pick(entry, /<link rel="alternate" href="([^"]+)"/),
      views: Number(pick(entry, /<media:statistics views="(\d+)"/)) || null
    }))
    .filter((video) => video.id && !video.link.includes("/shorts/"))
    .map(({ link, ...video }) => video);
}

const norm = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const matches = (video, title) => norm(video.title).includes(norm(title));

// Views and publish date from a video's own page (the feed has them; oEmbed doesn't).
export function parseWatchStats(html) {
  const views = Number(pick(html, /"viewCount":"(\d+)"/)) || null;
  const published = pick(html, /"publishDate":"(\d{4}-\d{2}-\d{2}[^"]*)"/) || pick(html, /itemprop="datePublished" content="([^"]+)"/) || null;
  return { views, published };
}

const browser = { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "pt-BR,pt;q=0.9", Cookie: "CONSENT=YES+1" } };
// Every call to YouTube has its own time limit, so one slow page can't push the function past Vercel's limit.
const get = (url, ms, init = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(ms) });

// oEmbed gives a video's title and confirms it belongs to this channel; the watch page adds views and date.
async function videoById(id, log = () => {}) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  const response = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, 3000);
  if (!response.ok) return log({ id, rejected: `oembed ${response.status}` }), null;
  const info = await response.json();
  const author = String(info.author_url || "").toLowerCase();
  if (!author.endsWith(`/@${handle.toLowerCase()}`) && !(channelId && author.endsWith(`/channel/${channelId.toLowerCase()}`))) {
    return log({ id, rejected: "outro canal", author: info.author_url, title: info.title }), null;
  }
  const stats = await get(url, 3500, browser)
    .then((r) => (r.ok ? r.text() : ""))
    .then(parseWatchStats)
    .catch(() => ({ views: null, published: null }));
  log({ id, title: info.title, ...stats });
  return { id, title: info.title, ...stats };
}

// Videos from the channel's videos page (about 30 uploads, more than the feed's 15), with the views and date text as
// YouTube shows them ("60 mil visualizações", "há 1 mês"). Used for pins and when the feed is down.
const text = (t) => t?.simpleText ?? t?.runs?.map((r) => r.text).join("") ?? t?.content ?? "";
export function parseVideosPage(html) {
  const raw = html.match(/ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)?.[1];
  if (!raw) return [];
  const found = new Map();
  const add = (id, title, viewsText, publishedText) => {
    if (id && title && !found.has(id)) found.set(id, { id, title, viewsText: viewsText || null, publishedText: publishedText || null });
  };
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.videoId && node.title) {
      add(node.videoId, text(node.title), text(node.shortViewCountText) || text(node.viewCountText), text(node.publishedTimeText));
    }
    if (node.contentType === "LOCKUP_CONTENT_TYPE_VIDEO" && node.contentId) {
      const meta = node.metadata?.lockupMetadataViewModel;
      const parts = (meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [])
        .flatMap((row) => row.metadataParts ?? [])
        .map((part) => part.text?.content)
        .filter(Boolean);
      add(node.contentId, meta?.title?.content, parts.find((p) => /visualiza|views/i.test(p)), parts.find((p) => /^há |atrás|ago$/i.test(p)));
    }
    Object.values(node).forEach(walk);
  };
  try { walk(JSON.parse(raw)); } catch { return []; }
  return [...found.values()];
}

function makeLookup(log = () => {}) {
  let page = null;
  return {
    log,
    byId: (id) => videoById(id, log).catch((error) => (log({ id, rejected: error.message }), null)),
    channelVideos: () =>
      (page ??= get(`https://www.youtube.com/@${handle}/videos?hl=pt-BR&gl=BR`, 4000, browser)
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`página do canal ${r.status}`))))
        .then(parseVideosPage)
        .catch((error) => (log({ channelPage: error.message }), [])))
  };
}
const defaultLookup = makeLookup();
const offline = { log: () => {}, byId: async () => null, channelVideos: async () => [] };

export async function curate(videos, rules = curation, lookup = defaultLookup) {
  let list = videos.filter((video) => !rules.hide.some((title) => matches(video, title)));
  let known = null; // videos behind rules.ids, fetched once and only if a pin needs them
  let page = null; // channel videos page, same
  const pins = [];
  for (const pin of rules.pin) {
    let video = list.find((v) => matches(v, pin.title));
    if (video) list = list.filter((v) => v !== video);
    if (!video && rules.ids?.length) {
      known ??= (await Promise.all(rules.ids.map((id) => lookup.byId(id)))).filter(Boolean);
      video = known.find((v) => matches(v, pin.title));
    }
    if (!video) {
      page ??= await lookup.channelVideos();
      const hit = page.find((v) => matches(v, pin.title));
      if (hit) video = await lookup.byId(hit.id);
    }
    if (video) pins.push({ ...pin, video });
    lookup.log?.({ pin: pin.title, found: video ? video.id : null });
  }
  for (const pin of pins.sort((a, b) => a.position - b.position)) {
    list.splice(Math.min(Math.max(pin.position - 1, 0), list.length), 0, pin.video);
  }
  return list.slice(0, LIMIT);
}

async function resolveChannelId() {
  if (channelId) return channelId;
  const response = await get(`https://www.youtube.com/@${handle}`, 4000, browser);
  const html = await response.text();
  channelId = pick(html, /"externalId":"(UC[\w-]{22})"/) || pick(html, /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/);
  if (!channelId) throw new Error(`channel id not found for @${handle}`);
  return channelId;
}

// Latest uploads: the RSS feed, or the channel's videos page when the feed fails or comes back empty.
async function latestVideos(id, lookup) {
  try {
    const response = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, 5000);
    if (!response.ok) throw new Error(`feed ${response.status}`);
    const feed = parseFeed(await response.text());
    if (!feed.length) throw new Error("feed vazio");
    return { source: "feed", videos: feed };
  } catch (error) {
    lookup.log({ feed: error.message, fallback: "página de vídeos do canal" });
    const page = await lookup.channelVideos();
    if (!page.length) throw new Error(`${error.message}; página do canal sem vídeos`);
    return { source: "página do canal", videos: page };
  }
}

// Pins that aren't in the list need extra calls to YouTube; if those take too long, answer without them.
async function curateWithin(videos, lookup, ms) {
  let timer;
  const late = new Promise((resolve) => { timer = setTimeout(() => (lookup.log({ pins: `sem resposta em ${ms} ms, lista sem eles` }), resolve(curate(videos, curation, offline))), ms); });
  try {
    return await Promise.race([curate(videos, curation, lookup), late]);
  } finally {
    clearTimeout(timer);
  }
}

export async function youtube(req, res) {
  // /api/youtube?debug=1 shows what came from YouTube and how each pin was resolved (never cached).
  const debug = new URL(req.url || "/", "http://localhost").searchParams.has("debug");
  const report = [];
  const lookup = makeLookup((entry) => report.push(entry));
  try {
    const id = await resolveChannelId();
    const { source, videos: latest } = await latestVideos(id, lookup);
    const videos = await curateWithin(latest, lookup, 5000);
    if (debug) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
        .end(JSON.stringify({
          channelId: id,
          source,
          latest: latest.map((v) => v.title),
          steps: report,
          result: videos.map((v) => `${v.title} | ${v.views ?? v.viewsText ?? "-"} | ${v.published ?? v.publishedText ?? "-"}`)
        }, null, 2));
      return;
    }
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
    }).end(JSON.stringify({ channel: `https://www.youtube.com/@${handle}`, videos }));
  } catch (error) {
    console.error("YouTube feed failed:", error.message, JSON.stringify(report));
    if (debug) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
        .end(JSON.stringify({ error: error.message, channelId, steps: report }, null, 2));
      return;
    }
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
      .end(JSON.stringify({ error: "Não foi possível carregar os vídeos agora." }));
  }
}
