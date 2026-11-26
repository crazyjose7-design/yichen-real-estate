import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const src=path.join(root,'index.html');
const out=path.join(root,'dist');
const pkg=path.join(out,'deployment-package');
const assetDir=path.join(root,'assets');
const assetDefs={
 badge:{type:'image/jpeg',files:['yichen-inline-badge-1.txt','yichen-inline-badge-2.txt']},
 founder:{type:'image/png',files:['yichen-inline-founder-1.txt','yichen-inline-founder-2.txt']},
 'about-emblem':{type:'image/png',files:['yichen-inline-about-emblem-1.txt','yichen-inline-about-emblem-2.txt','yichen-inline-about-emblem-3.txt','yichen-inline-about-emblem-4.txt','yichen-inline-about-emblem-5.txt']}
};
await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(pkg,{recursive:true});
let html=await fs.readFile(src,'utf8');
for(const [key,def] of Object.entries(assetDefs)){
 const chunks=await Promise.all(def.files.map(f=>fs.readFile(path.join(assetDir,f),'utf8')));
 const b64=chunks.join('').replace(/\s/g,'');
 if(!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)||b64.length%4!==0) throw new Error('Invalid base64 asset '+key);
 const bytes=Buffer.from(b64,'base64');
 if(!bytes.length) throw new Error('Empty asset '+key);
 const data='data:'+def.type+';base64,'+b64;
 html=html.replaceAll('data-yichen-inline-image="'+key+'"', 'src="'+data+'"');
}
const loader=/<script id="yichen-inline-image-loader">[\s\S]*?<\/script>/;
if(!loader.test(html)) throw new Error('Inline image loader not found');
html=html.replace(loader,'<!-- Images embedded into this single-file build; no external asset fetch required. -->');
if(/data-yichen-inline-image=/.test(html)) throw new Error('Unresolved inline image placeholders remain');
await fs.writeFile(path.join(out,'index.html'),html);
await fs.writeFile(path.join(pkg,'index.html'),html);
await fs.copyFile(src,path.join(pkg,'index.multi-file.html'));
await fs.cp(assetDir,path.join(pkg,'assets'),{recursive:true});
await fs.cp(path.join(root,'workbench','modules'),path.join(pkg,'modules'),{recursive:true});
await fs.copyFile(path.join(root,'workbench','EXECUTION_RULES.md'),path.join(pkg,'EXECUTION_RULES.md'));
await fs.cp(path.join(root,'regulations'),path.join(pkg,'regulations'),{recursive:true});
await fs.cp(path.join(root,'docs'),path.join(pkg,'docs'),{recursive:true});
await fs.copyFile(path.join(root,'scripts','validate-regulatory-data.mjs'),path.join(pkg,'validate-regulatory-data.mjs'));
await fs.copyFile(path.join(root,'tests','regulatory-data.test.mjs'),path.join(pkg,'regulatory-data.test.mjs'));
execFileSync(process.execPath,[path.join(root,'tests','regulatory-data.test.mjs')],{cwd:root,stdio:'inherit'});
await fs.writeFile(path.join(pkg,'README.txt'),[
 '億辰不動產網站部署包',
 '主要部署檔：index.html（單檔版，圖片已內嵌）',
 'index.multi-file.html 與 assets/ 為原始多檔參考版本；正式上傳建議使用 index.html。',
 'modules/ 是拆分後的維護來源模組，尚未替換正式頁面的 inline script。',
 'regulations/ 包含 22 縣市、中央法規與獎勵資料；未查證資料不得自動套用。',
 'docs/ 與驗證器一併封裝，方便後續查核及回復。',
 '本包以 V6.2.20 已驗證基準分支為來源。'
].join('\n')+'\n');
execFileSync('zip',['-qr',path.join(out,'yichen-real-estate-deployment.zip'),'.'],{cwd:pkg});
const stats=await Promise.all([path.join(out,'index.html'),path.join(out,'yichen-real-estate-deployment.zip')].map(async p=>({file:path.basename(p),bytes:(await fs.stat(p)).size})));
console.log(JSON.stringify({output:out,stats,embeddedImages:Object.keys(assetDefs)},null,2));
