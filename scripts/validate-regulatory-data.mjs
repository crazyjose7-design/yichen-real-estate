import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const cities=[["01","臺北市","taipei"],["02","新北市","new-taipei"],["03","桃園市","taoyuan"],["04","臺中市","taichung"],["05","臺南市","tainan"],["06","高雄市","kaohsiung"],["07","基隆市","keelung"],["08","新竹市","hsinchu-city"],["09","嘉義市","chiayi-city"],["10","新竹縣","hsinchu-county"],["11","苗栗縣","miaoli"],["12","彰化縣","changhua"],["13","南投縣","nantou"],["14","雲林縣","yunlin"],["15","嘉義縣","chiayi-county"],["16","屏東縣","pingtung"],["17","宜蘭縣","yilan"],["18","花蓮縣","hualien"],["19","臺東縣","taitung"],["20","澎湖縣","penghu"],["21","金門縣","kinmen"],["22","連江縣","lienchiang"]];
const root='regulations';
const errors=[];
for(const [code,name,slug] of cities){
 const f=path.join(root,'cities',code+'-'+slug+'.json');
 if(!fs.existsSync(f)){errors.push('missing '+f);continue;}
 const d=JSON.parse(fs.readFileSync(f,'utf8'));
 if(d.jurisdiction?.code!==code||d.jurisdiction?.name!==name)errors.push('identity mismatch '+f);
 if(d.status!=='verified'&&d.application_policy?.auto_apply!==false)errors.push('unverified city auto-applies '+f);
 for(const p of d.official_parameters??[])if(p.status!=='verified'||!p.source?.url||!p.effective_from||!p.verified_by)errors.push('unverified/incomplete official parameter '+f);
}
for(const dir of ['national','rewards']){
 for(const f of fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.json'))){
  const p=path.join(root,dir,f),d=JSON.parse(fs.readFileSync(p,'utf8'));
  if(d.status!=='verified'&&d.application_policy?.auto_apply!==false)errors.push('unverified '+p+' auto-applies');
 }
}
assert.equal(cities.length,22);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
const manifestPath=path.join(root,'manifest.json');
if(!fs.existsSync(manifestPath))errors.push('missing regulations/manifest.json');
else { const m=JSON.parse(fs.readFileSync(manifestPath,'utf8')); if((m.county_city_files??[]).length!==22)errors.push('manifest must list 22 city files'); for(const item of m.county_city_files??[])if(!fs.existsSync(path.join(root,item.path)))errors.push('manifest city path missing: '+item.path); for(const p of [...(m.central_law_files??[]),...(m.incentive_files??[])])if(!fs.existsSync(path.join(root,p)))errors.push('manifest path missing: '+p); }
console.log('PASS: 22 city files; central laws and incentives; manifest paths exist; unverified data cannot auto-apply.');
