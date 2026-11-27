# 工程方法與替代路徑研究（2026-11-27）

## 目的
針對億辰房產網站目前卡關項目，採用可重現、可量測、可追溯的工程方法。這份文件是研究決策紀錄，不代表下列功能已經實作或通過。

## 一、已確認的根因與風險
1. 稅務工具數量與版本宣稱不一致：瀏覽器CI實際讀到12個選項，原要求14項；租金扣繳與執行業務所得尚未補齊。
2. 既有瀏覽器測試偏 smoke test：PDF只確認能產生、手機只檢查單一390px水平溢出；不能證明指定內容、分頁、版面與跨尺寸操作。
3. 列印驗收缺乏輸出物檢查：沒有逐頁PDF頁數/文字/尺寸/截圖證據，無法確認只印指定區塊。
4. 表單缺少收件端閉環證據：前端成功訊息或HTTP成功不等於收件端真正收到資料。
5. CI綠燈容易被誤讀：不同workflow的建置成功、獨立oracle成功，不等於整個網站驗收成功。
6. 正式部署尚無部署記錄與公開站點證據；不能以GitHub build或部署包產生取代Cloudflare Pages正式部署驗收。

## 二、業界工具與做法研究

### A. 瀏覽器與功能測試
- Playwright Test：以角色/標籤等穩定定位方式測試；CI失敗保留trace、截圖、網路請求與HTML報告。
- Trace Viewer：檢視每一步操作、DOM快照、畫面前後狀態與網路請求，作為失敗診斷的第一手證據。
- 視覺回歸：toHaveScreenshot()建立基準圖，固定CI作業系統、瀏覽器版本、字型與viewport；先人工核准基準圖，不能自動接受新基準。
- RWD：以viewport/deviceScaleFactor矩陣執行，對每個核心頁面截全頁及元件圖；同時檢查水平溢出、元素邊界、可見性、可點擊及鍵盤操作。
- 輔助性：在核心頁面加axe-core掃描，檢查標籤、對比、可存取名稱等常見問題；自動掃描不能代替鍵盤與人工視覺檢查。

### B. PDF與列印
- 將列印文件與畫面DOM分離：建立獨立、明確的列印根節點/列印模板，只把當次已完成試算的資料映射進去。不要依賴全站DOM大量hide/show，避免CSS遺漏造成其他區塊混印。
- 使用獨立列印模式/路由或可測試的列印容器，資料由單一結果快照提供；切換工具時重新產生文件，不沿用前一次結果。
- CSS使用@media print、@page { size: A4 portrait; }、break-before/after: page、break-inside: avoid，並明確設定背景色列印；避免只靠大量transform: scale()壓縮內容。
- Playwright Chromium page.pdf()可設定format: A4、printBackground: true、preferCSSPageSize: true，並以emulateMedia({media:'print'})檢查列印樣式。
- PDF驗收要讀取產物：使用pdfinfo驗證頁數與頁面尺寸、pdftotext驗證每頁內容及不混印、pdftoppm輸出逐頁圖像供視覺比對。CI保存PDF、文字抽取、逐頁PNG及Playwright trace作為artifacts。
- 對四頁土地坪效列印，先建立明確頁面資料模型：基地法規、條件式官方查核、土地成本、試算結果。官方查核空值時直接不建立該頁，而不是建立空白頁後隱藏文字。

### C. 聯絡表單與送達
- 建立端到端測試識別碼（例如E2E-日期-短碼），從瀏覽器送出後一路追蹤到服務端紀錄及收件端。
- 若沿用Google Apps Script：檢查部署版本、Web App存取權限、doPost(e)解析、回應碼/回應本文、執行紀錄與Cloud Logging；需用收件端實際郵件或資料列證明送達。Apps Script執行記錄是短期診斷，正式多使用者追蹤應考慮Cloud Logging。
- 若改採Cloudflare Pages Functions：以服務端端點接收及驗證資料；敏感憑證放Cloudflare Secrets，不放前端或Git；寄信透過經確認的郵件服務API，並記錄供應商訊息ID/狀態。加上欄位驗證、速率限制、垃圾訊息防護與失敗回應。
- 不要在沒有查清目前表單收件目的地、帳號權限及寄信服務的情況下，直接替換現有端點。

