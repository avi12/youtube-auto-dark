# Purpose

YouTube Auto Dark makes YouTube's own "Use device theme" setting live. When the OS flips between light and dark, open www.youtube.com tabs re-theme in place, with no reload, instead of waiting for the next load. A user who picked Dark or Light in YouTube's appearance menu is left alone. There is no popup and there are no settings.

# How YouTube themes itself (reverse-engineered from its `ytmainappweb` bundles, 2026-11)

- **Choice:** the `PREF` cookie (`f6` hex group) holds it. Flag 165 (`0x400`) means explicit dark and 174 (`0x80000`) explicit light; with neither set, the device theme applies (`isDeviceThemeChosen`)
- **Recording:** `ytd-app` listens to `prefers-color-scheme` (`onDeviceThemeChanged`) and only records flag 185 for the next server render. It never re-themes the open page. Its own theme switch (`onThemeSelected` -> `yt-dark-mode-toggled-action`) reloads with `themeRefresh=1`
- **Server render:** the server bakes the theme in: `<html dark>`, `:root` tokens for that theme (hashed `--t…` custom properties), and theme-resolved colors inside InnerTube data (`fontColor` runs)
- **Re-theming in place** (`src/features/live-theme/apply-theme.ts`), step by step:
  1. **Tokens:** `[light]`/`[dark]` are YouTube's token islands. No internal function changes the page's tokens (they are server-rendered), so the extension sets YouTube's own island attribute on `<html>`, where `html[dark]` variables such as live chat's resolve, and on `<body>`, because a few `:root:root` tokens outrank it on `<html>`. `DARK_THEME_TOKEN` (the DI token every signal component reads) is `() => html.hasAttribute("dark")`
  2. **Cached properties:** about 20 components copy `isDarkTheme` / `isDark` / `isDarkMode` / `pageDarkTheme` from `<html dark>` once (constructor/`attached`); they are re-set on each Polymer controller (`polymerController`)
     2b. **Masthead:** its `dark`/`isDarkThemeForced` come from the dark server shell, so outside theater mode they follow the theme. On a watch page in dark its "cinematic" background fades with scroll only on the next scroll event, so its own `updateMastheadBackgroundOpacity()` runs now; leaving dark, its own `resetBackground()` (keeping `watchPageScrollTop`)
  3. **YouTube's own action:** `yt-dark-mode-toggled-action`'s handlers are called straight from YouTube's action router (`ytd-app`'s controller holds it as `actionRouter_`), skipping `ytd-app`'s own handler, which reloads
     2c. **Ambient mode:** the cinematics controller (Shorts, watch page) copies `<html dark>` into `isDarkModeEnabled` once at creation; it is found by shape on its owner and re-synced exactly as YouTube's `lVZ` does (`isDarkModeEnabled = ...; update()`)
  4. **Live chat:** live chat is its own server-rendered document with only its loaded theme's tokens. YouTube's `yt-dark-theme-action` / `yt-light-theme-action` make it toggle `<html dark>` (its `setGlobalDarkTheme`), which recolors nothing, so its own `ShadyCSS.styleDocument` gets the token values YouTube's page stylesheet declares in its `[dark]`/`[light]` island (read via CSSOM, never written). Nothing is ever reloaded
  5. **Palettes:** components with a `--yt-lightsource-*` palette re-run their own `dataChanged`, which picks the dark or light palette from `<html dark>`
  6. **Text:** `yt-attributed-string` resolves each run's `colorMap` with the theme at render, but skips data equal to its current data; it is re-rendered through its own signal setters (`rawProps.data()` / `setters.data`). Bare `fontColor` runs the server baked for the old theme (the PREF cookie decides the server's theme) are translated with a dictionary learned from the page's own `colorMap`s - one table per target theme, kept for the page's lifetime (`ThemeColorPairs`). Attributed text nests attributed text (a collab byline carries its whole collaborators dialog in its tap command), so runs are found at any depth (JSON reviver, `nested-style-runs.ts`)
  7. **Late text:** while the page shows a theme other than the server's, a MutationObserver translates newly rendered attributed strings the same way (`late-text-repair.ts`). It is stopped before every switch, or it would translate that switch's own re-renders back
- **Order:** components read `<html dark>` while being created, so the content script runs in the MAIN world; data the page loaded with stays colored for the server's theme, which is what steps 6-7 cover

# Layout

- `src/lib` - `theme/theme.ts` (Theme enum), `youtube/`, `zod.ts`
- `src/features/live-theme` - `prefs/` (reading `PREF`), `page/` (one module per re-theme step, `attributed-text/` for the text step), `apply-theme.ts`, `sync-live-theme.ts`
- `scripts/dev` - dev server (`pnpm dev` / `pnpm dev:firefox`), adapted from youtube-time-manager without the Rust sidecar or Svelte HMR. It does the WXT dev build and launches web-ext-run on an isolated cloned profile. On every save it rebuilds, reloads the extension (web-ext) and reloads the open YouTube tabs itself over the browser's debugging protocol (`tab-reload/`: CDP for Chrome, WebDriver BiDi for Firefox). The extension carries no dev-only permission, background script or re-injection code
- A directory past about 8 files gets split into meaningful subfolders, and a file that mixes concerns gets divided

# Rules

- Page objects (components, controllers, windows) are validated with `z.looseObject` / `z.function()` schemas turned into type guards (`@/lib/zod-guard`), then used in place: a parsed copy would lose their identity and `this`. No `z.custom`
- Never reload anything, and never write CSS: only YouTube's own CSS (its island attributes) and its own JS

The rules of `../youtube-time-manager/CLAUDE.md` (Code style, Naming conventions, Hardcoded values, CSS, Storage, UI copy) and of `../youtube-semi-sub/CLAUDE.md` (zod-first, no `as` casts, `@` alias, linting gates) apply. Event handler params are `event`.

# Gates

`pnpm lint`, `pnpm compile`, `pnpm test`, `pnpm exec fallow dead-code --root .` - all at 0 findings
