export interface LevelTheme {
  name: string;
  wallColor: [number, number, number];
  wallBaseHex: string;
  wallBrickFn: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
  floorBaseHex: string;
  floorColor: [number, number, number];
  floorTileFn: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
  ceilingBaseHex: string;
  ceilingColor: [number, number, number];
  fogColor: string;
  fogColorHex: number;
  ambientColor: string;
  ambientIntensity: number;
  torchColor: string;
  directionalColor: string;
}

function stoneBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 110 + Math.random() * 40;
  const g = 85 + Math.random() * 30;
  const b = 55 + Math.random() * 25;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = `rgba(40,25,12,0.6)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  for (let n = 0; n < 15; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    const shade = 80 + Math.random() * 50;
    ctx.fillStyle = `rgba(${shade},${shade * 0.75},${shade * 0.5},0.3)`;
    ctx.fillRect(nx, ny, 2, 2);
  }
  if (Math.random() < 0.15) {
    const mx = x + 10 + Math.random() * (w - 20);
    const my = y + 5 + Math.random() * (h - 10);
    ctx.fillStyle = `rgba(70,95,45,${0.15 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(mx, my, 3 + Math.random() * 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mossyBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 60 + Math.random() * 30;
  const g = 90 + Math.random() * 40;
  const b = 55 + Math.random() * 25;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = `rgba(20,40,15,0.6)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  for (let n = 0; n < 10; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    ctx.fillStyle = `rgba(40,${80 + Math.random() * 40},30,0.4)`;
    ctx.fillRect(nx, ny, 2, 2);
  }
  if (Math.random() < 0.35) {
    const mx = x + 5 + Math.random() * (w - 10);
    const my = y + 3 + Math.random() * (h - 6);
    ctx.fillStyle = `rgba(30,${100 + Math.random() * 60},20,${0.25 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(mx, my, 4 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  if (Math.random() < 0.2) {
    ctx.fillStyle = `rgba(60,140,80,0.15)`;
    for (let v = 0; v < 3; v++) {
      const vx = x + Math.random() * w;
      ctx.fillRect(vx, y, 1, h);
    }
  }
}

function lavaBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 35 + Math.random() * 20;
  const g = 25 + Math.random() * 15;
  const b = 30 + Math.random() * 15;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = `rgba(80,20,10,0.7)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  for (let n = 0; n < 8; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    ctx.fillStyle = `rgba(${20 + Math.random() * 20},${15 + Math.random() * 10},${20 + Math.random() * 10},0.5)`;
    ctx.fillRect(nx, ny, 2, 2);
  }
  if (Math.random() < 0.2) {
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
    grad.addColorStop(0, `rgba(255,${80 + Math.random() * 60},0,0.25)`);
    grad.addColorStop(1, `rgba(180,30,0,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
}

function iceBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 140 + Math.random() * 40;
  const g = 160 + Math.random() * 40;
  const b = 190 + Math.random() * 40;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = `rgba(100,140,180,0.5)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  for (let n = 0; n < 6; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    ctx.fillStyle = `rgba(200,220,255,${0.3 + Math.random() * 0.3})`;
    ctx.fillRect(nx, ny, 1 + Math.random() * 3, 1);
  }
  if (Math.random() < 0.3) {
    ctx.strokeStyle = `rgba(180,210,240,0.2)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const sx = x + Math.random() * w;
    const sy = y + Math.random() * h;
    ctx.moveTo(sx, sy);
    for (let s = 0; s < 3; s++) {
      ctx.lineTo(sx + (Math.random() - 0.5) * 20, sy + (Math.random() - 0.5) * 15);
    }
    ctx.stroke();
  }
}

function shadowBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const v = 15 + Math.random() * 15;
  ctx.fillStyle = `rgb(${v},${v},${v + 5})`;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = `rgba(80,0,120,0.4)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  for (let n = 0; n < 5; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    ctx.fillStyle = `rgba(${10 + Math.random() * 10},${5 + Math.random() * 8},${15 + Math.random() * 10},0.5)`;
    ctx.fillRect(nx, ny, 2, 2);
  }
  if (Math.random() < 0.15) {
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const symbols = ["⟁", "◇", "⊕", "△"];
    ctx.font = `${6 + Math.random() * 4}px monospace`;
    ctx.fillStyle = `rgba(${140 + Math.random() * 60},0,${200 + Math.random() * 55},${0.3 + Math.random() * 0.3})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbols[Math.floor(Math.random() * symbols.length)], cx, cy);
  }
}

function stoneFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = 60 + Math.random() * 20;
  const g = 50 + Math.random() * 15;
  const b = 38 + Math.random() * 12;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.strokeStyle = "rgba(25,18,10,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
}

function mossyFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = 35 + Math.random() * 15;
  const g = 55 + Math.random() * 25;
  const b = 30 + Math.random() * 12;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.strokeStyle = "rgba(15,30,10,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
  if (Math.random() < 0.4) {
    ctx.fillStyle = `rgba(40,${80 + Math.random() * 40},25,0.3)`;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function lavaFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const v = 25 + Math.random() * 15;
  ctx.fillStyle = `rgb(${v + 5}, ${v}, ${v})`;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.strokeStyle = "rgba(60,15,5,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
  if (Math.random() < 0.15) {
    const grad = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size * 0.4);
    grad.addColorStop(0, `rgba(255,${60 + Math.random() * 40},0,0.3)`);
    grad.addColorStop(1, `rgba(120,20,0,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, size, size);
  }
}

function iceFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = 130 + Math.random() * 30;
  const g = 150 + Math.random() * 30;
  const b = 180 + Math.random() * 30;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.strokeStyle = "rgba(80,120,160,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = `rgba(220,240,255,0.15)`;
  ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.15);
}

function shadowFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const v = 12 + Math.random() * 10;
  ctx.fillStyle = `rgb(${v}, ${v}, ${v + 3})`;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.strokeStyle = "rgba(60,0,90,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);
  if (Math.random() < 0.1) {
    ctx.fillStyle = `rgba(${120 + Math.random() * 60},0,${180 + Math.random() * 75},0.15)`;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const LEVEL_THEMES: LevelTheme[] = [
  {
    name: "Stone Dungeon",
    wallColor: [0.55, 0.42, 0.3],
    wallBaseHex: "#8a6e55",
    wallBrickFn: stoneBrick,
    floorBaseHex: "#4a3828",
    floorColor: [0.35, 0.28, 0.2],
    floorTileFn: stoneFloorTile,
    ceilingBaseHex: "#1a120a",
    ceilingColor: [0.12, 0.08, 0.05],
    fogColor: "#1a0f08",
    fogColorHex: 0x1a0f08,
    ambientColor: "#ffcc88",
    ambientIntensity: 0.35,
    torchColor: "#ff9933",
    directionalColor: "#ffd4a0",
  },
  {
    name: "Mossy Catacombs",
    wallColor: [0.3, 0.45, 0.28],
    wallBaseHex: "#4a7040",
    wallBrickFn: mossyBrick,
    floorBaseHex: "#2a3a20",
    floorColor: [0.2, 0.3, 0.15],
    floorTileFn: mossyFloorTile,
    ceilingBaseHex: "#0e160a",
    ceilingColor: [0.06, 0.1, 0.04],
    fogColor: "#0e1808",
    fogColorHex: 0x0e1808,
    ambientColor: "#88cc88",
    ambientIntensity: 0.3,
    torchColor: "#66cc44",
    directionalColor: "#a0d4a0",
  },
  {
    name: "Lava Caves",
    wallColor: [0.25, 0.18, 0.2],
    wallBaseHex: "#2a1a1e",
    wallBrickFn: lavaBrick,
    floorBaseHex: "#1a0e0e",
    floorColor: [0.15, 0.08, 0.08],
    floorTileFn: lavaFloorTile,
    ceilingBaseHex: "#120808",
    ceilingColor: [0.08, 0.04, 0.04],
    fogColor: "#1a0800",
    fogColorHex: 0x1a0800,
    ambientColor: "#ff6644",
    ambientIntensity: 0.4,
    torchColor: "#ff4400",
    directionalColor: "#ff8844",
  },
  {
    name: "Frozen Crypts",
    wallColor: [0.55, 0.65, 0.8],
    wallBaseHex: "#8aa0c0",
    wallBrickFn: iceBrick,
    floorBaseHex: "#5a6a80",
    floorColor: [0.4, 0.5, 0.6],
    floorTileFn: iceFloorTile,
    ceilingBaseHex: "#1a2030",
    ceilingColor: [0.1, 0.12, 0.18],
    fogColor: "#0c1420",
    fogColorHex: 0x0c1420,
    ambientColor: "#88bbff",
    ambientIntensity: 0.45,
    torchColor: "#4488ff",
    directionalColor: "#88aadd",
  },
  {
    name: "Shadow Realm",
    wallColor: [0.12, 0.1, 0.15],
    wallBaseHex: "#1a1520",
    wallBrickFn: shadowBrick,
    floorBaseHex: "#0a0810",
    floorColor: [0.06, 0.05, 0.08],
    floorTileFn: shadowFloorTile,
    ceilingBaseHex: "#060410",
    ceilingColor: [0.03, 0.02, 0.06],
    fogColor: "#08041a",
    fogColorHex: 0x08041a,
    ambientColor: "#aa66ff",
    ambientIntensity: 0.25,
    torchColor: "#9933ff",
    directionalColor: "#8844cc",
  },
];

export function getThemeForLevel(level: number): LevelTheme {
  return LEVEL_THEMES[Math.min(level - 1, LEVEL_THEMES.length - 1)];
}
