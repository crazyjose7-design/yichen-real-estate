import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(resolve(here,'../index.html'),'utf8');
const a=html.indexOf('<section class="section social-media-section"');
const b=html.indexOf('</section>',a);
assert.ok(a>=0&&b>a,'social section exists');
const social=html.slice(a,b);
test('no social video iframe is loaded before a click',()=>{
 assert.equal((social.match(/<iframe\b/gi)||[]).length,0);
 assert.equal((social.match(/data-youtube-video-id=/g)||[]).length,9);
 assert.equal((social.match(/data-tiktok-short-url=/g)||[]).length,9);
});
test('YouTube thumbnails are lazy loaded',()=>{
 assert.equal((social.match(/<img src="https:\/\/i\.ytimg\.com\/vi\//g)||[]).length,9);
 assert.equal((social.match(/loading="lazy" decoding="async" width="480" height="360"/g)||[]).length,9);
});
test('players are created on click and only one is active',()=>{
 assert.match(social,/root\.addEventListener\('click'/);
 assert.match(social,/youtube-nocookie\.com\/embed\/.*?autoplay=1/);
 assert.match(social,/tiktok\.com\/player\/v1\/.*?autoplay=1/);
 assert.match(social,/function stopOtherPlayers\(current\)/);
 assert.match(social,/request!==activeRequest\|\|activeBox!==box/);
 assert.doesNotMatch(social,/visible\.forEach\(mount\)/);
});
test('video cards retrieve their real titles from platform metadata',()=>{
 assert.match(social,/youtube\.com\/oembed\?url=/);
 assert.match(social,/api\/tiktok-metadata\?url=/);
 assert.match(social,/applyVideoTitle\(box,metadata\.title\)/);
});
test('TikTok player enables sound and requests unmute when ready',()=>{
 assert.match(social,/force_muted=0/);
 assert.match(social,/type:'unMute'/);
 assert.match(social,/data\.type==='onPlayerReady'/);
});
test('four resource anchors are connected to the menu',()=>{
 for(const id of ['resource-government','resource-urban-renewal','resource-disaster','resource-private']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
  assert.equal((html.match(new RegExp('href="#'+id+'"','g'))||[]).length,1);
 }
});
test('six official social links and publishing disclaimer are below the heading',()=>{
 const title=social.indexOf('<h2>社群媒體專區</h2>'),links=social.indexOf('social-links-under-title'),disclaimer=social.indexOf('social-disclaimer-under-title'),videos=social.indexOf('aria-label="億辰精選影片"');
 assert.ok(title>=0&&links>title&&disclaimer>links&&videos>disclaimer);
 for(const label of ['YouTube','Threads','TikTok','抖音','Instagram','Facebook'])assert.equal((social.match(new RegExp('>'+label+'</a>','g'))||[]).length,1,label);
});

test('video titles keep only the first segment and remove hashtags',()=>{
 const p=html.indexOf('function applyVideoTitle');
 const q=html.indexOf('async function loadVideoTitles',p);
 const code=html.slice(p,q);
 assert.ok(code.includes("split('\\n')[0]"));
 assert.ok(code.includes("raw.replace(/^(?:\\s*#[\\p{L}\\p{N}_]+)+\\s*/u,'')"));
 assert.ok(code.includes('withoutLeadingTags.split(/\\s+#/u)[0]'));
 assert.ok(code.includes("replace(/#[\\p{L}\\p{N}_]+/gu,'')"));
});
test('TikTok cards use server metadata for real titles and thumbnails',()=>{
 assert.match(html,/api\/tiktok-metadata\?url=/);
 assert.match(html,/metadata\?\.ok&&metadata\.title\)applyVideoTitle\(box,metadata\.title\)/);
 assert.match(html,/metadata\?\.ok&&metadata\.thumbnail_url\)applyVideoThumbnail\(box,metadata\.thumbnail_url\)/);
 assert.match(html,/box\.dataset\.tiktokThumbnailUrl/);
 assert.match(html,/has-tiktok-thumbnail/);
});
test('server-side TikTok metadata endpoint resolves public titles and covers',()=>{
 const endpoint=readFileSync(resolve(here,'../functions/api/tiktok-metadata.js'),'utf8');
 assert.match(endpoint,/https:\/\/www\.tikwm\.com\/api\//);
 assert.match(endpoint,/method: "POST"/);
 assert.match(endpoint,/data\.title \|\| data\.desc/);
 assert.match(endpoint,/data\.cover \|\| data\.origin_cover/);
 assert.match(endpoint,/caches\.default/);
});
test('page title ends immediately after the version number',()=>{
 const match=html.match(/<title>億辰不動產集團｜V[0-9]+(?:\.[0-9]+)*<\/title>/);
 assert.ok(match,'page title contains brand and version only, with no suffix');
});

test('TikTok metadata requests are serialized to respect provider rate limits and cached',()=>{
 const p=html.indexOf('async function loadVideoTitles');
 const q=html.indexOf('async function readText',p);
 const code=html.slice(p,q);
 assert.match(code,/for\(const box of cards\)/);
 assert.match(code,/nextTikTokRequestAt-Date\.now\(\)/);
 assert.match(code,/setTimeout\(resolve,wait\)/);
 assert.match(code,/1200/);
 assert.match(code,/sessionStorage\.getItem\(cacheKey\)/);
 assert.match(code,/30\*60\*1000/);
 assert.doesNotMatch(code,/Promise\.all\(cards\.map/);
});

test('TikTok metadata endpoint has an independent public-page fallback',()=>{
 const endpoint=readFileSync(resolve(here,'../functions/api/tiktok-metadata.js'),'utf8');
 assert.match(endpoint,/fetch\(videoUrl,[\s\S]*redirect: "follow"/);
 assert.match(endpoint,/extractMeta\(html, \["og:title", "twitter:title"\]\)/);
 assert.match(endpoint,/extractMeta\(html, \["og:image", "twitter:image"\]\)/);
 assert.match(endpoint,/extractEmbeddedValue\(html/);
 assert.match(endpoint,/TikTok page HTTP/);
});
