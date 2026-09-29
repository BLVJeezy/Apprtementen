# Source-derived facade reconstruction

scripts/extract-facades.py reads the original four elevation PDFs and three floor plans without changing them. At 1:50, PDF point dimensions map to metres. Elevation registration uses the roof-band horizontal centre, the corresponding plan roof centre, and ground datum +89.81. Rear/right axes reverse to match orthographic viewing direction.

Grey enclosing frame rectangles containing blue glazing fills recover 75 window/door frame assemblies and 15 balustrade assemblies. Nested frame edges provide vertical divisions. Window depth comes from the unmasked source-grey facade footprint intersected at each assembly midpoint; railings use the corresponding slab perimeter. public/models/facades.json retains source rectangle coordinates, source filenames and SHA256 hashes.

Rendering adds dark aluminium frame profiles, blue-grey transparent glazing, source-width sill and lintel closures, and glass balustrades. Railing post spacing, frame profile depth and glass material properties are illustrative. This is a significant improvement over full-height empty openings, not a fabrication-ready or photorealistically exact model. Composite glazing without an enclosing qualifying rectangle remains omitted. Recess mapping needs specialist validation near corners. Exposed roofs use footprint differences between successive levels, not inferred structural layers. The upper roof envelope is corrected to 8.0–8.8m (source +97.81 to +98.61 relative to +89.81).

The supplied photorealistic montage is a visual styling reference; original plans remain the dimensional authority. Landscaping and interior furniture are illustrative.
