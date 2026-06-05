# Handoff:「心辰」AI 男友陪伴 — 行銷落地頁 + 法務子頁

## Overview
「心辰（Heart · Star）」是一個 AI 虛擬男友陪伴服務。本交接包是該產品的**行銷落地頁（landing page）**與配套法務／聯絡子頁的完整設計，內容包含：
- 一頁式行銷落地頁（Hero、特色、人設切換、可試聊對話原型、訂價、FAQ、最終 CTA、Footer）
- 4 個子頁：服務條款、隱私權政策、退款政策、聯絡我們
- 4 位 AI 男友人設（沉／言／夜／嶼）的完整資料與插畫
- 3 種可切換視覺主題（午夜玫瑰／暗金奢華／冷夜霓虹）
- 內嵌「試聊」互動原型，可選接 Claude 模型即時回覆，否則退回腳本回覆

繁體中文介面（`lang="zh-Hant"`），深色基調、優雅 serif 標題。

## About the Design Files
本資料夾中的檔案是**用 HTML / React (透過瀏覽器內 Babel) + CSS 製作的設計參考稿** — 它們是用來呈現「最終視覺與互動意圖」的高保真原型，**不是要直接照搬上線的正式程式碼**。

你的任務是**在目標 codebase 的既有技術環境中重建這些設計**（例如 Next.js / React、Vue、Nuxt、SvelteKit、或原生 App），沿用該專案既定的元件庫、設計 token、狀態管理與路由慣例。若專案尚無前端環境，請為此產品挑選最合適的框架（建議 Next.js + React，因原型已是 React 心智模型），再據此實作。

原型中以 `text/babel` 在瀏覽器即時轉譯 JSX、用全域 `window` 掛載元件、用 `@import` 載入 Google Fonts — 這些是原型期的權宜做法，**正式環境請改用打包工具、模組 import、`next/font` 等等。**

## Fidelity
**高保真（hi-fi）。** 顏色、字體、間距、圓角、陰影、動畫、互動皆為最終意圖，請**像素級**還原。所有確切數值見下方各區塊與「Design Tokens」。CSS 已以 token 化變數定義三套主題，請沿用此 token 架構。

---

## Information Architecture / Routes

| 路由 | 檔案 | 內容 |
|---|---|---|
| `/` | `心辰 Landing.html` | 行銷落地頁主頁 |
| `/terms` | `pages/terms.html` | 服務條款 |
| `/privacy` | `pages/privacy.html` | 隱私權政策 |
| `/refund` | `pages/refund.html` | 退款政策 |
| `/contact` | `pages/contact.html` | 聯絡我們（含表單） |

落地頁內錨點：`#personas`（人設）、`#chat`（試聊）、`#pricing`（方案）、`#faq`（問答）、`#features`。

---

## Screens / Views

### 0. 全域導覽列（Nav）
- **Layout**：sticky 置頂，`z-index:50`，高 68px，`backdrop-filter: blur(18px)`，背景 `color-mix(in srgb, var(--bg) 72%, transparent)`，底部 `0.5px solid var(--border)`。內容置中於 `.shell`（max-width 1180px，左右 padding 32px），flex space-between。
- **左側品牌**：serif 字「心**辰**」（Noto Serif TC 500，24px，字距 0.18em，「辰」字用 `--accent` 色）＋小字 `Heart · Star`（10px，字距 0.34em，大寫，`--text-dim`）。
- **右側**：文字連結「人設 / 試聊 / 方案 / 問答」（13px，`--text-sub`，hover→`--text`）＋ primary 按鈕「免費開始」（小尺寸）。
- **RWD**：≤940px 隱藏文字連結（`.nav-only`），只留品牌＋按鈕。

