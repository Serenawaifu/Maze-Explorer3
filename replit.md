# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/maze-game` (`@workspace/maze-game`)

First-person 3D maze game built with React, Vite, Three.js (via React Three Fiber), and Zustand for state management. Frontend-only — no backend required.

- Entry: `src/main.tsx` → `src/App.tsx`
- Game logic: `src/game/` directory
  - `mazeGenerator.ts` — Recursive backtracker maze generation, wall segments, collectible positions, enemy patrol paths with types (stalker/rusher), BFS pathfinding (optimized: O(1) pointer-based dequeue, packed numeric keys), power-up/trap/fog zone placement
  - `gameState.ts` — Zustand store managing screen state, level config, score, health, timer, collectibles, active power-ups with timers, screen shake, fog zone state, boss state (bossHealth/bossMaxHealth/bossPhase/bossDefeated/bossStunTimer/attackCooldown/frameFreezeTimer/collapseTimer/bossPosition), boss actions (damageBoss, playerAttack, tickBossTimers, setBossPosition, startCollapse)
  - `GameScene.tsx` — Main 3D scene with Canvas, lighting, fog, maze rendering, collectibles, enemies, power-ups, spike traps, fog zones, flickering torch lights (pooled: max 10 nearest to player), wall torch models, portal particles, dynamic fog, ambient audio lifecycle. Performance: no reactive subscriptions to playerPosition/playerYaw/bossPosition — all high-frequency state read via getState() in frame/interval callbacks. Exit detection runs on 100ms interval
  - `audioSystem.ts` — Procedural Web Audio API sound engine: ambient dungeon drone, reverb-echoed footsteps, heartbeat/growl proximity audio, pickup chimes, damage sounds, level complete/victory/game over fanfares, boss hit impact, player attack swoosh, boss roar, boss death cascade, dungeon collapse rumble. Zustand-based mute/volume state
  - `theme.ts` — Design tokens (colors, fonts, glow effects) shared across all UI components
  - `scoreSystem.ts` — localStorage-based top-10 leaderboard persistence, difficulty mode definitions (Easy/Normal/Hard/Nightmare) with multipliers for enemies, speed, time, health, and score
  - `levelThemes.ts` — 5 level-themed visual environments: Stone Dungeon (warm brown), Mossy Catacombs (green-tinted), Lava Caves (obsidian/red glow), Frozen Crypts (icy blue), Shadow Realm (black/purple runes). Procedural wall/floor/ceiling texture generators per theme
  - `MazeWalls.tsx` — Instanced mesh walls with procedural themed brick textures/normal maps, themed textured floor and ceiling, animated portal exit with spinning rings
  - `PlayerController.tsx` — First-person pointer-lock camera, WASD movement, sequential axis-separated collision (resolve X then Z with penetration push-back against AABB wall boxes, handles zero-distance overlap via nearest-face fallback, updates coordinates per-wall for multi-wall corners), flashlight, footstep audio, speed boost support, screen shake effect, dust puff particles at feet, torch upgrade enhanced lighting, left-click attack (1.5s cooldown, ~3.5 unit range, 25 damage to boss, stun effect), expanding blue blast wave visual on attack, frame-freeze gate pauses movement during impact
  - `Collectible.tsx` — Orange fruit collectibles with sphere geometry, green stem/leaf, warm glow light, pickup chime, orange sparkle burst particle effect on collection
  - `PowerUp.tsx` — 4 power-up types: speed boost (blue dodecahedron), shield (cyan octahedron), health potion (green cylinder), torch upgrade (yellow cone). Floating/spinning animations, colored glow lights
  - `SpikeTrap.tsx` — Pulsing red floor tiles with metal spike cones, pulsing emissive glow and red point light, deal 10 damage every 1.5s when player is on them
  - `FogZone.tsx` — Dense fog patches with particle systems, circular ground markers, drastically reduce visibility when player enters, floating fog particles animate upward
  - `Enemy.tsx` — FSM-based AI with 5 states: patrol (wander along path), alert (pause and face player), chase (BFS pathfinding to player), flee (BFS pathfinding away from player when shield active, panicked animations, no damage), return (BFS path back to home cell). Two enemy types: Stalker (purple, slow, 18-unit detection, 6s chase memory) and Rusher (red, fast, 8-unit detection, 3s chase memory). Eye glow intensifies on detection. Performance: module-level texture cache (enemies of same type share textures), proximity-based light culling (lights hidden >20 units from player), reads playerPosition via getState()
  - `Boss.tsx` — Level 5 boss entity "Shadow Lord" with 3-phase AI. Phase 1 (100-50% HP): slow pursuit + AoE ground slam. Phase 2 (50-25% HP): faster, summons rusher minions, more frequent attacks. Phase 3 (<25% HP): enraged, teleport-dash attacks, very fast. White-flash shader on damage hit. Procedural 3-eyed face texture, purple aura, horn crown. 300 HP
  - `HUD.tsx` — Professional HUD with segmented 20-block health bar, Orbitron font panels, crosshair reticle, damage flash overlay with damage sound, mute/volume toggle, active power-up indicators with countdown timers/progress bars, low-health red vignette pulse, fog zone overlay, boss health bar with phase labels (Shadow Lord/Frenzied/Enraged), attack cooldown indicator below crosshair
  - `MiniMap.tsx` — Canvas-based mini-map HUD element (bottom-right). Fog of war: only explored cells (within 3-cell radius of player) are revealed. POI markers for exit portal (pulsing green diamond), gems (orange dots), power-ups (blue stars), traps (red diamonds), boss (purple skull), fog zones (grey circles), lore scrolls (pulsing gold). Player shown as green directional arrow. Click to expand/shrink. Legend at bottom. Stable 80ms redraw interval using refs. Performance: reads playerPosition/playerYaw/bossPosition from getState(), skips fog-of-war recalc when cell unchanged, avoids canvas.width reset
  - `Compass.tsx` — Circular exit compass showing needle direction toward the exit portal, distance indicator, N/S/E/W markings, rotates relative to player facing. Performance: 50ms interval redraw, reads all high-frequency state from getState(), pre-rendered static background layer cached
  - `Screens.tsx` — Cinematic screens with floating orange fruit particles, scanline overlay, staggered fade-in animations, stat cards, hover-glow buttons. Includes difficulty selector (Easy/Normal/Hard/Nightmare), leaderboard screen with top-10 scores, "New Personal Best" badge on game over/victory, next level theme preview on level complete, upgrade shop screen with 6 permanent upgrade cards, Lore Journal button on start screen
  - `loreFragments.ts` — 13 lore entries across 5 levels, authored by Dr. Elara Voss and others, detailing the Shadow Realm backstory. Persisted via localStorage ("maze_runner_lore")
  - `LoreFragment.tsx` — 3D collectible scroll with golden glow, floating animation, particle sparkles, and audio cue on collection
  - `LoreOverlay.tsx` — Typewriter-effect overlay for reading newly found lore + LoreJournal component for re-reading all discovered entries organized by level
  - `metaProgression.ts` — Roguelite meta-progression system with localStorage persistence. 6 permanent upgrades: Vitality (+10 HP/level), Swiftness (+5% speed/level), Luminary (+10% flashlight/level), Might (+5 attack dmg/level), Chrono (+15s time/level), Aegis (+3s shield/level). Cost formula: BaseCost × 1.15^currentLevel. Currency: oranges (collectibles). Tracks totalOrangesEarned, totalRuns. Functions: loadMeta, saveMeta, purchaseUpgrade, addOranges, incrementRuns, getter functions for each bonus
