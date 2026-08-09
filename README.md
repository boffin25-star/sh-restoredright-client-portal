# S&H RestoredRight Client Portal — Flat Upload v2

This package is intentionally FLAT: every file belongs at the GitHub repository root.

It fixes the Vercel error:
`Rollup failed to resolve import "/src/main.jsx"`

The first upload was flattened by GitHub, so the repo did not contain a `src/` folder even though `index.html` expected one.

## Upload
Delete/replace the current repository files with the files in this package. Every file should appear directly at the repo root.

Important:
- `index.html` now loads `/main.jsx`
- `main.jsx`, `App.jsx`, `adminTools.jsx`, `adminTabVisibility.jsx`, and `authWizard.jsx` all live at root
- SVG assets also live at root and are imported by Vite so they are bundled correctly
- No `src/` or `public/` folders are required

After committing, Vercel should automatically redeploy.
