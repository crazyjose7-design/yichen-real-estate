export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const videoUrl = requestUrl.searchParams.get("url") || "";
  let parsed;
  try { parsed = new URL(videoUrl); }
  catch { return json({ ok: false, error: "Invalid TikTok URL" }, 400); }

  const host = parsed.hostname.toLowerCase();
  if (!(host === "tiktok.com" || host.endsWith(".tiktok.com")) || parsed.protocol !== "https:") {
    return json({ ok: false, error: "Only HTTPS TikTok URLs are allowed" }, 400);
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/tiktok-metadata-v3?url=" + encodeURIComponent(videoUrl), request.url).toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const errors = [];
  let result = null;

  // Route 1: TikWM public metadata endpoint (the frontend serializes requests).
  try {
    const body = new URLSearchParams({ url: videoUrl, hd: "1", web: "1" });
    const upstream = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.tikwm.com",
        "Referer": "https://www.tikwm.com/"
      },
      body
    });
    if (!upstream.ok) throw new Error("TikWM HTTP " + upstream.status);
    const payload = await upstream.json();
    const data = payload && payload.data;
    if (payload.code === 0 && data) {
      result = normalize({
        title: data.title || data.desc,
        thumbnail: data.cover || data.origin_cover || data.ai_dynamic_cover,
        video_id: data.id
      });
    } else {
      throw new Error("TikWM response code " + String(payload.code));
    }
  } catch (error) {
    errors.push("TikWM: " + String(error && error.message || error));
  }

  // Route 2: fetch the public TikTok page and extract Open Graph / embedded state.
  // This is independent of TikWM and does not depend on TikTok oEmbed fields.
  if (!result || !result.title || !result.thumbnail_url) {
    try {
      const pageResponse = await fetch(videoUrl, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });
      if (!pageResponse.ok) throw new Error("TikTok page HTTP " + pageResponse.status);
      const html = await pageResponse.text();
      const title = extractMeta(html, ["og:title", "twitter:title"]);
      const thumbnail = extractMeta(html, ["og:image", "twitter:image"]);
      const canonical = pageResponse.url || videoUrl;
      const videoId = canonical.split("/video/")[1]?.match(/^\d{8,}/)?.[0] || "";
      const embeddedTitle = extractEmbeddedValue(html, ["desc", "description", "title"]);
      const embeddedCover = extractEmbeddedValue(html, ["originCover", "cover", "dynamicCover"]);
      const pageData = normalize({
        title: title || embeddedTitle,
        thumbnail: thumbnail || embeddedCover,
        video_id: videoId
      });
      if (pageData && (pageData.title || pageData.thumbnail_url)) {
        result = { ...(result || {}), title: result?.title || pageData.title, thumbnail_url: result?.thumbnail_url || pageData.thumbnail_url, video_id: result?.video_id || pageData.video_id };
      }
    } catch (error) {
      errors.push("TikTok page: " + String(error && error.message || error));
    }
  }

  if (!result || (!result.title && !result.thumbnail_url)) {
    return json({ ok: false, error: errors.join(" | ") || "No public metadata found" }, 502);
  }

  const response = json({ ok: true, ...result }, 200, { "Cache-Control": "public, max-age=1800" });
  if (result.title && result.thumbnail_url) await cache.put(cacheKey, response.clone());
  return response;
}

function normalize({ title = "", thumbnail = "", video_id = "" }) {
  let thumbnailUrl = String(thumbnail || "").replace(/\\u002F/g, "/").replace(/\\u0026/g, "&").trim();
  if (thumbnailUrl.startsWith("//")) thumbnailUrl = "https:" + thumbnailUrl;
  try {
    const parsed = new URL(thumbnailUrl);
    if (parsed.protocol !== "https:") thumbnailUrl = "";
  } catch { thumbnailUrl = ""; }
  const cleanTitle = String(title || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!cleanTitle && !thumbnailUrl && !video_id) return null;
  return { title: cleanTitle, thumbnail_url: thumbnailUrl, video_id: String(video_id || "") };
}

function extractMeta(html, keys) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const name = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    if (!keys.includes(name.toLowerCase())) continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] || "";
    if (content) return decodeHtml(content);
  }
  return "";
}

function extractEmbeddedValue(html, keys) {
  for (const key of keys) {
    const pattern = new RegExp('"' + key + '"\\s*:\\s*"([^"]{3,500})"', "i");
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]);
  }
  return "";
}

function decodeHtml(value) {
  return String(value || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\\u002F/g, "/").replace(/\\u0026/g, "&");
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}
