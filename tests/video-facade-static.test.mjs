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
 assert.match(social,/tiktok\.com\/oembed\?url=/);
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
 assert.match(code,/split\('\\n'\)\[0\]/);
 assert.match(code,/raw\.split\(\/\\s\+#\/u\)\[0\]/);
 assert.match(code,/replace\(\/#\[\\p\{L\}\\p\{N\}_\]\+\/gu,''\)/);
});
