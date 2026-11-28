export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const videoUrl = requestUrl.searchParams.get("url") || "";
  let parsed;
  try {
    parsed = new URL(videoUrl);
  } catch {
    return json({ ok: false, error: "Invalid TikTok URL" }, 400);
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = host === "tiktok.com" || host.endsWith(".tiktok.com");
  if (!allowed || parsed.protocol !== "https:") {
    return json({ ok: false, error: "Only HTTPS TikTok URLs are allowed" }, 400);
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/tiktok-metadata?url=" + encodeURIComponent(videoUrl), request.url).toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const body = new URLSearchParams({ url: videoUrl, hd: "1", web: "1" });
    const upstream = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (compatible; YichenRealEstate/1.0)"
      },
      body
    });
    if (!upstream.ok) throw new Error("TikWM HTTP " + upstream.status);
    const payload = await upstream.json();
    const data = payload && payload.data;
    if (payload.code !== 0 || !data) {
      return json({ ok: false, error: "TikTok metadata provider did not return video data" }, 502);
    }

    const title = String(data.title || data.desc || "").trim();
    let thumbnail = data.cover || data.origin_cover || data.ai_dynamic_cover || "";
    if (thumbnail && thumbnail.startsWith("/")) thumbnail = "https://www.tikwm.com" + thumbnail;
    try {
      const imageUrl = new URL(thumbnail);
      if (imageUrl.protocol !== "https:") thumbnail = "";
    } catch {
      thumbnail = "";
    }
    const response = json({
      ok: Boolean(title || thumbnail),
      title,
      thumbnail_url: thumbnail,
      video_id: String(data.id || "")
    }, 200, { "Cache-Control": "public, max-age=1800" });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    return json({ ok: false, error: String(error && error.message || error) }, 502);
  }
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
