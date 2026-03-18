import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { MazeData } from "./mazeGenerator";
import { getWallSegments } from "./mazeGenerator";
import { type LevelTheme, getThemeForLevel } from "./levelThemes";

const CELL_SIZE = 4;
const WALL_HEIGHT = 3.5;
const WALL_THICKNESS = 0.3;

interface MazeWallsProps {
  maze: MazeData;
  level: number;
}

function buildWallMaterial(theme: LevelTheme): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(...theme.wallColor),
    roughness: 0.8,
    metalness: 0.05,
    bumpScale: 0.02,
  });

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = theme.wallBaseHex;
  ctx.fillRect(0, 0, 256, 256);

  const brickH = 32;
  const brickW = 64;
  for (let row = 0; row < 8; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;
      theme.wallBrickFn(ctx, x, y, brickW, brickH);
    }

    ctx.strokeStyle = "rgba(30,18,8,0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, row * brickH);
    ctx.lineTo(256, row * brickH);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  mat.map = tex;

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = 256;
  normalCanvas.height = 256;
  const nctx = normalCanvas.getContext("2d")!;
  nctx.fillStyle = "#8080ff";
  nctx.fillRect(0, 0, 256, 256);

  for (let row = 0; row < 8; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    nctx.strokeStyle = "#6060cc";
    nctx.lineWidth = 3;
    nctx.beginPath();
    nctx.moveTo(0, row * brickH);
    nctx.lineTo(256, row * brickH);
    nctx.stroke();

    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offset;
      nctx.beginPath();
      nctx.moveTo(x, row * brickH);
      nctx.lineTo(x, (row + 1) * brickH);
      nctx.stroke();
    }
  }

  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(1, 1);
  mat.normalMap = normalTex;
  mat.normalScale = new THREE.Vector2(0.5, 0.5);

  mat.needsUpdate = true;
  return mat;
}

export function MazeWalls({ maze, level }: MazeWallsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const wallSegments = useMemo(() => getWallSegments(maze), [maze]);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    wallSegments.forEach((wall, i) => {
      dummy.position.set(wall.x, WALL_HEIGHT / 2, wall.z);
      dummy.rotation.set(0, 0, 0);
      if (wall.rotated) {
        dummy.scale.set(WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE);
      } else {
        dummy.scale.set(CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS);
      }
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
    meshRef.current.computeBoundingBox();
  }, [wallSegments]);

  const wallMaterial = useMemo(() => {
    const theme = getThemeForLevel(level);
    return buildWallMaterial(theme);
  }, [level]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, wallSegments.length]}
      material={wallMaterial}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

export function MazeFloor({ maze, level }: { maze: MazeData; level: number }) {
  const floorSize = Math.max(maze.width, maze.height) * CELL_SIZE + CELL_SIZE;
  const centerX = ((maze.width - 1) * CELL_SIZE) / 2;
  const centerZ = ((maze.height - 1) * CELL_SIZE) / 2;

  const floorMaterial = useMemo(() => {
    const theme = getThemeForLevel(level);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = theme.floorBaseHex;
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        theme.floorTileFn(ctx, col * tileSize, row * tileSize, tileSize);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(floorSize / 4, floorSize / 4);

    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.92,
      metalness: 0.02,
      color: new THREE.Color(...theme.floorColor),
    });
  }, [floorSize, level]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]} receiveShadow material={floorMaterial}>
      <planeGeometry args={[floorSize, floorSize]} />
    </mesh>
  );
}

export function MazeCeiling({ maze, level }: { maze: MazeData; level: number }) {
  const floorSize = Math.max(maze.width, maze.height) * CELL_SIZE + CELL_SIZE;
  const centerX = ((maze.width - 1) * CELL_SIZE) / 2;
  const centerZ = ((maze.height - 1) * CELL_SIZE) / 2;

  const ceilingMaterial = useMemo(() => {
    const theme = getThemeForLevel(level);
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = theme.ceilingBaseHex;
    ctx.fillRect(0, 0, 256, 256);

    const plankW = 256;
    const plankH = 32;
    for (let row = 0; row < 8; row++) {
      const y = row * plankH;
      const [br, bg, bb] = theme.ceilingColor;
      const r = Math.round((br + Math.random() * 0.04) * 255);
      const g = Math.round((bg + Math.random() * 0.03) * 255);
      const b = Math.round((bb + Math.random() * 0.03) * 255);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y + 1, plankW, plankH - 2);

      for (let n = 0; n < 30; n++) {
        const nx = Math.random() * plankW;
        const ny = y + Math.random() * plankH;
        ctx.fillStyle = `rgba(${Math.round(br * 200)},${Math.round(bg * 200)},${Math.round(bb * 200)},0.4)`;
        ctx.fillRect(nx, ny, 1 + Math.random() * 3, 1);
      }

      ctx.strokeStyle = `rgba(${Math.round(br * 150)},${Math.round(bg * 150)},${Math.round(bb * 150)},0.7)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plankW, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(floorSize / 4, floorSize / 4);

    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.95,
      metalness: 0.0,
      color: new THREE.Color(...theme.ceilingColor),
    });
  }, [floorSize, level]);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[centerX, WALL_HEIGHT, centerZ]} material={ceilingMaterial}>
      <planeGeometry args={[floorSize, floorSize]} />
    </mesh>
  );
}

export function ExitMarker({ maze }: { maze: MazeData }) {
  const portalRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const x = (maze.width - 1) * CELL_SIZE;
  const z = (maze.height - 1) * CELL_SIZE;

  useFrame((_, delta) => {
    const t = Date.now() * 0.001;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 2;
      ring1Ref.current.rotation.x = Math.sin(t) * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 1.5;
      ring2Ref.current.rotation.y += delta * 0.5;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += delta * 1;
      ring3Ref.current.rotation.z += delta * 2.5;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 3;
      const pulse = 0.3 + Math.sin(t * 4) * 0.05;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={portalRef} position={[x, 1.5, z]}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#ffaa33"
          emissive="#ff8800"
          emissiveIntensity={4}
          transparent
          opacity={0.8}
        />
      </mesh>

      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.7, 0.04, 8, 48]} />
        <meshStandardMaterial
          color="#ffcc44"
          emissive="#ffaa22"
          emissiveIntensity={3}
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.03, 8, 48]} />
        <meshStandardMaterial
          color="#44cc88"
          emissive="#33aa66"
          emissiveIntensity={2}
          transparent
          opacity={0.5}
        />
      </mesh>

      <mesh ref={ring3Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.1, 0.02, 8, 48]} />
        <meshStandardMaterial
          color="#ffdd66"
          emissive="#ffaa33"
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      <pointLight color="#ffaa33" intensity={6} distance={10} />
      <pointLight color="#ff8800" intensity={3} distance={5} />
    </group>
  );
}
