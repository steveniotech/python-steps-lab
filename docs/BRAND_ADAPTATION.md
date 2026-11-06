# Python Steps Lab — io TECH local brand adaptation

Status: User visual acceptance completed. The light blue-white editor, line numbers, and output theme were reviewed and approved by the user on 2026-11-05. No commit, push or publication.

## Feedback and revisions

- **2026-11-05 User Feedback & Approval**: The legacy dark green editor surface was rejected in favor of the light blue-white brand style. Following adjustment, the user reviewed the light editor, line numbers, output, and overall layout, and explicitly confirmed visual acceptance.
- **Adjustments in `brand.css`**:
  - Editor background: light blue-white `#f8fbff`, border `#d9e6f6`, active focus ring `rgba(0,102,218,0.18)`.
  - Line numbers: soft light blue `#edf4fc`, numbers `#48688a` (contrast > 5.1:1).
  - Code text: deep blue-slate `#0f2d4a` (contrast 13.5:1), selection `#cce3ff` / text `#0a2540`, cursor `#0066da`, subtle scrollbars `#b8d1ea`.
  - Output panel: unified `#f8fbff` surface with `#d9e6f6` border and `#0f2d4a` monospace text.
  - Homepage hero preview: updated `.hero-program` to matching light surface `#f8fbff`, removing old green backgrounds while keeping monospace typography and token contrast.
- **Review status**: User visual acceptance passed. No commit, push or publication. Real login, cloud sync, physical touch devices, and full 29-step manual completion remain unverified as noted below.

## Starting work and preservation

Before implementation, Git showed an existing modification to `TESTING.md`, plus untracked `docs/CLOUD_SETUP.md` and `tests/`. These are prior work and have not been restored, cleaned or rewritten. The header, stylesheet and build script had no pre-existing modifications or direct conflict.

The original `index.html` and `python-steps.css` were copied into ignored `.local/brand-review/before/`, with starting hashes and Git status. All curriculum, core, runner, page, account and sync JavaScript, the original stylesheet, existing test files and the pre-existing `TESTING.md` remain byte-identical. Everything from `<main>` through the footer is unchanged. No student account, existing progress, Auth setting, shared function or database was accessed or modified.

## Changes

- `index.html`: actual approved logo with full tagline, compact centered header, Learning Hub link, local stylesheet and PNG favicon references. Original brand link behavior, map navigation, sign-in, status and stars are retained.
- `brand.css`: matching system sans typography, blue/white palette, rounded controls and outer cards, semantic success/error panels and obvious focus. Original learning grid and mobile stacking remain. Dark editor colors, monospace fonts, input behavior and internal scrolling are preserved; no body-level overflow hiding is used.
- `assets/io-tech-center-logo.png`: exact byte copy of the accepted Express/Hub logo, 1383 × 742, unchanged aspect ratio and opaque white background. No source artwork or unrelated images copied.
- `scripts/build-site.mjs`: exact 11-file allowlist; only `brand.css` and the PNG are added. Text credential checks remain; the PNG is validated and copied as binary. Existing unexpected artifacts cause a stop rather than deletion. Nested private files and symlinks are not accepted.
- `scripts/serve-brand-review.mjs`: loopback-only review on port 8773, serving only explicit public runtime files plus the ignored HTML/CSS baseline. No arbitrary project access.
- `scripts/check-brand-review.mjs`: checks real routed PNG bytes/type/dimensions, every built runtime reference, private-path denial, method restrictions and the production Hub destination. Optional `--http` checks running HTTP responses separately.
- `.gitignore`: ignores `.local/` review snapshots, logs and screenshots. README/publishing documentation reflects the local adaptation and artifact additions. Prior testing history remains intact.

## Local review

From the project root:

```sh
node scripts/serve-brand-review.mjs
```

- Sample: http://127.0.0.1:8773/python-steps-lab/
- Before: http://127.0.0.1:8773/before/python-steps-lab/

The sibling Learning Hub link resolves to `https://steveniotech.github.io/io-tech-learning-hub/` on GitHub Pages. The local preview maps it to the existing Hub preview on port 8765. It does not modify or start that service. This project's unchanged cloud configuration does not enable cloud sign-in on port 8773; anonymous browser review is separate from production and the previously enabled local origin.

Before screenshots, when available, must be labeled as new browser renders of the preserved local pre-adaptation baseline, not historical production screenshots. The baseline shares the unchanged runtime scripts, so teaching behavior and data rules are equivalent. Review artifacts stay ignored and are not build inputs.

## Checks actually completed

- Existing `node test-python.js` and `node test-cloud.js` passed before and after adaptation. These cover all 29 reference programs under local CPython, course/core rules, worker lifecycle substitutes, all 29 steps via DOM/runner adapters, rewards and persistence, account UI, sync/conflict/session behavior and teacher transport substitutes. They do not constitute browser/Pyodide or real account verification.
- `node scripts/build-site.mjs`: passed; exactly 11 static resources, including a byte-identical PNG copy.
- `node scripts/check-brand-review.mjs`: passed for in-process routing and content. Encoded traversal aliases and private paths are rejected rather than normalized into another public route.
- JavaScript/MJS syntax and `git diff --check`: passed.
- Source preservation hashes, unchanged main/footer and exact logo-copy checks: passed.
- Calculated text contrast: primary white/blue 5.37:1, body on page 11.64:1, secondary on white 6.40:1, success text 5.27:1, error text 8.02:1, unchanged editor text/background 12.81:1. This calculation is not a visual-browser result.

## Browser / HTTP status

Agent startup of the preview listener was blocked by EPERM. The user was given the exact loopback startup command once. Actual HTTP responses, desktop/mobile layout, real Pyodide input/run/output/error/check/next flow, long code/output behavior, draft recovery, Hub navigation and before/after screenshots are **not yet verified** and must not be labeled passed on the strength of file or routing checks.

Real login, cloud synchronization, cross-account permissions, physical touch devices, screen readers and full 29-step real-browser completion remain outside completed evidence. No password has been requested or read. No other course, Hub source, Netlify site, root website or Supabase resource was modified.

## Review and rollback

Wait for user review of this local Python design before further course work or release. To undo only this adaptation, remove the new brand/icon references and restore the saved header, then remove the added visual assets/brand build entries when appropriate. Do not reset Git or discard prior work. Runtime logic and stored progress require no rollback because they were not changed. Deployment is not authorized by this document.
