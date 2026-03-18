import { useRef, useEffect, useCallback } from "react";
import { useGameState } from "./gameState";
import { THEME } from "./theme";
import type { MazeData } from "./mazeGenerator";

const CELL_SIZE = 4;
const COMPASS_REDRAW_INTERVAL = 50;

interface CompassProps {
  maze: MazeData;
}

export function Compass({ maze }: CompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screen = useGameState((s) => s.screen);
  const propsRef = useRef({ maze });
  propsRef.current = { maze };

  const drawBg = useCallback(() => {
    const bg = document.createElement("canvas");
    const size = 140;
    bg.width = size;
    bg.height = size;
    const ctx = bg.getContext("2d")!;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 58;

    ctx.fillStyle = "rgba(14, 8, 4, 0.88)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(210, 140, 60, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(210, 140, 60, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(210, 140, 60, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 36; i++) {
      const angle = (i * Math.PI * 2) / 36;
      const inner = i % 9 === 0 ? radius - 10 : radius - 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.stroke();
    }

    const cardinals = [
      { label: "N", angle: -Math.PI / 2 },
      { label: "E", angle: 0 },
      { label: "S", angle: Math.PI / 2 },
      { label: "W", angle: Math.PI },
    ];

    ctx.font = "bold 10px 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(210, 140, 60, 0.5)";

    cardinals.forEach(({ label, angle }) => {
      const dist = radius - 16;
      const lx = cx + Math.cos(angle) * dist;
      const ly = cy + Math.sin(angle) * dist;
      ctx.fillText(label, lx, ly);
    });

    ctx.strokeStyle = "rgba(210, 140, 60, 0.06)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - radius + 20, cy);
    ctx.lineTo(cx + radius - 20, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius + 20);
    ctx.lineTo(cx, cy + radius - 20);
    ctx.stroke();

    bgCanvasRef.current = bg;
  }, []);

  useEffect(() => {
    drawBg();
  }, [drawBg]);

  useEffect(() => {
    if (screen !== "playing") return;

    function tick() {
      const canvas = canvasRef.current;
      const bg = bgCanvasRef.current;
      if (!canvas || !bg) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const p = propsRef.current;
      const state = useGameState.getState();
      const playerPosition = state.playerPosition;
      const collectiblesGathered = state.collectiblesGathered;
      const totalCollectibles = state.totalCollectibles;

      const size = 140;
      if (canvas.width !== size) canvas.width = size;
      if (canvas.height !== size) canvas.height = size;
      const cx = size / 2;
      const cy = size / 2;
      const radius = 58;

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(bg, 0, 0);

      const exitWorldX = (p.maze.width - 1) * CELL_SIZE;
      const exitWorldZ = (p.maze.height - 1) * CELL_SIZE;
      const dx = exitWorldX - playerPosition.x;
      const dz = exitWorldZ - playerPosition.z;
      const angleToExit = Math.atan2(dx, -dz);
      const relativeAngle = angleToExit + state.playerYaw;

      const needleAngle = relativeAngle - Math.PI / 2;
      const needleLen = radius - 22;

      const allCollected = collectiblesGathered >= totalCollectibles;
      const needleColor = allCollected ? "#44cc88" : "#d2882a";
      const needleGlow = allCollected ? "#44cc88" : "#ff8800";

      ctx.save();
      ctx.shadowColor = needleGlow;
      ctx.shadowBlur = 8;

      ctx.fillStyle = needleColor;
      ctx.beginPath();
      const tipX = cx + Math.cos(needleAngle) * needleLen;
      const tipY = cy + Math.sin(needleAngle) * needleLen;
      const baseL = needleAngle + Math.PI / 2;
      const baseR = needleAngle - Math.PI / 2;
      const baseWidth = 5;
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(cx + Math.cos(baseL) * baseWidth, cy + Math.sin(baseL) * baseWidth);
      ctx.lineTo(cx + Math.cos(needleAngle + Math.PI) * 10, cy + Math.sin(needleAngle + Math.PI) * 10);
      ctx.lineTo(cx + Math.cos(baseR) * baseWidth, cy + Math.sin(baseR) * baseWidth);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = "rgba(80, 40, 20, 0.6)";
      ctx.beginPath();
      const tailX = cx + Math.cos(needleAngle + Math.PI) * 10;
      const tailY = cy + Math.sin(needleAngle + Math.PI) * 10;
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(cx + Math.cos(baseL) * baseWidth, cy + Math.sin(baseL) * baseWidth);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + Math.cos(baseR) * baseWidth, cy + Math.sin(baseR) * baseWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(210, 140, 60, 0.7)";
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(30, 18, 8, 0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      const dist = Math.sqrt(dx * dx + dz * dz);
      const maxDist = Math.sqrt(exitWorldX * exitWorldX + exitWorldZ * exitWorldZ);
      const distPct = Math.min(1, dist / maxDist);

      ctx.font = "9px 'Rajdhani', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(210, 140, 60, 0.4)";

      let distLabel: string;
      if (dist < 8) {
        distLabel = "NEAR";
        ctx.fillStyle = allCollected ? "rgba(68, 204, 136, 0.7)" : "rgba(210, 140, 60, 0.7)";
      } else if (distPct < 0.3) {
        distLabel = "CLOSE";
      } else if (distPct < 0.6) {
        distLabel = "MID";
      } else {
        distLabel = "FAR";
      }
      ctx.fillText(distLabel, cx, cy + radius + 2);
    }

    tick();
    const id = setInterval(tick, COMPASS_REDRAW_INTERVAL);
    return () => clearInterval(id);
  }, [screen]);

  if (screen !== "playing") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 14,
        right: 14,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div style={{
        fontSize: 8,
        fontFamily: THEME.fonts.heading,
        color: THEME.colors.textMuted,
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 3,
        textAlign: "center",
      }}>
        Exit Compass
      </div>
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: "50%",
          border: `1px solid ${THEME.colors.panelBorder}`,
          boxShadow: `0 4px 24px rgba(0,0,0,0.6), ${THEME.glow.primary}`,
        }}
      />
    </div>
  );
}
