# V2 獨立驗證工程｜分類執行紀錄（2026-11-27）

## 本輪查核結論

六大工作尚未全部完成。這次先按類別建立可追蹤驗收檔案與新的自動測試入口；沒有把尚未核實的公式或法規標成 PASS。

## 已查明的程式缺口

1. 稅務區版本說明宣稱14項工具；目前抽取的 `workbench/modules/tax-engine.js` 有12個計算器定義。租金扣繳、執行業務所得在該模組找不到計算器定義，需先定位或補建實際工具。
2. 現有 `tests/tax-existing-tools.test.mjs` 有11個固定基準 expected；其中未涵蓋 `land`（土地增值稅）定義。另有既有土地增值稅瀏覽器回歸紀錄131筆，但仍須確認其涵蓋範圍與獨立預期值來源。
3. 現有土地坪效測試6項，只涵蓋基準、平方公尺換算、手動獎勵情境、自訂空值、負土地價及車位收入；不等於全部欄位、獎勵組合及列印四頁驗收。
4. 房貸現有測試8個主情境加1個錯誤情境；測試參考函式採 JavaScript Number/Math.round，並非 Decimal oracle。新增 Decimal 原型先前只涵蓋無寬限期等額本息。
5. 22縣市法規資料雖存在，仍為 unverified；中央21條索引仍為 in_review；目前不得自動套用。
6. 網站已確認稅務、房貸、土地坪效 DOM 入口，但沒有證據顯示完整 Playwright 表單、逐期表格、四頁PDF及手機版驗收已完成。

## 本輪新增檔案

- `verification/tax/README.md`
- `verification/tax/tax-tools-matrix.json`：14項清單、缺失工具及來源阻擋狀態
- `verification/land-efficiency/acceptance-matrix.json`：完整欄位、獎勵、成本、收入及列印驗收矩陣
- `verification/mortgage/matrix.json`：利率×年期×寬限期×攤還方式驗收維度
- `verification/python/mortgage_matrix_oracle.py`：Decimal 房貸獨立攤還核心，含兩種攤還、寬限期、利率變動及逐期資料
- `verification/python/test_mortgage_matrix.py`：三個固定基準及54組矩陣不變量測試
- `verification/python/land_efficiency_oracle.py`：土地坪效非法律部分的 Decimal 獨立算術核心
- `verification/python/test_land_efficiency_oracle.py`：坪/平方公尺、基準坪效、情境獎勵、換算及異常值測試
- `verification/regulations/acceptance.md`：法規逐條、附件、地域、日期、互斥併計驗收標準
- `verification/browser/acceptance.md`：真實頁面 selector、互動、PDF及響應式驗收標準
- `playwright.config.js` 與 `verification/browser/tests/site-functional.spec.js`：新增實際頁面載入、房貸送出、土地試算、稅務選單、手機寬度及PDF輸出測試
- `.github/workflows/independent-verification.yml`：新增 Python Decimal、Node 回歸及 Playwright 三組獨立工作

## 已完成的本地計算核對

- 房貸 Decimal 核心以獨立程式驗算54組（兩種攤還×三種利率×三種年期×三種寬限期）本金守恆、逐期付款等式與期末餘額；此為 oracle 自身不變量檢查，尚未與網站所有組合逐筆交叉比對。
- 土地坪效 Decimal 核心的基準：100坪、法定容積率200%、換算係數1.3、土地總價8000萬元、平均售價60萬元/坪，算出基準樓地板200坪、可售260坪、每可售坪分攤土地成本30.77萬元、銷售總額15600萬元。此僅為算術基準，不代表200%容積或任何獎勵在特定基地合法。

## CI狀態

- 先前建置工作流 Run 45899613887：success；包含原本 browser smoke test 及 ZIP 檢查，不等於新加的完整 Playwright 測試通過。
- 新增的 `independent-verification.yml` 已提交；目前尚未取得此新工作流的完成結果，故不得宣稱通過。
- 未合併 main、未部署正式網站。

## 後續未完成項目

1. 取得14項稅務每項的完整欄位及當年度官方法源，補足獨立 expected matrix；先查明兩項計算器是否在其他版本或已漏做。
2. 對土地坪效每一欄位建立生產程式對照測試；把第三層法規規則輸出接入，而非允許自由填獎勵百分比代替法規。
3. 將房貸 Decimal oracle 與網站生產JS在相同矩陣逐筆對照，並明確處理本金平均攤還及利率變動尾差。
4. 22縣市逐條法規、附表、都市計畫書圖及個案核准來源覆核。
5. 修正 Playwright 可能失敗的 selector/實際頁面行為，擴充每項稅務、列印入口與PDF分頁檢查；新CI全綠後仍需人工檢查PDF內容。
6. 第五層待前四層證據齊全後才啟動。

## 本輪判定

分類驗收架構及部分獨立 Decimal oracle 已建立；尚未達成任何一個完整工作包的全部 exit criteria。