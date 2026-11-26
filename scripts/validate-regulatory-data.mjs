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

// Verify reported local-law source coverage against the actual city records.
let citySourceCount=0;
for(const [code,name,slug] of cities){
 const p=path.join(root,'cities',code+'-'+slug+'.json');
 if(!fs.existsSync(p))continue;
 const d=JSON.parse(fs.readFileSync(p,'utf8'));
 if((d.local_regulations??[]).some(x=>x.source?.url))citySourceCount++;
 if(d.status==='verified'&&!(d.official_parameters??[]).length)errors.push('city marked verified without official parameters '+p);
}
const manifestForCoverage=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
if(manifestForCoverage.research_progress?.cities_with_source_records_count!==citySourceCount)errors.push('manifest local source coverage count does not match city records');
if(citySourceCount!==7)errors.push('expected seven city source indexes in current research batch; found '+citySourceCount);

for(const dir of ['national','rewards','taxes']){
 for(const f of fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.json'))){
  const p=path.join(root,dir,f),d=JSON.parse(fs.readFileSync(p,'utf8'));
  if(d.status!=='verified'&&d.application_policy?.auto_apply!==false)errors.push('unverified '+p+' auto-applies');
 }
}
assert.equal(cities.length,22);
for(const schema of ['schemas/city-parameters.schema.json','schemas/parameter-record.schema.json'])if(!fs.existsSync(path.join(root,schema)))errors.push('missing schema '+schema);
const manifestPath=path.join(root,'manifest.json');
if(!fs.existsSync(manifestPath))errors.push('missing regulations/manifest.json');
else { const m=JSON.parse(fs.readFileSync(manifestPath,'utf8')); if((m.county_city_files??[]).length!==22)errors.push('manifest must list 22 city files'); for(const item of m.county_city_files??[])if(!fs.existsSync(path.join(root,item.path)))errors.push('manifest city path missing: '+item.path); for(const p of [...(m.central_law_files??[]),...(m.incentive_files??[]),...(m.tax_parameter_files??[])])if(!fs.existsSync(path.join(root,p)))errors.push('manifest path missing: '+p); }
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('PASS: 22 city files; central laws, taxes and incentives; manifest paths exist; unverified data cannot auto-apply.');
