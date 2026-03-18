# Sound & Audio System

## What & Why
The game is completely silent — no footsteps, no music, no sound effects. Adding audio dramatically increases immersion and makes the horror/dungeon atmosphere feel alive. Players should hear ambient dungeon sounds, their own footsteps echoing, enemies nearby, and satisfying collection sounds.

## Done looks like
- Ambient dungeon music/drone plays during gameplay (looping, low volume)
- Player footstep sounds play while moving (timed to walk speed)
- Enemy proximity produces a heartbeat or low growl that gets louder as they approach
- Collecting an orange plays a satisfying chime/pickup sound
- Taking damage plays a hit/pain sound effect and a brief heartbeat
- Reaching the exit portal plays a victory fanfare
- Start screen has subtle ambient music
- All audio uses the Web Audio API with spatial/positional awareness where appropriate
- A mute/volume toggle is available in the HUD

## Out of scope
- Voice acting or dialogue
- Procedural music generation
- Per-enemy unique sound profiles

## Tasks
1. **Audio engine setup** — Create an audio manager using Web Audio API that handles loading, playing, looping, and spatial positioning of sounds.
2. **Generate or source sound effects** — Use procedural audio synthesis (oscillators, noise generators) to create footstep, pickup, damage, and ambient sounds without external files.
3. **Ambient music** — Create a looping dark ambient drone using layered oscillators and filters for the dungeon atmosphere.
4. **Spatial enemy audio** — Add proximity-based audio that intensifies as enemies get closer to the player (heartbeat or low rumble).
5. **HUD volume control** — Add a mute/volume toggle button to the HUD overlay.
6. **Integrate audio triggers** — Wire up sound playback to game events: movement, collection, damage, level complete, game over.

## Relevant files
- `artifacts/maze-game/src/game/PlayerController.tsx`
- `artifacts/maze-game/src/game/Collectible.tsx`
- `artifacts/maze-game/src/game/Enemy.tsx`
- `artifacts/maze-game/src/game/GameScene.tsx`
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/Screens.tsx`
