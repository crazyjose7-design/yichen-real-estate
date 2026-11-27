# 億辰聯絡表單 Apps Script 接收端

這是可部署的接收端替代實作。**目前只建立程式碼，尚未部署到 Google Apps Script，也沒有實際寄信或 LINE 送達證據。** 不要把它當成已經接通的後端。

## 1. 建立 Apps Script 專案

1. 使用具備權限的 Google 帳號開啟 Google Apps Script，建立新的獨立專案。
2. 將 `Code.gs` 全文貼入專案。
3. 在「專案設定 → 指令碼屬性」設定下列屬性。

| 屬性 | 必要性 | 說明 |
|---|---|---|
| `RECIPIENT_EMAIL` | 必填 | 真正接收億辰網站諮詢的電子郵件地址 |
| `SPREADSHEET_ID` | 選填 | Google 試算表 ID；會建立/使用 `ContactLeads` 工作表留存紀錄 |
| `LINE_CHANNEL_ACCESS_TOKEN` | 選填 | LINE Messaging API Channel access token |
| `LINE_TO_ID` | 選填 | LINE 官方帳號可推播的 userId 或 groupId |

**注意：網站訪客填寫的 LINE ID 不是 LINE Messaging API 的 userId。** 不可把訪客輸入的 LINE ID 當作推播目的地。LINE 通知必須由億辰自己的官方帳號，推送到已合法取得的 userId/groupId。

## 2. 授權與部署

1. 在 Apps Script 編輯器執行 `testConfiguration`，依 Google 提示授權。
2. 點選「部署 → 新增部署 → 網頁應用程式」。
3. 執行身分選「我」，存取權依公開官網需求選擇可匿名存取；若 Google Workspace 管理政策禁止匿名存取，須先由管理員處理。
4. 部署後複製以 `/exec` 結尾的 Web App URL。
5. 將新 URL 填入網站 `YICHEN_FORM_ENDPOINT`。目前網站仍指向原有 Apps Script URL；未取得新部署 URL 前，不可自行替換。

## 3. 真實送達驗收

使用唯一測試碼（例如 `YICHEN-E2E-20261127-203000`）提交一次測試資料，然後逐項確認：

- 收件信箱收到主旨含「億辰官網諮詢」的郵件，信件含唯一案件編號。
- 若已設定試算表，`ContactLeads` 有相同案件編號與欄位。
- Apps Script「執行項目」及 Cloud Logging 有 `CONTACT_ACCEPTED` 紀錄，且 `emailSent=true`。
- 若已設定 LINE，Apps Script 回傳/紀錄 `lineStatus=sent`，並在指定官方帳號對話/群組實際收到訊息。

只有郵件、試算表/執行紀錄與 LINE（若有啟用）都符合預期，才可把相應渠道標示 PASS。瀏覽器的 `no-cors` fetch 無法讀取 Apps Script 回應，因此網頁顯示「請求已送出」不等於後端已成功送達。

## 4. 資料安全

- 不要把收件 Email、LINE token 或試算表 ID 寫進前端 HTML 或 Git。
- Script Properties 只由 Apps Script 管理者設定；不要把 Token 貼到聊天或公開 issue。
- 試算表應限制存取權，僅開放必要承辦人；不要設為公開。
- 測試時使用虛構聯絡資料，不要使用真實客戶個資。
- 本程式不會把訪客提供的 LINE ID 當成通知收件人。

## 5. 尚待外部操作

目前未取得億辰指定收件 Email、LINE 官方帳號推播 Token/目的地 ID、Google Apps Script 專案存取權，因此沒有部署 URL，也無法代替帳號持有人完成授權及真實收件測試。
