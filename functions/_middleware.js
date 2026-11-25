/**
 * YICHEN V6.2.1 tax-safety guard for Cloudflare Pages.
 * Keeps the existing V6.2.0 site intact while preventing the form from
 * silently treating unverified documents and legal facts as confirmed.
 */
const SECTION_RULES = {
  land: {
    landType: "",
  },
  house: {
    assetType: "",
    mode: "",
    costBasisVerified: "否",
    saleVerified: "否",
    landGainVerified: "否",
    resident: "",
    shareControl: "",
    shareLots: "",
    shareTransition: "",
    listed: "",
    special: "",
    self: "",
    repurchase: "",
  },
  old: {
    regimeVerified: "否",
    costVerified: "否",
    baseIncomeVerified: "否",
  },
  vat: {
    priorCreditVerified: "不適用",
    dataVerified: "否",
    vatType: "",
  },
  deed: {
    baseVerified: "否",
    kind: "",
    exemption: "可能符合免徵（停止自動試算並查核）",
  },
  stamp: {
    documentVerified: "否",
    kind: "",
    exemption: "可能免稅／免貼（停止自動試算並查核）",
  },
  houseTax: {
    ownerType: "",
    baseVerified: "否",
    ownerRelation: "",
    kind: "",
    householdRegistered: "",
    noRentBusiness: "",
    actualResidence: "",
    rateVerified: "否",
    exemptionVerified: "否",
  },
  landTax: {
    baseVerified: "否",
    kind: "",
    startVerified: "否",
  },
  rent: {
    rentalType: "",
    dataVerified: "否",
    baseIncomeVerified: "否",
  },
  estate: {
    decedentResident: "",
    serviceDeath: "",
    estateInfoVerified: "否",
    gift2YearsVerified: "不適用",
    deductionsVerified: "否",
    creditVerified: "不適用",
  },
  gift: {
    donorResident: "",
    annualGiftVerified: "否",
    deductionsVerified: "否",
    creditVerified: "不適用",
  },
  corp: {
    taxableIncomeVerified: "否",
  },
};

const OLD_HELP = "資料核實選項預設按「已核實」估算；尚未核實時，請展開進階資料改選「否」。";
const NEW_HELP = "資料核實選項預設為「未確認」；請依正式文件逐項核對，未確認前系統會停止計算。";

export function patchTaxDefaults(html) {
  const marker = "const defaultSelects={";
  const start = html.indexOf(marker);
  if (start < 0) return null;

  const end = html.indexOf("\n };", start);
  if (end < 0) return null;

  const sourceBlock = html.slice(start, end);
  const lines = sourceBlock.split("\n");
  const foundSections = new Set();

  for (let i = 1; i < lines.length; i += 1) {
    const match = lines[i].match(/^\s*([A-Za-z][A-Za-z0-9]*):\{/);
    if (!match) continue;
    const section = match[1];
    const rules = SECTION_RULES[section];
    if (!rules) continue;
    foundSections.add(section);
    for (const [key, value] of Object.entries(rules)) {
      const pattern = new RegExp(`(\\b${key}\\s*:\\s*)'[^']*'`);
      if (!pattern.test(lines[i])) return null;
      lines[i] = lines[i].replace(pattern, (_whole, prefix) => prefix + JSON.stringify(value));
    }
  }

  if (foundSections.size !== Object.keys(SECTION_RULES).length) return null;
  let patched = html.slice(0, start) + lines.join("\n") + html.slice(end);
  if (!patched.includes(OLD_HELP)) return null;
  patched = patched.replace(OLD_HELP, NEW_HELP);
  return patched;
}

export async function onRequest({ request, next }) {
  const response = await next();
  if (request.method !== "GET" || !response.ok) return response;

  const pathname = new URL(request.url).pathname;
  if (pathname !== "/" && pathname !== "/index.html") return response;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;

  const originalHtml = await response.clone().text();
  const patchedHtml = patchTaxDefaults(originalHtml);
  if (!patchedHtml) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("x-yichen-tax-guard", "v6.2.1-applied");

  return new Response(patchedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