### D. CI與部署
- GitHub Actions採工作分流：公式oracle、法規資料驗證、Node回歸、Playwright功能、列印PDF檢查、RWD視覺回歸、部署包完整性分開執行。
- 使用測試矩陣覆蓋瀏覽器/viewport/案例；artifact保存PDF、截圖、trace、測試報告及部署包SHA-256。
- CI必須有單一acceptance-gate job，只有所有必要工作成功才通過；允許非阻斷性資訊工作另列，不可把某些job成功宣稱全綠。
- Cloudflare Pages優先使用Git整合的Preview Deployments驗收工作分支；確認預覽網址、commit SHA、build output及實際頁面後才進行production流程。設定production branch control，工作分支只能產生預覽，不得碰正式環境。
- Cloudflare Pages支援預覽部署及production rollback；正式部署前記錄現行production deployment，出問題可回滾。正式部署必須檢查公開URL及其commit，不以Actions成功取代。

## 三、工具路徑比較與選擇
| 問題 | 首選路徑 | 失敗時替代路徑 | 不採用的捷徑 |
|---|---|---|---|
| 功能驗收 | Playwright Test + trace | 單一流程以獨立HTML fixture重現，再回到正式頁 | 只看CI綠燈 |
| RWD | Playwright viewport矩陣 + screenshot baseline | 真機瀏覽器手動截圖與逐項檢查 | 只測一個手機寬度 |
| 列印 | 專用列印模板 + Chromium PDF + PDF解析 | 先輸出獨立HTML列印文件，再由瀏覽器列印 | 只斷言PDF檔案存在 |
| PDF頁面檢查 | pdfinfo + pdftotext + pdftoppm | Node PDF parser或人工逐頁檢查 | 只檢查檔案大小 |
| 表單送達 | 唯一測試碼 + 收件端證據 + 服務端紀錄 | 隔離測試收件匣/測試服務 | 只相信前端成功訊息 |
| 部署 | Cloudflare Pages Preview → 驗收 → Production | Wrangler CLI由受控CI部署（需先確認專案型態） | 未驗收直接推main |

## 四、建議執行順序（由低耦合到高耦合）
1. 盤點目前網站HTML、JavaScript、CSS、表單端點及Cloudflare專案設定；建立功能到DOM/函式/資料流的對照表。
2. 修正14項稅務缺口及獨立公式測試；同時保留官方依據與適用條件。
3. 建立專用列印文件模型與共用PDF檢查工具；先完成稅務單項、房貸、土地坪效，再做整份網站。
4. 將Playwright由smoke test升級成實際互動、PDF解析及多尺寸視覺測試。
5. 表單依目前真實架構選擇修復或遷移，完成收件端E2E證明。
6. 所有功能獨立PASS後，跑整合閘門及乾淨環境部署包驗證。
7. 只在已授權且正式驗收通過後部署Cloudflare production；保留rollback方案。

## 五、執行鐵律
- 每一項工作先寫驗收條件與測試資料，再修改程式。
- 先做可獨立測試的小模組，最後才整合。
- 每次失敗記錄錯誤、根因、嘗試過的方法；若同一路徑重複失敗，必須換工具/架構/驗證方法。
- 不降低測試門檻以追求綠燈。
- 不宣稱未取得的證據；不將研究文件當成實作成果。
- 不修改main、不提前部署；需要帳號/收件端/秘密值時，使用最小必要授權且絕不提交機密。
- 每個PASS都必須連到commit、測試案例、執行結果與產物證據。