# Current state — 29 September 2026
Website and interactive 3D tour implemented locally. Analog joystick added for mouse/touch; WASD and arrow keys supported. Fullscreen toggle added. Source brick texture and parquet improve material appearance. Original plans remain authoritative. See HANDOFF.md for exact limitations and next steps.

Local preview: http://127.0.0.1:5173/
Mobile on same Wi-Fi: http://192.168.0.234:5174/ (Mac must remain awake; address may change).
Remote configured: https://github.com/BLVJeezy/Apprtementen.git
No production deployment performed.

Verification: npm run build passed; all 16 Playwright tests passed, including joystick movement/release, keyboard walking, fullscreen, all ten units, mobile accessibility and WebGL fallback. Three.js lazy chunk emits a size warning (~593 KB / 152 KB gzip).

## Facade and immersive update
Added 75 source-extracted glazed frame assemblies and 15 glass railing assemblies, sill/lintel closures, exposed roof caps, source brick mapping and dark frames. Fullscreen scene fills viewport; all lower controls move to right side. CSS fallback supports browsers rejecting native fullscreen. Photorealistic parity with supplied render is not claimed; construction details, terrain and landscaping remain simplified.

## Realism pass — 29 September 2026 (Claude)
Tuned to the supplied aerial render: gradient sky, warmer sun, charcoal roof membrane over anthracite fascia, powder-coated metallic frames, reflective glazing (studio environment map applied only to glass/frames for mobile performance), pale buff brick tint. Illustrative front context added: terrace paving, entrance path, low hedges, pavement, red cycle lane, road with markings, street trees and a background tree line. Site layout is decorative, not surveyed.

Verification: npm run build passed; all 16 Playwright tests passed (run here with pre-installed Chromium and software WebGL). Software-rendered frame cost rose ~12s → ~18s for the full-tour test, mainly from the larger landscape; still needs a real-phone check.
