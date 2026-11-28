import fs from "node:fs/promises";
const file = "index.html";
let html = await fs.readFile(file, "utf8");
const re = /<article\b[^>]*class="[^"]*social-video-card[^"]*"[^>]*>[\s\S]*?<\/article>/g;
const cards = [...html.matchAll(re)];
if (cards.length !== 18) throw new Error("Expected 18 video cards; found " + cards.length);
const clean = v => String(v || "").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
const esc = v => clean(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
async function getYT(id) {
 const url="https://www.youtube.com/watch?v="+encodeURIComponent(id);
 const r=await fetch("https://www.youtube.com/oembed?url="+encodeURIComponent(url)+"&format=json",{headers:{"user-agent":"Mozilla/5.0"}});
 if(!r.ok) throw Error("YouTube oEmbed "+id+" HTTP "+r.status);
 const d=await r.json(), title=clean(d.title).split("#")[0].trim(), thumbnail=d.thumbnail_url||"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg";
 if(!title||!thumbnail) throw Error("Incomplete YouTube metadata "+id);
 return {title,thumbnail};
}
async function getTT(url) {
 const body=new URLSearchParams({url,hd:"1",web:"1"});
 const r=await fetch("https://www.tikwm.com/api/",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded; charset=UTF-8","user-agent":"Mozilla/5.0",origin:"https://www.tikwm.com",referer:"https://www.tikwm.com/"},body});
 if(!r.ok) throw Error("TikWM HTTP "+r.status+" "+url);
 const d=(await r.json())?.data, title=clean(d?.title||d?.desc), thumbnail=d?.cover||d?.origin_cover||d?.ai_dynamic_cover||"";
 if(!title||!thumbnail) throw Error("TikWM incomplete metadata "+url);
 return {title,thumbnail};
}
function apply(card,m,type){
 let x=card, t=esc(m.title);
 x=x.replace(/(<h3>)[\s\S]*?(<\/h3>)/,"$1"+t+"$2");
 x=x.replace(/(data-(?:video|tiktok)-title=")[^"]*"/,"$1"+t+'"');
 x=x.replace(/aria-label="點擊播放 [^"]*"/,'aria-label="點擊播放 '+t+'"');
 x=x.replace(/(<span class="video-facade-caption">)點擊播放｜[\s\S]*?(<\/span>)/,"$1點擊播放｜"+t+"$2");
 const img='<img src="'+esc(m.thumbnail)+'" alt="'+t+'影片縮圖" loading="eager" decoding="async" width="480" height="'+(type==="youtube"?"360":"640")+'" onerror="this.style.display=\'none\'"/>';
 if(type==="youtube") x=x.replace(/<img\b[^>]*>/,img);
 else if(/<img\b/.test(x)) x=x.replace(/<img\b[^>]*>/,img);
 else x=x.replace(/(<button class="video-facade-play"[^>]*>)/,"$1"+img);
 return x;
}
const data=[], out=[];
for(const {0:card} of cards){
 const y=card.match(/data-youtube-video-id="([^"]+)"/), t=card.match(/data-tiktok-short-url="([^"]+)"/);
 if(!y&&!t) throw Error("Video card has no source");
 const m=y?await getYT(y[1]):await getTT(t[1]);
 data.push({source:y?"youtube":"tiktok",id:y?.[1]||t[1],title:m.title,thumbnail:m.thumbnail});
 out.push(apply(card,m,y?"youtube":"tiktok"));
}
if(data.length!==18||data.some(v=>!v.title||!v.thumbnail)) throw Error("18-record metadata validation failed");
let i=0; html=html.replace(re,()=>out[i++]); if(i!==18) throw Error("Failed to replace all video cards");
await fs.writeFile(file,html,"utf8");
await fs.mkdir("assets",{recursive:true});
await fs.writeFile("assets/video-metadata.json",JSON.stringify({generatedAt:new Date().toISOString(),count:data.length,videos:data},null,2)+"\n");
console.log("Static metadata generated for "+data.length+" videos.");
