# Power-ups, Traps & Environmental Hazards

## What & Why
The game currently only has oranges to collect and enemies to avoid. Adding power-ups gives the player strategic choices and rewards for exploration, while traps and hazards add environmental danger beyond just enemies. This creates a richer gameplay loop where every corner could hold a reward or a threat.

## Done looks like
- **Speed Boost** (blue orb): Doubles player movement speed for 8 seconds, with a glowing trail effect
- **Shield** (green crystal): Grants temporary invulnerability for 5 seconds, player glows with a protective aura
- **Health Potion** (red vial): Restores 30 health points, with a healing particle effect
- **Torch Upgrade** (yellow flame): Doubles flashlight range for the rest of the level
- Power-ups spawn randomly in the maze (2-4 per level, increasing with difficulty)
- **Spike Traps**: Floor tiles in certain corridors that pulse red and deal 15 damage when stepped on, with a brief warning glow
- **Fog Zones**: Dense fog patches in some corridors that reduce visibility to near-zero
- Active power-up status is shown in the HUD with a timer countdown
- Power-ups have distinct 3D models that hover and rotate (similar to collectibles)

## Out of scope
- Inventory system or item carrying
- Crafting or combining items
- Player-placed traps
- Purchasable upgrades between levels

## Tasks
1. **Power-up state management** — Add active power-up tracking to the game state (type, duration, timer).
2. **Power-up 3D models** — Create distinct 3D objects for each power-up type using primitive geometries and emissive materials.
3. **Power-up effects** — Implement the gameplay effect of each power-up (speed multiplier, invulnerability, health restore, flashlight range).
4. **Power-up spawning** — Add power-up position generation to the maze generator, separate from collectible positions.
5. **Spike trap system** — Create floor trap meshes that pulse with a warning glow and damage the player on contact.
6. **Fog zone rendering** — Add dense local fog volumes in random corridors that reduce visibility.
7. **HUD power-up display** — Show active power-up icon and remaining duration timer in the HUD.

## Relevant files
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/GameScene.tsx`
- `artifacts/maze-game/src/game/PlayerController.tsx`
- `artifacts/maze-game/src/game/Collectible.tsx`
- `artifacts/maze-game/src/game/mazeGenerator.ts`
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/MazeWalls.tsx`
