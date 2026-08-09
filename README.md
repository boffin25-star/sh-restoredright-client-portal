# S&H RestoredRight Client Portal

Fresh GitHub repository package for the redesigned S&H client portal.

## Design
The desktop and mobile layouts are based on the approved client-portal mockup and are styled to match the main RestoredRight application:

- Desktop white sidebar
- S&H box logo
- Inverted blueprint workspace
- White project/status cards
- White header with client profile
- Blue footer
- Mobile white header
- Mobile light blueprint background
- Blue bottom navigation
- Dashboard, Projects, Messages, My Contents, Approval Requests, Invoices, My Bill, Information

## Existing backend integration retained
The app uses the same Supabase project and preserves the existing patterns for:
- Client login
- Jobs
- Two-way job messages
- Change-order approvals
- Documents/invoices
- Billing status
- Work Authorization signing
- Client portal tab visibility
- Contact information updates

## Create the new GitHub repo
1. Create a new empty GitHub repository.
2. Upload the **contents of this folder** so `package.json` is at the repository root.
3. Commit the files to `main`.

## Deploy to Vercel
1. In Vercel choose **Add New → Project**.
2. Import the new GitHub repository.
3. Framework should detect as **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

`vercel.json` includes an SPA rewrite so routes and hash flows work correctly.

## Assets
This package contains self-contained SVG versions of the S&H box logo and both blueprint backgrounds so the repository will deploy immediately. If you want pixel-for-pixel parity with the current main-app raster artwork, replace these later with the approved production PNG/JPG assets using the same filenames or update the references in `src/App.jsx`.

## Important
This repository is intentionally separate from the old `sh-client-portal` repository. The old project can remain untouched as a rollback/reference.
