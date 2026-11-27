# 第四層｜Playwright 網站功能驗收

## 已確認的真實頁面結構
- 稅務：`#tax-center`、`#tax-menu`、`#tax-fields`、`#tax-calc`、`#tax-result`、`#tax-print`。
- 房貸：`#mortgageForm`、`#mortgageResults`、`#mortgageSchedule`、`#mortgage-print`。
- 土地坪效：`#land-efficiency-tool`、`#le-calc`、`#le-print`。

## 驗收情境
1. 桌面與手機載入、導覽及區塊捲動。
2. 每個稅務工具逐一切換，核對欄位、輸入、計算、金額、說明、清除及列印。
3. 房貸兩種攤還方式、寬限期、利率變動、前12期明細及試算後列印解鎖。
4. 土地坪效所有欄位、選填條件、獎勵互斥、車位收入、成本金額/百分比及四頁列印。
5. PDF實際產生後檢查頁數、文字、A4方向、表格截斷、空白頁及區塊混印。
6. 手機360/390/430px、平板及桌面檢查橫向溢出、欄位可用性及表格捲動。
7. 記錄console error、pageerror及失敗請求。

目前只確認DOM selector存在，尚未完成上述Playwright全量操作及PDF檔案驗收。不得以browser smoke test替代。