# Claude handoff — 29 September 2026

## Start here
Repository: https://github.com/BLVJeezy/Apprtementen.git. Working directory is this repository. Read PROJECT.md, STATE.md, DECISIONS.md, analysis/findings.md and analysis/geometry.md. Never modify sources/ or reference/. No production deployment has been made.

Run `npm ci`, `npm run dev` (localhost:5173), `npm run build`, `npx playwright install chromium --only-shell`, `npm test`. Mobile LAN preview: `npm run dev -- --host 0.0.0.0 --port 5174`; current Mac address is 192.168.0.234, subject to change. Phone must share Wi-Fi.

## Implemented
Dutch apartment sales site, verified 10-unit schedule over three levels, furnished source-plan viewer, individual crops, zoom, accessible enquiry export. Editable public/content.json; sales contacts and prices intentionally unconfirmed. No enquiry is sent without configured contact details.

Interactive Three.js hero with landscape and source-extracted wall/floor geometry. Enter the apartment opens walk/level/exterior views. All ten unit spawn points and three levels, mouse/touch look, camera zoom, collision checks, WASD/arrows with canvas focus, analog mouse/touch joystick with release/cancel/blur stopping, fullscreen toggle and WebGL fallback. Hero pauses while tour is open. Ceiling/roof geometry, shadows, staged furniture, parquet and source-derived brick texture improve presentation.

Main code: src/App.tsx, src/three/SceneCanvas.tsx, Experience.tsx, Joystick.tsx, HeroScene.tsx. Geometry: public/models/architecture.json, scripts/extract-geometry.py. Texture: public/assets/materials/source-brick.webp, provenance.json, scripts/prepare-materials.py. Asset pipeline: scripts/prepare-assets.py. Tests: tests/journey.spec.ts, accessibility.spec.ts, experience.spec.ts.

## Exact outstanding limits / next work
The model is a source-derived spatial visualization, not a finished photorealistic BIM model. Glazing, frames and balustrades now follow extracted elevations; doors, precise construction joints, sill/head build-ups and roof finishes remain simplified. Basement is available as a source plan, not a walkable 3D model. Furniture and landscape are illustrative. Do not claim certified interior living area: source net figures appear to include terraces. Do not invent prices, availability, EPC, parking allocation or private garden boundaries.

Facade extraction now implemented in scripts/extract-facades.py (PyMuPDF + Shapely): 75 glazed frame assemblies and 15 railing assemblies registered to source-plan depths, written to public/models/facades.json. Rendering is in src/three/Facades.ts. Source rectangles/hashes retained. Run geometry extraction first, then facade extraction; facade extraction also adds exposed-roof differences and corrects the roof envelope to 8.0–8.8m. Broad sill/lintel closures and inferred railing support spacing remain simplified; source composite openings without qualifying grey enclosing rectangles are omitted. Review registration at corners and balcony recesses with a CAD specialist before claiming exact reconstruction.

Fullscreen now makes the canvas fill 100vw × 100dvh, with compact right-side controls and left joystick. Native Fullscreen API is requested; when unavailable (notably some mobile browsers), CSS immersive mode still fills the browser viewport. Browser chrome cannot be forcibly hidden where the API is unavailable. Tests include rejected API fallback and exact canvas viewport bounds.

Claude realism pass (29 Sep): sky gradient, charcoal roof + anthracite fascia, reflective glass/frames (env map scoped to those materials — scene-wide env map doubled software render cost), buff brick tint, illustrative street/hedges/paving in front (decorative, not surveyed). Next: check real-phone frame rate; if slow, reduce tree crown instances or disable shadows on mobile. Continue realistic facade materials/lighting and validate visual quality on a real phone. Fullscreen support depends on browser; a clear fallback message is implemented. Larger Three.js chunk is lazy loaded. No paid backend or services. Configure salesEmail in public/content.json only after confirmation; current enquiry export is deliberately honest.

## Verification
Production build and Playwright suite should be rerun after any changes. Final results for this session are in STATE.md. Do not treat preliminary agent messages as completed changes.

## Realism and streetscape update — 30 September
Added licensed CC0 Poly Haven Kloppenheim 06 (Greg Zaal) HDR for photographic sky, environment lighting and window reflections; attribution/source is public/assets/environment/LICENSE.md. It is illustrative, not a site panorama. Brick uses source colour texture with shallow bump, glass has reflective physical material, ground has fine grass variation and trees use instanced leaves. Renderer draws on changes instead of continuously and reuses static shadow maps. An SSAO experiment was removed after it made interaction too slow; do not reintroduce without mobile performance profiling.

src/three/SiteContext.ts adds the front asphalt road/markings, red cycle strip, paved sidewalk, low front hedges, central entrance path, right access drive, a left detached-house volume and right industrial-neighbour volume. Composition follows the user's aerial reference and was compared with the site-plan image. Dimensions/materials of neighbours, public-road widths and planting are approximate, not a surveyed reconstruction. Building geometry still needs specialist detail work for photorealistic parity. Original reference photos were not modified or published.

Static facade, furniture and streetscape meshes are batched by material in src/three/batchMeshes.ts to reduce draw calls. Instanced foliage remains separate. An old agent-browser preview was consuming CPU during early performance checks and was closed; final tests use isolated Playwright browsers. Keep actual mobile GPU/frame-time profiling on the follow-up list; software-renderer test duration is not a phone frame-rate measurement.