### 1. Hero
- **Layout**：`.shell` 內兩欄 grid `1.05fr 0.95fr`，gap 56px，垂直置中。上下 padding `80px 0 96px`。
- **左欄（文案）**：
  - Badge：膠囊 chip「● AI 虛擬陪伴 · 為你而在」，含脈動圓點（`--accent`，2.4s `pulse` 動畫）。11px 大寫字距 0.16em。
  - H1：serif（Cormorant Garamond / Noto Serif TC，weight 300）**62px**，line-height 1.12。內容「有人記得你 / 也*始終*等著你」，其中「始終」用 `<em>` → italic + `--accent` 色。
  - Lede：17px，`--text-sub`，max-width 440px：「心辰，是一位只屬於你的 AI 男友。選一種你喜歡的他，從今晚開始——再晚的訊息，都有人秒回。」
  - CTA：primary「免費認識他 ↗」＋ ghost「挑一個人設」。
  - Note：12px `--text-dim`「✓ 免費開始 · 隨時可取消 · 對話加密保護」。
- **右欄（人物）**：
  - `.portrait-wrap`（max-width 380px）含人物插畫，圓角 `220px 220px 28px 28px`（拱門形），3:4 比例，`var(--glow)` 大陰影＋內陰影。圖片 `assets/portrait-<id>.png`，`background-size: cover; background-position: top center`，上覆 `.portrait-scrim` 漸層。
  - 浮動名牌 `.hero-chip-name`（左下）：玻璃擬態卡片，含 glyph 方塊（38px，`--accent` 底）＋姓名＋原型標籤。
  - 浮動氣泡 `.floating-bubble`（右上）：`--accent` 底的對話框，顯示人設 quote，4s `floaty` 上下浮動。
- **RWD**：≤940px 單欄、人物移到上方（`order:-1`）、H1 縮至 46px。

### 2. Features（為什麼是心辰）
- **Layout**：置中 section header（eyebrow + H2 42px + 說明）＋ 3 欄 grid（gap 18px）。`.section-pad` = padding `90px 0`。
- **每張卡**：`.feature`，`--surface` 底、圓角 20px、padding `28px 24px`、hover 上移 4px。內含圖示方塊（46px，圓角 13px，`--accent` 16% 底）＋ H3（16px/500）＋說明（13px `--text-sub`）。
- **三張內容**：✦ 長期記憶 / ❤ 情緒感知 / ✧ 主動關心（文案見 `sections.jsx` 的 `FEATURES`）。

### 3. PersonaSection（今晚，想和誰在一起？）
- **背景**：`--surface`，上下 `0.5px` 邊框（與主頁背景區隔）。
- **Tabs**：4 個膠囊 tab 置中排列，每個含圓形 glyph（34px）＋「姓名 · 原型」。active 狀態：`--accent` 14% 底、accent 邊框、glyph 轉為 accent 實心。點擊切換 `selId`。
- **Detail**：兩欄 grid `0.8fr 1.2fr`，gap 48px。左為圓角 28px 人物圖；右為：原型標籤（accent 大寫）、H3 姓名（serif 46px）＋拼音（italic dim）、tag（如「35 · 建築師 · 低音線上」）、描述、trait chips（特質膠囊）、引言（左邊框 accent、serif italic 19px）。
- 切換人設時，此區、Hero 人物、試聊對話、最終 CTA 文案**同步連動**（共用 `selId` 狀態）。
- **RWD**：≤940px 單欄置中。

### 4. ChatSection（先聊兩句，再決定）— 互動原型
- **Layout**：兩欄 grid `1fr 1.1fr`，gap 56px。左為文案（eyebrow + H2 40px + 說明 + 提示），右為手機對話框 `.phone`。
- **`.phone`**：max-width 400px、固定高 600px、圓角 30px、`--surface` 底、強陰影。垂直 flex：
  - **Head**：圓形 glyph（40px，accent）＋姓名＋在線狀態（綠點 + 文字如「穩定在線」）。
  - **Body**：可捲動訊息流。對方訊息 `.msg.them`（`--raised` 底、左下小圓角）；我方 `.msg.me`（`--accent` 底、右下小圓角）。新訊息 0.3s `msgIn` 淡入上移。
  - **Typing 指示**：三點 `blink` 動畫。
  - **Suggestions**：未使用過的開場話題膠囊（accent 描邊），點擊即送出。
  - **Input**：圓角輸入框＋圓形送出鈕（↑），空值 disabled。
