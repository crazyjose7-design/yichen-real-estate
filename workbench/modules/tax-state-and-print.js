/*
 * workbench/modules/tax-state-and-print.js
 * Tax input-state persistence and individual tax print orchestration extracted verbatim from inline script #5. Coupled to tax-engine DOM IDs and tax snapshots.
 * Source baseline: fix/v6.2.20-print-layout-2026-11-27
 * Extraction only: behavior intentionally unchanged; integrate only after isolated tests.
 */

(()=>{
 const $=id=>document.getElementById(id);
 // Keep each of the 12 tax calculators' inputs and result independently when switching tools.
 const taxState=window.__yichenTaxState=window.__yichenTaxState||{};
 const taxFields=$('tax-fields');
 if(taxFields){
  const observer=new MutationObserver(()=>{
   const activeBtn=$('tax-menu')?.querySelector('button.active'); if(!activeBtn)return;
   const key=activeBtn.dataset.key; const saved=taxState[key]; if(!saved)return;
   taxFields.querySelectorAll('input,select,textarea').forEach(el=>{
    if(Object.prototype.hasOwnProperty.call(saved.values,el.id)){const v=saved.values[el.id];if(el.type==='checkbox')el.checked=!!v;else el.value=v;}
   });
  });
  observer.observe(taxFields,{childList:true,subtree:true});
  const remember=(allowShown=true)=>{const key=$('tax-menu')?.querySelector('button.active')?.dataset.key;if(!key)return;const values={};taxFields.querySelectorAll('input,select,textarea').forEach(el=>values[el.id]=el.type==='checkbox'?el.checked:el.value);const panel=$('tax-center')?.querySelector('.tax-panel');let snapshot='';if(panel){const clone=panel.cloneNode(true);const origFields=panel.querySelectorAll('input,select,textarea'),copyFields=clone.querySelectorAll('input,select,textarea');origFields.forEach((orig,i)=>{const copy=copyFields[i];if(!copy)return;if(orig.type==='checkbox'){if(orig.checked)copy.setAttribute('checked','');else copy.removeAttribute('checked')}else if(orig.tagName==='SELECT'){[...copy.options].forEach((o,j)=>{if(orig.options[j]?.selected)o.setAttribute('selected','');else o.removeAttribute('selected')})}else copy.setAttribute('value',orig.value)});clone.querySelector('.tax-actions')?.remove();clone.classList.add('tax-snapshot');snapshot=clone.outerHTML;}taxState[key]={values,amount:$('tax-amount')?.textContent||'',detail:$('tax-detail')?.textContent||'',shown:!!allowShown&&($('tax-result')?.classList.contains('show')||false)&&!['無法計算','尚未計算'].includes(($('tax-amount')?.textContent||'').trim()),snapshot};};
  taxFields.addEventListener('input',()=>remember(false));taxFields.addEventListener('change',()=>remember(false));
  $('tax-menu')?.addEventListener('click',()=>setTimeout(()=>{const key=$('tax-menu')?.querySelector('button.active')?.dataset.key;const st=taxState[key];if(st){$('tax-amount').textContent=st.amount;$('tax-detail').textContent=st.detail;$('tax-result').classList.toggle('show',!!st.shown)}},0));
  $('tax-calc')?.addEventListener('click',()=>{setTimeout(()=>{const amountText=($('tax-amount')?.textContent||'').trim();const valid=$('tax-result')?.classList.contains('show')&&!['無法計算','尚未計算','尚未計算'].includes(amountText)&&/^NT\$\s*[\d,]+/.test(amountText);remember(valid);const key=$('tax-menu')?.querySelector('button.active')?.dataset.key;if(key&&taxState[key])taxState[key].shown=valid;},0)});
  $('tax-reset')?.addEventListener('click',()=>setTimeout(()=>remember(false),0));
 }
 const printOnly=mode=>{document.body.classList.remove('print-land','print-tax','print-site');document.body.classList.add(mode);window.print();};
 $('le-print')?.addEventListener('click',()=>{
  const d=$('land-efficiency-tool')?.querySelector('.le-official-details');
  if(d){const filled=[...d.querySelectorAll('input,select,textarea')].some(el=>el.value.trim()!=='' && !['尚未查核'].includes(el.value));d.dataset.printFilled=filled?'1':'0';if(filled)d.open=true;}
  printOnly('print-land');
 });
 $('tax-print')?.addEventListener('click',()=>printOnly('print-tax'));
 $('site-print')?.addEventListener('click',()=>{
  // Include calculator outputs only if the user has actually calculated them.
  const taxResult=$('tax-result');const savedTax=window.__yichenTaxState||{};const activeTaxKey=$('tax-menu')?.querySelector('button.active')?.dataset.key;if(activeTaxKey&&taxResult?.classList.contains('show')){const panel=$('tax-center')?.querySelector('.tax-panel');if(panel){const copy=panel.cloneNode(true);copy.querySelector('.tax-actions')?.remove();copy.classList.add('tax-snapshot');savedTax[activeTaxKey]={...(savedTax[activeTaxKey]||{}),shown:true,snapshot:copy.outerHTML};}}const sheets=$('tax-print-snapshots');if(sheets){sheets.innerHTML='';Object.entries(savedTax).forEach(([key,st])=>{if(st?.shown&&st.snapshot){const wrap=document.createElement('div');wrap.className='tax-snapshot-sheet';wrap.innerHTML=st.snapshot;sheets.appendChild(wrap)}})}const hasTax=Object.values(savedTax).some(st=>st?.shown&&st.snapshot);$('tax-center').dataset.siteSkipTax=hasTax?'0':'1';
  const le=$('land-efficiency-tool');if(le&&!le.dataset.calculated)$('land-efficiency-tool').dataset.siteSkipLand='1';else $('land-efficiency-tool').dataset.siteSkipLand='0';
  printOnly('print-site');
 });
 window.addEventListener('afterprint',()=>{document.body.classList.remove('print-land','print-tax','print-site');const d=$('land-efficiency-tool')?.querySelector('.le-official-details');if(d)d.open=false;});
})();

