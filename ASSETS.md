# Asset pipeline and specialist model handoff

## Reproduce drawings
Use Python with pypdf and Pillow plus Poppler `pdftoppm` (no proprietary CAD runtime). Run `python3 scripts/prepare-assets.py` from root after restoring exact ZIP contents in `reference/FW_ Laatste versie plannen/`. The source archive and drawings must remain read-only. Each generated asset has original filename, SHA256, PDF clip and dimensions in `public/assets/manifest.json`. Main WebP views are 2800px; apartment views 1800px. Small 1100px alternatives supplied. Unit pins derive from source apartment-number text coordinates, not approximate geometry.

`node scripts/create-content.mjs` creates initial content from the verified schedule. It OVERWRITES commercial edits and should only be used for an intentional re-import. Runtime content and imagery can otherwise be edited independently.

## What is verified
All floor plans and four elevations are rendered directly from the drawings, including shared circulation, stairs/lift, exterior openings, terraces, furnishings and source color zones. Site image shows documented landscaping. The nine AC1027 DWGs were inventoried, but no DWG geometry was parsed. Elevations and sections were reviewed as PDF references. No new geometry was invented.

## Production GLB/GLTF replacement
1. A qualified CAD producer must import the original DWGs, resolve units/coordinates, cross-check dimensions and levels against the PDFs and review the structure with the architect.
2. Deliver one exterior scene with stable object names `unit-0.1` through `unit-2.2`, `level-0` through `level-2`, and separate shared building/site geometry. Keep ownership boundaries independent from visual materials. Produce individual unit scenes using verified walls, openings and circulation; staging remains decorative.
3. Export metre-scale glTF 2.0/GLB with validated normals, mesh compression, mobile-appropriate textures, and documented source-to-object mapping. Keep a poster image and the current plan fallback. Aim for <5 MB exterior and <3 MB per lazily loaded apartment; verify on representative mobile hardware.
4. Replace the simplified geometry builder in src/three/SceneCanvas.tsx through a GLB loader, keeping selected apartment ID, level and inquiry props unchanged. Preserve keyboard-accessible HTML apartment cards and all factual content outside WebGL. Add modelUrl to content records; do not embed architectural or pricing data into mesh code.
5. Catch renderer/asset failures and WebGL context loss and show the existing image viewer. Offer an explicit plan option, respect reduced motion, lazy-load the renderer, avoid downloading all ten interiors at once. Test navigation and failure paths before enabling models.

Current 3D controls operate on public/models/architecture.json, extracted from PDF vector polygons by scripts/extract-geometry.py (PyMuPDF and Shapely). The original 2D plan viewer remains available. Brick material comes from the source elevation via scripts/prepare-materials.py, with provenance in public/assets/materials/provenance.json. GLB remains a future replacement for the simplified model. Furniture and landscape in 3D are illustrative.
