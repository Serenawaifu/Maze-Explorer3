import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateMaze, getCollectiblePositions, getEnemyPaths, getPowerUpPositions, getTrapPositions, getFogZonePositions, getLorePositions } from "./mazeGenerator";
import type { PowerUpType, EnemyPathData } from "./mazeGenerator";
import { MazeWalls, MazeFloor, MazeCeiling, ExitMarker } from "./MazeWalls";
import { PlayerController } from "./PlayerController";
import { Collectible } from "./Collectible";
import { Enemy } from "./Enemy";
import { Boss } from "./Boss";
import { PowerUp } from "./PowerUp";
import { SpikeTrap } from "./SpikeTrap";
import { FogZone } from "./FogZone";
import { LoreFragment } from "./LoreFragment";
import { HUD } from "./HUD";
import { Compass } from "./Compass";
import { MiniMap } from "./MiniMap";
import { LoreOverlay } from "./LoreOverlay";
import { useGameState } from "./gameState";
import { getThemeForLevel } from "./levelThemes";
import { getLoreForLevel } from "./loreFragments";
import {
  startAmbient,
  stopAmbient,
  flushProximityFrame,
  playLevelComplete,
  playVictoryFanfare,
  playGameOver,
  playBossRoar,
  playBossDeath,
  playCollapseRumble,
} from "./audioSystem";

const CELL_SIZE = 4;
const POINTS_PER_ITEM = 100;

const MAX_ACTIVE_TORCH_LIGHTS = 10;

function FlickeringTorchLights({ maze, torchColor }: { maze: { width: number; height: number }; torchColor: string }) {
  const lightsRef = useRef<THREE.PointLight[]>([]);
  const allPositions = useMemo(() => {
    const lights: [number, number, number][] = [];
    const spacing = 5;
    for (let x = 1; x < maze.width; x += spacing) {
      for (let z = 1; z < maze.height; z += spacing) {
        lights.push([x * CELL_SIZE, 2.8, z * CELL_SIZE]);
      }
    }
    if (lights.length > 40) return lights.slice(0, 40);
    return lights;
  }, [maze.width, maze.height]);

  const lightPool = useMemo(() => {
    return Array.from({ length: MAX_ACTIVE_TORCH_LIGHTS });
  }, []);

  useFrame(() => {
    const t = Date.now() * 0.001;
    const pp = useGameState.getState().playerPosition;

    const sorted = allPositions
      .map((pos, i) => ({
        pos,
        i,
        dist: (pos[0] - pp.x) ** 2 + (pos[2] - pp.z) ** 2,
      }))
      .sort((a, b) => a.dist - b.dist);

    for (let li = 0; li < MAX_ACTIVE_TORCH_LIGHTS; li++) {
      const light = lightsRef.current[li];
      if (!light) continue;
      if (li < sorted.length) {
        const s = sorted[li];
        light.position.set(s.pos[0], s.pos[1], s.pos[2]);
        const flicker = 1.0 + Math.sin(t * 8 + s.i * 2.3) * 0.15 + Math.sin(t * 13 + s.i * 5.7) * 0.1 + (Math.random() - 0.5) * 0.08;
        light.intensity = 1.5 * flicker;
        light.visible = true;
      } else {
        light.visible = false;
      }
    }
  });

  return (
    <>
      {lightPool.map((_, i) => (
        <pointLight
          key={i}
          ref={(el) => { if (el) lightsRef.current[i] = el; }}
          position={[0, 0, 0]}
          color={torchColor}
          intensity={1.5}
          distance={12}
          decay={2}
        />
      ))}
    </>
  );
}