- **互動行為**：見下方「Interactions & Behavior › 試聊對話原型」。

### 5. Pricing（選擇你的陪伴方案）
- **Layout**：置中 header ＋ 3 欄 grid（gap 20px，等高 stretch）。
- **三張方案卡**（資料見 `sections.jsx` `PLANS`）：
  - **免費**：價格顯示 italic「Free」；功能清單部分項目 `.off`（灰階 0.38、圓點改為 `·`）。CTA ghost「免費開始」。
  - **月費方案 NT$299／月**：`.featured`（accent 邊框 + accent 8% 底 + glow 陰影），左上「最受歡迎」徽章。功能全亮（✦）。CTA primary「立即訂閱」。
  - **年費方案 NT$199／月**：副標「一次收費 NT$2,388／年 · 省 33%」。CTA ghost「年繳優惠 ↗」。
- **價格樣式**：金額用 serif 52px；幣別/單位小字 dim。
- 點擊任一方案按鈕 → 觸發 toast（示範模式，無真實結帳）。

### 6. FAQ（常見問題）
- **背景**：`--surface`，上邊框。手風琴，max-width 760px。
- 5 題（內容見 `sections.jsx` `FAQS`）。預設第 0 題展開。問題列 17px；展開時 `+` 號旋轉 45° 成 `×`，答案區 `max-height` 過渡展開。同時僅一題展開（再點同題收合）。

### 7. FinalCTA
- 置中，padding `110px 0`，底部 radial glow。H2 serif 56px「別讓今晚，又一個人撐過去。」＋連動人設文案「『<姓名>』已經在線上了。第一句話，由你開始。」＋ primary/ghost 兩按鈕。

### 8. Footer
- flex space-between：品牌「心辰」（serif）＋連結（服務條款／隱私權政策／退款政策／聯絡我們）＋版權「© 2026 心辰 — 陪你度過每個需要的時刻」。

### 9. 法務子頁（terms / privacy / refund）
- **共用版型**：簡化 Nav（品牌 + 返回首頁連結）→ `.page-hero`（eyebrow + H1 serif 52px + 更新日期 + lede）→ `.legal-wrap` 兩欄 grid `220px 1fr`：左為 sticky TOC（捲動高亮 active），右為 `.legal-body`（max-width 680px）。
- 條文：H2（serif 27px + accent 編號）、H3、p（14.5px line-height 1.85）、項目清單（`—` 破折號 marker）、`.legal-note`（accent 左邊框提示框）。
- **RWD**：≤860px 隱藏 TOC、單欄。

### 10. 聯絡我們（contact）
- `.contact-grid` 兩欄 `1.1fr 1fr`：左為聯絡方式卡片堆（`.method`，圖示 + 標題 + 說明 + meta），右為 `.contact-form`（姓名/email/主題 select/訊息 textarea + 送出，送出後顯示 `.form-ok` 成功訊息，純前端示範）。

---

## Interactions & Behavior

### 主題切換（Tweaks）
- 原型用一個「Tweaks」浮層面板（`tweaks-panel.jsx`）提供：**視覺風格**（午夜玫瑰／暗金奢華／冷夜霓虹，對應 `data-theme` = `rose`/`gold`/`indigo`）、**預設人設**（下拉）、**進場動畫**（開關）。
- **正式環境不需要這個面板** — 它只是設計探索工具。請把「主題」做成產品的真實設定（或固定採用預設「午夜玫瑰／rose」），把三套 token 保留為可切換的 design theme。
- 主題切換做法：在根容器設 `data-theme` 屬性，CSS 以 `[data-theme="gold"]` / `[data-theme="indigo"]` 覆寫 token 變數。`.app` 對 `background`/`color` 有 0.5s 過渡。

