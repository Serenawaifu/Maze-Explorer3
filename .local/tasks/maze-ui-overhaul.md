# Professional UI & Assets Overhaul

  ## What & Why
  Completely upgrade the game's visuals to a polished, professional standard. Pull in free CC0
  textures from ambientcg.com for stone walls, floor, and ceiling; load a game-appropriate Google
  Font; add an animated background on the start screen; and redesign every screen and HUD element
  so the game looks and feels like a commercial release.

  ## Done looks like
  - Orbitron Google Font used throughout for a sci-fi dungeon aesthetic
  - Stone/dungeon tile textures on walls, floor, and ceiling (diffuse + normal + AO maps from ambientcg.com)
  - Animated CSS particle/star-field background on the start screen
  - Start screen: large hero logo with scanline glow, animated control hints fading in one-by-one
  - HUD: icon badges (heart, clock, star, gem icons), segmented health bar, pulsing damage flash, stylised crosshair
  - Minimap styled as a tactical overlay with a dark bezel border
  - GameOver / LevelComplete / Victory: cinematic full-bleed overlays with dramatic typography, stat cards, and animated entry
  - Collectibles upgraded to multi-layer golden gem with sparkle ring halos
  - Enemies have pulsing electric cracked wireframe outer shell
  - Exit marker upgraded to a glowing portal with spinning ring emitters
  - All transitions feel smooth and polished

  ## Out of scope
  - Audio / sound effects
  - New gameplay mechanics

  ## Tasks
  1. Add Orbitron Google Font via index.html and define a shared design-token constants file for
     colours, glows, and font names referenced by all game UI files.

  2. Apply free CC0 stone/dungeon textures from ambientcg.com (or publicly-accessible CDN variants)
     to walls, floor, and ceiling in MazeWalls.tsx with correct UV tiling and normal maps.

  3. Upgrade Collectible, Enemy, and ExitMarker 3D meshes to richer multi-layer visual effects with
     emissive rings, wireframe shells, and animated glow pulses.

  4. Redesign the HUD with icon-driven panels, a segmented health bar, cinematic timer, gem-counter
     badge, and an invulnerability red-flash overlay.

  5. Redesign all four screens (Start, GameOver, LevelComplete, Victory) with professional animated
     overlays, dramatic typography, scanline effects, and particle backgrounds.

  ## Relevant files
  - artifacts/maze-game/index.html
  - artifacts/maze-game/src/game/Screens.tsx
  - artifacts/maze-game/src/game/HUD.tsx
  - artifacts/maze-game/src/game/MazeWalls.tsx
  - artifacts/maze-game/src/game/Collectible.tsx
  - artifacts/maze-game/src/game/Enemy.tsx
  - artifacts/maze-game/src/game/Minimap.tsx
  