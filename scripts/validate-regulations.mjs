import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), cityDir=path.join(root,'regulations/cities'), taxDir=path.join(root,'regulations/taxes'), errors=[];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const cities=read(path.join(cityDir,'registry.json')).cityFiles, taxes=read(path.join(taxDir,'registry.json')).taxFiles;
if(cities.length!==22) errors.push('縣市登錄數必須為22');
if(taxes.length!==12) errors.push('稅目登錄數必須為12');
const moduleKeys = new Set();
for(const [items,dir,key] of [[cities,cityDir,'jurisdiction'],[taxes,taxDir,'tax']]) for(const item of items){const p=path.join(dir,item.file);if(!fs.existsSync(p)){errors.push('缺少檔案 '+item.file);continue;}const d=read(p);if(key==='jurisdiction'&&d.jurisdiction?.id!==item.id)errors.push('縣市ID不符 '+item.file);
if(key==='jurisdiction'&&(d.localParameterRequirements??[]).length<5)errors.push('縣市地方參數查核項目不足 '+item.file);if(key==='tax'&&d.id!==item.id)errors.push('稅目ID不符 '+item.file);
if(key==='tax'){if(!d.displayName||!d.moduleKey)errors.push('稅目尚未完成模組映射 '+item.file);if(moduleKeys.has(d.moduleKey))errors.push('稅務模組key重複 '+d.moduleKey);moduleKeys.add(d.moduleKey);if(!(d.sourceRecords??[]).some(s=>s.authority==='official'&&/^https:\/\//.test(s.url??'')))errors.push('缺少官方來源入口 '+item.file);}for(const v of d.parameters??[])if(v.status==='verified'&&(!v.official_source_url||!v.legal_basis||!v.effective_date||!v.checked_at||!v.checked_by))errors.push('已驗證參數缺法源欄位 '+item.file+'/'+v.id);}
if(errors.length){console.error('VALIDATION FAILED',...errors);process.exit(1);}console.log('STRUCTURE PASSED: 22 city files, 12 tax slots. Legal correctness is not certified.');

const fixtureDir=path.join(root,'tests/tax/fixtures');
if(fs.existsSync(fixtureDir)){
 for(const name of fs.readdirSync(fixtureDir).filter(x=>x.endsWith('.json'))){
  try{
   const f=read(path.join(fixtureDir,name));
   if(!f.id||!f.taxModule||!f.sourceUrl||!f.input||!f.expected)errors.push('稅務參考案例欄位不足 '+name);
   if(!/^https:\/\//.test(f.sourceUrl??''))errors.push('稅務參考案例缺少官方來源URL '+name);
  }catch(e){errors.push('稅務參考案例JSON錯誤 '+name+': '+e.message);}
 }
}
