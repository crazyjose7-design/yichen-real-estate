# 2026-11-27 網站功能執行與驗收報告

## 本輪可重現交付

- 工作分支：`work/city-parameter-files-2026-11-27`
- 驗收程式碼 commit：`7ddbb3158141967dff56ffb25369f4842b3a3664`
- 未合併 `main`，未切換正式網站流量。
- 最新部署包 Artifact：Run 45916926817，Artifact ID 15162921431。
- 最新瀏覽器/視覺證據 Artifact：Run 45916926815，Artifact ID 15162272978。

## 1. CI實際結果

| 驗收工作 | Run | 結果 |
|---|---:|---|
| Build and verify deployment package | 45916926817 | PASS |
| Independent verification layers | 45916926815 | PASS（3個jobs） |
| Regulatory data validation | 45916926904 | PASS |

Independent verification layers：
- Node production regression：115項通過、0失敗。
- Playwright browser functional tests：18項通過。
- Python independent Decimal oracles：13個測試方法通過。
- RWD尺寸：1440×900、1280×800、1024×768、820×1180、430×932、390×844、360×800、844×390，共8種尺寸，無水平溢出。
- Apps Script接收端：4項靜態語法/契約測試通過；這不等於Apps Script已部署或郵件已送達。
- 房貸獨立Decimal oracle：54組矩陣及固定基準/邊界測試通過。
- 土地坪效獨立Decimal oracle：算術基準通過。
- 土地增值稅回歸：131項、失敗0。

## 2. 稅務工作進度

網站仍保留原12項稅務工具，並已整合租金扣繳及執行業務所得，頁面選單共14項。

本輪新增年度法源資料：
- `regulations/taxes/individual-income-tax-2026.json`：財政部台財稅字第11404664070號，115年度綜所稅免稅額、扣除額、級距及退職所得標準。
- `regulations/taxes/estate-gift-tax-2026.json`：財政部台財稅字第11404671540號，115年度遺產/贈與稅免稅額、級距及扣除額。

新增獨立案例：
- 租金扣繳：9項；執行業務所得：12項。
- 遺產/贈與稅：9項級距、免稅額及例外案例。
- 土地增值稅：5項零漲價、三級距及無效持分案例。
- 租賃所得及房屋舊制財產交易所得：3項115年度個人綜所稅級距案例。

限制：
- 14項工具的完整官方法源、所有年度差異、正常/邊界/異常/交叉矩陣尚未全部完成。
- 部分年度參數仍硬編碼；新增JSON是可追溯法源資料，不代表所有計算器已動態讀取。
- 尚未為14項工具逐一輸出獨立PDF；目前有營所稅、租金扣繳及執行業務所得等單項PDF證據。

## 3. 列印與PDF人工檢視

最新瀏覽器證據Artifact：15162272978。

| PDF | 實際頁數 | 紙張 |
|---|---:|---|
| 房貸獨立列印 | 1 | A4直式 |
| 租金扣繳單項列印 | 1 | A4直式 |
| 土地坪效（官方查核已填） | 4 | A4直式 |
| 整份網站主內容（未加入試算） | 6 | A4直式 |

Build smoke另確認：
- 土地坪效官方查核未填時3頁。
- 整份網站有已完成房貸/稅務/土地試算時11頁。
- 再加入租金扣繳及執行業務所得試算時13頁。

已逐頁檢視土地四頁PDF，發現內部標題編號錯位後已修正；最新Playwright 18項全數通過，並對第3、4頁內部標題新增精確斷言。房貸PDF包含六項結果及前12期明細。

## 4. RWD視覺檢查

- CI已保存8種尺寸全頁截圖，人工抽查1440桌面及390手機分段畫面。
- 未見水平溢出、卡片超出畫面或主要區塊重疊；手機採單欄堆疊及漢堡選單。
- 社群影片區仍出現黑色預留框，需確認公開網域/外部影片權限。
- 尚未以真實Android裝置完成觸控、鍵盤及PDF檢視器驗收，不能標示整體視覺PASS。

## 5. 中央及22縣市法規

- 22縣市資料檔：22/22存在並有官方來源索引。
- 中央法規索引：19項。
- 稅務參數檔：9項。
- 獎勵資料檔：9項。
- 最新build smoke顯示 `reviewRequired=37`，`safeToCalculate=false`。
- 22縣市已驗證官方參數仍為0；來源清單存在不等於逐條法規及地方參數已驗證。
- 中央《都市更新建築容積獎勵辦法》引用範圍已校正為現行全文21條。
- 苗栗縣《都市更新建築容積獎勵辦法》第3條，依內政部115年1月12日台內國字第1140817216號函，已記錄為無效；city schema及validator已要求該條保持 `auto_apply=false`。
- 臺北、臺中、高雄地方都更規則已補充中央母法修法後條次、地方上限及附表審查風險；仍維持in_review。
- 未核實獎勵不自動套用，正式法規閘門維持BLOCKED。

## 6. 聯絡表單實際送達

已新增：
- `backend/google-apps-script/Code.gs`：Email接收、選配LINE Messaging API推播、Google試算表留存、案件編號及執行紀錄。
- `backend/google-apps-script/README.md`：部署、Script Properties、收件及驗收說明。
- 4項靜態語法/契約測試。

尚未取得收件Email、LINE官方帳號Token/目的地ID及Apps Script專案授權；新後端尚未部署，也未替換網站現有endpoint。沒有真實收件郵件/試算表/LINE證據，送達狀態仍BLOCKED。

## 7. Cloudflare Pages

已新增手動工作流程 `.github/workflows/cloudflare-pages-deploy.yml`：
- 預設部署Preview。
- Production限定從main執行。
- 需要GitHub secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。
- 需要repository variable：`CLOUDFLARE_PAGES_PROJECT`。
- 部署前會重新建置並檢查部署包。

目前尚未設定憑證或觸發Cloudflare部署，沒有正式部署ID、公開網址或公開站回歸證據；仍未合併main。

## 8. 交付檔案

- 完整部署包：`yichen-real-estate-deployment-v6.2.21-final.zip`
- 單檔網站：`yichen-real-estate-v6.2.21-final.html`
- 視覺及PDF證據：`browser-visual-and-print-evidence-final.zip`

完整部署包已解壓檢查，包含：
`index.html`、`index.multi-file.html`、`modules/`、`regulations/`、`docs/`、`versions/`、`backend/google-apps-script/`。
部署包已由CI成功產生及驗證，但不是Cloudflare正式上線版本。

## 9. 最終閘門

仍未完成：
1. 14項稅務工具逐項法源、年度、邊界矩陣及PDF。
2. 中央及22縣市法規逐條覆核、地方官方參數及獎勵互斥/併計。
3. 真實Android實機及社群影片嵌入檢查。
4. Apps Script真實收件端部署與Email/LINE驗收。
5. Cloudflare Preview部署、公開網址回歸及正式部署授權。

因此整合閘門仍為BLOCKED。不得合併main、不得宣稱正式上線。
