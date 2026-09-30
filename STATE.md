# Current state — 29 September 2026
Website and interactive 3D tour implemented locally. Analog joystick added for mouse/touch; WASD and arrow keys supported. Fullscreen toggle added. Source brick texture and parquet improve material appearance. Original plans remain authoritative. See HANDOFF.md for exact limitations and next steps.

Local preview: http://127.0.0.1:5173/
Mobile on same Wi-Fi: http://192.168.0.234:5174/ (Mac must remain awake; address may change).
Remote configured: https://github.com/BLVJeezy/Apprtementen.git
No production deployment performed.

Verification: npm run build passed; all 16 Playwright tests passed, including joystick movement/release, keyboard walking, fullscreen, all ten units, mobile accessibility and WebGL fallback. Three.js lazy chunk emits a size warning (~593 KB / 152 KB gzip).

## Facade and immersive update
Added 75 source-extracted glazed frame assemblies and 15 glass railing assemblies, sill/lintel closures, exposed roof caps, source brick mapping and dark frames. Fullscreen scene fills viewport; all lower controls move to right side. CSS fallback supports browsers rejecting native fullscreen. Photorealistic parity with supplied render is not claimed; construction details, terrain and landscaping remain simplified.

## Realism / environment update — 30 September
Photographic HDR environment/reflections, brick relief, grass detail, instanced foliage and reference-based street context added. Road, cycle strip, pavement, access paths, front hedges, right driveway and neighbouring building volumes are now visible. Neighbour dimensions and planting remain approximate. Rendering now stops when the scene is unchanged; costly screen-space occlusion was removed after interaction regressions. Final verification below supersedes earlier test results.
Verification: production build passes. Full 16-test suite passed after the interaction/performance fixes; the four 3D tests were rerun after static mesh batching. HDR remains locally hosted (~1.45 MB). Visual review confirms the new street composition and reflected sky; photo-identical realism is not claimed.
