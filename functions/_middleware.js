/**
 * YICHEN V6.2.2 tax-safety guard for Cloudflare Pages.
 * Preserves V6.2.1 defaults and rejects fractional prior land-tax credits.
 */
const SECTION_RULES = {
  land: { landType: "" },
  house: {
    assetType: "", mode: "", costBasisVerified: "否", saleVerified: "否",
    landGainVerified: "否", resident: "", shareControl: "", shareLots: "",
    shareTransition: "", listed: "", special: "", self: "", repurchase: "",
  },
  old: { regimeVerified: "否", costVerified: "否", baseIncomeVerified: "否" },
  vat: { priorCreditVerified: "不適用", dataVerified: "否", vatType: "" },
  deed: { baseVerified: "否", kind: "", exemption: "可能符合免徵（停止自動試算並查核）" },
  stamp: { documentVerified: "否", kind: "", exemption: "可能免稅／免貼（停止自動試算並查核）" },
  houseTax: {
    ownerType: "", baseVerified: "否", ownerRelation: "", kind: "",
    householdRegistered: "", noRentBusiness: "", actualResidence: "",
    rateVerified: "否", exemptionVerified: "否",
  },
  landTax: { baseVerified: "否", kind: "", startVerified: "否" },
  rent: { rentalType: "", dataVerified: "否", baseIncomeVerified: "否" },
  estate: {
    decedentResident: "", serviceDeath: "", estateInfoVerified: "否",
    gift2YearsVerified: "不適用", deductionsVerified: "否", creditVerified: "不適用",
  },
  gift: { donorResident: "", annualGiftVerified: "否", deductionsVerified: "否", creditVerified: "不適用" },
  corp: { taxableIncomeVerified: "否" },
};

const OLD_HELP = "資料核實選項預設按「已核實」估算；尚未核實時，請展開進階資料改選「否」。";
const NEW_HELP = "資料核實選項預設為「未確認」；請依正式文件逐項核對，未確認前系統會停止計算。";

const CREDIT_INTEGER_GUARD = String.raw`<script id="yichen-prior-credit-integer-guard">
(function () {
  "use strict";
  var phrase = "經核准可抵繳之增繳地價稅額";
  var message = "抵繳金額只能輸入非負整數元；不可輸入小數或負數。";
  function findCreditInput() {
    var labels = Array.prototype.slice.call(document.querySelectorAll("label"));
    for (var i = 0; i < labels.length; i += 1) {
      if (labels[i].textContent.indexOf(phrase) !== -1) {
        if (labels[i].control) return labels[i].control;
        var node = labels[i];
        for (var depth = 0; depth < 6 && node; depth += 1, node = node.parentElement) {
          var found = node.querySelector && node.querySelector("input, textarea");
          if (found) return found;
        }
      }
    }
    var candidates = Array.prototype.slice.call(document.querySelectorAll("body *")).filter(function (el) {
      return el.textContent && el.textContent.indexOf(phrase) !== -1 && el.querySelector("input, textarea");
    });
    candidates.sort(function (a, b) {
      return a.querySelectorAll("*").length - b.querySelectorAll("*").length;
    });
    return candidates.length ? candidates[0].querySelector("input, textarea") : null;
  }
  function validate(input, report) {
    if (!input) return true;
    var value = String(input.value == null ? "" : input.value).trim();
    var invalid = value !== "" && !/^\d+$/.test(value);
    input.setCustomValidity(invalid ? message : "");
    if (invalid) {
      input.setAttribute("aria-invalid", "true");
      if (report) {
        if (typeof input.reportValidity === "function") input.reportValidity();
        input.focus();
      }
      return false;
    }
    input.removeAttribute("aria-invalid");
    return true;
  }
  function install() {
    var input = findCreditInput();
    if (!input || input.getAttribute("data-yichen-integer-guard") === "1") return;
    input.setAttribute("data-yichen-integer-guard", "1");
    if (input.type === "number") {
      input.min = "0";
      input.step = "1";
    }
    input.addEventListener("input", function () { validate(input, false); });
    input.addEventListener("change", function () { validate(input, false); });
    var form = input.form;
    if (form) form.addEventListener("submit", function (event) {
      if (!validate(input, true)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest ? event.target.closest("button, input[type=submit], input[type=button]") : null;
      if (!button) return;
      var label = (button.innerText || button.value || button.getAttribute("aria-label") || "").trim();
      if (/計算|試算|估算|calculate|compute/i.test(label) && !validate(input, true)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(install);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
</script>`;

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
  if (!patched.includes("yichen-prior-credit-integer-guard")) {
    const bodyEnd = patched.toLowerCase().lastIndexOf("</body>");
    if (bodyEnd < 0) return null;
    patched = patched.slice(0, bodyEnd) + CREDIT_INTEGER_GUARD + patched.slice(bodyEnd);
  }
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
  headers.set("x-yichen-tax-guard", "v6.2.2-applied");
  return new Response(patchedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
