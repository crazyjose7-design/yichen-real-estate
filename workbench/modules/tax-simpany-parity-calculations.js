(()=> {
 const round=n=>Math.round(Number(n)||0);
 const money=n=>Number.isFinite(Number(n))&&Number(n)>=0;
 const clampPct=n=>{const v=Number(n);if(!Number.isFinite(v)||v<0||v>100)throw new Error('房東持分比例須介於0%至100%');return v};
 const calcOne=(rent,person)=>{
  const kind=person.kind||'individual',resident=person.residency!=='nonresident';
  const rate=resident?0.10:0.20;
  const raw=round(rent*rate);
  const tax=rate===0?0:(resident&&rent*rate<=2000?0:raw);
  const nhiEligible=kind==='individual'&&person.healthStatus!=='not_insured'&&person.healthStatus!=='union_exempt'&&person.healthStatus!=='other_exempt'&&rent>=20000;
  const nhiBase=nhiEligible?Math.min(rent,10000000):0;
  const nhi=round(nhiBase*0.0211);
  return {rent:round(rent),withholdingRate:rate,rawWithholding:raw,withholdingTax:tax,nhiBase,supplementaryPremium:nhi,netToLandlord:round(rent)-tax-nhi};
 };
 function calculateRent({rentAmount,rentMode='tax_included',landlords=[{kind:'individual',residency:'resident',share:100,healthStatus:'insured'}]}={}){
  const amount=Number(rentAmount);
  if(!money(amount)||amount<=0)throw new Error('每期租金必須輸入大於0的金額');
  if(!Array.isArray(landlords)||!landlords.length)throw new Error('至少需要一位房東');
  const normalized=landlords.map((p,i)=>({...p,share:clampPct(p.share??100),name:p.name||'房東 '+(i+1)}));
  const shareTotal=normalized.reduce((s,p)=>s+p.share,0);
  if(Math.abs(shareTotal-100)>0.0001)throw new Error('所有房東持分比例合計必須為100%');
  const calcAtGross=gross=>normalized.map(p=>{
   const allocated=gross*p.share/100;
   return {...p,...calcOne(allocated,p)};
  });
  let gross=amount,rows;
  if(rentMode==='tax_excluded'){
   let lo=amount,hi=amount*2+1000;
   for(let i=0;i<80;i++){const mid=(lo+hi)/2;const rs=calcAtGross(mid);const net=rs.reduce((s,r)=>s+r.netToLandlord,0);if(net<amount)lo=mid;else hi=mid;}
   gross=hi;rows=calcAtGross(gross);
  }else rows=calcAtGross(gross);
  const sum=k=>rows.reduce((s,r)=>s+(Number(r[k])||0),0);
  return {rentMode,contractRent:round(amount),grossRent:round(gross),withholdingTax:sum('withholdingTax'),supplementaryPremium:sum('supplementaryPremium'),totalDeductions:sum('withholdingTax')+sum('supplementaryPremium'),totalPaidToLandlords:sum('netToLandlord'),landlords:rows.map(r=>({...r,rent:round(r.rent)})),notes:['租金含稅：以約定租金為給付總額；租金未含稅：以房東實拿租金反推應給付總額。','房東公司與個人分開判斷；外國／非居住者依非居住者扣繳規則處理。','補充保費須依實際健保投保身分判斷；本試算僅依所選健保身分估算。','多位房東依持分比例分配，持分總和必須為100%。']};
 }
 window.YichenSimpanyParityRent={calculateRent};
})();
(()=> {
 const round=n=>Math.round(Number(n)||0);
 function calculateProfessional({grossAmount,residency='resident',filingType='9A',healthStatus='insured',annualRevenue=0,feeRate=null,selfPublishing=false}={}){
  const gross=Number(grossAmount);
  if(!Number.isFinite(gross)||gross<0)throw new Error('金額必須是大於或等於0的有效數字');
  const resident=residency!=='nonresident',type=filingType==='9B'?'9B':'9A';
  const rate=resident?0.10:0.20,raw=round(gross*rate);
  const withholdingTax=resident?(gross*rate<=2000?0:raw):(type==='9B'&&gross<=5000?0:raw);
  const nhiEligible=healthStatus==='insured'&&gross>=20000;
  const nhiBase=nhiEligible?Math.min(gross,10000000):0;
  const supplementaryPremium=round(nhiBase*0.0211);
  const netPaid=round(gross)-withholdingTax-supplementaryPremium;
  const annual=Number(annualRevenue)||0;
  if(!Number.isFinite(annual)||annual<0)throw new Error('全年收入不可為負數或無效數字');
  let annualExpenseRate=0,annualTaxable=0,feeRateSource='未設定';
  if(type==='9B'){
   annualExpenseRate=selfPublishing?0.75:0.30;
   annualTaxable=round(Math.max(0,annual-180000)*(1-annualExpenseRate));
   feeRateSource=selfPublishing?'9B自行出版：75%費用率（需核對適用資格）':'9B稿費等：年免稅額18萬元後，按30%費用率估算';
  }else if(feeRate!==null&&feeRate!==''){
   const f=Number(feeRate);
   if(!Number.isFinite(f)||f<0||f>100)throw new Error('費用率須介於0%至100%');
   annualExpenseRate=f/100;
   annualTaxable=round(annual*(1-annualExpenseRate));
   feeRateSource='使用者輸入費用率；須核對所得年度及職業別官方標準';
  }
  const expense=round(annual*annualExpenseRate);
  return {grossAmount:round(gross),filingType:type,residency,withholdingRate:rate,rawWithholding:raw,withholdingTax,supplementaryPremium,nhiBase,netPaid,employerOutflow:round(gross),annualRevenue:round(annual),feeRate:annualExpenseRate*100,feeRateSource,annualExpense:expense,annualIncomeIncluded:annualTaxable,notes:['公司端結果：所得金額、代扣所得稅、代扣補充保費、實際支付金額。','個人所得影響為年度所得估算，9A費用率須依所得年度及職業別官方標準；未填費用率時不自行猜測。','9B稿費等依適用規定估算年免稅額及必要費用；自行出版須核對75%費用率適用條件。','健保補充保費僅在選擇一般具投保資格身分且單次給付達20,000元時估算；職業工會自行執業等例外不自動套用。']};
 }
 window.YichenSimpanyParityProfessional={calculateProfessional};
})();