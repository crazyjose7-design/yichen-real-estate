import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const file='file://'+path.resolve('dist/index.html');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__printCalls=0;window.print=()=>{window.__printCalls++}});
await page.goto(file,{waitUntil:'load'});
await page.waitForTimeout(1200);
const required=['tax-center','mortgage-center','land-efficiency-tool','tax-calc','tax-print','mortgageForm','mortgage-print','le-calc','le-print','site-print'];
for(const id of required){if(await page.locator('#'+id).count()!==1)throw new Error('Missing/duplicate required element #'+id)}
const imgs=await page.locator('img[data-yichen-inline-image]').count();
if(imgs!==0)throw new Error('Unembedded image placeholders remain');
const imageSources=await page.locator('img[src^="data:image/"]').count();
if(imageSources<4)throw new Error('Expected embedded brand images, found '+imageSources);

// Mortgage calculation
await page.locator('#mortgageForm button[type="submit"]').click();
await page.waitForTimeout(150);
const mortgage=await page.locator('#mortgageMonthly').innerText();
if(!mortgage||mortgage==='—')throw new Error('Mortgage result was not calculated');

// Land efficiency calculation
await page.locator('#le-calc').click();
await page.waitForTimeout(150);
const land=await page.locator('#le-out-landunit').innerText();
if(!land||land==='—')throw new Error('Land efficiency result missing');

// Tax menu should initialize and calculator should execute
const taxMenuButtons=page.locator('#tax-menu button');
if(await taxMenuButtons.count()<1)throw new Error('Tax menu did not initialize');
await page.locator('#tax-calc').click();
await page.waitForTimeout(150);
const taxAmount=await page.locator('#tax-amount').innerText();
if(!taxAmount)throw new Error('Tax result element empty');

// Independent print entry points must be clickable and invoke print
for(const id of ['tax-print','mortgage-print','le-print','site-print']){
 await page.locator('#'+id).click();
 await page.waitForTimeout(100);
}
const printCalls=await page.evaluate(()=>window.__printCalls);
if(printCalls!==4)throw new Error('Expected 4 print invocations; got '+printCalls);
if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
await fs.writeFile('dist/browser-smoke-results.json',JSON.stringify({passed:true,mortgage,land,taxAmount,embeddedImageCount:imageSources,printCalls,errors},null,2));
await browser.close();
console.log('Browser smoke tests passed: '+JSON.stringify({mortgage,land,taxAmount,imageSources,printCalls}));
