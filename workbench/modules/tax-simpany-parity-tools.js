(()=> {
 const menu=document.getElementById('tax-menu'),fields=document.getElementById('tax-fields'),title=document.getElementById('tax-title'),desc=document.getElementById('tax-desc'),amount=document.getElementById('tax-amount'),detail=document.getElementById('tax-detail'),result=document.getElementById('tax-result');
 if(!menu||!fields||!window.YichenSimpanyParityRent||!window.YichenSimpanyParityProfessional)return;
 const fmt=n=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:0}).format(Math.round(Number(n)||0));
 const addButton=(key,label)=>{let b=menu.querySelector('[data-yichen-extra="'+key+'"]');if(!b){b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.yichenExtra=key;menu.appendChild(b)}};
 addButton('rentWithholding','租金扣繳');addButton('professionalIncome','執行業務所得');
 let active=null;
 const field=(id,label,type='number',value='')=>'<div class="tax-field"><label for="tax-extra-'+id+'">'+label+'</label><input id="tax-extra-'+id+'" type="'+type+'" min="0" step="1" value="'+value+'" placeholder="請輸入"></div>';
 const select=(id,label,opts)=>'<div class="tax-field"><label for="tax-extra-'+id+'">'+label+'</label><select id="tax-extra-'+id+'">'+opts.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select></div>';
 const radio=(name,label,opts)=>'<div class="tax-field"><span class="tax-extra-label">'+label+'</span><div class="tax-extra-options">'+opts.map((x,i)=>'<label><input type="radio" name="tax-extra-'+name+'" value="'+x[0]+'" '+(i===0?'checked':'')+'> '+x[1]+'</label>').join('')+'</div></div>';
 const details=(s,h)=>'<details class="tax-advanced"><summary>'+s+'</summary><div class="tax-advanced-fields">'+h+'</div></details>';
 const read=id=>document.getElementById('tax-extra-'+id);
 const value=id=>read(id)?.value??'';
 const num=id=>value(id).trim()===''?0:Number(value(id));
 const checked=name=>fields.querySelector('input[name="tax-extra-'+name+'"]:checked')?.value;
 const snapshot=key=>{const p=document.createElement('div');p.className='tax-print-panel';p.innerHTML='<h3>'+title.textContent+'</h3><p>'+desc.textContent+'</p>'+fields.innerHTML+'<div class="tax-result show"><small>試算結果</small><strong>'+amount.textContent+'</strong><p>'+detail.textContent+'</p></div>';const s=window.__yichenTaxState||(window.__yichenTaxState={});s[key]={shown:true,snapshot:p.outerHTML};};
 function activate(key){active=key;menu.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.yichenExtra===key||b.dataset.key===key));result.classList.remove('show');amount.textContent='尚未計算';detail.textContent='';
  if(key==='rentWithholding'){
   title.textContent='租金扣繳計算機';desc.textContent='選擇房東類型，輸入每期租金及是否含稅，即可估算租金扣繳與二代健保補充保費。';
   fields.innerHTML='<div class="tax-quick-fields"><div class="tax-quick-title">每期租金</div><div class="tax-fields">'+radio('rentKind','房東', [['individual','個人'],['company','公司']])+field('rentAmount','每期租金（元）')+radio('rentMode','租金金額', [['tax_included','租金已含稅'],['tax_excluded','租金未含稅']])+'</div></div>'+details('進階設定（多位房東／居住者身分／健保身分）','<div id="tax-extra-landlords"><div class="tax-landlord-row" data-index="0"><h4>房東 1</h4><div class="tax-fields">'+select('rentResidency','稅務居住者身分',[['resident','境內居住者'],['nonresident','非境內居住者']])+field('rentShare','持分比例（%）','number','100')+select('rentHealth','健保身分',[['insured','具健保投保資格（估算補充保費）'],['union_exempt','專技自行執業且職業工會投保（依法免扣，需確認）'],['not_insured','非健保保險對象'],['other_exempt','其他法定免扣情形（需確認）']])+'</div></div></div><button type="button" id="tax-extra-add-landlord" class="secondary">＋新增房東</button><p class="tax-field-hint">房東國籍不等於稅法居住者身分；請依稅法居住者規定判斷。多位房東持分合計必須為100%。公司房東與個人房東分流計算。</p>');
  }else{
   title.textContent='執行業務所得計算';desc.textContent='依所得人身分、申報類別及健保身分，估算公司應預扣及發放金額，並顯示個人所得影響。';
   fields.innerHTML='<div class="tax-quick-fields"><div class="tax-quick-title">所得人資料</div><div class="tax-fields">'+select('proResidency','身分',[['resident','境內居住者'],['nonresident','非境內居住者']])+select('proType','申報類別',[['9A','9A 執行業務所得'],['9B','9B 稿費、版稅、演講等']])+select('proHealth','健保身分',[['insured','一般具健保投保資格'],['union_exempt','專技自行執業且職業工會投保（依法免扣，需確認）'],['not_insured','非健保保險對象'],['other_exempt','其他法定免扣情形（需確認）']])+field('proGross','金額（元）')+'</div></div>'+details('進階設定（個人年度所得影響）',field('proAnnual','全年同類所得收入（元）')+field('proFeeRate','9A官方費用率（%；依年度及職業別）')+radio('pro9bPublish','9B所得類型',[['standard','一般稿費等（30%費用率）'],['self','自行出版（75%費用率，須確認適用）']])+'<p class="tax-field-hint">9A費用率不得自行猜測，請依所得年度與職業別核對財政部官方標準。9B依年度累計收入計算18萬元免稅額及適用費用率。本欄僅估算所得淨額，不是綜合所得稅最終稅額。</p>');
  }
  fields.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>result.classList.remove('show')));
 }
 menu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.yichenExtra){e.preventDefault();e.stopImmediatePropagation();activate(b.dataset.yichenExtra)}},true);
 fields.addEventListener('click',e=>{if(e.target?.id==='tax-extra-add-landlord'){const root=read('landlords');const container=document.getElementById('tax-extra-landlords');const i=container.querySelectorAll('.tax-landlord-row').length;const row=document.createElement('div');row.className='tax-landlord-row';row.dataset.index=i;row.innerHTML='<h4>房東 '+(i+1)+'</h4><div class="tax-fields">'+select('rentResidency-'+i,'稅務居住者身分',[['resident','境內居住者'],['nonresident','非境內居住者']])+field('rentShare-'+i,'持分比例（%）','number','0')+select('rentHealth-'+i,'健保身分',[['insured','具健保投保資格'],['union_exempt','職業工會投保免扣（需確認）'],['not_insured','非健保保險對象'],['other_exempt','其他法定免扣情形']])+'</div>';container.appendChild(row)}},true);
 document.getElementById('tax-calc')?.addEventListener('click',e=>{if(!active)return;e.preventDefault();e.stopImmediatePropagation();try{
  if(active==='rentWithholding'){
   if(!value('rentAmount').trim())throw Error('請輸入每期租金');
   const rows=[...document.querySelectorAll('#tax-extra-landlords .tax-landlord-row')].map((r,i)=>({kind:i===0?checked('rentKind'):'individual',residency:i===0?value('rentResidency'):value('rentResidency-'+i),share:i===0?num('rentShare'):num('rentShare-'+i),healthStatus:i===0?value('rentHealth'):value('rentHealth-'+i)}));
   if(checked('rentKind')==='company')rows[0].kind='company';
   const v=window.YichenSimpanyParityRent.calculateRent({rentAmount:num('rentAmount'),rentMode:checked('rentMode'),landlords:rows});
   amount.textContent='NT$ '+fmt(v.totalDeductions);detail.textContent='每期租金（約定）：NT$ '+fmt(v.contractRent)+'\n反推給付總額：NT$ '+fmt(v.grossRent)+'\n租金扣繳：NT$ '+fmt(v.withholdingTax)+'\n二代健保補充保費：NT$ '+fmt(v.supplementaryPremium)+'\n租扣二代總金額：NT$ '+fmt(v.totalDeductions)+'\n實際支付房東：NT$ '+fmt(v.totalPaidToLandlords)+'\n\n'+v.landlords.map(x=>x.name+'：租金 '+fmt(x.rent)+'／扣繳 '+fmt(x.withholdingTax)+'／補充保費 '+fmt(x.supplementaryPremium)+'／實付 '+fmt(x.netToLandlord)).join('\n')+'\n\n'+v.notes.join('\n');
  }else{
   if(!value('proGross').trim())throw Error('請輸入金額');
   const v=window.YichenSimpanyParityProfessional.calculateProfessional({grossAmount:num('proGross'),residency:value('proResidency'),filingType:value('proType'),healthStatus:value('proHealth'),annualRevenue:num('proAnnual'),feeRate:value('proFeeRate')===''?null:num('proFeeRate'),selfPublishing:checked('pro9bPublish')==='self'});
   amount.textContent='NT$ '+fmt(v.withholdingTax+v.supplementaryPremium);detail.textContent='【公司應預扣及發放】\n所得金額：NT$ '+fmt(v.grossAmount)+'\n代扣所得稅：NT$ '+fmt(v.withholdingTax)+'\n代扣二代健保：NT$ '+fmt(v.supplementaryPremium)+'\n實際支付金額：NT$ '+fmt(v.netPaid)+'\n\n【所得人個人所得影響】\n所得類別：'+v.filingType+'\n費用率：'+(v.feeRate?fmt(v.feeRate)+'%':'依年度／職業別另核')+'\n計入所得淨額：NT$ '+fmt(v.annualIncomeIncluded)+'\n費用標準：'+v.feeRateSource+'\n\n'+v.notes.join('\n');
  }
  result.classList.add('show');snapshot(active);
 }catch(err){amount.textContent='無法計算';detail.textContent=err.message;result.classList.add('show')}},true);
 document.getElementById('tax-reset')?.addEventListener('click',e=>{if(active){e.preventDefault();e.stopImmediatePropagation();activate(active)}},true);
 const style=document.createElement('style');style.textContent='.tax-extra-options{display:flex;gap:18px;flex-wrap:wrap;margin-top:8px}.tax-extra-options label{display:inline-flex;align-items:center;gap:5px}.tax-extra-options input{width:auto;min-height:0}.tax-extra-label{font-size:13px;font-weight:700}.tax-landlord-row{padding:12px 0;border-bottom:1px solid #ddd}.tax-landlord-row h4{margin:0 0 8px}.tax-field-hint{grid-column:1/-1;color:#716b60;font-size:12px;line-height:1.7}';document.head.appendChild(style);
})();