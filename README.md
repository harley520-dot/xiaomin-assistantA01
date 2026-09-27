# 小敏助教 4092A01｜網路電腦版

這是可直接部署到 GitHub Pages 的純靜態網站，不需要伺服器程式、OpenAI API Key 或額外 API 費用。網站只在使用者的瀏覽器中分析所選音訊的音量，用來控制小敏助教的嘴型與表情。

## 建議環境

- Windows 10／11
- 最新版 Google Chrome 或 Microsoft Edge
- HTTPS 網址（GitHub Pages 會提供）
- 建議將 ChatGPT Voice 開在另一個 Chrome／Edge 分頁

本版定義為桌面瀏覽器版本；手機瀏覽器的分頁／系統音訊擷取能力不在 4092A01 的支援範圍內。

## 發布到 GitHub Pages

1. 在 GitHub 建立 Public repository，例如 `xiaomin-assistant`。
2. 將這個資料夾內的所有檔案與 `assets` 資料夾上傳到 repository 根目錄。
3. 開啟 repository 的 `Settings` → `Pages`。
4. 在 `Build and deployment` 中選擇 `Deploy from a branch`。
5. Branch 選 `main`，Folder 選 `/ (root)`，然後儲存。
6. 等待 GitHub 完成發布，網址通常為：

   `https://你的帳號.github.io/xiaomin-assistant/`

7. 確認 Pages 設定中的 `Enforce HTTPS` 已啟用。

## 使用方式

1. 用 Chrome 或 Edge 開啟已發布的小敏助教網站。
2. 在另一個瀏覽器分頁開啟 ChatGPT Voice。
3. 回到小敏助教，按「擷取電腦聲音」。
4. 在分享視窗選擇 ChatGPT 分頁，並勾選「分享分頁音訊」。
5. 回到 ChatGPT Voice 對話。小敏助教會依聲音動嘴並呈現表情。

如果使用 Windows ChatGPT App，可嘗試選擇整個螢幕並開啟「分享系統音訊」；瀏覽器或電腦未提供音訊時，可改用「麥克風感應」。

## 重要限制

- 基於瀏覽器安全規則，每次進入網站都必須由使用者按下擷取按鈕並重新選擇音訊來源，網站不能自動取得權限。
- 此網站只分析音量，不會讀取 ChatGPT 的對話內容，也不會產生自動字幕。
- 課程名稱保存在目前瀏覽器的 local storage，不會上傳到伺服器。
- 擷取到的聲音只在目前瀏覽器中分析，不會由本網站上傳或保存。

## GitHub Pages 根目錄內容

```text
index.html
styles.css
app.js
manifest.webmanifest
.nojekyll
README.md
assets/
  chihlee-logo.png
```
