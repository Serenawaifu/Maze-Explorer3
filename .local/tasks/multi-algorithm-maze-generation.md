# Multi-Algorithm Maze Generation

## What & Why
The maze game currently only uses the Recursive Backtracker (DFS) algorithm for generating mazes, which always produces long, winding corridors with low branching. Adding Prim's algorithm as an alternative will produce mazes that are "short and bushy" with many short dead ends and more direct solution paths — creating more gameplay variety across runs and levels. A solvability check (BFS validation) should run after generation to guarantee a valid path from start to exit always exists.

## Done looks like
- Mazes feel noticeably different between runs: some have long winding corridors (DFS), others have shorter dead ends with more open branching (Prim's)
- Each level randomly picks one of the two algorithms, so layouts vary per run
- The HUD or level-start UI indicates which maze style was generated (e.g. "Labyrinth" vs "Catacombs")
- Every generated maze is guaranteed solvable — BFS validates a path from start to exit after generation, regenerating if needed
- No changes to how walls, enemies, collectibles, power-ups, traps, fog zones, or lore fragments are placed — all existing placement functions continue to work on the same MazeData structure

## Out of scope
- Kruskal's algorithm (may be added later)
- Non-perfect mazes (loops / multiple paths)
- Visual indicators of algorithm type beyond a text label
- Changes to level configs, enemy AI, or scoring

## Tasks
1. **Add Prim's algorithm** — Implement a `generateMazePrim(width, height)` function in `mazeGenerator.ts` that produces a perfect maze using randomized Prim's algorithm, returning the same `MazeData` structure as the existing DFS generator.
2. **Add solvability validation** — After generating a maze (with either algorithm), run a BFS check from start `(0,0)` to end `(width-1, height-1)`. If no path exists, regenerate (retry up to 5 times). The existing `bfsPath` function can be reused for this.
3. **Random algorithm selection** — Update `generateMaze` to randomly pick between DFS and Prim's for each call. Store the chosen algorithm name on `MazeData` (add an `algorithm` field) so downstream code can display it.
4. **Display algorithm label** — Show the maze generation style name in the HUD or level-start transition so the player knows what kind of maze they got (e.g. "Labyrinth" for DFS, "Catacombs" for Prim's).

## Relevant files
- `artifacts/maze-game/src/game/mazeGenerator.ts`
- `artifacts/maze-game/src/game/GameScene.tsx:417-420`
- `artifacts/maze-game/src/game/gameState.ts:8-24`
