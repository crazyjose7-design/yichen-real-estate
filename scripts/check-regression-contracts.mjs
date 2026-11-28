import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const api = await readFile(new URL("../functions/api/tiktok-metadata.js", import.meta.url), "utf8");
const headers = await readFile(new URL("../_headers", import.meta.url), "utf8");
const count = (value, needle) => value.split(needle).length - 1;

const checks = [
  ["UTF-8 document declaration", html.includes('<meta charset="utf-8"/>')],
  ["Exact document title", html.includes("<title>億辰不動產集團 V6.3.3</title>")],
  ["Open Graph title kept in sync", html.includes('property="og:title" content="億辰不動產集團 V6.3.3"')],
  ["Twitter title kept in sync", html.includes('name="twitter:title" content="億辰不動產集團 V6.3.3"')],
  ["Homepage hero title preserved", html.includes("<h1>看見不動產的<br/><em>真正價值。</em></h1>")],

  ["Desktop brand version remains visible", html.includes(".brand-version{display:inline-flex!important;align-items:center;color:#e4d0a6;font-size:12px")],
  ["Custom saleable factor starts empty", html.includes('id="le-custom-eff" max="5" min="0.01" placeholder="請自行輸入比例" step="0.01" type="number"/>')],
  ["Custom saleable factor reset remains empty", html.includes("$('le-custom-eff').value=''")],
  ["TikTok featured card 02 uses isolated direct metadata", html.includes('data-tiktok-metadata-direct="1"') && html.includes("const directCard=box.dataset.tiktokMetadataDirect==='1'") && html.includes("yichen_tiktok_metadata_v4:")],
  ["TikTok featured card 02 uses same-origin endpoint before short-link resolver", html.indexOf("readText('/api/tiktok-metadata?url='+encodeURIComponent(shortUrl),18000)") < html.indexOf("canonical=await resolveCanonical(shortUrl)")],

  ["HTML response explicitly declares UTF-8", headers.includes("/\\n  Content-Type: text/html; charset=utf-8") && headers.includes("/index.html\\n  Content-Type: text/html; charset=utf-8")],
  ["Homepage icon and social preview URLs cache-busted", html.includes("yichen-favicon.svg?rev=20261128-2") && html.includes("yichen-og-cover.svg?rev=20261128-2")],
  ["Custom factor empty selection has a clear blocking message", html.includes("你已選擇「自訂可出售面積換算比例」，請自行輸入比例；留白不會自動套用1.3或其他預設值。")],
  ["Homepage social preview image configured", html.includes('property="og:image"') && html.includes('name="twitter:image"') && html.includes('name="twitter:card" content="summary_large_image"')],
  ["Homepage favicon configured", html.includes('rel="icon" type="image/svg+xml" href="/assets/yichen-favicon.svg"')],
  ["Three featured TikTok videos retained", (html.match(/data-tiktok-title="TikTok 精選影片 0[1-3]"/g) || []).length === 3],
  ["All nine TikTok cards retained", count(html, "data-tiktok-short-url=") === 9],
  ["TikTok accepted canonical/oEmbed path retained", html.includes("const canonical=await resolveCanonical(shortUrl);") && html.includes("https://www.tiktok.com/oembed?url=") && html.includes("const fallback=JSON.parse(await readText('/api/tiktok-metadata?url='+encodeURIComponent(canonical),18000))")],
  ["TikTok cache hit still applies title", html.includes("}\n         if(metadata?.title)applyVideoTitle(box,metadata.title);")],
  ["TikTok thumbnail renderer retained", html.includes("function applyVideoThumbnail(")],
  ["Mobile header shows version only", html.includes('<span class="brand-version">V6.3.3</span>') && html.includes(".brand-motto,.brand>span:not(.brand-version){display:none!important}")],
  ["Compact brand applies to phone and tablet widths", html.includes("@media(max-width:900px){")],
  ["Mobile brand preserves emblem and version only", html.includes(".brand img{display:block!important;width:40px!important;height:40px!important}") && html.includes(".brand-version{display:inline-flex!important")],
  ["YouTube title cleanup remains isolated", html.includes("box.dataset.youtubeVideoId?String(title||'').replace") && html.includes(":cleanVideoTitle(title)")],
  ["TikTok metadata Function retained", api.includes("export async function onRequestGet")],
  ["Four resource sections retained", ["resource-government","resource-urban-renewal","resource-disaster","resource-private"].every(id => html.includes('id="'+id+'"'))],
  ["Four resource anchors retain offset rule", html.includes("#resource-government,#resource-urban-renewal,#resource-disaster,#resource-private{scroll-margin-top:132px}")],
  ["Tax calculator modules retained", html.includes('id="yichen-tax-simpany-calculations"') && html.includes('id="yichen-tax-simpany-tools"')],
  ["County selector retained", html.includes('id="le-city-select"')],
  ["Official land result panel added", html.includes('id="le-official-out-base"') && html.includes('id="le-official-out-approved"')],
  ["User estimate panel explicitly separated", html.includes("B. 使用者自行輸入預估情境結果")],
  ["Manual FAR input is labelled as an assumption", html.includes("使用者自行輸入的法定容積率假設（%）")],
  ["Official result requires official land area", html.includes('id="le-official-area"') && html.includes("officialAreaSqm/3.305785")],
  ["Official FAR requires verified status, source and date", html.includes("const officialValid=written&&officialAreaPing!==null&&officialFar!==null&&officialFar>0&&source!==''&&date!==''")],
  ["Approved area requires approval status, permit and date", html.includes("const approvedValid=approved&&((approvedSqm!==null&&approvedSqm>0)||(officialAreaPing!==null&&approvedFar!==null&&approvedFar>0))&&permit!==''&&date!==''&&source!==''")],
  ["Official calculation excludes manual reward assumptions", html.includes("const statutoryPing=officialValid?officialAreaPing*officialFar/100:null;") && html.includes("const approvedPing=approvedValid?")],
  ["Official result refreshes when source fields change", html.includes("['le-official-status','le-official-area','le-official-far','le-approved-far','le-approved-fa','le-permit-no','le-doc-date','le-doc-source'")],
  ["Land PDF includes both official and estimate result panels", html.includes("officialResult=cardFor('A. 法定／官方核定結果')") && html.includes("estimateResult=cardFor('B. 使用者自行輸入預估情境結果')")],
  ["All inline JavaScript parses", [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].every(match => { try { new Function(match[1]); return true; } catch { return false; } })],
];

for (const [name, ok] of checks) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  assert.ok(ok, name);
}
console.log("All regression contracts passed.");
