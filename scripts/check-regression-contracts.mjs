import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const api = await readFile(new URL("../functions/api/tiktok-metadata.js", import.meta.url), "utf8");
const headers = await readFile(new URL("../_headers", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../site.webmanifest", import.meta.url), "utf8"));
const metadata = JSON.parse(await readFile(new URL("../assets/video-metadata.json", import.meta.url), "utf8"));
const count = (value, needle) => value.split(needle).length - 1;
const videoCards = [...html.matchAll(/<article\b[^>]*class="[^"]*social-video-card[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);

const checks = [
  ["UTF-8 document declaration", html.includes('<meta charset="utf-8"/>')],
  ["Exact document title", html.includes("<title>億辰不動產集團</title>")],
  ["Browser and Apple app names use exact Chinese brand", html.includes('<meta name="application-name" content="億辰不動產集團"/>') && html.includes('<meta name="apple-mobile-web-app-title" content="億辰不動產集團"/>')],
  ["Web app shortcut name and short name use exact Chinese brand", manifest.name === "億辰不動產集團" && manifest.short_name === "億辰不動產集團" && manifest.start_url === "/" && manifest.scope === "/" && manifest.icons.some(icon => icon.src === "/assets/yichen-favicon.svg" && icon.sizes === "512x512")],
  ["Open Graph title kept in sync", html.includes('property="og:title" content="億辰不動產集團"')],
  ["Twitter title kept in sync", html.includes('name="twitter:title" content="億辰不動產集團"')],
  ["Homepage hero title preserved", html.includes("<h1>看見不動產的<br/><em>真正價值。</em></h1>")],

  ["Desktop navigation shows only the exact Chinese brand name", html.includes('<span class="brand-name"><strong>億辰不動產集團</strong></span>') && !html.includes('<small>YICHEN REAL ESTATE GROUP</small>') && !html.includes('<span class="brand-version">') && html.includes(".brand-name{display:block;flex:0 0 auto;white-space:nowrap}")],
  ["Custom factor input is embedded in the original coefficient field", html.includes('id="le-eff"') && html.includes('id="le-custom-eff" aria-label="自訂坪效換算係數"') && !html.includes('id="le-custom-wrap"')],
  ["Custom saleable factor reset remains empty", html.includes("$('le-custom-eff').value=''")],
  ["TikTok featured card 02 uses isolated direct metadata", html.includes('data-tiktok-metadata-direct="1"') && html.includes("const directCard=box.dataset.tiktokMetadataDirect==='1'") && html.includes("yichen_video_metadata_v5:tiktok:")],
  ["TikTok featured card 02 uses same-origin endpoint before short-link resolver", html.indexOf("readText('/api/tiktok-metadata?url='+encodeURIComponent(shortUrl),18000)") < html.indexOf("canonical=await resolveCanonical(shortUrl)")],

  ["HTML response explicitly declares UTF-8", headers.includes("/\n  Content-Type: text/html; charset=utf-8") && headers.includes("/index.html\n  Content-Type: text/html; charset=utf-8")],
  ["Original toolbar emblem and social preview URLs cache-busted", html.includes("yichen-brand-emblem.jpg?rev=20261128-3") && html.includes("yichen-og-cover.svg?rev=20261128-2")],
  ["Custom factor empty selection has a clear blocking message", html.includes("你已選擇「自訂」坪效換算係數，請直接在同一欄位輸入係數；留白不會自動套用1.3或其他預設值。")],
  ["Homepage social preview image configured", html.includes('property="og:image"') && html.includes('name="twitter:image"') && html.includes('name="twitter:card" content="summary_large_image"')],
  ["Homepage icon reuses the original toolbar emblem", html.includes('rel="icon" type="image/jpeg" href="/assets/yichen-brand-emblem.jpg?rev=20261128-3"') && html.includes('rel="apple-touch-icon" href="/assets/yichen-brand-emblem.jpg?rev=20261128-3"')],
  ["Header and culture badges load the shared original emblem eagerly", (html.match(/src="\/assets\/yichen-brand-emblem\.jpg\?rev=20261128-3" loading="eager"/g) || []).length === 2 && !html.includes('data-yichen-inline-image="badge"')],
  ["All 18 videos have verified static titles and thumbnail URLs", metadata.count === 18 && metadata.videos.length === 18 && metadata.videos.every(v => v.title && /^https:\/\//.test(v.thumbnail)) && videoCards.length === 18 && videoCards.every(card => !/YouTube 精選影片|TikTok 精選影片|TikTok 影片 0[1-9]/.test(card))],
  ["All nine TikTok thumbnails load eagerly without referrer blocking", metadata.videos.filter(v => v.source === "tiktok").length === 9 && metadata.videos.filter(v => v.source === "tiktok").every(v => /^https:\/\//.test(v.thumbnail)) && (html.match(/<img\b(?=[^>]*src="https:\/\/www\.tikwm\.com\/video\/cover\/[^"]+")(?=[^>]*loading="eager")(?=[^>]*referrerpolicy="no-referrer")(?=[^>]*fetchpriority="high")[^>]*>/g) || []).length === 9],
  ["All nine TikTok cards retained", count(html, "data-tiktok-short-url=") === 9],
  ["TikTok accepted canonical/oEmbed path retained", html.includes("canonical=await resolveCanonical(shortUrl);") && html.includes("https://www.tiktok.com/oembed?url=") && html.includes("const fallback=JSON.parse(await readText('/api/tiktok-metadata?url='+encodeURIComponent(canonical),18000))")],
  ["Fullscreen video exit restores the original page scroll position", html.includes("function rememberVideoScroll()") && html.includes("function restoreVideoScroll()") && html.includes("document.addEventListener('visibilitychange'") && html.includes("document.addEventListener('fullscreenchange'") && html.includes("rememberVideoScroll();if(box.dataset.youtubeVideoId)")],
  ["Video scroll restoration is debounced and executes one instant scroll", html.includes("let videoScrollRestoreTimer=null;") && html.includes("},180);") && html.includes("window.scrollTo({left:0,top:saved.top,behavior:'instant'});") && !html.includes("requestAnimationFrame(()=>window.scrollTo(0,top))")],
  ["Top navigation social-media link inherits the same font and size as sibling navigation links", html.includes('#nav .links>a[href="#social-media"]{') && html.includes('font-family:inherit!important;') && html.includes('font-size:inherit!important;') && !html.includes('yichen-social-toolbar-font-unification')],
  ["All video platforms use persistent metadata cache and parallel loading", html.includes("localStorage.getItem(cacheKey)") && html.includes("Promise.allSettled(cards.map(box=>loadOneVideoMetadata(box)))") && html.includes("yichen_video_metadata_v1:youtube:")],
  ["All nine YouTube thumbnails load eagerly", (html.match(/src="https:\/\/i\.ytimg\.com\/vi\/[^"]+"[^>]*loading="eager"/g) || []).length === 9],
  ["TikTok thumbnail renderer loads eagerly", html.includes("function applyVideoThumbnail(") && html.includes("img.loading='eager'") && html.includes("img.fetchPriority='high'") && html.includes("img.referrerPolicy='no-referrer'")],
  ["Mobile header retains the exact Chinese brand name without version", html.includes('<span class="brand-name"><strong>億辰不動產集團</strong></span>') && !html.includes('<span class="brand-version">') && html.includes(".brand-motto{display:none!important}") && !html.includes(".brand>span:not(.brand-version){display:none!important}")],
  ["Compact brand applies to phone and tablet widths", html.includes("@media(max-width:900px){")],
  ["Mobile brand preserves emblem and Chinese brand name", html.includes(".brand img{display:block!important;width:40px!important;height:40px!important}") && html.includes(".brand-name{display:block;flex:0 0 auto;white-space:nowrap}")],
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
