# 稅務模組盤點來源基準

盤點日期：2026-11-27

## GitHub main 原始碼
- Repository：`crazyjose7-design/yichen-real-estate`
- Branch：`main`
- Commit：`7e92ae22992b9b2536c0c53605c1a7b9ec96f9da`
- `index.html` blob：`c19ea232dad177f7aa2545a3ebe5300935622d2b`
- GitHub tree 中檔案大小：4,224,247 bytes
- 原始碼內版本標記：V6.2.19
- 12個稅務模組名稱及 key 以此 main 原始碼靜態盤點。

## 與先前部署成品的差異
- 先前測試紀錄指向部署來源 commit：`6561679f75f0ddc564f2c22cc72a84fdd5961d31`
- 該 commit 的 `index.html` blob：`e8306989632c07e52cbf36a3ced1a7848b642ce0`
- 該檔案大小：4,206,049 bytes；原始碼內含 V6.2.13 標記。
- main 與該部署來源的 index.html blob SHA 不同，不可視為同一份程式。
- 本次盤點以目前 GitHub main 的 V6.2.19 為程式映射基準；部署中實際提供給訪客的版本仍須另以正式網站與部署紀錄驗證。

## 部署工作流程
目前 repository 的 `.github/workflows/static.yml` 設定為 main 分支 push 後執行 GitHub Pages 部署，部署路徑為整個 repository。此工作流程本身不能證明 Cloudflare Pages 的外部部署狀態。

## 限制
這是版本/來源盤點，不是公式正確性或實際部署驗收。未完成法源逐條審查、參數比對及回歸測試前，不得宣稱12項稅務計算正確。
