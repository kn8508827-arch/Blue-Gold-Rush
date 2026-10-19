# Blue-Gold-Rush ⚡

An original, mobile-friendly endless-runner game for Team ស្មោះស្នេហ៍. It uses the two supplied team logos as collectible coin designs:
- `blue-team-coin.png` — blue Team coin
- `gold-collaboration-coin.png` — gold Collaboration coin

## Play
Renders with Three.js (WebGL, loaded from a CDN) and automatically falls back to the built-in 2D canvas game if WebGL or the CDN is unavailable. Open `index.html` in a modern browser. For the smoothest local test, use a simple local web server. The game supports:
- Desktop: Left/Right or A/D to change lanes, Up/Space to jump, Down to slide.
- Mobile: swipe left/right/up/down.
- Collect blue and gold coins, avoid blocks and low barriers, pause, and restart.

## Player character
The runner is a rigged, skinned 3D human (`assets/CesiumMan.glb`, 19 bones) loaded by `human-runner.js` through the bundled `vendor/GLTFLoader.js`. It is re-coloured at load time (Team ស្មោះស្នេហ៍ white polo with blue collar/side panels/sleeve trim and the team emblem decal, navy joggers with blue/gold stripes, white sneakers) and given procedural curly hair, beard and face parts. Run, jump, landing, slide, lane-lean, collision and game-over poses are driven by an `AnimationMixer` cross-fading the model's clip plus procedural bone rotations; hit boxes are unchanged. If the GLB or loader fails, the previous built-in runner is kept; if WebGL is unavailable the 2D fallback is used. The likeness is stylized, not a face scan. Model source/license/attribution (CC BY 4.0, Cesium): see [`ASSETS_LICENSES.md`](ASSETS_LICENSES.md). Verification screenshots are in `docs/`.

## Upload to GitHub
1. Open your repository `Blue-Gold-Rush`.
2. Click **Add file → Upload files**.
3. Unzip this archive on your computer.
4. Upload the contents of the `Blue-Gold-Rush` folder (`index.html`, `human-runner.js`, `audio.js`, the `assets/` and `vendor/` folders and the two coin `.png` files). Do not upload only the ZIP file.
5. Click **Commit changes**.

## Publish with GitHub Pages
1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose branch `main` and folder `/(root)`, then click **Save**.
4. Wait a few minutes and refresh the Pages section for the published URL.

This is an original game and does not use Subway Surfers artwork, characters, or branding.

## Sound
Original Web Audio synthesized music and effects (`audio.js`, no external assets). Use the 🔊 button or **M** to mute and the slider for volume; settings persist in localStorage. Audio starts after the first click/tap/key. Run tests with `npm test`.