- Random difficulty per level: each level randomly assigns Normal, Hard, or Nightmare difficulty (no player selection). Difficulty affects enemy count, speed, time, health, and score multiplier. Shown in HUD during gameplay
- localStorage-based leaderboard storing top 10 scores with difficulty, level reached, and date
- Roguelite meta-progression: permanent upgrades purchased with oranges (collected in-game), persist across runs via localStorage. Shop accessible from start screen, game over, level complete, and victory screens. Upgrades applied to health, speed, flashlight range, attack damage, starting time, and shield duration
- 5 levels with progressively larger mazes (10x10 to 26x26), more enemies, collectibles, power-ups (3-10), traps (4-16), and fog zones (2-7)
- 5 themed environments: Level 1 Stone Dungeon, Level 2 Mossy Catacombs, Level 3 Lava Caves, Level 4 Frozen Crypts, Level 5 Shadow Realm
- Boss encounter on Level 5: Shadow Lord with 300 HP, 3-phase AI (pursuit→frenzied→enraged), AoE ground slam, minion summoning, teleport-dash. Player left-click stun attack (25 dmg, 1.5s cooldown, ~3.5 range). Frame-freeze on hit, white-flash damage feedback. Dungeon collapse victory sequence with falling debris, rumble audio, then transitions to victory screen
- Dependencies: three, @react-three/fiber, @react-three/drei, zustand

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
