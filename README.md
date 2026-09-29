# Solyn · apartments in Heers
Dutch sales website based on the 24 July 2026 architectural package. Ten apartments on three levels, four exterior elevations, furnished apartment plans, zoomable site drawing and enquiry preparation. Architectural facts and commercial placeholders are separated.

## Run
Node 22+ and npm required.

```sh
npm ci
npm run dev -- --port 5173
```
Open http://127.0.0.1:5173.

```sh
npm run build
npm run preview -- --port 4173
npx playwright install chromium
npm test
```

## Edit content
`public/content.json` is fetched at runtime. Change brand, salesEmail, salesPhone, legal text and each apartment's description, price (EUR number or null), availability (`Te bevestigen`, `Beschikbaar`, `In optie`, `Verkocht`) and plan asset path. The interface does not need recompilation to read an updated JSON. On immutable hosting such as Vercel, upload/deploy the updated file. Architectural changes must be checked against the source drawings. Invalid data displays a recoverable error.

The enquiry form makes a local text download. When salesEmail is configured, it also opens a prefilled email in the visitor's mail client. It never claims submission and does not store personal data. Actual sending is performed by the visitor. No backend, credentials, cookies or paid services required.

## Deploy (not executed)
1. Import `BLVJeezy/Apprtementen` into Vercel with authorization.
2. Framework: Vite. Install: `npm ci`. Build: `npm run build`. Output: `dist`. Node: 22.
3. No environment variables required. Configure client-approved sales and legal content in `public/content.json` before production publication.
4. Deploy, then rerun the browser journey against the deployment by changing the Playwright baseURL/webServer configuration. Check the configured mail client action manually.

Any static HTTPS host can serve `dist`; no SPA rewrites are required because navigation uses anchors.

## Drawings and provenance
Original ZIP and extracted `reference/` are read-only and not uploaded to Git. Source hashes and filenames: `analysis/inventory.json`. Verified schedule: `analysis/apartment-schedule.json`. Asset clips and exact sources: `public/assets/manifest.json`.

Only web derivatives are in public assets. The reference title blocks are cropped away. Furnishings are source-plan symbols, not sales inclusions. Apartment crops retain contextual common/neighboring areas and do not assert legal boundaries. Plan-stated net areas appear to include terraces; certified interior areas must be confirmed. No private garden/parking assignment is inferred.

## Replaceable model pipeline
See `ASSETS.md`. Accurate interactive 2D drawings are delivered; no photorealistic 3D or walkthrough is claimed.
