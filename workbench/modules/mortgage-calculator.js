/*
 * workbench/modules/mortgage-calculator.js
 * Mortgage calculator extracted verbatim from inline script #3. Depends on mortgageForm and related result elements.
 * Source baseline: fix/v6.2.20-print-layout-2026-11-27
 * Extraction only: behavior intentionally unchanged; integrate only after isolated tests.
 */

(()=>{
 const $=id=>document.getElementById(id), money=n=>'NT$ '+Math.round(n).toLocaleString('zh-TW');
 const form=$('mortgageForm'); if(!form)return;
 const loan=$('mortgageLoan'),price=$('mortgagePrice'),down=$('mortgageDown'),rate2Input=$('mortgageRate2'),rateChangeInput=$('mortgageRateChangeMonth');
 const syncLoan=()=>{const p=Number(price.value),d=Number(down.value);if(p>0&&d>=0&&d<=p)loan.value=Math.max(0,Math.round((p-d)*100)/100)};
 price.addEventListener('input',syncLoan);down.addEventListener('input',syncLoan);
 const round=n=>Math.round(n);
 function calculate(e){if(e)e.preventDefault();if(!form.reportValidity())return;
  const principal=Number(loan.value)*10000, house=Number(price.value)*10000, years=Number($('mortgageYears').value), rate=Number($('mortgageRate').value)/100, rate2Raw=rate2Input.value.trim(),hasRateChange=rate2Raw!=='',rate2=hasRateChange?Number(rate2Raw)/100:rate,rateChange=Number(rateChangeInput.value||0),graceYears=Number($('mortgageGrace').value),grace=graceYears*12,method=$('mortgageMethod').value,start=(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`})();
  const months=years*12;
  const fundingGap=Math.abs((principal+Number(down.value)*10000)-house);
  const validRateChange=hasRateChange?Number.isFinite(rate2)&&rate2>=0&&rate2<=.3&&Number.isInteger(rateChange)&&rateChange>=1&&rateChange<=months:rateChange===0;
  if(!(Number.isFinite(principal)&&Number.isFinite(house)&&principal>0&&house>0&&principal<=house&&Number(down.value)>=0&&Number(down.value)<=Number(price.value)&&fundingGap<=1&&years>0&&Number.isFinite(rate)&&rate>=0&&rate<=.3&&validRateChange&&grace>=0&&grace<months)){
   alert('請確認：貸款金額須大於0且不可高於房屋總價；自備款不可高於房價；貸款金額＋自備款須與房屋總價相符（允許1元誤差）；利率須為0至30%；如設定利率變動，須同時輸入有效新利率及1至總期數內的調整期數；寬限期須短於貸款年限。');return
  }
  const rows=[];let balance=principal,totalInterest=0,totalPaid=0,firstAmortPay=0,gracePayment=0,principalFixed=(principal/(months-grace));
  for(let i=1;i<=months;i++){
   const annualRate=hasRateChange&&i>=rateChange?rate2:rate,mr=annualRate/12,interest=round(balance*mr);let pay=0,pr=0;
   if(i<=grace){pay=interest;gracePayment=grace?round(principal*mr):0;}
   else if(method==='annuity'){
    const rem=months-i+1;const raw=mr===0?balance/rem:balance*mr/(1-Math.pow(1+mr,-rem));pay=round(raw);if(i===months)pay=round(balance+interest);pr=Math.min(balance,Math.max(0,pay-interest));
   }else{pr=i===months?balance:Math.min(balance,round(principalFixed));pay=pr+interest;}
   if(i>grace&&i===grace+1)firstAmortPay=pay;
   if(i===months&&method==='annuity'&&pay<interest){alert('輸入條件導致無法正常攤還，請調整利率或年限。');return}
   balance=Math.max(0,balance-pr);totalInterest+=interest;totalPaid+=pay;
   const dt=new Date(start+'-01T00:00:00');dt.setMonth(dt.getMonth()+i-1);
   rows.push({i,pay,pr,interest,balance,date:dt.toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit'})});
  }
  const ltv=principal/house*100;
  $('mortgageMonthly').textContent=money(firstAmortPay||0);
  $('mortgageGracePay').textContent=grace?money(gracePayment):'無寬限期';
  $('mortgageInterest').textContent=money(totalInterest);
  $('mortgageTotal').textContent=money(totalPaid);
  $('mortgageLtv').textContent=ltv.toFixed(1)+'%';
  $('mortgageFirstDate').textContent=rows[0].date;
  $('mortgageCalcNote').textContent=`貸款本金 ${money(principal)}；總期數 ${months} 期；寬限期 ${grace} 期。${hasRateChange?`第${rateChange}期起調整為年利率${(rate2*100).toFixed(3)}%。`:''}${method==='annuity'?'本息平均攤還：寬限期後依剩餘本金及剩餘期數計算固定月付金。':'本金平均攤還：寬限期後每期償還固定本金，利息隨本金餘額下降。'}利息按月以期初餘額 × 年利率 ÷ 12 估算，金額四捨五入至元。此為估算，未含開辦費、帳管費、保險、鑑價及實際天數計息差異。`;
  $('mortgageSchedule').innerHTML=rows.slice(0,12).map(r=>`<tr><td>${r.i}｜${r.date}</td><td>${money(r.pay)}</td><td>${money(r.pr)}</td><td>${money(r.interest)}</td><td>${money(r.balance)}</td></tr>`).join('');
  if(e)$('mortgageResults').dataset.userCalculated='1';
 }
 const invalidateUserCalculation=()=>{delete $('mortgageResults').dataset.userCalculated};form.addEventListener('input',invalidateUserCalculation);form.addEventListener('change',invalidateUserCalculation);form.addEventListener('submit',calculate);form.addEventListener('reset',()=>setTimeout(()=>{ $('mortgageMonthly').textContent='—';$('mortgageGracePay').textContent='—';$('mortgageInterest').textContent='—';$('mortgageTotal').textContent='—';$('mortgageLtv').textContent='—';$('mortgageFirstDate').textContent='—';$('mortgageCalcNote').textContent='輸入條件後按「開始試算」，結果將顯示於此。';$('mortgageSchedule').innerHTML='<tr><td colspan="5">尚未試算</td></tr>';delete $('mortgageResults').dataset.userCalculated;},0));
 calculate();
})();

