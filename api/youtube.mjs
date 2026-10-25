// Latest long-form videos from the channel's public RSS feed (no API key). Vercel's CDN caches the answer for an hour.
// YOUTUBE_CHANNEL_ID (UC…) is optional: without it the channel ID is read once from the handle's page.
const handle = process.env.YOUTUBE_HANDLE || "NandoVoyager";
let channelId = process.env.YOUTUBE_CHANNEL_ID || "";

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

// oEmbed gives a video's title and confirms it belongs to this channel; the watch page adds views and date.
async function videoById(id) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  if (!response.ok) return null;
  const info = await response.json();
  const author = String(info.author_url || "").toLowerCase();
  if (!author.endsWith(`/@${handle.toLowerCase()}`) && !(channelId && author.endsWith(`/channel/${channelId.toLowerCase()}`))) return null;
  const stats = await fetch(url, browser)
    .then((r) => (r.ok ? r.text() : ""))
    .then(parseWatchStats)
    .catch(() => ({ views: null, published: null }));
  return { id, title: info.title, ...stats };
}

// Ids and titles from the channel's videos page (about 30 uploads, more than the feed's 15).
export function parseVideosPage(html) {
  const raw = html.match(/ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)?.[1];
  if (!raw) return [];
  const found = new Map();
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const title = node.videoId && (node.title?.runs?.[0]?.text || node.title?.simpleText);
    if (title && !found.has(node.videoId)) found.set(node.videoId, title);
    const lockup = node.contentType === "LOCKUP_CONTENT_TYPE_VIDEO" && node.metadata?.lockupMetadataViewModel?.title?.content;
    if (lockup && node.contentId && !found.has(node.contentId)) found.set(node.contentId, lockup);
    Object.values(node).forEach(walk);
  };
  try { walk(JSON.parse(raw)); } catch { return []; }
  return [...found].map(([id, title]) => ({ id, title }));
}

const defaultLookup = {
  byId: (id) => videoById(id).catch(() => null),
  channelVideos: () => fetch(`https://www.youtube.com/@${handle}/videos`, browser).then((r) => (r.ok ? r.text() : "")).then(parseVideosPage).catch(() => [])
};

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
  }
  for (const pin of pins.sort((a, b) => a.position - b.position)) {
    list.splice(Math.min(Math.max(pin.position - 1, 0), list.length), 0, pin.video);
  }
  return list.slice(0, LIMIT);
}

async function resolveChannelId() {
  if (channelId) return channelId;
  const response = await fetch(`https://www.youtube.com/@${handle}`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "pt-BR,pt;q=0.9", Cookie: "CONSENT=YES+1" }
  });
  const html = await response.text();
  channelId = pick(html, /"externalId":"(UC[\w-]{22})"/) || pick(html, /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/);
  if (!channelId) throw new Error(`channel id not found for @${handle}`);
  return channelId;
}

export async function youtube(req, res) {
  try {
    const id = await resolveChannelId();
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
    if (!response.ok) throw new Error(`feed ${response.status}`);
    const videos = await curate(parseFeed(await response.text()));
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
    }).end(JSON.stringify({ channel: `https://www.youtube.com/@${handle}`, videos }));
  } catch (error) {
    console.error("YouTube feed failed:", error.message);
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
      .end(JSON.stringify({ error: "Não foi possível carregar os vídeos agora." }));
  }
}
