# 回復程序

1. 正式網站維持目前 production deployment，不因本分支提交而變更。
2. 本次所有變更只在 `work/city-parameter-files-2026-11-27` 分支。
3. 若資料結構或 loader 驗證失敗，回到本分支前一個已知通過 CI 的 commit；不得直接覆寫 `main`。
4. 若未來整合到正式頁面，先保留部署前的 production commit SHA、部署 ID 及 ZIP checksum，再用 Cloudflare Pages 前一個成功部署執行 rollback。
5. 未取得明確部署授權，不可把本分支合併至 production branch 或執行正式部署。
