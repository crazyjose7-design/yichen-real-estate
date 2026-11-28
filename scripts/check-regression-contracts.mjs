import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const api = await readFile(new URL("../functions/api/tiktok-metadata.js", import.meta.url), "utf8");
const count = (value, needle) => value.split(needle).length - 1;

const checks = [
  ["UTF-8 document declaration", html.includes('<meta charset="utf-8"/>')],
  ["Exact document title", html.includes("<title>億辰不動產集團 V6.3.3</title>")],
  ["Open Graph title kept in sync", html.includes('property="og:title" content="億辰不動產集團 V6.3.3"')],
  ["Twitter title kept in sync", html.includes('name="twitter:title" content="億辰不動產集團 V6.3.3"')],
  ["Homepage hero title preserved", html.includes("<h1>看見不動產的<br/><em>真正價值。</em></h1>")],
  ["Three featured TikTok videos retained", (html.match(/data-tiktok-title="TikTok 精選影片 0[1-3]"/g) || []).length === 3],
  ["All nine TikTok cards retained", count(html, "data-tiktok-short-url=") === 9],
  ["TikTok accepted canonical/oEmbed path retained", html.includes("const canonical=await resolveCanonical(shortUrl);") && html.includes("https://www.tiktok.com/oembed?url=") && html.includes("const fallback=JSON.parse(await readText('/api/tiktok-metadata?url='+encodeURIComponent(canonical),18000))")],
  ["TikTok cache hit still applies title", html.includes("}\n         if(metadata?.title)applyVideoTitle(box,metadata.title);")],
  ["TikTok thumbnail renderer retained", html.includes("function applyVideoThumbnail(")],
  ["Mobile header shows version only", html.includes('<span class="brand-version">V6.3.3</span>') && html.includes(".brand-motto,.brand>span:not(.brand-version){display:none!important}")],
  ["YouTube title cleanup remains isolated", html.includes("box.dataset.youtubeVideoId?String(title||'').replace") && html.includes(":cleanVideoTitle(title)")],
  ["TikTok metadata Function retained", api.includes("export async function onRequestGet")],
  ["Four resource sections retained", ["resource-government","resource-urban-renewal","resource-disaster","resource-private"].every(id => html.includes('id="'+id+'"'))],
  ["Four resource anchors retain offset rule", html.includes("#resource-government,#resource-urban-renewal,#resource-disaster,#resource-private{scroll-margin-top:132px}")],
  ["Tax calculator modules retained", html.includes('id="yichen-tax-simpany-calculations"') && html.includes('id="yichen-tax-simpany-tools"')],
  ["County selector retained", html.includes('id="le-city-select"')],
];

for (const [name, ok] of checks) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  assert.ok(ok, name);
}
console.log("All regression contracts passed.");