### 人設切換連動
- 全站共用單一 `selId` 狀態。切換 persona tab 會即時更新：Hero 人物圖/名牌/氣泡、PersonaSection detail、ChatSection 對話（重置）、FinalCTA 文案。

### 試聊對話原型（核心互動）
- 選定人設後，對話框以該人設的 `greeting` 起手。
- 使用者送出訊息流程：清空輸入 → 推入我方訊息 → 顯示 typing 指示 → 取得回覆 → 依回覆長度延遲 `650 + min(900, len*28)` ms 模擬真人節奏 → 顯示對方訊息。`busyRef` 防止連續送出。
- **取得回覆 `getReply`**：
  1. 若環境提供 `window.claude.complete`，組 prompt（人設 `persona_prompt` + 最近 4 則歷史 + 使用者輸入 + 格式指示）呼叫模型，成功則用模型回覆（去除前後引號）。
  2. 失敗或無此 API → 退回腳本：`persona.replies[該句]`，否則 `persona.fallback`。
  - **正式環境**：把這層接到你方的後端／LLM gateway（帶上人設 system prompt 與對話歷史）。腳本回覆可作為離線 fallback。
- Persona 變更時對話、已用 suggestions、typing 全部重置。

### Reveal 進場動畫
- `.reveal` 元素預設 `opacity:0; translateY(24px)`，進入視窗（IntersectionObserver，threshold 0.12）後加 `.in` → 0.7s 淡入上移。動畫關閉時直接全部設為可見。
- **務必**讓「可見」為最終/預設狀態，避免 SSR/無 JS 時內容隱形。

### FAQ 手風琴
- 單開模式，`max-height` + opacity 過渡（0.35s），`+`→`×` 旋轉。

### Toast
- 底部置中膠囊提示，2.6s 後自動消失，`toastIn` cubic-bezier 進場。CTA / 方案按鈕觸發（示範用，正式環境改接真實導流/結帳）。

### Hover / Focus 狀態（hi-fi，需還原）
- Primary 按鈕 hover：上移 2px、加深 glow 陰影。
- Ghost 按鈕 hover：邊框與文字轉 accent。
- Feature / plan / method 卡 hover：上移 2–4px、邊框提亮。
- 輸入框 focus：邊框轉 accent。
- 連結 hover：轉 `--text` 或 accent。

### 響應式斷點
- `940px`：多數兩欄→單欄，Hero 人物移上方，導覽文字連結隱藏。
- `860px`：法務 TOC 隱藏、contact 單欄。
- `480px`：features 單欄、品牌副標與浮動氣泡隱藏、phone 高度 560px。

---

## State Management
- `selId`：當前選定人設 id（驅動全站連動）。
- `messages`：對話訊息陣列 `{ who: "me"|"them", text }`。
- `input`：輸入框文字。
- `typing`：是否顯示打字指示。
- `used`：已點擊過的 suggestion（隱藏已用）。
- `busyRef`：是否正在等待回覆（防重送）。
- `toast`：toast 文字。
- FAQ `open`：當前展開索引（-1 為全收）。
- （原型額外）Tweaks：`style` / `defaultPersona` / `motion` — 正式環境多半改為產品設定或移除。

### 資料取得
- 唯一真實外部呼叫為試聊的 LLM 回覆。其餘皆為靜態內容。正式環境請把人設資料、方案、FAQ 移至 CMS / 設定檔，並把試聊接到後端對話 API（帶人設 system prompt + 歷史）。

---

## Design Tokens

