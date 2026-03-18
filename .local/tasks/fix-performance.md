# Fix Game Freezing and Performance

  ## What & Why
  The game freezes and stutters during gameplay due to several performance issues:
  excessive per-frame object allocations causing GC spikes, brute-force collision detection
  iterating all wall boxes without spatial partitioning, synchronous BFS pathfinding on
  the main thread for up to 15 enemies simultaneously, per-frame sorting of torch light
  positions, and Zustand state updates (setPlayerPosition/setPlayerYaw) triggering every frame.

  ## Done looks like
  - Game runs at a smooth, consistent frame rate on all 5 levels including level 5 (26x26 maze with 15 enemies)
  - No visible hitching or freezing when enemies pathfind, when collecting items, or during boss fights
  - Player movement feels responsive and fluid throughout
  - No GC-related frame spikes from per-frame object allocation

  ## Out of scope
  - Visual quality changes or new features
  - UI redesign (handled separately)
  - Web Worker-based pathfinding (too complex for this pass; throttling is sufficient)

  ## Tasks
  1. **Eliminate per-frame THREE.js object allocations** — Cache Euler, Vector3, and other THREE objects as refs instead of creating new ones every frame inside useFrame in PlayerController.tsx. Pre-allocate reusable vectors for forward, right, and moveDir calculations.

  2. **Add spatial grid for collision detection** — Replace the brute-force wallBox iteration in resolveAxis with a cell-based spatial hash so only nearby walls are checked. For a 26x26 maze this reduces checks from ~5400/frame to ~20/frame.

  3. **Batch high-frequency Zustand updates** — Combine setPlayerPosition and setPlayerYaw into a single set() call per frame. Use getState()/setState() direct mutation pattern instead of selector-based set for high-frequency updates to avoid triggering re-renders.

  4. **Optimize torch light sorting** — Cache the sorted-by-distance torch array and only re-sort when the player moves more than one cell distance from the last sort position, instead of sorting every frame.

  5. **Throttle enemy pathfinding more aggressively** — Stagger BFS calls across enemies so at most 2-3 enemies pathfind per frame. Increase the pathfind cooldown and add frame-budget-aware scheduling to prevent multiple simultaneous BFS computations from blocking the render loop.

  6. **Optimize Collectible/PowerUp/SpikeTrap useFrame calls** — These components each run their own useFrame with per-frame distance checks. Batch distance checks or increase the check interval to reduce per-frame overhead when many instances exist.

  ## Relevant files
  - `artifacts/maze-game/src/game/PlayerController.tsx`
  - `artifacts/maze-game/src/game/Enemy.tsx`
  - `artifacts/maze-game/src/game/GameScene.tsx`
  - `artifacts/maze-game/src/game/gameState.ts`
  - `artifacts/maze-game/src/game/Collectible.tsx`
  - `artifacts/maze-game/src/game/SpikeTrap.tsx`
  - `artifacts/maze-game/src/game/FogZone.tsx`
  - `artifacts/maze-game/src/game/MazeWalls.tsx`
  