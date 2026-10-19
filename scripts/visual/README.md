# Visual comparison harness

Captures the mockup screens and the app (web export), then builds mockup | app side-by-side images.

```
PLAYWRIGHT_PATH=<dir containing node_modules/playwright> \
CHROMIUM_PATH=<chromium binary> \
node scripts/visual/capture.mjs [--skip-export]
```

Environment variables:

- `PLAYWRIGHT_PATH`: directory containing `node_modules/playwright`.
- `CHROMIUM_PATH`: optional Chromium binary, for example
  `$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell`.
- `VISUAL_WEB_DIR`: web export directory. Default: `<os tmpdir>/mfa004-web-<hash of the current worktree path>`, so parallel worktrees do not overwrite each other.

Output: `.agents/tasks/MFA-004/shots/{mockup,app,compare}-<screen>.png`, relative to the current worktree.
