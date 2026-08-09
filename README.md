# S&H RestoredRight Client Portal — Branding Fix v4

This package replaces the generated placeholder branding with the exact files supplied by the user.

## Exact branding assets now included
- `public/sh-box-logo.png` — official S&H Services logo supplied by the user
- `public/blueprint-house-login-inverted.jpg` — exact approved blue blueprint house image
- `public/blueprint-house.jpg` — same approved blueprint image used for mobile/background treatment
- `public/restoredright-badge.png` — exact RestoredRight System badge supplied by the user

## Placement
- S&H box logo: login screen and desktop sidebar
- Blueprint house: login and portal workspace backgrounds
- RestoredRight badge: bottom of the desktop sidebar

The generated SVG placeholder logos/backgrounds were removed.

## Repository structure
Keep the folders exactly as provided:
- `src/`
- `public/`
- `supabase/`

Do not flatten the repository.

Vercel:
- Framework: Vite
- Build command: `npm run build`
- Output: `dist`
