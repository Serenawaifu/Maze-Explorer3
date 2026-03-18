import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MazeData, EnemyType } from "./mazeGenerator";
import { bfsPath } from "./mazeGenerator";
import { reportEnemyDistance } from "./audioSystem";
import { useGameState } from "./gameState";

const textureCache = new Map<string, THREE.CanvasTexture>();

function getCachedFaceTexture(type: EnemyType): THREE.CanvasTexture {
  const key = `face-${type}`;
  if (textureCache.has(key)) return textureCache.get(key)!;
  const tex = createFaceTexture(type);
  textureCache.set(key, tex);
  return tex;
}

function getCachedBodyTexture(type: EnemyType): THREE.CanvasTexture {
  const key = `body-${type}`;
  if (textureCache.has(key)) return textureCache.get(key)!;
  const tex = createBodyTexture(type);
  textureCache.set(key, tex);
  return tex;
}

const CELL_SIZE = 4;

interface EnemyProps {
  path: { x: number; z: number }[];
  speed: number;
  onHitPlayer: () => void;
  enemyType: EnemyType;
  detectionRange: number;
  chaseSpeed: number;
  homeCell: { x: number; y: number };
  maze: MazeData;
}

type AIState = "patrol" | "alert" | "chase" | "flee" | "return";

function createFaceTexture(type: EnemyType): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const baseColor = type === "stalker" ? "#2d1530" : "#3d2020";
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    if (type === "stalker") {
      ctx.fillStyle = `rgba(${20 + Math.random() * 20},${10 + Math.random() * 15},${25 + Math.random() * 20},0.4)`;
    } else {
      ctx.fillStyle = `rgba(${30 + Math.random() * 30},${15 + Math.random() * 15},${15 + Math.random() * 15},0.4)`;
    }
    ctx.fillRect(x, y, 2 + Math.random() * 4, 1 + Math.random() * 3);
  }

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(80, 85, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(176, 85, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyeColor1 = type === "stalker" ? "#aa00ff" : "#ffff00";
  const eyeColor2 = type === "stalker" ? "#6600aa" : "#ff4400";
  const eyeColor3 = type === "stalker" ? "#330066" : "#880000";

  const eyeGrad1 = ctx.createRadialGradient(80, 82, 3, 80, 82, 18);
  eyeGrad1.addColorStop(0, eyeColor1);
  eyeGrad1.addColorStop(0.3, eyeColor2);
  eyeGrad1.addColorStop(1, eyeColor3);
  ctx.fillStyle = eyeGrad1;
  ctx.beginPath();
  ctx.ellipse(80, 82, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyeGrad2 = ctx.createRadialGradient(176, 82, 3, 176, 82, 18);
  eyeGrad2.addColorStop(0, eyeColor1);
  eyeGrad2.addColorStop(0.3, eyeColor2);
  eyeGrad2.addColorStop(1, eyeColor3);
  ctx.fillStyle = eyeGrad2;
  ctx.beginPath();
  ctx.ellipse(176, 82, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(80, 80, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(176, 80, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = type === "stalker" ? "#cc88ff" : "#ffcc00";
  ctx.beginPath();
  ctx.ellipse(82, 78, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(178, 78, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = type === "stalker" ? "#180022" : "#220000";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(50, 55);
  ctx.quadraticCurveTo(80, 42, 110, 58);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(206, 55);
  ctx.quadraticCurveTo(176, 42, 146, 58);
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(75, 155);
  ctx.quadraticCurveTo(128, 230, 181, 155);
  ctx.lineTo(181, 175);
  ctx.quadraticCurveTo(128, 245, 75, 175);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = type === "stalker" ? "#330044" : "#550000";
  ctx.beginPath();
  ctx.moveTo(80, 160);
  ctx.quadraticCurveTo(128, 220, 176, 160);
  ctx.lineTo(176, 170);
  ctx.quadraticCurveTo(128, 230, 80, 170);
  ctx.closePath();
  ctx.fill();

  const teethCount = 8;
  ctx.fillStyle = "#eee8cc";
  for (let i = 0; i < teethCount; i++) {
    const t = (i + 0.5) / teethCount;
    const tx = 78 + t * 100;
    const topY = 155 + Math.sin(t * Math.PI) * 15;
    ctx.beginPath();
    ctx.moveTo(tx - 5, topY);
    ctx.lineTo(tx, topY + 16);
    ctx.lineTo(tx + 5, topY);
    ctx.closePath();
    ctx.fill();

    const botY = 173 + Math.sin(t * Math.PI) * 12;
    ctx.beginPath();
    ctx.moveTo(tx - 4, botY);
    ctx.lineTo(tx, botY - 12);
    ctx.lineTo(tx + 4, botY);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 8; i++) {
    const sx = 40 + Math.random() * 176;
    const sy = 10 + Math.random() * 240;
    ctx.strokeStyle = type === "stalker"
      ? `rgba(50,20,70,${0.2 + Math.random() * 0.3})`
      : `rgba(80,20,20,${0.2 + Math.random() * 0.3})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 30, sy + Math.random() * 20);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createBodyTexture(type: EnemyType): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = type === "stalker" ? "#1a0a20" : "#2a1515";
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    if (type === "stalker") {
      ctx.fillStyle = `rgba(${15 + Math.random() * 15},${5 + Math.random() * 10},${20 + Math.random() * 15},0.5)`;
    } else {
      ctx.fillStyle = `rgba(${20 + Math.random() * 20},${8 + Math.random() * 12},${8 + Math.random() * 12},0.5)`;
    }
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 4);
  }

  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = type === "stalker"
      ? `rgba(40,10,50,${0.2 + Math.random() * 0.3})`
      : `rgba(60,15,15,${0.2 + Math.random() * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 128, Math.random() * 128);
    ctx.lineTo(Math.random() * 128, Math.random() * 128);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function Enemy({
  path,
  speed,
  onHitPlayer,
  enemyType,
  detectionRange,
  chaseSpeed,
  homeCell,
  maze,
}: EnemyProps) {
  const ref = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const eyeLight1Ref = useRef<THREE.PointLight>(null);
  const eyeLight2Ref = useRef<THREE.PointLight>(null);

  const progressRef = useRef(0);
  const directionRef = useRef(1);
  const hitCooldownRef = useRef(0);
  const aiStateRef = useRef<AIState>("patrol");
  const chasePathRef = useRef<{ x: number; z: number }[]>([]);
  const chaseIndexRef = useRef(0);
  const lostTimerRef = useRef(0);
  const pathfindCooldownRef = useRef(0);
  const alertTimerRef = useRef(0);
  const eyeGlowRef = useRef(0);
  const fleeTimerRef = useRef(0);
  const currentPosRef = useRef({ x: path[0].x, z: path[0].z });

  const faceTexture = useMemo(() => getCachedFaceTexture(enemyType), [enemyType]);
  const bodyTexture = useMemo(() => getCachedBodyTexture(enemyType), [enemyType]);

  const bodyColor = enemyType === "stalker" ? "#2a1535" : "#4a1818";
  const bodyEmissive = enemyType === "stalker" ? "#1a0828" : "#2a0808";
  const cloakColor = enemyType === "stalker" ? "#0a0512" : "#1a0808";
  const cloakEmissive = enemyType === "stalker" ? "#0a0310" : "#150505";
  const auraColor = enemyType === "stalker" ? "#220044" : "#440000";
  const auraEmissiveColor = enemyType === "stalker" ? "#4400aa" : "#880000";
  const eyeLightColor = enemyType === "stalker" ? "#aa00ff" : "#ff2200";

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: bodyTexture,
    color: bodyColor,
    roughness: 0.8,
    metalness: 0.05,
    emissive: bodyEmissive,
    emissiveIntensity: 0.4,
  }), [bodyTexture, bodyColor, bodyEmissive]);

  const cloakMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: cloakColor,
    roughness: 0.9,
    metalness: 0,
    emissive: cloakEmissive,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.9,
  }), [cloakColor, cloakEmissive]);

  const headMaterials = useMemo(() => {
    const headColor = enemyType === "stalker" ? "#3a1840" : "#5a2828";
    const headEmissive = enemyType === "stalker" ? "#1a0a22" : "#2a0a0a";
    const sides = new THREE.MeshStandardMaterial({
      map: bodyTexture,
      color: headColor,
      roughness: 0.7,
      emissive: headEmissive,
      emissiveIntensity: 0.3,
    });
    const face = new THREE.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.6,
      emissive: enemyType === "stalker" ? "#1a0030" : "#3a0808",
      emissiveIntensity: 0.5,
    });
    return [sides, sides, sides, sides, face, sides];
  }, [faceTexture, bodyTexture, enemyType]);

  const totalLength = useMemo(() => {
    let len = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dz = path[i + 1].z - path[i].z;
      len += Math.sqrt(dx * dx + dz * dz);
    }
    return len;
  }, [path]);

  const worldToCell = useCallback((wx: number, wz: number) => ({
    x: Math.round(wx / CELL_SIZE),
    y: Math.round(wz / CELL_SIZE),
  }), []);

  const getPatrolPosition = useCallback(() => {
    let remaining = progressRef.current;
    let px = path[0].x;
    let pz = path[0].z;

    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dz = path[i + 1].z - path[i].z;
      const segLen = Math.sqrt(dx * dx + dz * dz);

      if (remaining <= segLen) {
        const tt = remaining / segLen;
        px = path[i].x + dx * tt;
        pz = path[i].z + dz * tt;
        return { x: px, z: pz, nextX: path[i + 1].x, nextZ: path[i + 1].z };
      }
      remaining -= segLen;
    }
    const last = path[path.length - 1];
    return { x: last.x, z: last.z, nextX: last.x, nextZ: last.z };
  }, [path]);

  useFrame((_, delta) => {
    if (!ref.current || path.length < 2) return;

    const t = Date.now() * 0.001;
    hitCooldownRef.current = Math.max(0, hitCooldownRef.current - delta);
    pathfindCooldownRef.current = Math.max(0, pathfindCooldownRef.current - delta);

    const playerPosition = useGameState.getState().playerPosition;
    const dpx = playerPosition.x - currentPosRef.current.x;
    const dpz = playerPosition.z - currentPosRef.current.z;
    const distToPlayer = Math.sqrt(dpx * dpx + dpz * dpz);
    reportEnemyDistance(distToPlayer);

    const canSeePlayer = distToPlayer <= detectionRange;
    const playerHasShield = useGameState.getState().hasPowerUp("shield");

    let px: number, pz: number;
    let faceDirX = 0, faceDirZ = 0;
    let currentSpeed = speed;
    let isChasing = false;
    let isFleeing = false;

    if (playerHasShield && canSeePlayer && aiStateRef.current !== "flee" && aiStateRef.current !== "return") {
      aiStateRef.current = "flee";
      fleeTimerRef.current = 0;
      pathfindCooldownRef.current = 0;
    }

    if (aiStateRef.current === "patrol") {
      if (canSeePlayer && !playerHasShield) {
        aiStateRef.current = "alert";
        alertTimerRef.current = 0.6;
      }

      progressRef.current += directionRef.current * speed * delta;
      if (progressRef.current >= totalLength) {
        progressRef.current = totalLength;
        directionRef.current = -1;
      } else if (progressRef.current <= 0) {
        progressRef.current = 0;
        directionRef.current = 1;
      }

      const pos = getPatrolPosition();
      px = pos.x;
      pz = pos.z;
      faceDirX = (pos.nextX - px) * directionRef.current;
      faceDirZ = (pos.nextZ - pz) * directionRef.current;

    } else if (aiStateRef.current === "alert") {
      alertTimerRef.current -= delta;
      const pos = getPatrolPosition();
      px = pos.x;
      pz = pos.z;
      faceDirX = playerPosition.x - px;
      faceDirZ = playerPosition.z - pz;

      if (alertTimerRef.current <= 0) {
        aiStateRef.current = "chase";
        lostTimerRef.current = 0;
      }

    } else if (aiStateRef.current === "chase") {
      isChasing = true;
      currentSpeed = chaseSpeed;

      if (canSeePlayer) {
        lostTimerRef.current = 0;
      } else {
        lostTimerRef.current += delta;
        const lostTimeout = enemyType === "stalker" ? 6 : 3;
        if (lostTimerRef.current > lostTimeout) {
          aiStateRef.current = "return";
          const myCell = worldToCell(currentPosRef.current.x, currentPosRef.current.z);
          const chasePath = bfsPath(maze, myCell, homeCell);
          if (chasePath) {
            chasePathRef.current = chasePath.map(c => ({ x: c.x * CELL_SIZE, z: c.y * CELL_SIZE }));
            chaseIndexRef.current = 0;
          }
        }
      }

      if (pathfindCooldownRef.current <= 0 && aiStateRef.current === "chase") {
        pathfindCooldownRef.current = 0.4;
        const myCell = worldToCell(currentPosRef.current.x, currentPosRef.current.z);
        const playerCell = worldToCell(playerPosition.x, playerPosition.z);
        const chasePath = bfsPath(maze, myCell, playerCell);
        if (chasePath && chasePath.length > 1) {
          chasePathRef.current = chasePath.map(c => ({ x: c.x * CELL_SIZE, z: c.y * CELL_SIZE }));
          chaseIndexRef.current = 1;
        }
      }

      px = currentPosRef.current.x;
      pz = currentPosRef.current.z;

      if (chasePathRef.current.length > 0 && chaseIndexRef.current < chasePathRef.current.length) {
        const target = chasePathRef.current[chaseIndexRef.current];
        const tdx = target.x - px;
        const tdz = target.z - pz;
        const tdist = Math.sqrt(tdx * tdx + tdz * tdz);

        if (tdist < 0.5) {
          chaseIndexRef.current++;
        } else {
          const moveAmount = currentSpeed * delta;
          const move = Math.min(moveAmount, tdist);
          px += (tdx / tdist) * move;
          pz += (tdz / tdist) * move;
          faceDirX = tdx;
          faceDirZ = tdz;
        }
      } else {
        faceDirX = dpx;
        faceDirZ = dpz;
        const moveAmount = currentSpeed * delta;
        if (distToPlayer > 0.5) {
          px += (dpx / distToPlayer) * moveAmount;
          pz += (dpz / distToPlayer) * moveAmount;
        }
      }

    } else if (aiStateRef.current === "flee") {
      isFleeing = true;
      currentSpeed = chaseSpeed * 1.2;
      fleeTimerRef.current += delta;

      px = currentPosRef.current.x;
      pz = currentPosRef.current.z;

      if (!playerHasShield || fleeTimerRef.current > 8) {
        aiStateRef.current = "return";
        const myCell = worldToCell(px, pz);
        const returnPath = bfsPath(maze, myCell, homeCell);
        if (returnPath) {
          chasePathRef.current = returnPath.map(c => ({ x: c.x * CELL_SIZE, z: c.y * CELL_SIZE }));
          chaseIndexRef.current = 0;
        }
      } else {
        if (pathfindCooldownRef.current <= 0) {
          pathfindCooldownRef.current = 0.5;
          const myCell = worldToCell(px, pz);
          const playerCell = worldToCell(playerPosition.x, playerPosition.z);
          const awayX = myCell.x + (myCell.x - playerCell.x) * 2;
          const awayY = myCell.y + (myCell.y - playerCell.y) * 2;
          const clampedX = Math.max(0, Math.min(maze.width - 1, awayX));
          const clampedY = Math.max(0, Math.min(maze.height - 1, awayY));
          const fleePath = bfsPath(maze, myCell, { x: clampedX, y: clampedY });
          if (fleePath && fleePath.length > 1) {
            chasePathRef.current = fleePath.map(c => ({ x: c.x * CELL_SIZE, z: c.y * CELL_SIZE }));
            chaseIndexRef.current = 1;
          }
        }

        if (chasePathRef.current.length > 0 && chaseIndexRef.current < chasePathRef.current.length) {
          const target = chasePathRef.current[chaseIndexRef.current];
          const tdx = target.x - px;
          const tdz = target.z - pz;
          const tdist = Math.sqrt(tdx * tdx + tdz * tdz);
          if (tdist < 0.5) {
            chaseIndexRef.current++;
          } else {
            const moveAmount = currentSpeed * delta;
            const move = Math.min(moveAmount, tdist);
            px += (tdx / tdist) * move;
            pz += (tdz / tdist) * move;
            faceDirX = -(playerPosition.x - px);
            faceDirZ = -(playerPosition.z - pz);
          }
        } else {
          const moveAmount = currentSpeed * delta;
          if (distToPlayer > 0.5) {
            px -= (dpx / distToPlayer) * moveAmount;
            pz -= (dpz / distToPlayer) * moveAmount;
          }
          faceDirX = -dpx;
          faceDirZ = -dpz;
        }
      }

    } else {
      px = currentPosRef.current.x;
      pz = currentPosRef.current.z;

      if (chasePathRef.current.length > 0 && chaseIndexRef.current < chasePathRef.current.length) {
        const target = chasePathRef.current[chaseIndexRef.current];
        const tdx = target.x - px;
        const tdz = target.z - pz;
        const tdist = Math.sqrt(tdx * tdx + tdz * tdz);

        if (tdist < 0.5) {
          chaseIndexRef.current++;
        } else {
          const moveAmount = speed * delta;
          const move = Math.min(moveAmount, tdist);
          px += (tdx / tdist) * move;
          pz += (tdz / tdist) * move;
          faceDirX = tdx;
          faceDirZ = tdz;
        }
      } else {
        aiStateRef.current = "patrol";
        progressRef.current = 0;
        directionRef.current = 1;
      }

      if (canSeePlayer && !playerHasShield) {
        aiStateRef.current = "alert";
        alertTimerRef.current = 0.4;
      }
    }

    currentPosRef.current = { x: px, z: pz };
    ref.current.position.set(px, 0, pz);

    if (Math.abs(faceDirX) > 0.001 || Math.abs(faceDirZ) > 0.001) {
      const angle = Math.atan2(faceDirX, faceDirZ);
      ref.current.rotation.y = angle;
    }

    const walkSpeed = isFleeing ? 12 : isChasing ? 10 : 6;
    const walkAmplitude = isFleeing ? 0.8 : isChasing ? 0.7 : 0.5;
    const walkCycle = Math.sin(t * walkSpeed) * walkAmplitude;
    if (leftArmRef.current) leftArmRef.current.rotation.x = walkCycle;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -walkCycle;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -walkCycle * 0.7;
    if (rightLegRef.current) rightLegRef.current.rotation.x = walkCycle * 0.7;

    if (headRef.current) {
      if (aiStateRef.current === "flee") {
        headRef.current.rotation.z = Math.sin(t * 12) * 0.2;
        headRef.current.rotation.x = Math.sin(t * 6) * 0.1;
      } else if (aiStateRef.current === "alert") {
        headRef.current.rotation.z = Math.sin(t * 8) * 0.15;
      } else {
        headRef.current.rotation.z = Math.sin(t * 2) * 0.05;
      }
    }

    const targetGlow = (aiStateRef.current === "chase" || aiStateRef.current === "alert") ? 1 : aiStateRef.current === "flee" ? 0.5 : 0;
    eyeGlowRef.current += (targetGlow - eyeGlowRef.current) * delta * 4;

    const baseEyeIntensity = 2;
    const chaseEyeIntensity = enemyType === "stalker" ? 10 : 15;
    const eyeIntensity = baseEyeIntensity + eyeGlowRef.current * chaseEyeIntensity;
    const lightsVisible = distToPlayer < 20;
    if (eyeLight1Ref.current) {
      eyeLight1Ref.current.intensity = eyeIntensity;
      eyeLight1Ref.current.visible = lightsVisible;
    }
    if (eyeLight2Ref.current) {
      eyeLight2Ref.current.intensity = eyeIntensity;
      eyeLight2Ref.current.visible = lightsVisible;
    }

    if (auraRef.current) {
      const basePulse = 1 + Math.sin(t * 4) * 0.15;
      const chasePulse = isChasing ? 1.3 + Math.sin(t * 8) * 0.2 : basePulse;
      auraRef.current.scale.setScalar(chasePulse);
      const baseOpacity = 0.08 + Math.sin(t * 3) * 0.04;
      const chaseOpacity = isChasing ? 0.15 + Math.sin(t * 6) * 0.08 : baseOpacity;
      (auraRef.current.material as THREE.MeshStandardMaterial).opacity = chaseOpacity;
    }

    const finalDist = Math.sqrt(
      (playerPosition.x - px) * (playerPosition.x - px) +
      (playerPosition.z - pz) * (playerPosition.z - pz)
    );

    if (finalDist < 1.2 && hitCooldownRef.current <= 0 && !isFleeing) {
      onHitPlayer();
      hitCooldownRef.current = 2;
    }
  });

  const bodyLightColor = enemyType === "stalker" ? "#8800cc" : "#ff4400";

  return (
    <group ref={ref} position={[path[0].x, 0, path[0].z]}>
      <mesh position={[0, 0.85, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.55, 0.75, 0.35]} />
      </mesh>

      <mesh position={[0, 0.55, 0]} material={cloakMaterial}>
        <boxGeometry args={[0.65, 0.4, 0.45]} />
      </mesh>

      <mesh ref={headRef} position={[0, 1.5, 0]} material={headMaterials}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>

      <mesh ref={leftArmRef} position={[-0.42, 0.85, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.16, 0.65, 0.16]} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.42, 0.85, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.16, 0.65, 0.16]} />
      </mesh>

      <mesh position={[-0.42, 0.48, 0]} material={cloakMaterial}>
        <sphereGeometry args={[0.1, 8, 8]} />
      </mesh>
      <mesh position={[0.42, 0.48, 0]} material={cloakMaterial}>
        <sphereGeometry args={[0.1, 8, 8]} />
      </mesh>

      <mesh ref={leftLegRef} position={[-0.16, 0.3, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.16, 0.3, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
      </mesh>

      <mesh ref={auraRef}>
        <sphereGeometry args={[1.2, 12, 12]} />
        <meshStandardMaterial
          color={auraColor}
          emissive={auraEmissiveColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      <pointLight ref={eyeLight1Ref} position={[0, 1.5, 0.3]} color={eyeLightColor} intensity={2} distance={4} />
      <pointLight ref={eyeLight2Ref} position={[0, 0.8, 0]} color={bodyLightColor} intensity={3} distance={6} />
    </group>
  );
}
