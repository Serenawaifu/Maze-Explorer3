export interface MazeCell {
  x: number;
  y: number;
  walls: { north: boolean; south: boolean; east: boolean; west: boolean };
  visited: boolean;
}

export interface MazeData {
  width: number;
  height: number;
  cells: MazeCell[][];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export function generateMaze(width: number, height: number): MazeData {
  const cells: MazeCell[][] = [];
  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      cells[y][x] = {
        x,
        y,
        walls: { north: true, south: true, east: true, west: true },
        visited: false,
      };
    }
  }

  const stack: MazeCell[] = [];
  const startCell = cells[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, cells, width, height);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      next.visited = true;
      stack.push(next);
    }
  }

  return {
    width,
    height,
    cells,
    start: { x: 0, y: 0 },
    end: { x: width - 1, y: height - 1 },
  };
}

function getUnvisitedNeighbors(
  cell: MazeCell,
  cells: MazeCell[][],
  width: number,
  height: number
): MazeCell[] {
  const neighbors: MazeCell[] = [];
  const { x, y } = cell;

  if (y > 0 && !cells[y - 1][x].visited) neighbors.push(cells[y - 1][x]);
  if (y < height - 1 && !cells[y + 1][x].visited) neighbors.push(cells[y + 1][x]);
  if (x > 0 && !cells[y][x - 1].visited) neighbors.push(cells[y][x - 1]);
  if (x < width - 1 && !cells[y][x + 1].visited) neighbors.push(cells[y][x + 1]);

  return neighbors;
}

function removeWall(a: MazeCell, b: MazeCell) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  if (dx === 1) {
    a.walls.west = false;
    b.walls.east = false;
  } else if (dx === -1) {
    a.walls.east = false;
    b.walls.west = false;
  }

  if (dy === 1) {
    a.walls.north = false;
    b.walls.south = false;
  } else if (dy === -1) {
    a.walls.south = false;
    b.walls.north = false;
  }
}

export function getWallSegments(maze: MazeData): { x: number; z: number; rotated: boolean }[] {
  const walls: { x: number; z: number; rotated: boolean }[] = [];
  const cellSize = 4;

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const cell = maze.cells[y][x];
      const cx = x * cellSize;
      const cz = y * cellSize;

      if (cell.walls.north) {
        walls.push({ x: cx, z: cz - cellSize / 2, rotated: false });
      }
      if (cell.walls.west) {
        walls.push({ x: cx - cellSize / 2, z: cz, rotated: true });
      }
      if (x === maze.width - 1 && cell.walls.east) {
        walls.push({ x: cx + cellSize / 2, z: cz, rotated: true });
      }
      if (y === maze.height - 1 && cell.walls.south) {
        walls.push({ x: cx, z: cz + cellSize / 2, rotated: false });
      }
    }
  }

  return walls;
}

export function getCollectiblePositions(
  maze: MazeData,
  count: number
): { x: number; z: number }[] {
  const cellSize = 4;
  const positions: { x: number; z: number }[] = [];
  const available: { x: number; y: number }[] = [];

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (x === 0 && y === 0) continue;
      if (x === maze.width - 1 && y === maze.height - 1) continue;
      available.push({ x, y });
    }
  }

  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const actualCount = Math.min(count, available.length);
  for (let i = 0; i < actualCount; i++) {
    positions.push({
      x: available[i].x * cellSize,
      z: available[i].y * cellSize,
    });
  }

  return positions;
}

export type EnemyType = "stalker" | "rusher";

export interface EnemyPathData {
  points: { x: number; z: number }[];
  speed: number;
  enemyType: EnemyType;
  detectionRange: number;
  chaseSpeed: number;
  homeCell: { x: number; y: number };
}

export function getEnemyPaths(
  maze: MazeData,
  count: number
): EnemyPathData[] {
  const cellSize = 4;
  const paths: EnemyPathData[] = [];
  const used = new Set<string>();

  used.add("0,0");
  used.add(`${maze.width - 1},${maze.height - 1}`);

  for (let i = 0; i < count; i++) {
    let startX: number, startY: number;
    let attempts = 0;
    do {
      startX = Math.floor(Math.random() * maze.width);
      startY = Math.floor(Math.random() * maze.height);
      attempts++;
    } while (used.has(`${startX},${startY}`) && attempts < 100);

    if (attempts >= 100) continue;
    used.add(`${startX},${startY}`);

    const pathPoints: { x: number; z: number }[] = [];
    pathPoints.push({ x: startX * cellSize, z: startY * cellSize });

    let cx = startX;
    let cy = startY;
    const pathLength = 2 + Math.floor(Math.random() * 3);

    for (let step = 0; step < pathLength; step++) {
      const cell = maze.cells[cy][cx];
      const options: { nx: number; ny: number }[] = [];

      if (!cell.walls.north && cy > 0) options.push({ nx: cx, ny: cy - 1 });
      if (!cell.walls.south && cy < maze.height - 1) options.push({ nx: cx, ny: cy + 1 });
      if (!cell.walls.east && cx < maze.width - 1) options.push({ nx: cx + 1, ny: cy });
      if (!cell.walls.west && cx > 0) options.push({ nx: cx - 1, ny: cy });

      if (options.length === 0) break;

      const chosen = options[Math.floor(Math.random() * options.length)];
      cx = chosen.nx;
      cy = chosen.ny;
      pathPoints.push({ x: cx * cellSize, z: cy * cellSize });
    }

    if (pathPoints.length >= 2) {
      const isStalker = Math.random() < 0.5;
      const enemyType: EnemyType = isStalker ? "stalker" : "rusher";

      paths.push({
        points: pathPoints,
        speed: isStalker ? 1.2 + Math.random() * 0.5 : 1.8 + Math.random() * 1.2,
        enemyType,
        detectionRange: isStalker ? 18 : 8,
        chaseSpeed: isStalker ? 2.5 : 5.5,
        homeCell: { x: startX, y: startY },
      });
    }
  }

  return paths;
}

