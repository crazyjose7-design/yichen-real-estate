(()=>{
 const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v));
 function evaluateRewardStack({baseVolume,items=[],calculationDate,jurisdiction,statutoryCapVolume}={}){
  if(!Number.isFinite(baseVolume)||baseVolume<=0)throw new TypeError('baseVolume must be a positive number');
  if(!validDate(calculationDate))throw new TypeError('A valid calculationDate is required');
  if(statutoryCapVolume!==undefined&&(!Number.isFinite(statutoryCapVolume)||statutoryCapVolume<baseVolume))throw new TypeError('statutoryCapVolume must be a number not below baseVolume');
  const blocked=[],eligible=[];
  for(const item of items){const reasons=[];
   if(item.status!=='verified')reasons.push('法規或參數尚未完成覆核');
   if(item.application_policy?.auto_apply!==true)reasons.push('未獲准自動套用');
   if(!item.verified_by)reasons.push('缺少覆核人員');
   if(!item.source?.url||!item.source?.provision||!item.source?.agency)reasons.push('缺少官方法源、條文或主管機關');
   if(!validDate(item.effective_from)||item.effective_from>calculationDate)reasons.push('尚未生效或缺少生效日期');
   if(item.effective_to&&(!validDate(item.effective_to)||item.effective_to<calculationDate))reasons.push('已失效或效期資料不完整');
   if(item.jurisdiction&&jurisdiction&&item.jurisdiction!==jurisdiction)reasons.push('不適用本次基地轄區');
   if(!item.approval_record?.id||item.approval_record?.status!=='approved')reasons.push('缺少個案主管機關核准紀錄');
   if(!Number.isFinite(item.additional_volume)||item.additional_volume<0)reasons.push('缺少經核准的獎勵樓地板面積');
   if(!item.combination_group)reasons.push('缺少獎勵互斥／併計群組');
   if(reasons.length)blocked.push({id:item.id||'unknown',title:item.title||item.id||'未識別獎勵',reasons});else eligible.push(item);
  }
  const groups=new Map();for(const item of eligible){const g=item.combination_group;if(!groups.has(g))groups.set(g,[]);groups.get(g).push(item)}
  const conflicts=[];for(const [group,members] of groups){if(members.length>1&&members.some(x=>x.combination_rule!=='cumulative'))conflicts.push({group,ids:members.map(x=>x.id),reason:'同一互斥群組不得逕行累加'})}
  if(blocked.length||conflicts.length)return {status:'blocked',baseVolume,approvedAdditionalVolume:0,resultingVolume:null,blocked,conflicts,appliedItems:[]};
  const additional=eligible.reduce((s,x)=>s+x.additional_volume,0),resulting=baseVolume+additional;
  if(statutoryCapVolume!==undefined&&resulting>statutoryCapVolume)return {status:'blocked',baseVolume,approvedAdditionalVolume:0,resultingVolume:null,blocked:[],conflicts:[{reason:'超過已核實法定總量上限',statutoryCapVolume,proposedVolume:resulting}],appliedItems:[]};
  return {status:'verified',baseVolume,approvedAdditionalVolume:additional,resultingVolume:resulting,blocked:[],conflicts:[],appliedItems:eligible.map(x=>x.id)};
 }
 window.YichenRewardGate=Object.freeze({evaluateRewardStack});
})();