### 字體（Google Fonts）
- **Serif 標題**：`Cormorant Garamond`（300/400/500，含 italic）＋中文 `Noto Serif TC`。
- **內文/UI**：`DM Sans`（300/400/500）＋中文 `Noto Sans TC`。
- **占位等寬**：`DM Mono`（僅圖片占位標籤用）。
- 正式環境建議改用 `next/font` 或自架字體，避免 `@import` 阻塞。

### 字級（關鍵）
| 用途 | size / weight / family |
|---|---|
| Hero H1 | 62px / 300 / serif（line-height 1.12） |
| Section H2 | 42px / 300 / serif |
| FinalCTA H2 | 56px / 300 / serif |
| Persona 姓名 H3 | 46px / 300 / serif |
| 方案金額 | 52px / 300 / serif |
| Hero lede | 17px / 300 |
| 內文 | 14–15px / 300–400 |
| eyebrow | 11px / 400 / 字距 0.32em / 大寫 |
- 1920 級別非適用；此為一般網頁，最小內文 ~12px（法務頁腳註）。

### 顏色 — 三套主題 token
所有顏色以 CSS 變數定義，accent 用 `oklch`。三套主題僅換 token：

**午夜玫瑰（rose，預設）**
```
--bg:#0E0A10  --surface:#181219  --raised:#20171F
--text:#F4ECEF  --text-sub:#B6A4AC  --text-dim:#7C6C73
--accent: oklch(0.74 0.13 14)      --accent-2: oklch(0.80 0.10 62)
--accent-ink:#1a0e10  --glow: oklch(0.74 0.13 14 / 0.40)
--border: rgba(244,236,239,0.10)   --border-2: rgba(244,236,239,0.16)
--bg-grad: radial-gradient(120% 90% at 80% -10%, #241620 0%, #0E0A10 55%)
```
**暗金奢華（gold）**
```
--bg:#0C0B08  --surface:#15130D  --raised:#1D1A12
--text:#F3EDDD  --text-sub:#B5AB92  --text-dim:#7C745F
--accent: oklch(0.80 0.10 84)      --accent-2: oklch(0.72 0.07 50)
--accent-ink:#16120a  --glow: oklch(0.80 0.10 84 / 0.38)
```
**冷夜霓虹（indigo）**
```
--bg:#08090F  --surface:#10121C  --raised:#161A28
--text:#E9ECF6  --text-sub:#9DA4BC  --text-dim:#6A7088
--accent: oklch(0.72 0.13 285)     --accent-2: oklch(0.78 0.10 218)
--accent-ink:#0b0d16  --glow: oklch(0.72 0.13 285 / 0.42)
```
> 大量使用 `color-mix(in srgb, var(--accent) N%, ...)` 做半透明調和 — 請保留此手法或以對等方式還原。

### 圓角
- 按鈕/膠囊：`100px`（pill）。
- 卡片：feature 20px、plan 24px、phone 30px、method/contact-form 18–22px。
- Hero 人物：`220px 220px 28px 28px`（拱門）；persona 人物：28px。
- 訊息泡：18px（朝向側小圓角 4–5px）。

### 陰影 / Glow
- 按鈕 primary：`0 8px 30px -8px var(--glow)`，hover `0 14px 40px -8px var(--glow)`。
- 人物：`0 40px 90px -30px var(--glow)` + inset accent glow。
- phone：`0 50px 100px -40px rgba(0,0,0,0.8), 0 0 60px -30px var(--glow)`。
- featured 方案：`0 30px 70px -30px var(--glow)`。

### 間距
- 內容容器 `.shell`：max-width 1180px，padding `0 32px`（≤940px 22px、≤480px 18px）。
- Section 垂直 padding：`.section-pad` 90px（≤480px 64px）。

