# Mobile Touch Controls

## What & Why
The game currently only works with keyboard and mouse (pointer lock). Adding touch controls opens the game to mobile and tablet players, which is a huge audience. A virtual joystick for movement and swipe-to-look makes the game fully playable on touch devices.

## Done looks like
- **Virtual joystick** on the bottom-left of the screen for movement (WASD equivalent)
- **Touch-drag anywhere** on the right half of the screen to look around (mouse look equivalent)
- Joystick and touch areas only appear on touch-capable devices (hidden on desktop)
- Joystick has a clear visual — outer ring boundary and inner thumb indicator
- Touch look sensitivity is adjustable and feels natural
- All existing gameplay works identically with touch input
- HUD elements don't overlap with touch control areas
- Compass and HUD remain visible and positioned to avoid touch zone conflicts

## Out of scope
- Gamepad/controller support
- Tilt/gyroscope controls
- Haptic feedback
- Separate mobile UI layout (same HUD, just repositioned controls)

## Tasks
1. **Touch detection** — Detect whether the device supports touch and conditionally render touch controls.
2. **Virtual joystick component** — Build a touch joystick with an outer ring and draggable thumb that outputs a direction vector.
3. **Touch look system** — Implement touch-drag on the right half of the screen to rotate the camera (yaw and pitch), replacing pointer lock on mobile.
4. **Input integration** — Wire joystick output and touch look into the PlayerController's movement and rotation systems alongside keyboard/mouse.
5. **Layout adjustment** — Reposition HUD elements to avoid overlapping with joystick and touch areas on smaller screens.

## Relevant files
- `artifacts/maze-game/src/game/PlayerController.tsx`
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/Compass.tsx`
- `artifacts/maze-game/src/game/GameScene.tsx`
