# Cloudflare Pages正式部署驗收

狀態：BLOCKED

## 部署前
- 所有六大工作及本資料夾七個網站功能工作包均有證據通過。
- PR仍在工作分支驗收；核對部署來源分支、commit SHA、建置命令、輸出目錄、環境變數。
- 檢查資產、路徑、聯絡表單端點、安全標頭、404/重新整理路由。
- 建立可回復的前一個正式部署版本記錄。

## 正式部署後
- 記錄Cloudflare Pages專案名稱、正式網址、部署ID、commit SHA、完成時間。
- 從公開網址實際驗證桌面/平板/手機主要頁面。
- 執行稅務、房貸、土地坪效試算及單區/整份PDF輸出。
- 實際提交聯絡表單並確認收件端收到。
- 檢查瀏覽器Console、網路請求、資產載入、404、快取及HTTPS。
- 確認正式部署版本與已驗收commit完全一致。

## 通過標準
必須有Cloudflare部署成功記錄、公開網址可用、部署commit一致、公開站點回歸結果及實際收件證據。GitHub CI或ZIP建置成功不等於Cloudflare Pages部署成功。

## 變更限制
在正式驗收全部完成前，不合併main、不修改正式流量、不宣稱已上線。正式部署如需使用者帳號授權或DNS操作，僅在真正需要時要求最小必要授權。

## 目前測試證據與阻礙（2026-11-27）
- GitHub Actions已成功產生並驗證部署包；單檔HTML已內嵌圖片及稅務模組，多檔版本的modules路徑亦已修正。
- 最新部署包：Run 45916926817，Artifact ID 15162921431；已解壓檢查，包含modules、regulations、docs、versions及Apps Script後端原始碼。
- 目前沒有Cloudflare Pages正式部署ID、公開網址回歸或部署commit一致證據；未合併main、未切換正式流量。

## 已建立可執行的部署路徑（2026-11-27）

新增 GitHub Actions：`.github/workflows/cloudflare-pages-deploy.yml`。

- 手動觸發，預設只部署 Preview，不會自動部署正式環境。
- Preview 從目前選定的工作分支建置並以該分支名稱部署。
- Production 僅允許從 `main` 執行，並使用 GitHub `production` Environment（若設定保護規則可要求人工核准）。
- 部署前重新執行 `scripts/build-deployment.mjs`，部署 `dist/deployment-package`。
- 需要 GitHub Actions secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`；以及 repository variable：`CLOUDFLARE_PAGES_PROJECT`。
- 缺少任何必要設定時，workflow 會明確失敗，不會假裝部署成功。

**目前狀態仍為 BLOCKED**：尚未取得 Cloudflare 專案名稱及上述憑證，尚未實際觸發部署，沒有部署 ID 或公開網址。新增 workflow 只是把可重現部署路徑準備好，不代表 Cloudflare 已上線。


## 部署自動化新增（2026-11-27）
- 已新增 `.github/workflows/cloudflare-pages-deploy.yml`，手動觸發，預設Preview；Production只允許從main部署。
- 部署前會重建部署包，檢查Cloudflare API Token、Account ID及Pages project name；缺少設定會明確失敗。
- 仍未取得上述Secrets/Variable，也未實際部署；正式部署狀態保持BLOCKED。
