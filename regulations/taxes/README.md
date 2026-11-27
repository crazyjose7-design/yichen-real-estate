# 稅目參數資料

每個稅目獨立維護，與中央法規原文及計算程式分離。已建立的初始檔案：
- `land-value-tax.json`：地價稅
- `land-value-increment-tax.json`：土地增值稅
- `house-land-transaction-income-tax.json`：房地合一所得稅
- `deed-tax.json`：契稅
- `house-tax.json`：房屋稅

目前均為 `unverified`，參數陣列為空，`auto_apply=false`。中央法規來源已定位，但尚未完成每一計算參數、身分條件、有效期間、地方差別稅率/自治規定及例外條件的逐項覆核。不得直接沿用網站舊程式中的固定數字，當作已驗證法規值。

每個參數至少須記錄：法源、條次、主管機關、適用對象、交易/課稅時點、有效起迄日、單位、計算規則、官方來源 URL、查詢日期、覆核者及測試案例。
