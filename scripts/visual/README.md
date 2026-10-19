# Visual comparison harness

Captures the mockup screens and the app (web export), then builds mockup | app side-by-side images.

```
PLAYWRIGHT_PATH=<dir containing node_modules/playwright> \
CHROMIUM_PATH=<chromium binary> \
node scripts/visual/capture.mjs [--skip-export] [--viewport=375x667] [--screens=home,history]
```

Options:

- `--skip-export`: reuse the existing web export.
- `--screens=<a,b>`: only capture the listed screens (names from `ALL_SCREENS` in `capture.mjs`).
- `--viewport=<width>x<height>`: capture the app at another size (for example a 375x667 small phone). The mockup only exists at 390x844, so in that case only `app-<screen>@<width>x<height>.png` is written, with no mockup or compare image.
- `--worst[=XOF|EUR|USD]`: worst-case state (26-character holder of wide letters, `MAX_BALANCE_MINOR`, huge intentions). Only the app is captured, to `app-<screen>-worst-<currency>[@<width>x<height>].png`, and the extra `keypad-max` screen (keypad opened without typing) is included. `adjustsFontSizeToFit` (keypad, pills, tickets) is ignored by the web export, so check the native fit on a simulator too.
- `--holder=<name>`: holder name for `--worst` (an empty value is rejected).
- `--out-dir=<dir>`: output directory (default `.agents/tasks/MFA-004/shots`).

Environment variables:

- `PLAYWRIGHT_PATH`: directory containing `node_modules/playwright`.
- `CHROMIUM_PATH`: optional Chromium binary, for example
  `$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell`.
- `VISUAL_WEB_DIR`: web export directory. Default: `<os tmpdir>/mfa004-web-<hash of the current worktree path>`, so parallel worktrees do not overwrite each other.

Output: `.agents/tasks/MFA-004/shots/{mockup,app,compare}-<screen>.png`, relative to the current worktree.
