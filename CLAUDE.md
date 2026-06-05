# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

「心辰」is an AI virtual companion marketing landing page + legal subpages. It is a **high-fidelity design prototype** — not production code. The intent is for it to be rebuilt in a target framework (Next.js/React recommended) while pixel-perfectly preserving the visual and interactive design.

## Running the Prototype

No build step. Open `心辰 Landing.html` directly in a browser. All JSX is transpiled in-browser via Babel CDN; there is no `package.json`, npm, or linting toolchain.

## Architecture

### Entry Point & Module Structure
- `心辰 Landing.html` — main entry; loads React + Babel via CDN, imports all `.jsx`/`.js` files as `text/babel` scripts
- `app.jsx` — root component; holds global state (`selId`, `messages`, `input`, `typing`, `toast`), theme switcher, and renders all sections
- `sections.jsx` — all page sections: Nav, Hero, Features, PersonaSection, ChatSection, PricingSection, FAQ, FinalCTA, Footer
- `chat.jsx` — `ChatDemo` component; handles message flow, typing indicator, suggestion chips, and LLM/script reply routing
- `personas.js` — data for the 4 AI personas (沉/言/夜/嶼): names, traits, quotes, script replies, system prompts
- `styles.css` — all styles; defines 3 theme token sets (rose/gold/indigo) via CSS custom properties on `:root`/`[data-theme]`

### State Flow
`selId` (active persona ID) lives in `App` and is passed down; changing it syncs: Hero portrait/chip/bubble, PersonaSection detail, ChatSection AI identity, FinalCTA copy. Chat state (`messages`, `input`, `typing`, `used`) lives in `ChatSection`/`ChatDemo`.

### Chat Reply Routing
`chat.jsx` checks for `window.claude.complete(systemPrompt, userMessage)` — if present, uses it for live LLM replies. Otherwise falls back to scripted replies in `personas.js`.

### Themes
3 themes defined entirely in CSS variables: `midnight-rose` (default), `gold-luxury`, `indigo-neon`. Switch via `data-theme` attribute on `<html>`. The tweaks panel (`tweaks-panel.jsx`) is design-exploration UI only — not needed in production.

### Pages
`pages/` contains 4 standalone HTML subpages (terms, privacy, refund, contact) with shared layout and sticky TOC nav. No shared component infrastructure — each is self-contained HTML.

## Rebuilding in a Real Framework

When migrating to Next.js or another framework:
- Replace `text/babel` CDN pattern with proper module imports and a bundler
- Replace `window.claude.complete` stub with a real API route to Claude
- Use `personas.js` data and `styles.css` token architecture as-is
- Replace Google Fonts `@import` with `next/font` or equivalent
- The tweaks panel is prototype-only; omit in production
- All pixel-level specs (sizes, radii, animations, breakpoints) are in `README.md` and `styles.css`
