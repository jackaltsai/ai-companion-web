# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

「心辰」是一個 AI 虛擬男友陪伴服務的行銷落地頁與法務子頁。這是一份**高保真設計原型**，並非正式上線程式碼。其目的是在目標框架（建議 Next.js/React）中重建，並像素級還原視覺與互動設計。

## 執行原型

無需建置步驟，直接用瀏覽器開啟 `心辰 Landing.html` 即可。所有 JSX 均透過 Babel CDN 在瀏覽器內即時轉譯；本專案沒有 `package.json`、npm 或 linting 工具鏈。

## 架構

### 入口點與模組結構
- `心辰 Landing.html` — 主入口；透過 CDN 載入 React + Babel，以 `text/babel` 方式引入所有 `.jsx`/`.js` 檔案
- `app.jsx` — 根元件；管理全域狀態（`selId`、`messages`、`input`、`typing`、`toast`）、主題切換，並渲染所有區塊
- `sections.jsx` — 所有頁面區塊：Nav、Hero、Features、PersonaSection、ChatSection、PricingSection、FAQ、FinalCTA、Footer
- `chat.jsx` — `ChatDemo` 元件；處理訊息流、打字指示、建議話題膠囊，以及 LLM／腳本回覆路由
- `personas.js` — 4 位 AI 人設資料（沉／言／夜／嶼）：姓名、特質、引言、腳本回覆、系統提示詞
- `styles.css` — 所有樣式；以 CSS 自訂屬性在 `:root`/`[data-theme]` 上定義 3 套主題 token（玫瑰／金／靛）

### 狀態流
`selId`（當前人設 ID）存於 `App` 並向下傳遞；切換人設會同步更新：Hero 人物插畫／名牌／浮動氣泡、PersonaSection 詳細資訊、ChatSection AI 身份、FinalCTA 文案。聊天狀態（`messages`、`input`、`typing`、`used`）存於 `ChatSection`/`ChatDemo`。

### 聊天回覆路由
`chat.jsx` 會檢查 `window.claude.complete(systemPrompt, userMessage)` — 若存在則使用即時 LLM 回覆，否則退回至 `personas.js` 中的腳本回覆。

### 主題
3 套主題完全以 CSS 變數定義：`midnight-rose`（預設）、`gold-luxury`、`indigo-neon`。透過 `<html>` 上的 `data-theme` 屬性切換。微調面板（`tweaks-panel.jsx`）僅供設計探索使用，正式版不需要。

### 子頁
`pages/` 包含 4 個獨立 HTML 子頁（terms、privacy、refund、contact），各有共用版面與 sticky 目錄導覽，無共用元件架構，每頁均為自包含 HTML。

## 在正式框架中重建

遷移至 Next.js 或其他框架時：
- 將 `text/babel` CDN 模式改為正規模組 import 與打包工具
- 將 `window.claude.complete` 替換為真實的 Claude API 路由
- 直接沿用 `personas.js` 資料與 `styles.css` token 架構
- 將 Google Fonts `@import` 改為 `next/font` 或對應方案
- 微調面板為原型專用，正式版省略
- 所有像素級規格（尺寸、圓角、動畫、斷點）詳見 `README.md` 與 `styles.css`
