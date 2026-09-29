# Claude handoff — 29 September 2026

## Start here
Repository: https://github.com/BLVJeezy/Apprtementen.git. Working directory is this repository. Read PROJECT.md, STATE.md, DECISIONS.md, analysis/findings.md and analysis/geometry.md. Never modify sources/ or reference/. No production deployment has been made.

Run `npm ci`, `npm run dev` (localhost:5173), `npm run build`, `npx playwright install chromium --only-shell`, `npm test`. Mobile LAN preview: `npm run dev -- --host 0.0.0.0 --port 5174`; current Mac address is 192.168.0.234, subject to change. Phone must share Wi-Fi.

## Implemented
Dutch apartment sales site, verified 10-unit schedule over three levels, furnished source-plan viewer, individual crops, zoom, accessible enquiry export. Editable public/content.json; sales contacts and prices intentionally unconfirmed. No enquiry is sent without configured contact details.

Interactive Three.js hero with landscape and source-extracted wall/floor geometry. Enter the apartment opens walk/level/exterior views. All ten unit spawn points and three levels, mouse/touch look, camera zoom, collision checks, WASD/arrows with canvas focus, analog mouse/touch joystick with release/cancel/blur stopping, fullscreen toggle and WebGL fallback. Hero pauses while tour is open. Ceiling/roof geometry, shadows, staged furniture, parquet and source-derived brick texture improve presentation.

Main code: src/App.tsx, src/three/SceneCanvas.tsx, Experience.tsx, Joystick.tsx, HeroScene.tsx. Geometry: public/models/architecture.json, scripts/extract-geometry.py. Texture: public/assets/materials/source-brick.webp, provenance.json, scripts/prepare-materials.py. Asset pipeline: scripts/prepare-assets.py. Tests: tests/journey.spec.ts, accessibility.spec.ts, experience.spec.ts.

## Exact outstanding limits / next work
The model is a source-derived spatial visualization, not a finished photorealistic BIM model. Window voids remain simplified; accurate glass, sill/head details, doors, balustrades and roof finishes are not complete. Basement is available as a source plan, not a walkable 3D model. Furniture and landscape are illustrative. Do not claim certified interior living area: source net figures appear to include terraces. Do not invent prices, availability, EPC, parking allocation or private garden boundaries.

Facade investigation stopped at agent usage limit; no finished facade extraction file exists. Source elevation nested grey-frame rectangles enclosing blue gradients appeared to identify 39 front, 24 rear, 6 left and 6 right glazed assemblies; these counts are preliminary and require validation. Next engineer should extract exact elevation sill/head rectangles, map facade axis to plan geometry and recess depth, validate against elevation images, then add glazing/frame meshes. Never infer repeated/mirrored openings without source evidence. Roof band extraction was under review: confirm combined upper/lower bands against section before changing heights.

Continue realistic facade materials/lighting and validate visual quality on a real phone. Fullscreen support depends on browser; a clear fallback message is implemented. Larger Three.js chunk is lazy loaded. No paid backend or services. Configure salesEmail in public/content.json only after confirmation; current enquiry export is deliberately honest.

## Verification
Production build and Playwright suite should be rerun after any changes. Final results for this session are in STATE.md. Do not treat preliminary agent messages as completed changes.
