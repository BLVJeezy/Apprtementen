# Architectural source review

All 23 single-page PDFs were text-extracted, rendered, and visually reviewed as contact sheets. The three apartment floors were additionally viewed individually at 1800px. The nine DWGs were inventoried and SHA-256 hashed; all have header AC1027. DWG geometry has **not** been parsed or validated. Source drawings remain untouched.

## Verified project facts

- Drawing title: HET BOUWEN VAN 10 APPARTEMENTEN; architect Gorissen Georges; reference 2025-006; issue date 24/07/2026.
- Location: Steenweg, 3870 Heers. Cadastral identifiers in title block: 1ste afd., Stie. B, 301d and 305l/deel. The site drawing includes multiple neighboring lots and addresses: do not assign a final marketing street number from nearby labels.
- Four ground-floor units (0.1–0.4), four first-floor units (1.1–1.4), two second-floor units (2.1–2.2). Basement garage and storage. Central lift/stair core and ground/first-floor circulation passage. Ten unit-specific basement allocation entries are separate from floor-unit areas.
- Ground floor and basement carry 680m² overall labels; first floor 512.42m² incl. covered terraces and passage; second floor 323.28m² overall label. These are drawing labels, not interchangeable with apartment gross/net totals.
- Section AA/BB levels include +86.96 basement, +89.81 ground, +92.66 first, +95.51 second, +98.61 roof top. These are source elevation values, not geographic coordinates.
- Site drawing shows four visitor parking spaces (two groups of two), permeable driveway and paths, lawns/hedges, 40m² garden store, wadi 13,860L / 34m².
- Basement label specifies seven rainwater tanks with combined minimum 68,000L and reuse for toilets, washing machines, garden/cars.

## Unit areas and caveats

See `apartment-schedule.json`. Gross/net values transcribe the floor-specific Oppervlaktes box. Bedroom, bathroom, separate WC, and terrace labels are visually associated with the colored unit boundaries. Ground-floor terraces are each explicitly covered. First-floor outer units have 12.60m² terrace, central units 12.00m². Each penthouse has two 20.37m² terraces.

The floor schedules appear to include terrace areas in their net totals. Example: room labels in unit 2.1 sum to 131.20m² indoors; two terraces total 40.74m², yielding the stated 171.94m². Do not label the source net figure as certified habitable/internal floor area. Basement gross/net values in its own schedule refer to allocated annex/parking/storage and must not replace apartment areas. Final area measurement convention needs architect confirmation.

Private garden allocations, exact orientation per unit, prices, availability, EPC/energy performance, sale terms and certified habitable areas are not established and are null. No invented dimensions or inferred construction geometry.

## Elevation/material review

Front and rear elevations show three above-ground levels with a recessed upper floor and glazed terrace balustrades. Both side elevations and sections confirm stepped massing. Main facades use light grey/beige variegated brick; black solid-core cladding; anthracite aluminium roof edges; black aluminium joinery; bluestone sills; glass balustrades; black metal sectional garage door. Garden store has timber facade cladding. These map to material numbers 1–8 in the legend. Four garden-store elevations, its floor plan, and section CC show a separate simple rectangular flat-roof volume.

Four terrain profiles and section BB distinguish existing versus proposed ground, with excavation/fill and driveway slope. Wadi detail shows planting and connections to rainwater infrastructure. Legend general notes state structural member sizes are indicative pending engineer study; site dimensions are indicative pending survey. These are source-document caveats, not instructions to the software agent.

## Inventory

`inventory.json` contains all source names, sizes, SHA-256 hashes, PDF page dimensions, and DWG headers. `text/` contains extracted text for all 23 PDFs. `renders/` and four contact sheets provide review images. Text includes title-block personal contacts; keep raw extracted text out of public marketing assets.

## Remaining verification needed

A reliable DWG parser/converter and CAD/BIM workflow are required to claim a dimensionally accurate 3D model, precise unit boundary polygons, wall/opening geometry, or faithful first-person interior navigation. Rendered drawings are reliable source previews; they are not a validated 3D reconstruction. All source drawings use architectural sheet scale rather than geographic registration.
