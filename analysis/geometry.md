# Source-derived walkthrough geometry

`public/models/architecture.json` is produced by `scripts/extract-geometry.py`, directly from the three furnished apartment PDFs using PyMuPDF and Shapely. No manually approximated walls or apartment shapes are used.

## Coordinate contract

One PDF point equals 50 × 0.0254 / 72 metres at the printed 1:50 scale. Common origin is PDF point (58.32,425.52), the ground-floor outside footprint's upper-left corner. All three drawings share their registration, including the central stair/lift core. World x increases to sheet right; world z increases down the sheet. Ground drawing extent measures 39.99653 × 17.00107m, agreeing with the printed 4000 × 1700cm overall dimensions within PDF rounding.

Floors have `level`, `elevation`, `wallHeight`, `wallPolygons`, `facadePolygons`, `floorPolygons`, `rooms`, `units`, and `floorImage`. Polygons use `{outer:[[x,z],...],holes:[[[x,z],...]]}`; preserve holes when extruding. `floorPolygons` groups source colored surface fills. `floorImage.bounds` gives xmin,zmin,xmax,zmax matching the existing furnished-plan asset crop exactly. Room labels and unit spawn positions come from actual text locations, with living rooms ordered left-to-right to match the verified unit schedule.

## Extraction and limitations

Orange masonry fills and dark-grey facade fills are processed in PDF paint order. Later filled linear paths subtract from existing walls, preserving white opening masks. Simply extruding the original orange fills would incorrectly block windows and doors: this extraction avoids that error. Curved filled paths are excluded, and are counted in metadata. Thin stroke hatching is not extruded. Floor surface fill polygons preserve source shapes; overlapping source furniture fills may occur, so union the surfaces if creating a single slab.

Vertical extrusion is 2.50m internal height from section AA/BB's 250cm callout. Floor spacing is 2.85m from source elevation levels +89.81,+92.66,+95.51. This is a source-derived plan cutaway rather than a fully reconstructed facade: window/door openings remain full-height gaps. Window sill heights, lintels, glass, roof build-ups and door leaf meshes have not been inferred. Garden building, basement and site geometry are not included in this three-floor apartment model. Furnishings visible in the plan texture are directly rendered from the source; any additional 3D furniture must be identified as illustrative.

## Checks

- Ground: 88 masonry polygons, 42 facade polygons; 39.77494m² masonry plan area.
- First: 85 masonry polygons, 39 facade polygons; 30.01394m² masonry plan area.
- Second: 51 masonry polygons, 20 facade polygons; 18.36349m² masonry plan area.
- All 224 masonry polygons valid. All 97 extracted room label points lie outside masonry.
- Four/four/two living-room spawn points are recovered for the ten apartments.
- Surface extents ground 0–40m / 0–17m, first 0–40m / 3.399–17.001m, second 1.897–38.100m / 3.399–15.401m, matching the stepped floor plans.
- Source file SHA-256 hashes are retained per floor. Sources are opened read-only.

This supersedes the earlier geometry-availability blocker in `analysis/findings.md` for plan-derived cutaway meshes only. DWG interpretation and full architectural BIM reconstruction remain unverified.

## Contiguous slab update

`slabPolygons` now unions the source colored surfaces with masonry and facade footprints in world metres, then simplifies with a 0.002m tolerance and topology preservation. Each level resolves to one valid polygon with source holes retained. `bounds` now follows actual slab extents, rather than the initial uniform ground-floor box. Union areas are 677.220m², 508.135m², and 402.305m²; the second-floor slab includes its four exterior terrace areas. These are reconstructed filled-path coverage areas, not replacement official area schedule values. Roof geometry remains null because a complete footprint/overhang could not be verified by this extraction. No roof shape is fabricated.

## Roof envelope verified from elevations

The earlier null roof has been superseded for the top-storey roof only. Front elevation's dark roof band is PDF rectangle (397.68,584.16)–(1992.96,623.76), yielding 28.13897m width and 0.69850m visible band depth. Left-side band (504.48,337.44)–(1252.80,377.04) yields 13.19953m building depth; right-side band (467.28,337.44)–(1215.60,377.04) corroborates it. The main upper wall immediately beneath each band confirms approximately 0.60m symmetric overhang. Registering those dimensions to the top-floor main wall produces roof bounds [5.92878,2.80035,34.06775,15.99989]. `roofPolygons` contains this verified rectangle; `roofBaseElevation` is 8.10150m, `roofThickness` 0.69850m, and `roofTopElevation` 8.80000m, based on source +98.61 roof top and +89.81 ground datum. This is the external roof-band envelope; structural layers are not claimed.

Facade-specific sill and lintel strips are not added: elevations include differing 130/230cm opening dimensions and upper-floor windows, and mapping each to every plan opening requires further correspondence validation. Applying one universal sill/lintel height would invent geometry. Sections support 2.50m room height and 2.85m floor spacing, but terrace/exterior finish datums vary; no universal intermediate slab build-up is certified.

## Interior ceiling planes

`ceilingPolygons` unions source-colored surface regions that contain an interior room label (living room, bedroom, bathroom, storage, WC, hall/stair hall), excludes every surface containing a terrace/covered-terrace label, and adds wall/facade footprints. Planes belong at `elevation + ceilingHeight`, with ceilingHeight2.50m from the sections. This models interior ceiling surfaces only and makes no roof-build-up claim. All three unions validate; every extracted interior label is covered and no terrace label is covered. Areas: ground558.61m², first394.96m², second298.34m². Covered exterior terraces intentionally remain omitted from this interior-only ceiling set.
