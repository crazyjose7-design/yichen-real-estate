(()=>{
 const tool=document.getElementById('land-efficiency-tool'),reg=window.YichenRegulatoryData,engine=window.YichenRewardGate;
 if(!tool||!reg||!engine)return;
 const fmt=n=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(n);
 let official=document.getElementById('le-official-reward');
 if(!official){official=document.createElement('input');official.type='hidden';official.id='le-official-reward';official.value='0';tool.appendChild(official)}
 const wrap=tool.querySelector('.land-efficiency-wrap')||tool;
 if(document.getElementById('le-reward-legal-gate'))return;
 const details=document.createElement('details');details.id='le-reward-legal-gate';details.className='le-card le-reward-legal-gate';
 details.innerHTML='<summary><strong>官方容積獎勵核准檢核（進階）</strong><span>檢查法源、效期、轄區、個案核准及互斥條件；未核實資料不會加入試算</span></summary><div class="le-reward-gate-body"><p>這裡只接受已完成法規覆核、已生效、符合基地轄區且有主管機關個案核准紀錄的獎勵。現有獎勵資料仍在覆核中，以下檢核若被阻擋，原本手動獎勵欄位仍只代表情境假設。</p><div class="le-reward-gate-grid"><label>基地縣市<select id="le-reward-jurisdiction"></select></label><label>試算基準日期<input id="le-reward-date" type="date"></label></div><div id="le-reward-options" class="le-reward-options"></div><button type="button" id="le-reward-check" class="le-reward-button">檢查官方核准資料</button><div id="le-reward-status" role="status" aria-live="polite">尚未檢查。選擇基地縣市、日期及獎勵類型後執行檢查。</div><button type="button" id="le-reward-apply" class="le-reward-button" disabled>套用已核准獎勵</button><p class="le-reward-footnote">套用按鈕只有在所有法定條件、核准文件及互斥/併計規則均通過時才會啟用。此檢核不會把獎勵上限當成可取得獎勵率。</p></div>';
 wrap.appendChild(details);
 const cityNames={'01':'臺北市','02':'新北市','03':'桃園市','04':'臺中市','05':'臺南市','06':'高雄市','07':'基隆市','08':'新竹市','09':'嘉義市','10':'新竹縣','11':'苗栗縣','12':'彰化縣','13':'南投縣','14':'雲林縣','15':'嘉義縣','16':'屏東縣','17':'宜蘭縣','18':'花蓮縣','19':'臺東縣','20':'澎湖縣','21':'金門縣','22':'連江縣'};
 const city=document.getElementById('le-reward-jurisdiction');Object.entries(cityNames).forEach(([code,name])=>{const o=document.createElement('option');o.value=code;o.textContent=name;city.appendChild(o)});
 const date=document.getElementById('le-reward-date');const now=new Date(),pad=n=>String(n).padStart(2,'0');date.value=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
 const opts=document.getElementById('le-reward-options');
 const incentivePaths=reg.manifest.incentive_files||[];
 incentivePaths.forEach(path=>{const d=reg.getFile(path);if(!d)return;const label=document.createElement('label');label.className='le-reward-option';const cb=document.createElement('input');cb.type='checkbox';cb.value=path;const span=document.createElement('span');span.textContent=d.title+'（'+(d.status||'未標示')+'）';label.append(cb,span);opts.appendChild(label)});
 const status=document.getElementById('le-reward-status'),apply=document.getElementById('le-reward-apply'),check=document.getElementById('le-reward-check');
 let latest=null;
 function baseVolume(){const area=Number(document.getElementById('le-area')?.value||0),unit=document.getElementById('le-unit')?.value,far=Number(document.getElementById('le-basefar')?.value||0);const ping=unit==='sqm'?area/3.305785:area;return ping*far/100}
 function resetGate(){const had=Number(official.value)>0;latest=null;apply.disabled=true;official.value='0';status.textContent='基地或法規條件已變更，請重新檢查法規及個案核准資料。';if(had)document.getElementById('le-calc')?.click()}
 check.addEventListener('click',()=>{
  try{
   const paths=[...opts.querySelectorAll('input:checked')].map(x=>x.value);if(!paths.length)throw new Error('請至少選擇一項獎勵類型。');
   const bv=baseVolume();if(!(bv>0))throw new Error('請先輸入有效的土地面積及法定容積率。');
   const items=paths.map(path=>{const d=reg.getFile(path);const source=(d?.official_sources||[]).find(x=>x.url&&x.provision&&x.agency)||null;return {...d,source,jurisdiction:d?.jurisdiction||null,approval_record:d?.case_approval_records?.[0]||null,additional_volume:d?.approved_additional_volume,combination_group:d?.combination_group}});
   latest=engine.evaluateRewardStack({baseVolume:bv,items,calculationDate:date.value,jurisdiction:city.value});
   apply.disabled=latest.status!=='verified';
   if(latest.status==='verified'){status.innerHTML='<strong>已通過法規及個案核准檢核</strong><p>核准增加樓地板面積：'+fmt(latest.approvedAdditionalVolume)+'坪；獎勵換算：'+fmt(latest.approvedAdditionalVolume/bv*100)+'%。</p>';return}
   status.innerHTML='<strong>目前阻擋：不會自動加入土地坪效試算</strong>'+latest.blocked.map(b=>'<div class="le-reward-blocked"><b>'+b.title+'</b><ul>'+b.reasons.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>').join('')+latest.conflicts.map(x=>'<p>'+x.reason+'</p>').join('');
  }catch(e){latest=null;apply.disabled=true;status.textContent=e.message}
 });
 apply.addEventListener('click',()=>{if(!latest||latest.status!=='verified')return;const bv=latest.baseVolume;if(!(bv>0))return;official.value=String(latest.approvedAdditionalVolume/bv*100);document.getElementById('le-calc')?.click();status.textContent='已將經核准獎勵換算為 '+fmt(Number(official.value))+'% 並加入土地坪效試算。';});
 details.addEventListener('change',e=>{if(e.target.matches('input,select'))resetGate()});
 document.getElementById('le-reset')?.addEventListener('click',()=>{latest=null;apply.disabled=true;official.value='0';status.textContent='已清除資料，尚未檢查。'});
 tool.addEventListener('input',e=>{if(details.contains(e.target))return;if(['le-area','le-unit','le-basefar'].includes(e.target.id))resetGate()});
 tool.addEventListener('change',e=>{if(details.contains(e.target))return;if(['le-area','le-unit','le-basefar'].includes(e.target.id))resetGate()});
 const style=document.createElement('style');style.textContent='.le-reward-legal-gate summary{cursor:pointer;display:flex;flex-direction:column;gap:6px}.le-reward-legal-gate summary span,.le-reward-gate-body p,.le-reward-footnote{font-size:12px;line-height:1.7;color:#766f62}.le-reward-gate-body{padding:12px 0}.le-reward-gate-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.le-reward-gate-grid label{display:flex;flex-direction:column;gap:6px;font-size:13px}.le-reward-gate-grid select,.le-reward-gate-grid input{min-height:40px;border:1px solid #d8d1c5;border-radius:8px;padding:8px}.le-reward-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:14px 0}.le-reward-option{display:flex;align-items:flex-start;gap:8px;font-size:13px}.le-reward-option input{margin-top:3px}.le-reward-button{margin:6px 8px 6px 0;padding:10px 16px;border:1px solid #b79b69;border-radius:8px;background:#f7f3eb;color:#403a30;cursor:pointer}.le-reward-button:disabled{opacity:.45;cursor:not-allowed}.le-reward-blocked{border-top:1px solid #ddd5c8;padding:8px 0}.le-reward-blocked ul{margin:4px 0 0 18px;font-size:12px;line-height:1.7;color:#9a4e36}';document.head.appendChild(style);
})();