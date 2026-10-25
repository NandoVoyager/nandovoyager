// Latest long-form videos from the channel's public RSS feed (no API key). Vercel's CDN caches the answer for an hour.
// YOUTUBE_CHANNEL_ID (UC…) is optional: without it the channel ID is read once from the handle's page.
const handle = process.env.YOUTUBE_HANDLE || "NandoVoyager";
let channelId = process.env.YOUTUBE_CHANNEL_ID || "";

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

export function parseFeed(xml, limit = 12) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, entry]) => ({
      id: pick(entry, /<yt:videoId>([\w-]{11})<\/yt:videoId>/),
      title: decode(pick(entry, /<title>([\s\S]*?)<\/title>/)),
      published: pick(entry, /<published>([^<]+)<\/published>/),
      link: pick(entry, /<link rel="alternate" href="([^"]+)"/),
      views: Number(pick(entry, /<media:statistics views="(\d+)"/)) || null
    }))
    .filter((video) => video.id && !video.link.includes("/shorts/"))
    .slice(0, limit)
    .map(({ link, ...video }) => video);
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
    const videos = parseFeed(await response.text());
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
