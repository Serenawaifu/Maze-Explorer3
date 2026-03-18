# Granny-Style Dungeon Overhaul

  ## What & Why
  Transform the maze game from a dark sci-fi aesthetic into a vibrant anime-dungeon horror experience
  inspired by Granny (granny-games.com). Replace abstract geometric enemies with recognizable
  block-like characters that have visible scary faces. Replace start screen particles with floating
  oranges. Add warmth, color, and dungeon atmosphere throughout.

  ## Done looks like
  - Start screen shows floating/spinning orange fruit images (using attached asset) instead of blue/green dots
  - Enemies are block-like humanoid characters with clearly visible scary faces (eyes, mouth drawn via
    Three.js geometry or procedural textures). They patrol the maze like Granny — menacing and recognizable
    at first glance as a threat
  - Maze environment has warm anime-dungeon colors — stone walls with warm tones (browns, tans, mossy greens),
    torchlit orange/amber lighting, warmer fog colors
  - Floor has visible stone tile detail. Ceiling has dark wooden beam feel
  - Collectibles remain as oranges (the fruit) — use the attached orange image as a sprite/texture
  - Exit portal stays but with warmer color palette
  - Overall atmosphere shifts from cold sci-fi blue to warm dungeon amber/brown with anime color pops

  ## Tasks
  1. Copy orange image asset into public directory. Update start screen ParticleBackground to render
     floating/spinning orange images instead of colored dots. Update particle colors to warm orange tones.

  2. Rewrite Enemy.tsx to render a block-like humanoid character with a recognizable scary face.
     Build the character from box geometries (body, head, arms, legs) with a procedural canvas texture
     on the head that draws eyes and a mouth. The face should be immediately identifiable. Keep patrol
     and damage logic unchanged.

  3. Overhaul maze environment colors and lighting: warm up wall textures to brown/tan stone bricks,
     add warmer floor tiles, update fog and ambient/directional lighting to amber/orange tones,
     add torch-like point lights in the maze, update ceiling to dark wood tone. Update theme.ts colors.

  4. Replace collectible geometry with an orange fruit — either use a textured sphere with the orange
     image or build a stylized orange using sphere geometry with orange material and a small green stem.

  ## Out of scope
  - Audio / sound effects
  - New gameplay mechanics or enemy AI changes
  - UI screen layout changes (only color/asset updates to match new theme)

  ## Relevant files
  - artifacts/maze-game/src/game/Screens.tsx (particle background)
  - artifacts/maze-game/src/game/Enemy.tsx (enemy visuals)
  - artifacts/maze-game/src/game/MazeWalls.tsx (walls, floor, ceiling, exit)
  - artifacts/maze-game/src/game/GameScene.tsx (lighting, fog, background)
  - artifacts/maze-game/src/game/Collectible.tsx (collectible item)
  - artifacts/maze-game/src/game/theme.ts (color palette)
  - attached_assets/gemini-image-2_BG_Removed_1773665222079.png (orange image)
  