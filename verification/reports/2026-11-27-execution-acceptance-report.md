# 2026-11-27 網站功能執行與驗收進度

## 本輪已完成並有自動化證據的項目

驗收來源分為 Build browser smoke、Playwright 瀏覽器互動、Node 回歸、Python Decimal 獨立 oracle 及法規資料結構驗證；各層不得互相替代。

### 1. 稅務工具

- 原網站12項計算器保留。
- 租金扣繳與執行業務所得以獨立模組整合至網站，正式頁面選單為14項。
- 新增21項獨立公式測試：租金扣繳9項、執行業務所得12項。
- 測試涵蓋境內/非居住者、個人/公司、10%/20%扣繳、租金含稅/未稅反推、多位房東持分、2,000元扣繳門檻、20,000元補充保費門檻、1,000萬元補充保費上限、9A/9B及9B年度18萬元免稅額。
- 9A費用率不硬猜；須按所得年度與職業別核對官方標準後才允許計入年度所得淨額。
- 稅務工具完整14項官方法源/年度測試矩陣尚未完成；目前只有新增兩項完成上述獨立案例。

### 2. 列印與網站分頁

Build browser smoke實際產生PDF並檢查頁數及A4直式：

| 功能 | PDF頁數 | 自動化結果 |
|---|---:|---|
| 單一稅務工具（營所稅） | 1 | 通過 |
| 房貸專區 | 1 | 通過 |
| 土地坪效（官方查核未填） | 3 | 通過 |
| 整份網站（房貸、營所稅、土地坪效已試算） | 11 | 通過 |
| 租金扣繳單項 | 1 | 通過 |
| 執行業務所得單項 | 1 | 通過 |
| 整份網站（再加入租金扣繳、執行業務所得） | 13 | 通過 |

- 土地坪效官方查核有填時，Playwright確認官方查核獨立成第2頁，整體為4頁；仍待保存實際4頁PDF並人工抽查。
- 房貸Playwright檢查六項結果及前12期明細。
- 整份網站主區塊已拆成：人物、關於億辰、企業徽章文化、專業服務、服務流程、市場觀點與OUR BELIEF；已完成試算才追加各工具頁。
- 修正部署包建置：單檔版內嵌稅務模組，不再引用不存在的workbench路徑；多檔版改用modules/路徑，並隨包附上modules資料夾。

### 3. 瀏覽器與獨立計算

- Playwright：18項瀏覽器互動測試通過。
- RWD水平溢出測試：1440×900、1280×800、1024×768、820×1180、430×932、390×844、360×800、844×390共8種尺寸通過。
- Node production regression：115項測試通過（含Apps Script接收端4項靜態契約/語法測試、土地增值稅5項新增獨立案例、遺產/贈與稅9項新增邊界/例外案例、115年度個人綜所稅級距3項新增案例）。
- Build browser smoke：115項Node測試通過；土地增值稅歷史/回歸案例131項、失敗0。
- Python Decimal oracle：13個測試方法通過；其中房貸54組矩陣、固定基準與邊界檢查通過，土地坪效算術核心通過。
- 以上不代表所有法規參數、22縣市適用條件或人工視覺驗收已完成。

## CI執行證據

- Build and verify deployment package：Run 45913252779，成功。
- Independent verification layers：Run 45913252912，production regression、browser functional tests、independent oracles全部成功。
- Regulatory data validation：Run 45913252798，成功。
- 部署包 Artifact ID：15161410623。
- Artifact網址：https://github.com/crazyjose7-design/yichen-real-estate/actions/runs/45913252779/artifacts/15161410623

## 尚未完成／不得宣稱通過

