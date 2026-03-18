# Score Persistence, Leaderboard & Difficulty Modes

## What & Why
Currently scores are lost when the page reloads, and there's no way to compare runs or adjust difficulty. Adding local score persistence, a high score leaderboard, and difficulty modes gives players a reason to replay and a sense of accomplishment.

## Done looks like
- **High scores saved** to localStorage — top 10 scores persist across sessions
- **Leaderboard screen** accessible from the start screen showing rank, score, level reached, and date
- **Difficulty modes** selectable on the start screen:
  - **Easy**: More time, fewer enemies, enemies move slower, more health
  - **Normal**: Current balance (default)
  - **Hard**: Less time, more enemies, enemies move faster, less starting health
  - **Nightmare**: Minimal time, maximum enemies, fast enemies, 50 health, no compass distance indicator
- **Victory screen** shows whether the score made it onto the leaderboard
- **Game Over screen** shows final stats compared to personal best
- **Run statistics** tracked: total oranges collected, total damage taken, time survived, levels completed
- Selected difficulty is shown in the HUD

## Out of scope
- Online/multiplayer leaderboards (local only)
- Account system or cloud save
- Achievement badges or unlock system

## Tasks
1. **localStorage persistence** — Create a score/stats manager that saves and loads high scores and run statistics to localStorage.
2. **Leaderboard screen** — Build a new screen component showing the top 10 scores with rank, score, level, difficulty, and date.
3. **Difficulty mode system** — Add difficulty selection to game state and start screen, with multipliers that affect time, enemy count/speed, and health.
4. **Run statistics tracking** — Track and aggregate per-run stats (damage taken, oranges collected, time survived) in game state.
5. **Post-game score comparison** — Update victory and game over screens to show whether the score is a new personal best or leaderboard entry.
6. **HUD difficulty indicator** — Show the current difficulty mode label in the HUD.

## Relevant files
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/Screens.tsx`
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/theme.ts`
