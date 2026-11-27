# 網站原始功能補充驗收紀錄（2026-11-27）

## 本輪新增分類檔案
新增 `verification/site-acceptance/`：
- README.md：七項網站功能總表與狀態定義
- tax-print.md：14項稅務單項A4直式列印
- mortgage-print.md：房貸獨立列印、六項結果與前12期明細
- land-print.md：基地法規/選填官方查核/土地成本/試算結果四頁
- full-site-print.md：整份網站指定區塊與條件式列印
- responsive-visual.md：桌面/平板/手機多尺寸視覺驗收
- contact-delivery.md：聯絡表單實際收件端證據
- cloudflare-deployment.md：Cloudflare Pages正式部署驗收
- integration-gate.md：七項功能與六大工作統一整合閘門

## 可追溯的瀏覽器CI結果
提交 `712084d86f8366cb076ec4d0248fb754b86763e0`：
- Independent verification layers Run `45903848590`：overall FAILURE
- production-regression：SUCCESS
- independent-oracles：SUCCESS
- browser-functional-tests：FAILURE
- Playwright 6項通過、1項失敗
- 唯一失敗：`#tax-menu button` 預期14個，實際12個。故目前仍缺租金扣繳及執行業務所得兩個實際稅務選項/工具，不能將稅務完整性標示PASS。
- 其餘通過項僅證明基本載入、房貸基本送出、土地坪效基本試算、稅務選單存在、390px寬度無水平溢出、瀏覽器能產生A4 PDF；不證明指定的列印內容/分頁、平板及完整視覺通過。

同提交其他工作流：
- Build and verify deployment package Run `45903848367`：SUCCESS（僅建置/封裝工作流）
- Regulatory data validation Run `45903848446`：SUCCESS（不代表22縣市逐條法規已完成）

## 七項網站功能現況
| 功能 | 現況 | 未通過/缺少的證據 |
|---|---|---|
| 稅務單項列印 | NOT_STARTED | 14項逐項PDF內容、A4方向、只印單項未驗收 |
| 房貸列印 | NOT_STARTED | 六項結果、前12期、只印房貸、A4直式未驗收 |
| 土地坪效四頁列印 | NOT_STARTED | 四頁分頁、選填頁條件式省略、順序及不混印未驗收 |
| 整份網站列印 | NOT_STARTED | 指定區塊分頁與所有試算組合未驗收 |
| RWD視覺 | IN_PROGRESS | 僅390px水平溢出自動測試通過；桌面/平板/多尺寸人工視覺未驗收 |
| 聯絡表單實際送達 | NOT_STARTED | 尚無收件端實際收到的證據 |
| Cloudflare Pages正式部署 | NOT_STARTED | 尚無正式部署ID、公開網址回歸及commit一致證據 |

## 工作限制
- PR維持工作分支，不合併main。
- 不把CI封裝成功說成Cloudflare部署成功。
- 不以文件規格完成代替實際程式修正及瀏覽器驗收。
- 七項工作包全部PASS及六大工作全部通過之前，不啟動正式部署。
