# Advanced Enemy AI & Enemy Types

## What & Why
Currently enemies follow fixed patrol paths and only damage the player on contact. This makes them predictable and not scary after the first encounter. Adding chase behavior, different enemy types, and smarter AI makes the game genuinely tense — enemies should feel like they're hunting the player, not just walking back and forth.

## Done looks like
- Enemies detect the player within a configurable range (e.g. 8 units) and switch from patrolling to chasing
- Chasing enemies use simple pathfinding (BFS through open maze cells) to navigate toward the player
- Enemies return to their patrol route after losing sight of the player for a few seconds
- At least 2 distinct enemy types with different behaviors:
  - **Stalker**: Slow but persistent, chases the player across longer distances, dark appearance
  - **Rusher**: Fast but short detection range, charges quickly when close, bright red glow
- Different enemy types appear at different levels (Stalkers from level 1, Rushers from level 3)
- Enemy detection state is visible (e.g. eyes glow brighter when chasing)
- Chase speed is faster than patrol speed but still escapable by the player

## Out of scope
- A* or navmesh pathfinding (BFS through cells is sufficient)
- Enemy attacks/projectiles (melee contact damage only)
- Cooperative enemy behavior or group tactics

## Tasks
1. **BFS pathfinding** — Implement a breadth-first search through maze cells that finds a path from the enemy's current cell to the player's cell.
2. **Detection and chase state machine** — Add states to enemies: PATROL, ALERT, CHASE, RETURN. Transition based on player distance and line-of-sight (can check if the maze path distance is reasonable).
3. **Stalker enemy variant** — Create a slow, persistent enemy type with darker visuals and longer detection/memory range.
4. **Rusher enemy variant** — Create a fast, aggressive enemy type with short detection range but high chase speed and red glow.
5. **Level configuration** — Update level configs to specify enemy type distribution per level.
6. **Visual chase indicators** — Make enemy eyes glow brighter and aura pulse faster when in chase mode.

## Relevant files
- `artifacts/maze-game/src/game/Enemy.tsx`
- `artifacts/maze-game/src/game/mazeGenerator.ts`
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/GameScene.tsx`
