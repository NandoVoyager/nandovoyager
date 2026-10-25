// Latest long-form videos from the channel's public RSS feed (no API key). Vercel's CDN caches the answer for an hour.
// YOUTUBE_CHANNEL_ID (UC…) is optional: without it the channel ID is read once from the handle's page.
const handle = process.env.YOUTUBE_HANDLE || "NandoVoyager";
let channelId = process.env.YOUTUBE_CHANNEL_ID || "";

/*
 * Curation on top of the automatic list. Titles match by a piece of the title (case and accents ignored).
 * hide: videos left out. pin: videos always shown at a position (1 = first). A pin is taken from the feed when it is
 * there; once it is too old for the feed, the optional id keeps it, after YouTube confirms the video is this channel's.
 */
const curation = {
  hide: ["todo mundo estudou em harvard", "desde quando ser honesto virou se gabar"],
  pin: [
    { title: "esse é o motivo que eu quero ficar rico", position: 2 },
    { title: "tentaram comprar minha alma", position: 4, id: "5EB6yb3nOd8" }
  ]
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

// A pinned id outside the feed: oEmbed gives its title and confirms the author is this channel.
async function pinnedById(id) {
  const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
  if (!response.ok) return null;
  const info = await response.json();
  const author = String(info.author_url || "").toLowerCase();
  if (!author.endsWith(`/@${handle.toLowerCase()}`) && !(channelId && author.endsWith(`/channel/${channelId.toLowerCase()}`))) return null;
  return { id, title: info.title, published: null, views: null };
}

export async function curate(videos, rules = curation, byId = pinnedById) {
  let list = videos.filter((video) => !rules.hide.some((title) => matches(video, title)));
  const pins = [];
  for (const pin of rules.pin) {
    let video = list.find((v) => matches(v, pin.title));
    if (video) list = list.filter((v) => v !== video);
    else if (pin.id) video = await byId(pin.id).catch(() => null);
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
      "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400"
    }).end(JSON.stringify({ channel: `https://www.youtube.com/@${handle}`, videos }));
  } catch (error) {
    console.error("YouTube feed failed:", error.message);
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
      .end(JSON.stringify({ error: "Não foi possível carregar os vídeos agora." }));
  }
}