function WallTorchModels({ maze }: { maze: { width: number; height: number } }) {
  const positions = useMemo(() => {
    const torches: { pos: [number, number, number]; rot: number }[] = [];
    const spacing = 5;
    for (let x = 1; x < maze.width; x += spacing) {
      for (let z = 1; z < maze.height; z += spacing) {
        torches.push({
          pos: [x * CELL_SIZE - 0.1, 2.2, z * CELL_SIZE],
          rot: Math.PI / 2,
        });
      }
    }
    if (torches.length > 40) return torches.slice(0, 40);
    return torches;
  }, [maze.width, maze.height]);

  const handleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#3a2818",
    roughness: 0.9,
    metalness: 0.1,
  }), []);

  const flameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ff6600",
    emissive: "#ff4400",
    emissiveIntensity: 3,
    transparent: true,
    opacity: 0.8,
  }), []);

  return (
    <>
      {positions.map((t, i) => (
        <group key={i} position={t.pos}>
          <mesh material={handleMat}>
            <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
          </mesh>
          <mesh position={[0, 0.35, 0]} material={flameMat}>
            <sphereGeometry args={[0.1, 6, 6]} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.06, 4, 4]} />
            <meshStandardMaterial color="#ffcc44" emissive="#ffaa00" emissiveIntensity={5} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function PortalParticles({ maze }: { maze: { width: number; height: number } }) {
  const pointsRef = useRef<THREE.Points>(null);
  const x = (maze.width - 1) * CELL_SIZE;
  const z = (maze.height - 1) * CELL_SIZE;
  const count = 60;

  const { positions: initPos, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 1.5;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      speeds[i] = 0.5 + Math.random() * 1;
    }
    return { positions, speeds };
  }, []);

  const mat = useMemo(() => new THREE.PointsMaterial({
    color: "#ffaa33",
    size: 0.08,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const t = Date.now() * 0.001;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * speeds[i];
      const angle = t * speeds[i] + i;
      const r = 0.5 + Math.sin(t * 0.5 + i) * 0.5;
      arr[i * 3] += Math.cos(angle) * delta * 0.3;
      arr[i * 3 + 2] += Math.sin(angle) * delta * 0.3;
      if (arr[i * 3 + 1] > 3.5) {
        arr[i * 3 + 1] = 0;
        const a2 = Math.random() * Math.PI * 2;
        const r2 = 0.5 + Math.random() * 1.5;
        arr[i * 3] = Math.cos(a2) * r2;
        arr[i * 3 + 2] = Math.sin(a2) * r2;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[x, 0, z]} material={mat}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initPos, 3]} count={count} />
      </bufferGeometry>
    </points>
  );
}

function DynamicFog({ fogColorHex }: { fogColorHex: number }) {
  const { scene } = useThree();
  const inFogZone = useGameState((s) => s.inFogZone);
  const hasTorch = useGameState((s) => s.hasPowerUp("torch_upgrade"));

  useEffect(() => {
    if (scene.fog) {
      (scene.fog as THREE.Fog).color.setHex(fogColorHex);
    }
  }, [scene, fogColorHex]);

  useFrame(() => {
    if (!scene.fog) return;
    const fog = scene.fog as THREE.Fog;
    const targetNear = inFogZone ? 0.5 : 2;
    const targetFar = inFogZone ? 8 : (hasTorch ? 50 : 35);
    fog.near += (targetNear - fog.near) * 0.05;
    fog.far += (targetFar - fog.far) * 0.05;
  });

  return null;
}

function PowerUpTicker() {
  const tickPowerUps = useGameState((s) => s.tickPowerUps);
  useFrame((_, delta) => {
    const { screen } = useGameState.getState();
    if (screen !== "playing") return;
    tickPowerUps(delta);
  });
  return null;
}

function BossTimerTicker() {
  const tickBossTimers = useGameState((s) => s.tickBossTimers);
  useFrame((_, delta) => {
    const { screen } = useGameState.getState();
    if (screen !== "playing") return;
    tickBossTimers(delta);
  });
  return null;
}

function FrameFreezeGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function CollapsingWalls({ maze, progress }: { maze: { width: number; height: number }; progress: number }) {
  const wallsRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!wallsRef.current) return;
    const children = wallsRef.current.children;
    const t = Date.now() * 0.001;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const seed = (i * 137.5) % 1;
      const delay = seed * 0.5;
      const localProgress = Math.max(0, Math.min(1, (progress - delay) / 0.5));
      child.rotation.x = localProgress * (0.3 + seed * 0.5) * (seed > 0.5 ? 1 : -1);
      child.rotation.z = localProgress * (0.2 + seed * 0.3) * (seed > 0.3 ? 1 : -1);
      child.position.y = -localProgress * (2 + seed * 3);
      if (localProgress > 0) {
        child.position.x += Math.sin(t * 10 + i) * 0.01 * progress;
        child.position.z += Math.cos(t * 12 + i) * 0.01 * progress;
      }
    }
  });

  const debris = useMemo(() => {
    const pieces: { x: number; z: number; w: number; h: number }[] = [];
    const step = 4;
    for (let x = 0; x < maze.width * CELL_SIZE; x += step) {
      for (let z = 0; z < maze.height * CELL_SIZE; z += step) {
        if (Math.random() < 0.4) {
          pieces.push({
            x: x + (Math.random() - 0.5) * step,
            z: z + (Math.random() - 0.5) * step,
            w: 0.3 + Math.random() * 0.8,
            h: 0.3 + Math.random() * 1.5,
          });
        }
      }
    }
    return pieces;
  }, [maze.width, maze.height]);

  return (
    <group ref={wallsRef}>
      {debris.map((d, i) => (
        <mesh key={i} position={[d.x, 2 + Math.random() * 1.5, d.z]}>
          <boxGeometry args={[d.w, d.h, d.w]} />
          <meshStandardMaterial color="#1a0825" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function EnemyProximityTracker() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const { screen } = useGameState.getState();
      if (screen !== "playing") return;
      flushProximityFrame();
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}

export function GameScene() {
  const screen = useGameState((s) => s.screen);
  const level = useGameState((s) => s.level);
  const runId = useGameState((s) => s.runId);
  const addScore = useGameState((s) => s.addScore);
  const collectItem = useGameState((s) => s.collectItem);
  const takeDamage = useGameState((s) => s.takeDamage);
  const setScreen = useGameState((s) => s.setScreen);
  const getLevelConfig = useGameState((s) => s.getLevelConfig);
  const addPowerUp = useGameState((s) => s.addPowerUp);
  const setInFogZone = useGameState((s) => s.setInFogZone);
  const bossActive = useGameState((s) => s.bossActive);
  const bossDefeated = useGameState((s) => s.bossDefeated);
  const collapseTimer = useGameState((s) => s.collapseTimer);


  const config = getLevelConfig();
  const isStartScreen = screen === "start" || screen === "leaderboard" || screen === "shop";
  const prevScreenRef = useRef(screen);
  const fogZoneCountRef = useRef(0);
  const bossRoaredRef = useRef(false);
  const collapseStartedRef = useRef(false);
  const [summonedMinions, setSummonedMinions] = useState<EnemyPathData[]>([]);
  const [collectedItems, setCollectedItems] = useState<Set<number>>(new Set());
  const [collectedPowerUps, setCollectedPowerUps] = useState<Set<number>>(new Set());
  const [collectedLore, setCollectedLore] = useState<Set<number>>(new Set());
  const collectLore = useGameState((s) => s.collectLore);

  useEffect(() => {
    if (screen === "playing") {
      startAmbient();
      fogZoneCountRef.current = 0;
      setInFogZone(false);
      bossRoaredRef.current = false;
      collapseStartedRef.current = false;
      setSummonedMinions([]);
      setCollectedItems(new Set());
      setCollectedPowerUps(new Set());
      setCollectedLore(new Set());
    } else {
      stopAmbient();
    }
  }, [screen, setInFogZone]);

  useEffect(() => {
    if (bossActive && screen === "playing" && !bossRoaredRef.current) {
      bossRoaredRef.current = true;
      setTimeout(() => playBossRoar(), 1000);
    }
  }, [bossActive, screen]);

  useEffect(() => {
    if (bossDefeated && !collapseStartedRef.current) {
      collapseStartedRef.current = true;
      playBossDeath();
      setTimeout(() => {
        playCollapseRumble();
        useGameState.getState().startCollapse();
      }, 500);
    }
  }, [bossDefeated]);

  useEffect(() => {
    if (collapseTimer === 0 && collapseStartedRef.current && screen === "playing") {
      addScore(2000);
      playVictoryFanfare();
      setTimeout(() => {
        useGameState.getState().nextLevel();
      }, 500);
    }
  }, [collapseTimer, addScore, screen]);

  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = screen;
    if (screen === "levelComplete" && prev === "playing") {
      playLevelComplete();
    } else if (screen === "victory" && prev !== "victory") {
      playVictoryFanfare();
    } else if (screen === "gameOver" && prev === "playing") {
      playGameOver();
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing" && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [screen]);

  const mazeData = useMemo(() => {
    if (isStartScreen) return null;
    return generateMaze(config.mazeWidth, config.mazeHeight);
  }, [level, runId, isStartScreen]);

  const collectiblePositions = useMemo(() => {
    if (!mazeData) return [];
    return getCollectiblePositions(mazeData, config.collectibleCount);
  }, [mazeData, config.collectibleCount]);

  const enemyPaths = useMemo(() => {
    if (!mazeData) return [];
    return getEnemyPaths(mazeData, config.enemyCount);
  }, [mazeData, config.enemyCount]);

  const powerUpPositions = useMemo(() => {
    if (!mazeData) return [];
    return getPowerUpPositions(mazeData, config.powerUpCount);
  }, [mazeData, config.powerUpCount]);

  const trapPositions = useMemo(() => {
    if (!mazeData) return [];
    return getTrapPositions(mazeData, config.trapCount);
  }, [mazeData, config.trapCount]);

  const fogZonePositions = useMemo(() => {
    if (!mazeData) return [];
    return getFogZonePositions(mazeData, config.fogZoneCount);
  }, [mazeData, config.fogZoneCount]);

  const lorePositions = useMemo(() => {
    if (!mazeData) return [];
    const loreEntries = getLoreForLevel(level);
    return getLorePositions(mazeData, loreEntries.map((l) => l.id));
  }, [mazeData, level]);

  const setTotalCollectibles = useGameState((s) => s.setTotalCollectibles);

  useEffect(() => {
    if (collectiblePositions.length > 0) {
      setTotalCollectibles(collectiblePositions.length);
    }
  }, [collectiblePositions, setTotalCollectibles]);

  const handleCollect = useCallback((index?: number) => {
    if (useGameState.getState().screen !== "playing") return;
    addScore(POINTS_PER_ITEM);
    collectItem();
    if (index !== undefined) {
      setCollectedItems((prev) => new Set(prev).add(index));
    }
  }, [addScore, collectItem]);

  const handleEnemyHit = useCallback(() => {
    if (useGameState.getState().screen !== "playing") return;
    takeDamage(20);
  }, [takeDamage]);

  const handleTrapHit = useCallback(() => {
    if (useGameState.getState().screen !== "playing") return;
    takeDamage(10);
  }, [takeDamage]);

  const handlePowerUpCollect = useCallback((type: PowerUpType, index?: number) => {
    if (useGameState.getState().screen !== "playing") return;
    addPowerUp(type);
    addScore(50);
    if (index !== undefined) {
      setCollectedPowerUps((prev) => new Set(prev).add(index));
    }
  }, [addPowerUp, addScore]);

  const handleLoreCollect = useCallback((loreId: string, index: number) => {
    if (useGameState.getState().screen !== "playing") return;
    collectLore(loreId);
    setCollectedLore((prev) => new Set(prev).add(index));
  }, [collectLore]);

  const handleFogEnter = useCallback(() => {
    fogZoneCountRef.current++;
    setInFogZone(true);
  }, [setInFogZone]);

  const handleFogExit = useCallback(() => {
    fogZoneCountRef.current = Math.max(0, fogZoneCountRef.current - 1);
    if (fogZoneCountRef.current <= 0) {
      setInFogZone(false);
    }
  }, [setInFogZone]);

  const bossSpawnPosition = useMemo(() => {
    if (!mazeData) return { x: 0, z: 0 };
    const cx = Math.floor(mazeData.width / 2) * CELL_SIZE;
    const cz = Math.floor(mazeData.height / 2) * CELL_SIZE;
    return { x: cx, z: cz };
  }, [mazeData]);

  const handleBossHitPlayer = useCallback((damage: number) => {
    if (useGameState.getState().screen !== "playing") return;
    takeDamage(damage);
  }, [takeDamage]);

  const handleSummonMinions = useCallback(() => {
    if (!mazeData) return;
    const bossPos = useGameState.getState().bossPosition;
    const newMinions: EnemyPathData[] = [];
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * 2;
      const sx = bossPos.x + Math.cos(angle) * dist;
      const sz = bossPos.z + Math.sin(angle) * dist;
      const cellX = Math.max(0, Math.min(mazeData.width - 1, Math.round(sx / CELL_SIZE)));
      const cellY = Math.max(0, Math.min(mazeData.height - 1, Math.round(sz / CELL_SIZE)));
      const wx = cellX * CELL_SIZE;
      const wz = cellY * CELL_SIZE;

      const pathPoints: { x: number; z: number }[] = [{ x: wx, z: wz }];
      let cx = cellX, cy = cellY;
      for (let step = 0; step < 3; step++) {
        const cell = mazeData.cells[cy]?.[cx];
        if (!cell) break;
        const options: { nx: number; ny: number }[] = [];
        if (!cell.walls.north && cy > 0) options.push({ nx: cx, ny: cy - 1 });
        if (!cell.walls.south && cy < mazeData.height - 1) options.push({ nx: cx, ny: cy + 1 });
        if (!cell.walls.east && cx < mazeData.width - 1) options.push({ nx: cx + 1, ny: cy });
        if (!cell.walls.west && cx > 0) options.push({ nx: cx - 1, ny: cy });
        if (options.length === 0) break;
        const chosen = options[Math.floor(Math.random() * options.length)];
        cx = chosen.nx;
        cy = chosen.ny;
        pathPoints.push({ x: cx * CELL_SIZE, z: cy * CELL_SIZE });
      }

      if (pathPoints.length >= 2) {
        newMinions.push({
          points: pathPoints,
          speed: 2.5 + Math.random() * 1.5,
          enemyType: "rusher",
          detectionRange: 12,
          chaseSpeed: 5.5,
          homeCell: { x: cellX, y: cellY },
        });
      }
    }
    setSummonedMinions(prev => [...prev, ...newMinions]);
  }, [mazeData]);

  const exitX = mazeData ? (mazeData.width - 1) * CELL_SIZE : 0;
  const exitZ = mazeData ? (mazeData.height - 1) * CELL_SIZE : 0;

  useEffect(() => {
    if (!mazeData || screen !== "playing") return;
    const checkExit = () => {
      const state = useGameState.getState();
      if (state.screen !== "playing") return;
      const pp = state.playerPosition;
      const dx = pp.x - exitX;
      const dz = pp.z - exitZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const gemsCollected = state.collectiblesGathered >= state.totalCollectibles;
      const bossCleared = !state.bossActive || state.bossDefeated;
      if (dist < 1.5 && gemsCollected && bossCleared) {
        if (state.collapseTimer > 0) return;
        const timeBonus = Math.floor(state.timeRemaining * 5);
        addScore(timeBonus + 500);
        setScreen("levelComplete");
      }
    };
    const id = setInterval(checkExit, 100);
    return () => clearInterval(id);
  }, [mazeData, screen, exitX, exitZ, addScore, setScreen]);

  const theme = useMemo(() => getThemeForLevel(level), [level]);

  if (isStartScreen || !mazeData) return null;

  return (
    <>
      <Canvas
        style={{ position: "fixed", inset: 0 }}
        camera={{ fov: 75, near: 0.1, far: 100 }}
        shadows
      >
        <color attach="background" args={[theme.fogColor]} />
        <fog attach="fog" args={[theme.fogColor, 2, 35]} />

        <ambientLight intensity={theme.ambientIntensity} color={theme.ambientColor} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.5}
          color={theme.directionalColor}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <FlickeringTorchLights maze={mazeData} torchColor={theme.torchColor} />
        <WallTorchModels maze={mazeData} />
        <PortalParticles maze={mazeData} />
        <DynamicFog fogColorHex={theme.fogColorHex} />
        <PowerUpTicker />
        <BossTimerTicker />

        <MazeWalls maze={mazeData} level={level} />
        <MazeFloor maze={mazeData} level={level} />
        <MazeCeiling maze={mazeData} level={level} />
        <ExitMarker maze={mazeData} />

        {collectiblePositions.map((pos, i) => (
          <Collectible
            key={`${runId}-${level}-c-${i}`}
            position={pos}
            onCollect={() => handleCollect(i)}
          />
        ))}

        {powerUpPositions.map((pu, i) => (
          <PowerUp
            key={`${runId}-${level}-pu-${i}`}
            position={pu}
            type={pu.type}
            onCollect={(type: PowerUpType) => handlePowerUpCollect(type, i)}
          />
        ))}

        {trapPositions.map((tp, i) => (
          <SpikeTrap
            key={`${runId}-${level}-trap-${i}`}
            position={tp}
            onHitPlayer={handleTrapHit}
          />
        ))}

        {fogZonePositions.map((fz, i) => (
          <FogZone
            key={`${runId}-${level}-fog-${i}`}
            position={fz}
            radius={fz.radius}
            onEnter={handleFogEnter}
            onExit={handleFogExit}
          />
        ))}

        {lorePositions.map((lp, i) =>
          !collectedLore.has(i) ? (
            <LoreFragment
              key={`${runId}-${level}-lore-${i}`}
              position={lp}
              onCollect={() => handleLoreCollect(lp.loreId, i)}
            />
          ) : null
        )}

        {enemyPaths.map((ep, i) => (
          <Enemy
            key={`${runId}-${level}-e-${i}`}
            path={ep.points}
            speed={ep.speed}
            onHitPlayer={handleEnemyHit}
            enemyType={ep.enemyType}
            detectionRange={ep.detectionRange}
            chaseSpeed={ep.chaseSpeed}
            homeCell={ep.homeCell}
            maze={mazeData}
          />
        ))}

        {bossActive && !bossDefeated && mazeData && (
          <Boss
            maze={mazeData}
            onHitPlayer={handleBossHitPlayer}
            spawnPosition={bossSpawnPosition}
            onSummonMinions={handleSummonMinions}
          />
        )}

        {summonedMinions.map((ep, i) => (
          <Enemy
            key={`${runId}-${level}-minion-${i}`}
            path={ep.points}
            speed={ep.speed}
            onHitPlayer={handleEnemyHit}
            enemyType={ep.enemyType}
            detectionRange={ep.detectionRange}
            chaseSpeed={ep.chaseSpeed}
            homeCell={ep.homeCell}
            maze={mazeData}
          />
        ))}

        {collapseTimer > 0 && collapseTimer < 4 && (
          <CollapsingWalls maze={mazeData} progress={1 - (collapseTimer / 4)} />
        )}

        <PlayerController maze={mazeData} />
      </Canvas>

      <LoreOverlay />
      <EnemyProximityTracker />
      <HUD />
      <Compass maze={mazeData} />
      <MiniMap
        maze={mazeData}
        level={level}
        exitPosition={{ x: exitX, z: exitZ }}
        trapPositions={trapPositions}
        collectiblePositions={collectiblePositions}
        powerUpPositions={powerUpPositions}
        fogZonePositions={fogZonePositions}
        collectedItems={collectedItems}
        collectedPowerUps={collectedPowerUps}
        lorePositions={lorePositions.map(lp => ({ x: lp.x, z: lp.z }))}
        collectedLore={collectedLore}
      />
    </>
  );
}