1. **其餘12項稅務工具**：獨立預期值、正常/邊界/異常/交叉矩陣及官方年度法源仍未逐項完成；稅務列印也未逐項產出14份PDF。
2. **中央及22縣市法規**：資料格式驗證成功不等於法規覆核。當前22縣市官方參數仍未完成，中央及地方資料共35項需審查；safeToCalculate仍為false，未查證獎勵不得自動套用。
3. **土地坪效**：算術 oracle 與列印初驗已完成，法規獎勵互斥/併計及22縣市參數尚未驗收。
4. **人工視覺驗收**：多尺寸無水平溢出通過，但全頁截圖、真實Android裝置、PDF字級/裁切/縮放人工審查尚未完成。
5. **聯絡表單實際送達**：Playwright只攔截模擬Apps Script回應，確認payload與前端不假報成功；未取得收件端郵件/紀錄。Apps Script後端程式不在GitHub專案內，Google Drive連接器不可用。
6. **Cloudflare Pages正式部署**：已產生可解壓部署包，但沒有正式部署ID、公開網址、部署commit一致性與公開站回歸證據。
7. **正式整合閘門**：維持BLOCKED；未合併main、未切換正式流量。

## 交付檔案

本輪CI下載後已另存：
- `yichen-real-estate-deployment-v6.2.21.zip`：外層CI artifact，內含完整部署包ZIP、單檔HTML、PDF與browser smoke結果。
- `yichen-real-estate-v6.2.21.html`：可獨立部署的單檔HTML。
- 完整部署包內含 `index.html`、`index.multi-file.html`、`modules/`、`regulations/`、`docs/`、`versions/`。

以上是工作分支的可驗收交付，不是Cloudflare正式上線版本。

## 2026-11-27 後續追加執行

### 年度稅務法源
- 新增 `regulations/taxes/estate-gift-tax-2026.json`：115年度遺產稅、贈與稅免稅額、級距及扣除額，來源為財政部台財稅字第11404671540號公告。
- 新增 `regulations/taxes/individual-income-tax-2026.json`：115年度綜所稅免稅額、標準扣除額、薪資/身障扣除額、級距及退職所得參數，來源為財政部台財稅字第11404664070號公告。
- 程式目前仍有部分年度級距硬編碼；新增JSON是可追溯法源/參數記錄，不代表所有計算器已改為動態讀取年度參數。

### 法規安全
- 中央《都市更新建築容積獎勵辦法》來源範圍已校正為全文21條。
- 苗栗縣都市更新建築容積獎勵辦法第3條，依內政部115年1月12日台內國字第1140817216號函，已明確記錄為無效；城市JSON及schema新增失效條文紀錄，validator要求其維持auto_apply=false。
- 臺北、臺中、高雄地方都更法規審查紀錄補入中央母法修法後條次、地方獎勵上限及最新公告注意事項；22縣市仍0個完成參數驗證。

### 聯絡表單
- 新增Google Apps Script接收端原始碼 `backend/google-apps-script/Code.gs` 及設定/部署說明；支援Email、選配LINE Messaging API與Google試算表稽核。
- 新增4項靜態語法/契約測試，已納入Node回歸。
- 未取得收件Email、LINE推播Token/目的地及Apps Script專案授權；接收端尚未部署，實際送達仍BLOCKED。

### 視覺與列印
- Playwright已輸出8種視窗尺寸全頁截圖，Artifact ID 15163065656（Run 45916649735）。
- 實際PDF已人工檢視：房貸1頁A4、租金扣繳1頁A4、土地官方查核4頁A4、整站主內容6頁A4。
- 土地四頁PDF人工檢視發現內部頁標題編號與外層頁首不一致，已修正列印clone標題並新增精確斷言；最新Playwright執行結果待完成。
- 真實Android裝置操作及社群影片嵌入載入仍未驗收。

### Cloudflare
- 新增手動Cloudflare Pages workflow：Preview預設；Production限定main。
- 必須設定GitHub secrets `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 及repository variable `CLOUDFLARE_PAGES_PROJECT`。
- 尚未設定憑證或觸發部署，仍無正式部署ID/公開網址；未合併main。

### 最新法規資料驗證輸出
- 22個縣市、19項中央法規索引、9項稅務參數檔、9項獎勵資料；`safeToCalculate=false`。
- 當前 validator 顯示 `reviewRequired=37`；來源清單完整不代表已逐條驗證，37項仍需人工/法規覆核。
