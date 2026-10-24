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
The runner is a rigged, skinned 3D human (`assets/CesiumMan.glb`, 19 bones) loaded by `human-runner.js` through the bundled `vendor/GLTFLoader.js`. It is re-coloured at load time (Team ស្មោះស្នេហ៍ white polo with blue collar/side panels/sleeve trim and the single team emblem decal on the left chest, navy joggers with blue/gold stripes, white sneakers) and given procedural curly hair, beard and face parts. Run, jump, landing, slide, lane-lean, collision and game-over poses are driven by an `AnimationMixer` cross-fading the model's clip plus procedural bone rotations; hit boxes are unchanged. If the GLB or loader fails, the previous built-in runner is kept; if WebGL is unavailable the 2D fallback is used. The likeness is stylized, not a face scan. Model source/license/attribution (CC BY 4.0, Cesium): see [`ASSETS_LICENSES.md`](ASSETS_LICENSES.md). Verification screenshots are in `docs/`.

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

## Levels and stages
Earn XP from score, level up for bonus XP, and complete each stage's score objective to unlock the next. Eleven named ranks unlock at Levels 1, 3, 5, 8, 12, 18, 25, 35 (Sky Rider), 50 (Blue Titan), 70 (Gold Emperor) and 100 (Smos Snea Immortal). Each stage cycles through twelve visual worlds—Blue Harbor, Gold Dunes, Jade Jungle, Neon Metro, Frost Peak, Coral Coast, Emerald Canyon, Cosmic Rush, Sky Islands, Volcano Run, Crystal Caverns, and Lunar Station—with dedicated 3D landmark scenes: harbor lighthouses, desert pyramids and cacti, jungle trees, the neon city, ice peaks, coral palms, canyon cliffs, cosmic planets, floating islands and clouds, lava volcanoes, glowing crystal formations, and a lunar habitat with solar panels. Sky, fog, track lighting, and colors transition as stages advance. Stage targets and runner difficulty increase as you progress, with no fixed stage cap. Level, XP, unlocked/completed stages, and best score stay saved in browser localStorage.

### Runner refinement (v2)
Single chest emblem with white backing and no rear logo; existing back geometry and gear stay untouched. The runner also has a slimmer head and stronger jump/slide/lane-change/crash poses. See `docs/18-improved-poses.png` (run, lane, jump, slide, game over). The portrait file could not be downloaded in the build environment, so face likeness is stylized and unverified against it.

## Sky Bike power-up 🚲
A glowing Sky Bike (blue wheels, gold frame and wings, with a gold ring) sometimes appears on the track, led in by a line of gold coins. Run into it to ride it: the runner climbs into the air and cruises in a gentle wave between **15 m and 20 m**, steering left/right between lanes to collect lines of sky coins, untouched by ground obstacles. Jump/slide are off while riding. After the ride the bike glides down and the runner gets 1.2 s of landing protection. The ride lasts 8 s at Rookie and +0.5 s for every rank above it (max 13 s), so higher ranks fly longer. A HUD pill shows altitude and time left. Works in both the 3D and the 2D fallback. Logic and ranks live in `powerups.js` (tested in `tests/powerups.test.js`). Screenshot: `docs/19-sky-bike.png`.

## Cooler Fly 3D (second game)

`cooler-fly/` is a separate 3D tap-to-fly game starring the Cooler Bot mascot, served at
`https://kn8508827-arch.github.io/Blue-Gold-Rush/cooler-fly/`.

- three.js 0.160 from jsDelivr (unpkg fallback); Telegram Mini App aware (expand, haptics, share)
- 5 stages that change with the score: Neo Phnom Penh 2050, Cyber Angkor, Mekong of Light, Orbit Station, Galaxy Kingdom
- 5 ranks (Rookie → Cooler King), local top-5 scores, coins (+1) and crystals (+5)
- procedural synthwave music per stage (Web Audio) plus sound effects; music and sound toggles, pause
- game rules in `cooler-fly/logic.js`, tested by `tests/cooler-fly.test.js`

## Cooler Arcade (sixteen games)

`arcade/` is a hub of sixteen games in one page, served at
`https://kn8508827-arch.github.io/Blue-Gold-Rush/arcade/` (open a game directly with `?g=<key>` or `#<key>`: `khla`, `sudoku`, `solitaire`, `mahjong`, `#2048`, `#snake`,
`#memory`, `#whack`, `#ttt`, `#brick`, `#sort`, `#c4`, `#mines`, `#simon`, `#slide` or `#tap`):

- for adults, big and calm (no timers): 🎲 ខ្លាឃ្លោក (Khmer New Year dice game, play points only) · 🔢 Sudoku (unique solution, hints) ·
  🃏 Solitaire (tap a card and it moves itself, undo) · 🀄 Mahjong solitaire (always solvable, hints)
- 🔢 2048 Neon · 🐍 Neon Snake · 🃏 Memory match (Khmer symbols) · 🔨 Whack-a-Cooler (30 s, avoid bombs) ·
  ❌ Tic-tac-toe vs AI (3 levels, perfect AI on hard) · 🧱 Brick breaker (levels, lives) ·
  🧪 Ball sort (levels, undo) · 🔴 Connect 4 vs AI (alpha-beta) · 💣 Minesweeper (safe first click, flags) ·
  🎵 Simon · 🧩 Sliding 15 puzzle (3×3/4×4, always solvable) · 🎯 Tap rush (30 s, combos)
- swipe/tap controls plus arrow keys, sound effects, best score per game, Telegram haptics
- rules in `arcade/logic.js`, tested by `tests/arcade.test.js`

## Cooler Merge Racer (idle merge game)

`merge-racer/` is an idle car-merge game served at
`https://kn8508827-arch.github.io/Blue-Gold-Rush/merge-racer/`. All art is drawn in code (no copied assets).

- buy cars, drag two of the same level together to get the next level (30 levels, tuk-tuk to "Cooler Legend")
- tap a car (or drag it onto the track) to race it; each lap pays coins; up to 8 cars on the track
- 🚀 x2 boost for 30 s, 🔀 auto-merge, half-rate offline earnings (capped at 2 h), progress saved on the device
- economy and merge rules in `merge-racer/logic.js`, tested by `tests/merge-racer.test.js`

## Cooler Hub (Telegram Mini App home screen)

`hub/` is the home screen the bot opens (`/hub`, the chat menu button, or 🚀 in /menu):
a holographic member card that follows your finger/phone tilt, today's Khmer date, weather, dollar and gold,
searchable app icons for every bot feature and game, a monthly money donut and an owner panel.
Personal data arrives from the bot as `?d=<base64url JSON>`; tiles open `t.me/<bot>?start=go_<feature>`.
