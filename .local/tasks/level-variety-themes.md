# Level Variety & Themed Environments

## What & Why
Every level currently looks the same — same brown brick walls, same stone floor, same ceiling. Adding unique visual themes per level makes progression feel meaningful and gives each dungeon a distinct personality. Different environments also allow for unique hazards and atmosphere.

## Done looks like
- Each of the 5 levels has a distinct visual theme:
  - **Level 1 — Stone Dungeon**: Current warm brown brick walls and stone floor (baseline)
  - **Level 2 — Mossy Catacombs**: Green-tinted walls with moss patches, damp stone floor with puddle reflections, dripping sounds
  - **Level 3 — Lava Caves**: Dark obsidian walls with glowing red cracks, orange/red ambient lighting, heat shimmer effect
  - **Level 4 — Frozen Crypts**: Icy blue-white walls, frost patterns on the floor, cold blue fog, crystalline decorations
  - **Level 5 — Shadow Realm**: Near-black walls with purple glowing runes, dark purple fog, floating phantom particles
- Wall, floor, and ceiling textures are generated per-theme using the existing procedural canvas approach
- Fog color, ambient light color, and torch light color change per theme
- Theme transitions happen smoothly when starting a new level
- Exit portal color adapts to match the level theme

## Out of scope
- Unique enemy models per level (enemies keep the same look)
- Theme-specific power-ups or collectibles
- Destructible environments
- Procedural level geometry beyond the maze grid (no rooms, bridges, etc.)

## Tasks
1. **Theme configuration system** — Create a theme config object per level defining wall/floor/ceiling colors, fog color, ambient light, torch color, and portal color.
2. **Mossy Catacombs theme** — Generate green-tinted brick textures with moss patches, damp floor tiles, and green-tinted fog.
3. **Lava Caves theme** — Generate dark obsidian walls with red glowing crack textures, warm orange floor, red fog and lighting.
4. **Frozen Crypts theme** — Generate ice-blue walls with frost patterns, white/blue floor, cold blue fog and ambient light.
5. **Shadow Realm theme** — Generate near-black walls with purple glowing rune patterns, dark purple fog, and purple ambient particles.
6. **Theme integration** — Pass the active theme config to MazeWalls, GameScene, and ExitMarker components so they adapt their procedural textures and lighting per level.

## Relevant files
- `artifacts/maze-game/src/game/MazeWalls.tsx`
- `artifacts/maze-game/src/game/GameScene.tsx`
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/theme.ts`
