import { useRef, useEffect, useState } from "react";
import type { MazeData, TrapData, PowerUpData, FogZoneData } from "./mazeGenerator";
import { THEME } from "./theme";
import { getThemeForLevel } from "./levelThemes";
import { useGameState } from "./gameState";

const CELL_SIZE = 4;
const MAP_SIZE = 170;
const REVEAL_RADIUS = 3;
const REDRAW_INTERVAL = 80;

interface MiniMapProps {
  maze: MazeData;
  level: number;
  exitPosition: { x: number; z: number };
  trapPositions: TrapData[];
  collectiblePositions: { x: number; z: number }[];
  powerUpPositions: PowerUpData[];
  fogZonePositions: FogZoneData[];
  collectedItems: Set<number>;
  collectedPowerUps: Set<number>;
  lorePositions: { x: number; z: number }[];
  collectedLore: Set<number>;
}

function worldToCell(wx: number, wz: number) {
  return { x: Math.round(wx / CELL_SIZE), y: Math.round(wz / CELL_SIZE) };
}

export function MiniMap(props: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exploredRef = useRef<Set<string>>(new Set());
  const seenPoisRef = useRef<Set<string>>(new Set());
  const propsRef = useRef(props);
  const lastLevelRef = useRef(props.level);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(expanded);

  propsRef.current = props;
  expandedRef.current = expanded;

  if (props.level !== lastLevelRef.current) {
    exploredRef.current = new Set();
    seenPoisRef.current = new Set();
    lastLevelRef.current = props.level;
  }

  const lastCellRef = useRef("");

  useEffect(() => {
    function tick() {
      const p = propsRef.current;
      const explored = exploredRef.current;
      const seen = seenPoisRef.current;

      const gameState = useGameState.getState();
      const playerPosition = gameState.playerPosition;
      const pc = worldToCell(playerPosition.x, playerPosition.z);
      const cellKey = `${pc.x},${pc.y}`;
      const cellChanged = cellKey !== lastCellRef.current;
      lastCellRef.current = cellKey;

      if (cellChanged) {
        for (let dy = -REVEAL_RADIUS; dy <= REVEAL_RADIUS; dy++) {
          for (let dx = -REVEAL_RADIUS; dx <= REVEAL_RADIUS; dx++) {
            const cx = pc.x + dx;
            const cy = pc.y + dy;
            if (cx < 0 || cy < 0 || cx >= p.maze.width || cy >= p.maze.height) continue;
            if (Math.sqrt(dx * dx + dy * dy) <= REVEAL_RADIUS) {
              explored.add(`${cx},${cy}`);
            }
          }
        }
      }

      const ec = worldToCell(p.exitPosition.x, p.exitPosition.z);
      if (explored.has(`${ec.x},${ec.y}`)) seen.add("exit");
      p.trapPositions.forEach((t, i) => {
        const tc = worldToCell(t.x, t.z);
        if (explored.has(`${tc.x},${tc.y}`)) seen.add(`trap-${i}`);
      });
      p.collectiblePositions.forEach((c, i) => {
        const cc = worldToCell(c.x, c.z);
        if (explored.has(`${cc.x},${cc.y}`)) seen.add(`gem-${i}`);
      });
      p.powerUpPositions.forEach((pu, i) => {
        const puc = worldToCell(pu.x, pu.z);
        if (explored.has(`${puc.x},${puc.y}`)) seen.add(`pu-${i}`);
      });
      p.fogZonePositions.forEach((f, i) => {
        const fc = worldToCell(f.x, f.z);
        if (explored.has(`${fc.x},${fc.y}`)) seen.add(`fog-${i}`);
      });
      p.lorePositions.forEach((lp, i) => {
        const lc = worldToCell(lp.x, lp.z);
        if (explored.has(`${lc.x},${lc.y}`)) seen.add(`lore-${i}`);
      });
      const bossPos = gameState.bossActive && !gameState.bossDefeated ? gameState.bossPosition : null;
      if (bossPos) {
        const bc = worldToCell(bossPos.x, bossPos.z);
        if (explored.has(`${bc.x},${bc.y}`)) seen.add("boss");
      }

      drawMap(canvasRef.current, p, explored, seen, expandedRef.current);
    }

    tick();
    const id = setInterval(tick, REDRAW_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const mapPx = expanded ? MAP_SIZE * 1.6 : MAP_SIZE;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 50,
        right: 14,
        zIndex: 101,
        pointerEvents: "auto",
        cursor: "pointer",
      }}
      onClick={() => setExpanded((e) => !e)}
      title={expanded ? "Click to shrink map" : "Click to enlarge map"}
    >
      <div style={{
        background: THEME.colors.panel,
        borderRadius: 8,
        padding: 6,
        border: `1px solid ${THEME.colors.panelBorder}`,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
          paddingLeft: 2,
          paddingRight: 2,
        }}>
          <span style={{
            fontSize: 8,
            fontFamily: THEME.fonts.heading,
            color: THEME.colors.textMuted,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}>
            MAP
          </span>
          <span style={{
            fontSize: 7,
            fontFamily: THEME.fonts.mono,
            color: THEME.colors.textDim,
          }}>
            {expanded ? "▼" : "▲"}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={mapPx}
          height={mapPx}
          style={{
            width: mapPx,
            height: mapPx,
            borderRadius: 4,
            display: "block",
          }}
        />
        <div style={{
          display: "flex",
          gap: 8,
          marginTop: 5,
          paddingLeft: 2,
          flexWrap: "wrap",
        }}>
          <LegendItem color="#44ee88" label="You" shape="arrow" />
          <LegendItem color="#44cc88" label="Exit" shape="diamond" />
          <LegendItem color="#ffa500" label="Gem" shape="circle" />
          <LegendItem color="#44aaff" label="Item" shape="star" />
          <LegendItem color="#cc2233" label="Trap" shape="diamond" />
          <LegendItem color="#aa00ff" label="Boss" shape="circle" />
          <LegendItem color="#ffd700" label="Lore" shape="circle" />
        </div>
      </div>
    </div>
  );
}

function drawMap(
  canvas: HTMLCanvasElement | null,
  p: MiniMapProps,
  explored: Set<string>,
  seen: Set<string>,
  isExpanded: boolean,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const gameState = useGameState.getState();
  const playerPosition = gameState.playerPosition;

  const mapPx = isExpanded ? MAP_SIZE * 1.6 : MAP_SIZE;
  if (canvas.width !== mapPx) canvas.width = mapPx;
  if (canvas.height !== mapPx) canvas.height = mapPx;

  ctx.clearRect(0, 0, mapPx, mapPx);

  const cellPx = mapPx / Math.max(p.maze.width, p.maze.height);
  const theme = getThemeForLevel(p.level);

  ctx.fillStyle = "rgba(5, 8, 16, 0.95)";
  ctx.fillRect(0, 0, mapPx, mapPx);

  for (let cy = 0; cy < p.maze.height; cy++) {
    for (let cx = 0; cx < p.maze.width; cx++) {
      if (!explored.has(`${cx},${cy}`)) continue;

      const px = cx * cellPx;
      const py = cy * cellPx;

      ctx.fillStyle = "rgba(40, 35, 30, 0.8)";
      ctx.fillRect(px, py, cellPx, cellPx);

      const cell = p.maze.cells[cy][cx];
      ctx.strokeStyle = theme.wallBaseHex || "rgba(140, 120, 90, 0.7)";
      ctx.lineWidth = Math.max(1, cellPx * 0.12);

      if (cell.walls.north) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + cellPx, py);
        ctx.stroke();
      }
      if (cell.walls.south) {
        ctx.beginPath();
        ctx.moveTo(px, py + cellPx);
        ctx.lineTo(px + cellPx, py + cellPx);
        ctx.stroke();
      }
      if (cell.walls.west) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + cellPx);
        ctx.stroke();
      }
      if (cell.walls.east) {
        ctx.beginPath();
        ctx.moveTo(px + cellPx, py);
        ctx.lineTo(px + cellPx, py + cellPx);
        ctx.stroke();
      }
    }
  }

  const dotSize = Math.max(2, cellPx * 0.3);

  p.fogZonePositions.forEach((f, i) => {
    if (!seen.has(`fog-${i}`)) return;
    const fc = worldToCell(f.x, f.z);
    const fx = fc.x * cellPx + cellPx / 2;
    const fy = fc.y * cellPx + cellPx / 2;
    const r = (f.radius / CELL_SIZE) * cellPx;
    ctx.fillStyle = "rgba(80, 100, 120, 0.25)";
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  p.trapPositions.forEach((t, i) => {
    if (!seen.has(`trap-${i}`)) return;
    const tc = worldToCell(t.x, t.z);
    const tx = tc.x * cellPx + cellPx / 2;
    const ty = tc.y * cellPx + cellPx / 2;
    ctx.fillStyle = "#cc2233";
    drawDiamond(ctx, tx, ty, dotSize * 1.1);
  });

  p.collectiblePositions.forEach((c, i) => {
    if (!seen.has(`gem-${i}`) || p.collectedItems.has(i)) return;
    const cc = worldToCell(c.x, c.z);
    const gx = cc.x * cellPx + cellPx / 2;
    const gy = cc.y * cellPx + cellPx / 2;
    ctx.fillStyle = "#ffa500";
    ctx.beginPath();
    ctx.arc(gx, gy, dotSize, 0, Math.PI * 2);
    ctx.fill();
  });

  p.powerUpPositions.forEach((pu, i) => {
    if (!seen.has(`pu-${i}`) || p.collectedPowerUps.has(i)) return;
    const puc = worldToCell(pu.x, pu.z);
    const pux = puc.x * cellPx + cellPx / 2;
    const puy = puc.y * cellPx + cellPx / 2;
    ctx.fillStyle = "#44aaff";
    drawStar(ctx, pux, puy, dotSize * 1.2);
  });

  p.lorePositions.forEach((lp, i) => {
    if (!seen.has(`lore-${i}`) || p.collectedLore.has(i)) return;
    const lc = worldToCell(lp.x, lp.z);
    const lx = lc.x * cellPx + cellPx / 2;
    const ly = lc.y * cellPx + cellPx / 2;
    const pulse = 0.7 + Math.sin(Date.now() * 0.003 + i) * 0.3;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 4;
    drawScroll(ctx, lx, ly, dotSize * 1.2);
    ctx.shadowBlur = 0;
  });

  if (seen.has("exit")) {
    const ec = worldToCell(p.exitPosition.x, p.exitPosition.z);
    const ex = ec.x * cellPx + cellPx / 2;
    const ey = ec.y * cellPx + cellPx / 2;
    const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
    ctx.fillStyle = `rgba(68, 204, 136, ${pulse})`;
    ctx.shadowColor = "#44cc88";
    ctx.shadowBlur = 6;
    drawDiamond(ctx, ex, ey, dotSize * 1.6);
    ctx.shadowBlur = 0;
  }

  const bossPosition = gameState.bossActive && !gameState.bossDefeated ? gameState.bossPosition : null;
  if (bossPosition && seen.has("boss")) {
    const bc = worldToCell(bossPosition.x, bossPosition.z);
    const bx = bc.x * cellPx + cellPx / 2;
    const by = bc.y * cellPx + cellPx / 2;
    const pulse = 0.7 + Math.sin(Date.now() * 0.004) * 0.3;
    ctx.fillStyle = `rgba(180, 0, 255, ${pulse})`;
    ctx.shadowColor = "#aa00ff";
    ctx.shadowBlur = 5;
    drawSkull(ctx, bx, by, dotSize * 1.8);
    ctx.shadowBlur = 0;
  }

  const ppx = (playerPosition.x / CELL_SIZE) * cellPx;
  const ppy = (playerPosition.z / CELL_SIZE) * cellPx;
  const arrowSize = Math.max(3.5, cellPx * 0.45);

  ctx.save();
  ctx.translate(ppx, ppy);
  ctx.rotate(gameState.playerYaw + Math.PI);

  ctx.fillStyle = "#44ee88";
  ctx.shadowColor = "#44ee88";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(0, -arrowSize);
  ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.5);
  ctx.lineTo(0, arrowSize * 0.2);
  ctx.lineTo(arrowSize * 0.6, arrowSize * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  const borderGrad = ctx.createLinearGradient(0, 0, mapPx, mapPx);
  borderGrad.addColorStop(0, "rgba(210, 140, 60, 0.4)");
  borderGrad.addColorStop(1, "rgba(210, 140, 60, 0.15)");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, mapPx, mapPx);
}

function LegendItem({ color, label, shape }: { color: string; label: string; shape: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <div style={{
        width: 6,
        height: 6,
        background: color,
        borderRadius: shape === "circle" ? "50%" : shape === "diamond" ? 1 : 0,
        transform: shape === "diamond" ? "rotate(45deg) scale(0.8)" : "none",
      }} />
      <span style={{
        fontSize: 7,
        fontFamily: THEME.fonts.mono,
        color: "rgba(180,160,130,0.5)",
      }}>
        {label}
      </span>
    </div>
  );
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const method = i === 0 ? "moveTo" : "lineTo";
    ctx[method](x + Math.cos(angle) * size, y + Math.sin(angle) * size);
  }
  ctx.closePath();
  ctx.fill();
}

function drawScroll(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.3, size * 0.25, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - size * 0.15, y - size * 0.3, size * 0.3, size * 0.6);
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.3, size * 0.25, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkull(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.arc(x, y - size * 0.15, size * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - size * 0.25, y + size * 0.3, size * 0.5, size * 0.3);
}
