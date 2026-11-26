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
 const placeholder='src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" data-yichen-inline-image="'+key+'" data-yichen-inline-type="'+def.type+'"';
 if(!html.includes(placeholder)) throw new Error('Inline image placeholder not found or malformed: '+key);
 html=html.replaceAll(placeholder,'src="'+data+'"');
}
const loader=/<script id="yichen-inline-image-loader">[\s\S]*?<\/script>/;
if(!loader.test(html)) throw new Error('Inline image loader not found');
html=html.replace(loader,'<!-- Images embedded into this single-file build; no external asset fetch required. -->');
if(/data-yichen-inline-image=/.test(html)) throw new Error('Unresolved inline image placeholders remain');
const imageTags=[...html.matchAll(/<img\b[^>]*>/g)].map(x=>x[0]);
if(imageTags.some(tag=>(tag.match(/\bsrc=/g)||[]).length!==1)) throw new Error('An image tag contains duplicate src attributes');
if(html.includes('data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=')) throw new Error('Transparent placeholder image remains in deployment HTML');
const regulationRoot=path.join(root,'regulations');
const regulationManifest=JSON.parse(await fs.readFile(path.join(regulationRoot,'manifest.json'),'utf8'));
const regulationPaths=[...(regulationManifest.county_city_files||[]).map(x=>x.path),...(regulationManifest.central_law_files||[]),...(regulationManifest.incentive_files||[]),...(regulationManifest.tax_parameter_files||[]),'schemas/city-parameters.schema.json','schemas/parameter-record.schema.json'];
const regulationFiles={};
for(const relativePath of regulationPaths) regulationFiles[relativePath]=JSON.parse(await fs.readFile(path.join(regulationRoot,relativePath),'utf8'));
const runtime=await fs.readFile(path.join(root,'workbench','modules','regulation-data-runtime.js'),'utf8');
const taxAdditionalCalc=await fs.readFile(path.join(root,'workbench','modules','tax-simpany-parity-calculations.js'),'utf8');
const taxAdditionalTools=await fs.readFile(path.join(root,'workbench','modules','tax-simpany-parity-tools.js'),'utf8');
const rewardEngineRuntime=await fs.readFile(path.join(root,'workbench','modules','reward-engine-runtime.js'),'utf8');
const landRewardGate=await fs.readFile(path.join(root,'workbench','modules','land-reward-gate.js'),'utf8');
const embeddedPayload=JSON.stringify({manifest:regulationManifest,files:regulationFiles}).replace(/</g,'\\u003c');
const embeddedBlock='<script type="application/json" id="yichen-regulatory-data">'+embeddedPayload+'</script>\n<script id="yichen-regulatory-runtime">'+runtime+'</script>\n<script id="yichen-reward-engine-runtime">'+rewardEngineRuntime+'</script>\n<script id="yichen-land-reward-gate">'+landRewardGate+'</script>\n<script id="yichen-tax-additional-calculations">'+taxAdditionalCalc+'</script>\n<script id="yichen-tax-additional-tools">'+taxAdditionalTools+'</script>\n';
if(!/<\/body>/i.test(html)) throw new Error('HTML body closing tag not found for regulatory data injection');
html=html.replace(/<\/body>/i,embeddedBlock+'</body>');
await fs.writeFile(path.join(out,'index.html'),html);
await fs.writeFile(path.join(pkg,'index.html'),html);
await fs.copyFile(src,path.join(pkg,'index.multi-file.html'));
await fs.cp(assetDir,path.join(pkg,'assets'),{recursive:true});
await fs.cp(path.join(root,'workbench','modules'),path.join(pkg,'modules'),{recursive:true});
await fs.copyFile(path.join(root,'workbench','EXECUTION_RULES.md'),path.join(pkg,'EXECUTION_RULES.md'));
await fs.cp(path.join(root,'regulations'),path.join(pkg,'regulations'),{recursive:true});
await fs.cp(path.join(root,'docs'),path.join(pkg,'docs'),{recursive:true});
await fs.cp(path.join(root,'versions'),path.join(pkg,'versions'),{recursive:true});
await fs.copyFile(path.join(root,'scripts','validate-regulatory-data.mjs'),path.join(pkg,'validate-regulatory-data.mjs'));
await fs.copyFile(path.join(root,'tests','regulatory-data.test.mjs'),path.join(pkg,'regulatory-data.test.mjs'));
await fs.copyFile(path.join(root,'tests','regulation-loader.test.mjs'),path.join(pkg,'regulation-loader.test.mjs'));
await fs.copyFile(path.join(root,'tests','tax-additional-tools.test.mjs'),path.join(pkg,'tax-additional-tools.test.mjs'));\nawait fs.copyFile(path.join(root,'tests','tax-simpany-parity.test.mjs'),path.join(pkg,'tax-simpany-parity.test.mjs'));
await fs.copyFile(path.join(root,'tests','reward-engine-runtime.test.mjs'),path.join(pkg,'reward-engine-runtime.test.mjs'));
await fs.copyFile(path.join(root,'tests','reward-engine.test.mjs'),path.join(pkg,'reward-engine.test.mjs'));
execFileSync(process.execPath,[path.join(root,'tests','regulatory-data.test.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['--test',path.join(root,'tests','reward-engine.test.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['--test',path.join(root,'tests','tax-additional-tools.test.mjs')],{cwd:root,stdio:'inherit'});\nexecFileSync(process.execPath,['--test',path.join(root,'tests','tax-simpany-parity.test.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['--test',path.join(root,'tests','reward-engine-runtime.test.mjs')],{cwd:root,stdio:'inherit'});
await fs.writeFile(path.join(pkg,'README.txt'),[
 '億辰不動產網站部署包',
 '主要部署檔：index.html（單檔版，圖片已內嵌）',
 'index.multi-file.html 與 assets/ 為原始多檔參考版本；正式上傳建議使用 index.html。',
 'modules/ 是維護來源模組；租金扣繳、執行業務所得及容積獎勵安全檢核已嵌入單檔HTML，其他既有核心模組仍有部分維持inline。',
 'regulations/ 包含 22 縣市、中央法規、稅目與獎勵資料；單檔 HTML 內嵌同一資料集及安全載入 API，未查證資料不得自動套用。',
 '稅務區新增租金扣繳與執行業務所得計算；公式及法源紀錄請見 regulations/national/、regulations/taxes/ 與 modules/tax-additional-*.js。',
 '土地坪效含官方容積獎勵安全檢核；未核實、未取得個案核准或互斥規則不明時，獎勵不得自動加入試算。',
 'docs/、versions/ 與驗證器一併封裝，方便後續查核及回復。',
 '本包以 V6.2.20 已驗證基準分支為來源。'
].join('\n')+'\n');
execFileSync('zip',['-qr',path.join(out,'yichen-real-estate-deployment.zip'),'.'],{cwd:pkg});
const stats=await Promise.all([path.join(out,'index.html'),path.join(out,'yichen-real-estate-deployment.zip')].map(async p=>({file:path.basename(p),bytes:(await fs.stat(p)).size})));
console.log(JSON.stringify({output:out,stats,embeddedImages:Object.keys(assetDefs)},null,2));
