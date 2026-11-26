(()=>{
 const round=n=>Math.round(Number(n)||0);
 function calculateRentWithholding({grossAmount,residency='resident',recipientKind='individual',includeNhi=false}={}){
  const gross=Number(grossAmount);
  if(!Number.isFinite(gross)||gross<0)throw new Error('租金給付金額必須是大於或等於0的有效數字');
  const nonresident=residency==='nonresident';
  const rate=nonresident?0.20:0.10;
  const rawTax=round(gross*rate);
  const withholdingTax=(!nonresident&&gross*rate<=2000)?0:rawTax;
  const nhiEligible=includeNhi&&recipientKind==='individual'&&gross>=20000;
  const nhiBase=nhiEligible?Math.min(gross,10000000):0;
  const supplementaryPremium=round(nhiBase*0.0211);
  return {grossAmount:round(gross),withholdingRate:rate,rawTax,withholdingTax,supplementaryPremium,nhiBase,netToRecipient:round(gross)-withholdingTax-supplementaryPremium,totalPayerOutflow:round(gross),notes:[
   nonresident?'非境內居住者租金原則按20%扣繳；不適用境內居住者每次2,000元免扣繳門檻。':'境內居住個人或境內有固定營業場所之營利事業，每次應扣繳稅額不超過2,000元者免予扣繳。',
   nhiEligible?'已按個人租金收入單次達20,000元、費率2.11%、單次計費上限1,000萬元估算補充保費。':includeNhi&&recipientKind==='individual'?'本次租金未達20,000元，未估列租金補充保費。':'未計入租金補充保險費（可於進階選項勾選）。',
   '本計算假設租金給付額為扣繳及補充保費計算基礎；租約約定由承租人負擔稅費、押金設算、代付費用及特殊租賃型態不在此基本版自動加計。'
  ]};
 }
 function calculateProfessionalIncome({revenue,expenseTotal=0,expenseMode='total',expenses={},feeRate=0,feeRateVerified=false,withholdingCredit=0}={}){
  const r=Number(revenue),credit=Number(withholdingCredit)||0;
  if(!Number.isFinite(r)||r<0)throw new Error('全年業務收入必須是大於或等於0的有效數字');
  if(!Number.isFinite(credit)||credit<0)throw new Error('已扣繳稅額不可為負數');
  let expense=0,modeLabel='';
  if(expenseMode==='rate'){
   const rate=Number(feeRate);
   if(!feeRateVerified)throw new Error('費用率模式必須勾選已核對該年度及職業別的財政部官方費用標準');
   if(!Number.isFinite(rate)||rate<0||rate>100)throw new Error('費用率須介於0%至100%');
   expense=r*rate/100;modeLabel='依使用者核對後輸入的官方費用率';
  }else if(expenseMode==='detail'){
   const vals=Object.values(expenses||{}).map(Number);
   if(vals.some(x=>!Number.isFinite(x)||x<0))throw new Error('費用明細不可為負數或無效數字');
   expense=vals.reduce((a,b)=>a+b,0);modeLabel='依費用明細合計';
  }else{
   expense=Number(expenseTotal);if(!Number.isFinite(expense)||expense<0)throw new Error('業務必要費用不可為負數或無效數字');
   modeLabel='依輸入的實際必要費用總額';
  }
  const net=r-expense;
  return {revenue:round(r),deductibleExpenses:round(expense),netProfessionalIncome:round(net),taxableIncomeEstimate:Math.max(0,round(net)),businessLoss:Math.max(0,round(-net)),withholdingCredit:round(credit),expenseMode:modeLabel,notes:[
   '所得額＝執行業務收入－可認列的直接必要費用；費用須與業務直接相關並留存合法憑證。',
   '本結果是執行業務所得額估算，不是個人綜合所得稅最終應納稅額；已扣繳稅款僅列為預扣/可能扣抵資訊。',
   '如採費用率，須核對所得年度及職業別。114年度費用標準不可直接套用到115年度；未核實年度標準前請使用實際費用模式。',
   '若計算結果為虧損，不代表可直接抵減其他類所得；應依所得稅法及個案規定判斷。'
  ]};
 }
 window.YichenTaxAdditionalCalc={calculateRentWithholding,calculateProfessionalIncome};
})();