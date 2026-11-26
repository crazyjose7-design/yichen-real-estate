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
   fields.innerHTML='<div class="tax-quick-fields"><div class="tax-quick-title">一般案件快速試算</div><div class="tax-fields">'+field('rentGross','本次租金給付總額（元）')+field('rentResidency','所得人身分','select','',[['resident','境內居住者'],['nonresident','非境內居住者']])+field('rentRecipient','所得人類型','select','',[['individual','個人'],['company','公司／法人']])+'</div></div>'+details('進階資料（補充保費與計算說明）',check('rentNhi','一併估算租金補充保險費（個人、單次給付達2萬元）',false)+check('rentNhiExempt','已確認所得人不具投保資格或依法免扣補充保費')+'<p class="tax-field-hint">補充保費與所得稅扣繳是不同制度；須確認個人投保資格及法定免扣條件。公司／法人受款不套用個人租金補充保費。若租約約定承租人負擔稅費、押金設算或代付費用，請另行確認是否須調整扣繳基礎。</p>');
   desc.dataset.taxExtraDesc='rentWithholding';
  }else{
   title.textContent='執行業務所得計算';desc.textContent='輸入本次執行業務報酬與所得人身分，先估算應扣繳稅款及實收金額；全年所得與費用分析收在進階資料。';
   fields.innerHTML='<div class="tax-quick-fields"><div class="tax-quick-title">一般案件快速試算</div><div class="tax-fields">'+field('proGross','本次執行業務報酬給付總額（元）')+field('proResidency','所得人身分','select','',[['resident','境內居住者／境內有固定營業場所'],['nonresident','非境內居住者／境內無固定營業場所']])+field('proType','報酬類型','select','',[['general','一般執行業務報酬'],['special','稿費、版稅、講演鐘點費等特定所得']])+'</div></div>'+details('進階資料（補充保費與全年所得分析）',check('proNhi','一併估算執行業務收入補充保險費（單次給付達2萬元）',false)+check('proNhiExempt','已確認依法免扣補充保費（例如專技自行執業且以職業工會投保）')+'<p class="tax-field-hint">補充保費須確認投保資格及法定免扣條件；專門職業及技術人員自行執業且以職業工會投保者，依法有免扣規定。</p><hr/><p class="tax-field-hint">全年執行業務所得估算：收入減除直接必要費用。這是所得額估算，不是個人綜合所得稅最終稅額。</p><div class="tax-fields">'+field('proYear','所得年度','select','',[['115','115年度（2026）'],['114','114年度（2025）']])+field('proRevenue','全年執行業務收入（元）')+field('proExpenses','全年直接必要費用合計（元）','number','0')+field('proCredit','全年已扣繳稅額（元，可不填）','number','0')+'</div><p class="tax-field-hint">如填寫費用明細，系統會以明細合計取代上方費用總額；請勿重複計入。</p><div class="tax-fields">'+field('proRent','業務房租（元）')+field('proStaff','業務人員薪資（元）')+field('proMaterials','藥品／材料成本（元）')+field('proEquipment','設備折舊及修理（元）')+field('proTravel','業務旅費（元）')+field('proOther','其他直接必要費用（元）')+'</div><div class="tax-field"><label for="tax-extra-proMode">全年費用計算方式</label><select id="tax-extra-proMode"><option value="total">使用上方費用總額</option><option value="detail">使用上述費用明細合計</option><option value="rate">使用自行核對的官方費用率</option></select></div><div class="tax-fields">'+field('proFeeRate','官方費用率（%）')+'</div>'+check('proFeeVerified','我已核對該所得年度、職業別及財政部官方費用標準')+'<p class="tax-field-hint">費用率不會自動帶入。114年度費用標準不能直接套用115年度；若無法確認適用標準，請使用實際必要費用及憑證模式。</p>');
  }
  fields.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{result.classList.remove('show')}));
 }
 function read(id){return document.getElementById('tax-extra-'+id)}
 function num(id){const el=read(id);return el&&el.value.trim()!==''?Number(el.value):0}
 function saveSnapshot(key){
  const panel=document.createElement('div');panel.className='tax-print-panel';panel.innerHTML='<h3 id="tax-title">'+title.textContent+'</h3><p id="tax-desc">'+desc.textContent+'</p>'+fields.innerHTML+'<div class="tax-result show"><small>試算結果</small><strong>'+amount.textContent+'</strong><p>'+detail.textContent+'</p></div>';
  const state=window.__yichenTaxState||(window.__yichenTaxState={});state[key]={shown:true,snapshot:panel.outerHTML};
 }
 menu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.yichenExtra){e.preventDefault();e.stopImmediatePropagation();activate(b.dataset.yichenExtra)}else{activeExtra=null}},true);
 const calc=document.getElementById('tax-calc');
 calc?.addEventListener('click',e=>{if(!activeExtra)return;e.preventDefault();e.stopImmediatePropagation();try{
  if(activeExtra==='rentWithholding'){
   if(!read('rentGross').value.trim())throw new Error('請輸入本次租金給付總額');
   const v=window.YichenTaxAdditionalCalc.calculateRentWithholding({grossAmount:num('rentGross'),residency:read('rentResidency').value,recipientKind:read('rentRecipient').value,includeNhi:read('rentNhi').checked,nhiExempt:read('rentNhiExempt').checked});
   amount.textContent='NT$ '+fmt(v.withholdingTax);detail.textContent='租金給付總額：NT$ '+fmt(v.grossAmount)+'\\n扣繳率：'+(v.withholdingRate*100)+'%\\n應扣繳所得稅：NT$ '+fmt(v.withholdingTax)+'\\n租金補充保費：NT$ '+fmt(v.supplementaryPremium)+'\\n出租人實收估算：NT$ '+fmt(v.netToRecipient)+'\\n\\n'+v.notes.join('\\n');
  }else{
   if(!read('proGross').value.trim())throw new Error('請輸入本次執行業務報酬給付總額');
   const w=window.YichenTaxAdditionalCalc.calculateProfessionalWithholding({grossAmount:num('proGross'),residency:read('proResidency').value,incomeType:read('proType').value,includeNhi:!!read('proNhi')?.checked,nhiExempt:!!read('proNhiExempt')?.checked});
   amount.textContent='NT$ '+fmt(w.withholdingTax);detail.textContent='本次報酬給付總額：NT$ '+fmt(w.grossAmount)+'\n扣繳率：'+(w.withholdingRate*100)+'%\n應扣繳所得稅：NT$ '+fmt(w.withholdingTax)+'\n補充保險費：NT$ '+fmt(w.supplementaryPremium)+'\n所得人實收估算：NT$ '+fmt(w.netToRecipient)+'\n\n'+w.notes.join('\n');
   if(read('proRevenue')?.value.trim()){
    const mode=read('proMode')?.value||'total',detailExpenses={rent:num('proRent'),staff:num('proStaff'),materials:num('proMaterials'),equipment:num('proEquipment'),travel:num('proTravel'),other:num('proOther')};
    const v=window.YichenTaxAdditionalCalc.calculateProfessionalIncome({revenue:num('proRevenue'),expenseTotal:num('proExpenses'),expenseMode:mode,expenses:detailExpenses,feeRate:num('proFeeRate'),feeRateVerified:!!read('proFeeVerified')?.checked,withholdingCredit:num('proCredit')});
    detail.textContent+='\n\n【全年執行業務所得額估算】\n所得年度：'+read('proYear').selectedOptions[0].textContent+'\n全年收入：NT$ '+fmt(v.revenue)+'\n必要費用估算：NT$ '+fmt(v.deductibleExpenses)+'（'+v.expenseMode+'）\n執行業務所得額：NT$ '+fmt(v.netProfessionalIncome)+(v.businessLoss?'（估算虧損 NT$ '+fmt(v.businessLoss)+'）':'')+'\n全年已扣繳稅額：NT$ '+fmt(v.withholdingCredit)+'\n\n'+v.notes.join('\n');
   }
  }
  result.classList.add('show');result.scrollIntoView({behavior:'smooth',block:'nearest'});saveSnapshot(activeExtra);
 }catch(err){amount.textContent='無法計算';detail.textContent=err.message;result.classList.add('show')}});
 document.getElementById('tax-reset')?.addEventListener('click',e=>{if(!activeExtra)return;e.preventDefault();e.stopImmediatePropagation();activate(activeExtra)});
 const style=document.createElement('style');style.textContent='.tax-extra-check{display:block;margin:12px 0;color:#514b40;font-size:13px}.tax-extra-check input{width:auto;min-height:0;margin-right:6px}.tax-field-hint{grid-column:1/-1;color:#716b60;font-size:12px;line-height:1.75;margin:8px 0}.tax-field-label{display:block;font-size:13px;font-weight:700;margin:12px 0 7px;color:#5c5549}';document.head.appendChild(style);
})();