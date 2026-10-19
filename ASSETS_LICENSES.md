# Asset sources & licenses

## Player character model — `assets/CesiumMan.glb`
- **Name:** Cesium Man (rigged, skinned human male; 19 bones; one walking/running clip)
- **Source:** https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/CesiumMan/glTF-Binary
  (downloaded from `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMan/glTF-Binary/CesiumMan.glb`)
- **License:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](http://creativecommons.org/licenses/by/4.0/)
- **Attribution (required):** "Cesium Man" by Cesium (https://cesium.com), donated to Khronos for glTF testing. Please also follow the [Cesium Trademark Terms](https://github.com/AnalyticalGraphicsInc/cesium/wiki/CesiumTrademark.pdf).
- **Modifications:** the embedded texture was downscaled to 64×64 with `@gltf-transform/cli resize` (file 491 KB → 273 KB). At load time (`human-runner.js`) the original material is discarded and replaced by vertex colours (white polo, blue collar/side panels/sleeve trim, navy joggers with blue/gold stripes, white sneakers, skin). Procedural curly hair, beard, mustache, eyes, brows, nose and the emblem decals are added as extra meshes attached to the skeleton. Extra poses (jump, slide, landing, crash) are produced procedurally by rotating bones.
- Other models that were considered and rejected: three.js `Soldier.glb` (armoured/helmeted vanguard, not a plain human) and `Xbot.glb` (robot).

## Team emblem decal — `assets/team-emblem.png`
- Derived from this repository's own `blue-team-coin.png` (the supplied Team ស្មោះស្នេហ៍ logo): resized to 256×256 and masked to a circle. No lettering or logo was redrawn or invented.

## GLTF loader — `vendor/GLTFLoader.js`
- `GLTFLoader` (+ the helpers it imports) from three.js **r160** (`three/examples/jsm/loaders/GLTFLoader.js`), MIT License, © 2010-2023 three.js authors, https://github.com/mrdoob/three.js.
- Bundled into a classic (non-module) script with esbuild so it can use the global `THREE` loaded from the CDN: the bundle exposes `THREE.GLTFLoader`.