export type PowerUpType = "speed_boost" | "shield" | "health_potion" | "torch_upgrade";

export interface PowerUpData {
  x: number;
  z: number;
  type: PowerUpType;
}

export interface TrapData {
  x: number;
  z: number;
  cellX: number;
  cellY: number;
}

export interface FogZoneData {
  x: number;
  z: number;
  radius: number;
}

export function getPowerUpPositions(maze: MazeData, count: number): PowerUpData[] {
  const cellSize = 4;
  const available: { x: number; y: number }[] = [];
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (x === 0 && y === 0) continue;
      if (x === maze.width - 1 && y === maze.height - 1) continue;
      if (x < 2 && y < 2) continue;
      available.push({ x, y });
    }
  }
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const types: PowerUpType[] = ["speed_boost", "shield", "health_potion", "torch_upgrade"];
  const actualCount = Math.min(count, available.length);
  const result: PowerUpData[] = [];
  for (let i = 0; i < actualCount; i++) {
    result.push({
      x: available[i].x * cellSize,
      z: available[i].y * cellSize,
      type: types[i % types.length],
    });
  }
  return result;
}

export function getTrapPositions(maze: MazeData, count: number): TrapData[] {
  const cellSize = 4;
  const available: { x: number; y: number }[] = [];
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (x === 0 && y === 0) continue;
      if (x === maze.width - 1 && y === maze.height - 1) continue;
      if (x <= 1 && y <= 1) continue;
      available.push({ x, y });
    }
  }
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const actualCount = Math.min(count, available.length);
  const result: TrapData[] = [];
  for (let i = 0; i < actualCount; i++) {
    result.push({
      x: available[i].x * cellSize,
      z: available[i].y * cellSize,
      cellX: available[i].x,
      cellY: available[i].y,
    });
  }
  return result;
}

export function getFogZonePositions(maze: MazeData, count: number): FogZoneData[] {
  const cellSize = 4;
  const available: { x: number; y: number }[] = [];
  for (let y = 2; y < maze.height - 1; y++) {
    for (let x = 2; x < maze.width - 1; x++) {
      available.push({ x, y });
    }
  }
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const actualCount = Math.min(count, available.length);
  const result: FogZoneData[] = [];
  for (let i = 0; i < actualCount; i++) {
    result.push({
      x: available[i].x * cellSize,
      z: available[i].y * cellSize,
      radius: 3 + Math.random() * 2,
    });
  }
  return result;
}

export interface LorePositionData {
  x: number;
  z: number;
  loreId: string;
}

export function getLorePositions(maze: MazeData, loreIds: string[]): LorePositionData[] {
  if (loreIds.length === 0) return [];
  const cellSize = 4;
  const available: { x: number; y: number }[] = [];
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (x === 0 && y === 0) continue;
      if (x === maze.width - 1 && y === maze.height - 1) continue;
      if (x <= 2 && y <= 2) continue;
      available.push({ x, y });
    }
  }
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const count = Math.min(loreIds.length, available.length);
  const result: LorePositionData[] = [];
  for (let i = 0; i < count; i++) {
    result.push({
      x: available[i].x * cellSize,
      z: available[i].y * cellSize,
      loreId: loreIds[i],
    });
  }
  return result;
}

function packKey(x: number, y: number): number {
  return (y << 10) | x;
}

export function bfsPath(
  maze: MazeData,
  fromCell: { x: number; y: number },
  toCell: { x: number; y: number }
): { x: number; y: number }[] | null {
  if (fromCell.x === toCell.x && fromCell.y === toCell.y) return [fromCell];

  const visited = new Set<number>();
  const parentX = new Int16Array(maze.width * maze.height);
  const parentY = new Int16Array(maze.width * maze.height);
  const hasParent = new Uint8Array(maze.width * maze.height);

  const queue: number[] = [];
  let head = 0;
  const startKey = packKey(fromCell.x, fromCell.y);
  queue.push(startKey);
  visited.add(startKey);

  while (head < queue.length) {
    const curKey = queue[head++];
    const cx = curKey & 0x3FF;
    const cy = curKey >> 10;
    const cell = maze.cells[cy][cx];

    const dirs: [boolean, number, number][] = [
      [!cell.walls.north && cy > 0, cx, cy - 1],
      [!cell.walls.south && cy < maze.height - 1, cx, cy + 1],
      [!cell.walls.east && cx < maze.width - 1, cx + 1, cy],
      [!cell.walls.west && cx > 0, cx - 1, cy],
    ];

    for (let d = 0; d < 4; d++) {
      if (!dirs[d][0]) continue;
      const nx = dirs[d][1];
      const ny = dirs[d][2];
      const nKey = packKey(nx, ny);
      if (visited.has(nKey)) continue;
      visited.add(nKey);
      const nIdx = ny * maze.width + nx;
      parentX[nIdx] = cx;
      parentY[nIdx] = cy;
      hasParent[nIdx] = 1;

      if (nx === toCell.x && ny === toCell.y) {
        const path: { x: number; y: number }[] = [{ x: nx, y: ny }];
        let px = nx, py = ny;
        while (hasParent[py * maze.width + px]) {
          const idx = py * maze.width + px;
          const ppx = parentX[idx];
          const ppy = parentY[idx];
          path.push({ x: ppx, y: ppy });
          px = ppx;
          py = ppy;
        }
        path.reverse();
        return path;
      }
      queue.push(nKey);
    }
  }

  return null;
}
