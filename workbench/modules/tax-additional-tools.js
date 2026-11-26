(()=>{
 const menu=document.getElementById('tax-menu'),fields=document.getElementById('tax-fields'),title=document.getElementById('tax-title'),desc=document.getElementById('tax-desc'),amount=document.getElementById('tax-amount'),detail=document.getElementById('tax-detail'),result=document.getElementById('tax-result');
 if(!menu||!fields||!window.YichenTaxAdditionalCalc)return;
 const fmt=n=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:0}).format(Math.round(Number(n)||0));
 const addButton=(key,label)=>{if(menu.querySelector('[data-yichen-extra="'+key+'"]'))return;const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.yichenExtra=key;b.setAttribute('aria-pressed','false');menu.appendChild(b)};
 addButton('rentWithholding','租金扣繳');
 addButton('professionalIncome','執行業務所得');
 let activeExtra=null;
 const field=(id,label,type='number',value='',opts=[])=>{let html='<div class="tax-field"><label for="tax-extra-'+id+'">'+label+'</label>';if(type==='select'){html+='<select id="tax-extra-'+id+'">'+opts.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join('')+'</select>'}else html+='<input id="tax-extra-'+id+'" type="'+type+'" min="0" step="1" value="'+value+'" placeholder="請輸入">';return html+'</div>'};
 const check=(id,label,checked=false)=>'<label class="tax-extra-check"><input id="tax-extra-'+id+'" type="checkbox" '+(checked?'checked':'')+'> '+label+'</label>';
 const details=(summary,html)=>'<details class="tax-advanced"><summary>'+summary+'</summary><div class="tax-advanced-fields">'+html+'</div></details>';
 function activate(key){
  activeExtra=key;menu.querySelectorAll('button').forEach(b=>{const on=b.dataset.yichenExtra===key||b.dataset.key===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
  result.classList.remove('show');amount.textContent='尚未計算';detail.textContent='';
  if(key==='rentWithholding'){
   title.textContent='租金扣繳計算機';desc.textContent='輸入本次租金給付金額與所得人身分，快速估算應扣繳所得稅、補充保費及出租人實收金額。';
   fields.innerHTML='<div class="tax-quick-fields"><div class="tax-quick-title">一般案件快速試算</div><div class="tax-fields">'+field('rentGross','本次租金給付總額（元）')+field('rentResidency','所得人身分','select','',[['resident','境內居住者'],['nonresident','非境內居住者']])+field('rentRecipient','所得人類型','select','',[['individual','個人'],['company','公司／法人']])+'</div></div>'+details('進階資料（補充保費與計算說明）',check('rentNhi','一併估算租金補充保險費（個人、單次給付達2萬元）',false)+'<p class="tax-field-hint">補充保費與所得稅扣繳是不同制度；公司／法人受款不套用個人租金補充保費。若租約約定承租人負擔稅費、押金設算或代付費用，請另行確認是否須調整扣繳基礎。</p>');
   desc.dataset.taxExtraDesc='rentWithholding';
  }else{
   title.textContent='執行業務所得計算';desc.textContent='先輸入全年執行業務收入與必要費用，估算本年度執行業務所得。此工具計算所得額，不直接推算個人綜合所得稅最終稅額。';
   fields.innerHTML='<div class="tax-quick-fields"><div class="tax-quick-title">一般案件快速試算</div><div class="tax-fields">'+field('proYear','所得年度','select','',[['115','115年度（2026）'],['114','114年度（2025）']])+field('proRevenue','全年執行業務收入（元）')+field('proExpenses','全年直接必要費用合計（元）','number','0')+field('proCredit','已扣繳稅額（元，可不填）','number','0')+'</div></div>'+details('進階資料（費用明細／官方費用率）', '<p class="tax-field-hint">如填寫費用明細，系統會以明細合計取代上方費用總額；請勿重複計入。</p><div class="tax-fields">'+field('proRent','業務房租（元）')+field('proStaff','業務人員薪資（元）')+field('proMaterials','藥品／材料成本（元）')+field('proEquipment','設備折舊及修理（元）')+field('proTravel','業務旅費（元）')+field('proOther','其他直接必要費用（元）')+'</div><hr/><label class="tax-field-label">費用計算方式</label><select id="tax-extra-proMode"><option value="total">使用上方費用總額</option><option value="detail">使用上述費用明細合計</option><option value="rate">使用自行核對的官方費用率</option></select><div class="tax-fields">'+field('proFeeRate','官方費用率（%）')+'</div>'+check('proFeeVerified','我已核對該所得年度、職業別及財政部官方費用標準')+'<p class="tax-field-hint">費用率不會自動帶入。114年度費用標準不能直接套用115年度；若無法確認適用標準，請使用實際必要費用及憑證模式。</p>');
  }
  fields.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{result.classList.remove('show')}));
 }
 function read(id){return document.getElementById('tax-extra-'+id)}
 function num(id){const el=read(id);return el&&el.value.trim()!==''?Number(el.value):0}
 function saveSnapshot(key){
  const panel=document.createElement('div');panel.className='tax-print-panel';panel.innerHTML='<h3>'+title.textContent+'</h3><p>'+desc.textContent+'</p>'+fields.innerHTML+'<div class="tax-result show"><small>試算結果</small><strong>'+amount.textContent+'</strong><p>'+detail.textContent+'</p></div>';
  const state=window.__yichenTaxState||(window.__yichenTaxState={});state[key]={shown:true,snapshot:panel.outerHTML};
 }
 menu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.yichenExtra){e.preventDefault();e.stopImmediatePropagation();activate(b.dataset.yichenExtra)}else{activeExtra=null}},true);
 const calc=document.getElementById('tax-calc');
 calc?.addEventListener('click',e=>{if(!activeExtra)return;e.preventDefault();e.stopImmediatePropagation();try{
  if(activeExtra==='rentWithholding'){
   const v=window.YichenTaxAdditionalCalc.calculateRentWithholding({grossAmount:num('rentGross'),residency:read('rentResidency').value,recipientKind:read('rentRecipient').value,includeNhi:read('rentNhi').checked});
   amount.textContent='NT$ '+fmt(v.withholdingTax);detail.textContent='租金給付總額：NT$ '+fmt(v.grossAmount)+'\\n扣繳率：'+(v.withholdingRate*100)+'%\\n應扣繳所得稅：NT$ '+fmt(v.withholdingTax)+'\\n租金補充保費：NT$ '+fmt(v.supplementaryPremium)+'\\n出租人實收估算：NT$ '+fmt(v.netToRecipient)+'\\n\\n'+v.notes.join('\\n');
  }else{
   const mode=read('proMode')?.value||'total',detailExpenses={rent:num('proRent'),staff:num('proStaff'),materials:num('proMaterials'),equipment:num('proEquipment'),travel:num('proTravel'),other:num('proOther')};
   const v=window.YichenTaxAdditionalCalc.calculateProfessionalIncome({revenue:num('proRevenue'),expenseTotal:num('proExpenses'),expenseMode:mode,expenses:detailExpenses,feeRate:num('proFeeRate'),feeRateVerified:!!read('proFeeVerified')?.checked,withholdingCredit:num('proCredit')});
   amount.textContent='NT$ '+fmt(v.netProfessionalIncome);detail.textContent='所得年度：'+read('proYear').selectedOptions[0].textContent+'\\n全年業務收入：NT$ '+fmt(v.revenue)+'\\n可認列必要費用估算：NT$ '+fmt(v.deductibleExpenses)+'（'+v.expenseMode+'）\\n執行業務所得額：NT$ '+fmt(v.netProfessionalIncome)+(v.businessLoss?'（所得額為負，估算虧損 NT$ '+fmt(v.businessLoss)+'）':'')+'\\n已扣繳稅額：NT$ '+fmt(v.withholdingCredit)+'（非最終應納稅額）\\n\\n'+v.notes.join('\\n');
  }
  result.classList.add('show');result.scrollIntoView({behavior:'smooth',block:'nearest'});saveSnapshot(activeExtra);
 }catch(err){amount.textContent='無法計算';detail.textContent=err.message;result.classList.add('show')}});
 document.getElementById('tax-reset')?.addEventListener('click',e=>{if(!activeExtra)return;e.preventDefault();e.stopImmediatePropagation();activate(activeExtra)});
 const style=document.createElement('style');style.textContent='.tax-extra-check{display:block;margin:12px 0;color:#514b40;font-size:13px}.tax-extra-check input{width:auto;min-height:0;margin-right:6px}.tax-field-hint{grid-column:1/-1;color:#716b60;font-size:12px;line-height:1.75;margin:8px 0}.tax-field-label{display:block;font-size:13px;font-weight:700;margin:12px 0 7px;color:#5c5549}';document.head.appendChild(style);
})();