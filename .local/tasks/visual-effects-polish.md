# Visual Effects & Animation Polish

## What & Why
The game renders well but lacks the reactive visual feedback that makes gameplay feel responsive and satisfying. Screen shake on damage, particle bursts on collection, glowing trails, and subtle post-processing effects elevate the experience from "functional" to "polished."

## Done looks like
- **Screen shake** on taking damage — camera jitters briefly to communicate impact
- **Collection particles** — burst of orange sparkles when picking up an orange
- **Footstep dust** — subtle dust puffs at the player's feet while moving
- **Enemy death/despawn effect** — if enemies are ever killed, they dissolve in red particles
- **Portal particles** — ambient floating particles around the exit portal that intensify when all oranges are collected
- **Damage vignette** — red vignette overlay pulses when health is low (below 30%)
- **Torch flicker** — torch lights subtly flicker in intensity for a more natural feel
- **Wall torch meshes** — visible torch models on walls near torch lights (simple cone + cylinder geometry)
- **Breathing camera bob** — subtle vertical camera oscillation while standing still for immersion

## Out of scope
- Full post-processing pipeline (bloom, SSAO, etc.) — too performance-heavy
- Skeletal animation for enemies
- Dynamic shadows from torch lights

## Tasks
1. **Screen shake system** — Add a camera shake function that triggers on damage, with configurable intensity and duration.
2. **Particle system component** — Create a reusable particle emitter using instanced meshes that handles burst and continuous emission.
3. **Collection burst effect** — Trigger an orange particle burst at the collectible's position when picked up.
4. **Low health vignette** — Add a persistent red vignette overlay that pulses when health drops below 30%.
5. **Torch flicker and mesh** — Add random intensity variation to torch lights and place visible torch models on nearby walls.
6. **Camera idle bob** — Add subtle vertical oscillation to the camera when the player is stationary.
7. **Portal ambient particles** — Add floating golden particles around the exit portal.

## Relevant files
- `artifacts/maze-game/src/game/PlayerController.tsx`
- `artifacts/maze-game/src/game/Collectible.tsx`
- `artifacts/maze-game/src/game/GameScene.tsx`
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/MazeWalls.tsx`
