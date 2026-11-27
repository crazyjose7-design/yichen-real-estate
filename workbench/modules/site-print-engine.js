/*
 * workbench/modules/site-print-engine.js
 * Site-wide print page builder extracted verbatim from inline script #6. Includes TikTok initialization and full-document page assembly.
 * Source baseline: fix/v6.2.20-print-layout-2026-11-27
 * Extraction only: behavior intentionally unchanged; integrate only after isolated tests.
 */

(()=>{
 const $=id=>document.getElementById(id);
 const body=document.body;
 const le=$('land-efficiency-tool');
 let root=$('yichen-print-root');
 if(!root){root=document.createElement('div');root.id='yichen-print-root';body.appendChild(root)}
 // TikTok's official embed script is loaded after the blockquotes; retry initialization after DOM is ready.
 const loadTikTok=()=>{if(window.tiktokEmbedLoad&&typeof window.tiktokEmbedLoad==='function'){try{window.tiktokEmbedLoad()}catch(e){}}};
 if(!document.querySelector('script[src="https://www.tiktok.com/embed.js"]')){const sc=document.createElement('script');sc.src='https://www.tiktok.com/embed.js';sc.async=true;document.body.appendChild(sc)}
 window.addEventListener('load',()=>setTimeout(loadTikTok,250));
 // V6.2.15: official verification remains a separate block between Section I and Section II.
 const cloneClean=(el)=>{const c=el.cloneNode(true);c.querySelectorAll('script,button,.tax-actions,.tax-print-actions,.le-actions,.socials,.social-disclaimer').forEach(n=>n.remove());const srcFields=el.querySelectorAll('input,select,textarea');c.querySelectorAll('input,select,textarea').forEach((n,i)=>{const o=srcFields[i];if(!o)return;if(n.tagName==='SELECT'){[...n.options].forEach((op,j)=>{if(o.options[j]?.selected)op.setAttribute('selected','');else op.removeAttribute('selected')})}else if(n.type==='checkbox'||n.type==='radio'){if(o.checked)n.setAttribute('checked','');else n.removeAttribute('checked')}else{n.setAttribute('value',o.value);if(n.tagName==='TEXTAREA')n.textContent=o.value}});c.querySelectorAll('details').forEach(d=>d.open=true);return c};
 const page=(title,els)=>{const pg=document.createElement('section');pg.className='print-page';const content=document.createElement('div');content.className='print-page-content';if(title){const h=document.createElement('h2');h.textContent=title;h.style.cssText='font-size:16pt;margin:0 0 5mm;text-align:center;color:#8a642e';content.appendChild(h)}els.filter(Boolean).forEach(el=>content.appendChild(cloneClean(el)));pg.appendChild(content);root.appendChild(pg);return {pg,content}};
 const fitPages=()=>{root.querySelectorAll('.print-page').forEach(pg=>{const c=pg.querySelector('.print-page-content');if(!c)return;c.style.transform='none';c.style.width='190mm';c.style.maxWidth='190mm';c.style.height='auto';const rect=c.getBoundingClientRect();const h=Math.max(c.scrollHeight,rect.height)/3.7795275591;const w=Math.max(c.scrollWidth,rect.width)/3.7795275591;const scale=Math.min(1,277/Math.max(h,1),190/Math.max(w,1));c.style.transformOrigin='top left';c.style.transform='scale('+scale+')';});};
 const openPrint=()=>{body.classList.add('yichen-print-active');const ready=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));Promise.resolve(document.fonts?.ready).catch(()=>{}).then(ready).then(()=>{fitPages();return ready()}).then(()=>{fitPages();window.print()});};
 const finish=()=>{body.classList.remove('yichen-print-active');root.innerHTML='';};
 window.addEventListener('beforeprint',()=>{if(body.classList.contains('yichen-print-active'))fitPages()});
 window.addEventListener('afterprint',finish);
 const bind=(id,fn)=>{const el=$(id);if(!el)return;el.addEventListener('click',ev=>{ev.preventDefault();ev.stopImmediatePropagation();root.innerHTML='';fn();if(root.querySelector('.print-page'))openPrint()},true)};
 const officialFilled=()=>{const d=le?.querySelector('.le-official-details');if(!d)return false;return [...d.querySelectorAll('input,select,textarea')].some(x=>{if(x.type==='checkbox'||x.type==='radio')return x.checked;const v=(x.value||'').trim();return v!==''&&!['尚未查核','否','未查核','不知道','無'].includes(v)})};
 const landPages=()=>{if(!le)return;const wrap=le.querySelector('.land-efficiency-wrap');if(!wrap)return;const cardFor=label=>{const h=[...wrap.querySelectorAll('.le-card > h3')].find(x=>x.textContent.trim().includes(label));return h?.closest('.le-card')||null};const first=cardFor('一、基地與法規條件'),second=cardFor('二、土地成本與市場銷售條件'),third=cardFor('三、試算結果'),d=wrap.querySelector('.le-official-details');root.dataset.printScope='land-efficiency-only';const parts=[first];if(officialFilled()&&d)parts.push(d);parts.push(second,third);const firstBase=first?.cloneNode(true),secondBase=second?.cloneNode(true),thirdBase=third?.cloneNode(true);firstBase?.querySelector('.le-official-details')?.remove();if(officialFilled()){const h2=secondBase?.querySelector(':scope > h3'),h3=thirdBase?.querySelector(':scope > h3');if(h2)h2.textContent='三、土地成本與市場銷售條件';if(h3)h3.textContent='四、試算結果';}if(firstBase)page('土地坪效試算｜一、基地與法規條件',[firstBase]).pg.classList.add('land-efficiency-print-page');if(officialFilled()&&d)page('土地坪效試算｜二、官方查核',[d]).pg.classList.add('land-efficiency-print-page');if(secondBase)page('土地坪效試算｜'+(officialFilled()?'三、土地成本與市場銷售條件':'二、土地成本與市場銷售條件'),[secondBase]).pg.classList.add('land-efficiency-print-page');if(thirdBase)page('土地坪效試算｜'+(officialFilled()?'四、試算結果':'三、試算結果'),[thirdBase]).pg.classList.add('land-efficiency-print-page');};
 const saveActiveTax=()=>{const menu=$('tax-menu'),key=menu?.querySelector('button.active')?.dataset.key;if(!key)return null;const panel=$('tax-center')?.querySelector('.tax-panel');if(!panel)return null;const c=cloneClean(panel);const state=window.__yichenTaxState||{};const values={};panel.querySelectorAll('input,select,textarea').forEach(x=>values[x.id]=x.type==='checkbox'?x.checked:x.value);const prior=state[key]||{};state[key]={...prior,values,amount:$('tax-amount')?.textContent||'',detail:$('tax-detail')?.textContent||'',shown:prior.shown===true&&($('tax-result')?.classList.contains('show')||false),snapshot:c.outerHTML};window.__yichenTaxState=state;return c;};
 const taxPages=()=>{const menu=$('tax-menu'),active=menu?.querySelector('button.active'),extraKey=active?.dataset.yichenExtra,key=active?.dataset.key;const live=$('tax-center')?.querySelector('.tax-panel'),state=window.__yichenTaxState||{};if(!live)return;if(extraKey){const st=state[extraKey],result=live.querySelector('.tax-result');if(!result?.classList.contains('show')||st?.shown!==true||!st.snapshot){alert('請先完成目前稅務工具的試算；修改資料後須重新試算才能列印。');return;}const holder=document.createElement('div');holder.innerHTML=st.snapshot;const panel=holder.firstElementChild;if(!panel)return;panel.classList.add('tax-print-panel');panel.querySelector('.tax-actions')?.remove();panel.querySelectorAll('input,select,textarea').forEach(el=>{el.disabled=true;el.setAttribute('aria-readonly','true')});const title=panel.querySelector('#tax-title')?.textContent||'目前選取工具';const out=page('稅務試算｜'+title,[panel]);out.pg.classList.add('tax-print-page');return;}if(!key)return;const result=live.querySelector('.tax-result');if(!result?.classList.contains('show')||state[key]?.shown!==true){alert('請先完成目前稅務工具的試算；修改資料後須重新試算才能列印。');return;}const panel=saveActiveTax();if(!panel)return;panel.classList.add('tax-print-panel');panel.querySelector('.tax-actions')?.remove();panel.querySelectorAll('input,select,textarea').forEach(el=>{el.disabled=true;el.setAttribute('aria-readonly','true')});const title=panel.querySelector('#tax-title')?.textContent||'目前選取工具';const out=page('稅務試算｜'+title,[panel]);out.pg.classList.add('tax-print-page');};
 const mortgagePages=(requireCalculated=true)=>{const live=$('mortgage-center')?.querySelector('.mortgage-calculator'),results=$('mortgageResults');if(!live)return;if(requireCalculated&&!results?.dataset.userCalculated){alert('請先完成房貸試算，再列印或存成 PDF。');return;}const panel=cloneClean(live);panel.classList.add('mortgage-print-panel');panel.querySelector('.mortgage-form-actions')?.remove();panel.querySelectorAll('input,select,textarea').forEach(el=>{el.disabled=true;el.setAttribute('aria-readonly','true')});const out=page('房貸試算｜輸入條件與試算結果',[panel]);out.pg.classList.add('mortgage-print-page');};
 bind('mortgage-print',()=>mortgagePages());
 bind('le-print',()=>landPages());
 bind('tax-print',()=>taxPages());
 bind('site-print',()=>{
  const main=$('home');if(!main)return;
  const hero=main.querySelector('.hero'),about=$('about'),culture=$('culture'),services=$('services'),method=$('method'),vision=$('vision'),insight=$('insight');
  if(hero)page('人物首頁',[hero]);
  if(about)page('關於億辰',[about]);
  if(culture)page('企業徽章與文化',[culture]);
  if(services)page('專業服務',[services]);if(method)page('服務流程',[method]);const marketBundle=[vision,insight].filter(Boolean);if(marketBundle.length)page('市場觀點與 OUR BELIEF',marketBundle);
  if($('mortgageResults')?.dataset.userCalculated==='1')mortgagePages(false);
  const state=window.__yichenTaxState||{};saveActiveTax();
  Object.entries(state).forEach(([key,st])=>{if(st?.shown===true&&st.snapshot){const holder=document.createElement('div');holder.innerHTML=st.snapshot;const panel=holder.firstElementChild;if(panel){panel.classList.add('tax-print-panel');page('稅務試算｜'+(panel.querySelector('#tax-title')?.textContent||key),[panel]).pg.classList.add('tax-print-page');}}});
  if(le?.dataset.calculated==='1')landPages();
 });;
})();

