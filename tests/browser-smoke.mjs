import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const file='file://'+path.resolve('dist/index.html');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
const dialogs=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',async d=>{dialogs.push(d.message());await d.accept()});
await page.addInitScript(()=>{window.__printCalls=0;window.print=()=>{window.__printCalls++}});
await page.goto(file,{waitUntil:'load'});
await page.waitForTimeout(800);
const regulatory=await page.evaluate(()=>{
 const api=window.YichenRegulatoryData;
 if(!api)return null;
 const bundle=api.loadBundle('06',{date:'2026-11-27',jurisdiction:'TW-KHH'});
 return {cityCount:api.manifest.county_city_files.length,lawCount:bundle.centralLawReferences.length,taxCount:bundle.taxParameterReferences.length,rewardCount:bundle.incentiveReferences.length,safeToCalculate:bundle.safeToCalculate,reviewRequired:bundle.reviewRequired.length};
});
if(!regulatory||regulatory.cityCount!==22||regulatory.taxCount!==5||regulatory.rewardCount!==9||regulatory.safeToCalculate!==false)throw new Error('Embedded regulatory data integration failed: '+JSON.stringify(regulatory));
const required=['tax-center','mortgage-center','land-efficiency-tool','tax-calc','tax-print','mortgageForm','mortgage-print','le-calc','le-print','site-print'];
for(const id of required){if(await page.locator('#'+id).count()!==1)throw new Error('Missing/duplicate required element #'+id)}
const imgs=await page.locator('img[data-yichen-inline-image]').count();
if(imgs!==0)throw new Error('Unembedded image placeholders remain');
const imageSources=await page.locator('img[src^="data:image/"]').count();
if(imageSources<4)throw new Error('Expected embedded brand images, found '+imageSources);

await page.locator('#mortgageForm button[type="submit"]').click();
await page.waitForTimeout(150);
const mortgage=await page.locator('#mortgageMonthly').innerText();
if(!mortgage||mortgage==='—')throw new Error('Mortgage result was not calculated');

await page.locator('#le-calc').click();
await page.waitForTimeout(150);
const land=await page.locator('#le-out-landunit').innerText();
if(!land||land==='—')throw new Error('Land efficiency result missing');

await page.locator('#tax-menu button[data-key="corp"]').click();
await page.locator('#tax-base').fill('500000');
await page.locator('#tax-fields details.tax-advanced').evaluate(el=>el.open=true);
await page.locator('#tax-taxableIncomeVerified').selectOption('是');
await page.locator('#tax-data-verified').check();
await page.locator('#tax-calc').click();
await page.waitForTimeout(150);
const taxAmount=await page.locator('#tax-amount').innerText();
if(!taxAmount||taxAmount==='NT$ 0')throw new Error('Tax calculator did not produce the expected non-zero sample result; dialogs='+dialogs.join(' | '));

const printCounts=[];
for(const id of ['tax-print','mortgage-print','le-print','site-print']){
 await page.locator('#'+id).click();
 await page.waitForTimeout(350);
 printCounts.push(await page.evaluate(()=>window.__printCalls));
}
const printCalls=await page.evaluate(()=>window.__printCalls);
if(printCalls!==4)throw new Error('Expected all 4 print entry points to invoke print; counts='+printCounts.join(',')+'; dialogs='+dialogs.join(' | '));
if(dialogs.length)throw new Error('Unexpected browser dialogs: '+dialogs.join(' | '));
if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
await fs.writeFile('dist/browser-smoke-results.json',JSON.stringify({passed:true,mortgage,land,taxAmount,embeddedImageCount:imageSources,regulatory,printCalls,printCounts,errors},null,2));
await browser.close();
console.log('Browser smoke tests passed: '+JSON.stringify({mortgage,land,taxAmount,imageSources,regulatory,printCalls,printCounts}));