### 動畫
| 名稱 | 用途 / 參數 |
|---|---|
| `pulse` | Hero badge 圓點，2.4s 循環 opacity |
| `floaty` | Hero 氣泡，4s 上下 8px |
| `msgIn` | 訊息進場，0.3s 淡入上移 8px |
| `blink` | typing 三點，1.2s 錯相 |
| `toastIn` | toast 進場，0.32s cubic-bezier(.2,.8,.2,1) |
| reveal | 0.7s ease 淡入 + translateY(24px) |
- 請尊重 `prefers-reduced-motion`（原型未完整處理，正式環境補上）。

---

## Assets
位於 `assets/`，4 張人物插畫（直幅，建議上對齊裁切）：
- `portrait-chen.png` — 沉（成熟穩重，建築師）
- `portrait-yan.png` — 言（溫柔傾聽，文字工作者）
- `portrait-ye.png` — 夜（神秘深沉，音樂人）
- `portrait-yu.png` — 嶼（陽光暖男，衝浪教練）

> 這些是 AI 生成的示意插畫，正式上線請替換為有授權的最終素材，並注意 AI 陪伴產品的形象合規與年齡分級。每位人設另有 `glyph`（單字：沉/言/夜/嶼）用於小尺寸圖示，無需圖片。

人設完整資料（姓名、拼音、tag、描述、特質、引言、問候語、suggestions、腳本回覆、`persona_prompt`）全部在 `personas.js` 的 `window.PERSONAS`，請直接沿用為資料來源。

---

## Files（本交接包內含）
- `心辰 Landing.html` — 落地頁進入點（載入順序：React → ReactDOM → Babel → personas.js → tweaks-panel.jsx → chat.jsx → sections.jsx → app.jsx）
- `app.jsx` — 主程式：`App` 組裝各區塊、主題對應、人設選擇與連動、toast、Tweaks 面板
- `sections.jsx` — 所有區塊元件 + 資料（`FEATURES` / `PLANS` / `FAQS`）
- `chat.jsx` — `ChatDemo` 試聊原型（含 LLM/腳本雙路回覆）
- `personas.js` — 4 位人設資料庫
- `styles.css` — 全部樣式與三套主題 token（562 行，唯一樣式來源）
- `tweaks-panel.jsx` — 原型期 Tweaks 面板（**正式環境可移除**）
- `pages/terms.html`、`pages/privacy.html`、`pages/refund.html`、`pages/contact.html` — 法務／聯絡子頁
- `assets/portrait-*.png` — 人物插畫

### 設計截圖（`screenshots/`）
高保真參考圖,供未參與此對話的工程師對照:
- `01-hero.png` — Hero(午夜玫瑰主題)
- `02-features.png` — Features 三特色
- `03-personas.png` — 人設切換 tabs + detail
- `04-chat.png` — 試聊原型(已填入對話:問候 → 使用者 → AI 回覆)
- `05-pricing.png` — 三方案訂價
- `06-faq.png` — FAQ 手風琴(首題展開)
- `07-final-footer.png` — 最終 CTA + Footer
- `08-theme-gold.png` — 暗金奢華主題(Hero)
- `09-theme-indigo.png` — 冷夜霓虹主題(Hero)

> 截圖為 1180px 寬桌機版;法務/聯絡子頁未附截圖,版式說明見上文第 9、10 節。

### 實作建議順序
1. 建立 design token（三主題）與字體載入。
2. 共用 layout：Nav、Footer、Button（primary/ghost/sm）、Section header、卡片。
3. 落地頁各區塊（Hero → Features → Persona → Chat → Pricing → FAQ → FinalCTA）。
4. 人設資料模型 + 全站 `selId` 連動。
5. 試聊接後端對話 API（人設 system prompt + 歷史），保留腳本 fallback。
6. 法務/聯絡子頁（共用 page-hero / legal / contact 樣式）。
7. RWD（940 / 860 / 480 斷點）與 reduced-motion。

> 注意：請勿原樣照搬 HTML 上線；以上述規格在你方 codebase 的既有元件與設計系統中重建。`tweaks-panel.jsx` 與 Tweaks 相關狀態為設計探索用途，正式產品不需要。
