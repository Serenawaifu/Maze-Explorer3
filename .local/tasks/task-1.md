---
title: First-Person 3D Maze Game
---
# First-Person 3D Maze Game

  ## What & Why
  Build a browser-based first-person 3D maze game using React + Vite with Three.js (via React Three Fiber). The player navigates a procedurally generated maze from a first-person perspective, collecting hidden glowing items to earn points while avoiding patrolling obstacle enemies. The game features multiple levels of increasing difficulty.

  ## Done looks like
  - A full-screen 3D first-person view of a maze rendered in the browser
  - WASD / arrow key movement with mouse-look camera control
  - Collectible glowing items scattered throughout the maze that award points when walked over
  - Moving obstacle enemies (spinning/patrolling hazards) that deduct health on contact
  - HUD overlay showing current score, health bar, level number, and a countdown timer
  - A minimap in the corner showing the maze layout and player position
  - A start screen and a game-over / level-complete screen
  - At least 3 levels with progressively larger mazes and more obstacles
  - Smooth 60fps performance in the browser preview

  ## Out of scope
  - Multiplayer or online leaderboards
  - Backend / database persistence (scores are session-only)
  - Mobile touch controls (keyboard + mouse only)

  ## Tasks
  1. **Scaffold the react-vite artifact and install 3D dependencies** — Create the game artifact, install React Three Fiber, Three.js, @react-three/drei, and @react-three/rapier (or custom collision). Set up the main app shell.

  2. **Maze generation & 3D rendering** — Implement a recursive-backtracker or similar maze generator that produces wall/floor data, then render it in 3D with walls, floors, and a ceiling using instanced meshes or merged geometry for performance.

  3. **First-person player controller** — Add a first-person camera with pointer-lock mouse-look and WASD keyboard movement, plus simple AABB collision detection against maze walls.

  4. **Collectibles, enemies, and scoring** — Scatter glowing collectible orbs through the maze, add patrolling enemy obstacles, implement point gain on item collection and health loss on enemy contact.

  5. **HUD, minimap, screens, and level progression** — Build a 2D HUD overlay (score, health, timer, level), a minimap canvas, a start/game-over/level-complete screen, and wire up level transitions with increasing difficulty.

  ## Relevant files
  - `lib/api-spec/openapi.yaml`
  - `artifacts/api-server/src/app.ts`