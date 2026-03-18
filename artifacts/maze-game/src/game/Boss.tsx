import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MazeData } from "./mazeGenerator";
import { bfsPath } from "./mazeGenerator";
import { useGameState } from "./gameState";

const CELL_SIZE = 4;
const BOSS_SPEED_P1 = 1.8;
const BOSS_SPEED_P2 = 2.8;
const BOSS_SPEED_P3 = 4.0;
const AOE_RANGE = 5;
const AOE_COOLDOWN_P1 = 6;
const AOE_COOLDOWN_P2 = 4;
const AOE_COOLDOWN_P3 = 2.5;
const AOE_DAMAGE = 25;
const CONTACT_DAMAGE = 15;
const CONTACT_RANGE = 1.8;
const TELEPORT_COOLDOWN = 5;
const TELEPORT_RANGE = 12;

interface BossProps {
  maze: MazeData;
  onHitPlayer: (damage: number) => void;
  spawnPosition: { x: number; z: number };
  onSummonMinions: () => void;
}

function createBossFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1a0825";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(${80 + Math.random() * 40},${10 + Math.random() * 20},${100 + Math.random() * 60},0.3)`;
    ctx.fillRect(x, y, 3 + Math.random() * 8, 2 + Math.random() * 6);
  }

  for (let i = 0; i < 3; i++) {
    const eyeX = 128 + i * 128;
    const eyeY = 170;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 35, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(eyeX, eyeY - 3, 4, eyeX, eyeY - 3, 25);
    grad.addColorStop(0, "#ff00ff");
    grad.addColorStop(0.3, "#cc00aa");
    grad.addColorStop(1, "#440044");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY - 3, 22, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY - 5, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff66ff";
    ctx.beginPath();
    ctx.ellipse(eyeX + 3, eyeY - 8, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(100, 320);
  ctx.quadraticCurveTo(256, 450, 412, 320);
  ctx.lineTo(412, 350);
  ctx.quadraticCurveTo(256, 470, 100, 350);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#330044";
  ctx.beginPath();
  ctx.moveTo(110, 325);
  ctx.quadraticCurveTo(256, 440, 402, 325);
  ctx.lineTo(402, 345);
  ctx.quadraticCurveTo(256, 460, 110, 345);
  ctx.closePath();
  ctx.fill();

  const teethCount = 12;
  ctx.fillStyle = "#eeddcc";
  for (let i = 0; i < teethCount; i++) {
    const t = (i + 0.5) / teethCount;
    const tx = 105 + t * 302;
    const topY = 320 + Math.sin(t * Math.PI) * 20;
    ctx.beginPath();
    ctx.moveTo(tx - 8, topY);
    ctx.lineTo(tx, topY + 22);
    ctx.lineTo(tx + 8, topY);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r1 = 180 + Math.random() * 30;
    const r2 = r1 + 15 + Math.random() * 20;
    ctx.strokeStyle = `rgba(${150 + Math.random() * 100}, 0, ${200 + Math.random() * 55}, 0.3)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(angle) * r1, 256 + Math.sin(angle) * r1);
    ctx.lineTo(256 + Math.cos(angle) * r2, 256 + Math.sin(angle) * r2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createBossBodyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#120820";
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = `rgba(${60 + Math.random() * 40},${5 + Math.random() * 15},${80 + Math.random() * 40},0.4)`;
    ctx.fillRect(x, y, 2 + Math.random() * 5, 2 + Math.random() * 6);
  }

  for (let i = 0; i < 8; i++) {
    const cx = Math.random() * 256;
    const cy = Math.random() * 256;
    ctx.strokeStyle = `rgba(${180 + Math.random() * 75}, 0, ${200 + Math.random() * 55}, ${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 5 + Math.random() * 15, 0, Math.PI * (0.5 + Math.random()));
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function Boss({ maze, onHitPlayer, spawnPosition, onSummonMinions }: BossProps) {
  const ref = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const innerAuraRef = useRef<THREE.Mesh>(null);
  const aoeIndicatorRef = useRef<THREE.Mesh>(null);

  const currentPosRef = useRef({ x: spawnPosition.x, z: spawnPosition.z });
  const chasePathRef = useRef<{ x: number; z: number }[]>([]);
  const chaseIndexRef = useRef(0);
  const pathfindCooldownRef = useRef(0);
  const aoeCooldownRef = useRef(3);
  const hitCooldownRef = useRef(0);
  const aoeChargeRef = useRef(0);
  const flashTimerRef = useRef(0);
  const prevHealthRef = useRef(-1);
  const teleportCooldownRef = useRef(TELEPORT_COOLDOWN);
  const minionsSummonedRef = useRef(false);
  const p2MinionsSummonedRef = useRef(false);

  const faceTexture = useMemo(() => createBossFaceTexture(), []);
  const bodyTexture = useMemo(() => createBossBodyTexture(), []);

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: bodyTexture,
    color: "#2a1040",
    roughness: 0.7,
    metalness: 0.1,
    emissive: "#1a0830",
    emissiveIntensity: 0.5,
  }), [bodyTexture]);

  const flashMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: "#ffffff",
    emissiveIntensity: 3,
    roughness: 0,
  }), []);

  const cloakMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#0a0516",
    roughness: 0.9,
    metalness: 0,
    emissive: "#0a0318",
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.92,
  }), []);

  const headMaterials = useMemo(() => {
    const sides = new THREE.MeshStandardMaterial({
      map: bodyTexture,
      color: "#3a1850",
      roughness: 0.6,
      emissive: "#1a0a30",
      emissiveIntensity: 0.4,
    });
    const face = new THREE.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.5,
      emissive: "#2a0050",
      emissiveIntensity: 0.6,
    });
    return [sides, sides, sides, sides, face, sides];
  }, [faceTexture, bodyTexture]);

  const flashHeadMaterials = useMemo(() => {
    const fm = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 3,
      roughness: 0,
    });
    return [fm, fm, fm, fm, fm, fm];
  }, []);

  const worldToCell = useCallback((wx: number, wz: number) => ({
    x: Math.max(0, Math.min(maze.width - 1, Math.round(wx / CELL_SIZE))),
    y: Math.max(0, Math.min(maze.height - 1, Math.round(wz / CELL_SIZE))),
  }), [maze]);

  useFrame((_, rawDelta) => {
    if (!ref.current) return;

    const state = useGameState.getState();
    if (state.bossDefeated || !state.bossActive) {
      if (state.bossDefeated && ref.current) {
        ref.current.visible = false;
      }
      return;
    }

    if (state.frameFreezeTimer > 0) return;

    const delta = Math.min(rawDelta, 0.05);
    const t = Date.now() * 0.001;
    const phase = state.bossPhase;

    if (prevHealthRef.current < 0) prevHealthRef.current = state.bossHealth;
    if (state.bossHealth < prevHealthRef.current) {
      flashTimerRef.current = 0.15;
      prevHealthRef.current = state.bossHealth;
    }
    flashTimerRef.current = Math.max(0, flashTimerRef.current - delta);
    const isFlashing = flashTimerRef.current > 0;

    hitCooldownRef.current = Math.max(0, hitCooldownRef.current - delta);
    pathfindCooldownRef.current = Math.max(0, pathfindCooldownRef.current - delta);
    aoeCooldownRef.current = Math.max(0, aoeCooldownRef.current - delta);
    teleportCooldownRef.current = Math.max(0, teleportCooldownRef.current - delta);

    if (phase >= 2 && !minionsSummonedRef.current) {
      minionsSummonedRef.current = true;
      onSummonMinions();
    }
    if (phase >= 3 && !p2MinionsSummonedRef.current) {
      p2MinionsSummonedRef.current = true;
      onSummonMinions();
    }

    const playerPosition = useGameState.getState().playerPosition;
    const px = currentPosRef.current.x;
    const pz = currentPosRef.current.z;
    const dpx = playerPosition.x - px;
    const dpz = playerPosition.z - pz;
    const distToPlayer = Math.sqrt(dpx * dpx + dpz * dpz);

    const isStunned = state.bossStunTimer > 0;

    let newX = px;
    let newZ = pz;

    if (!isStunned) {
      if (phase === 3 && teleportCooldownRef.current <= 0 && distToPlayer > 6) {
        teleportCooldownRef.current = TELEPORT_COOLDOWN;
        const angle = Math.atan2(dpx, dpz);
        const teleportDist = Math.min(distToPlayer - 3, TELEPORT_RANGE);
        newX = px + Math.sin(angle) * teleportDist;
        newZ = pz + Math.cos(angle) * teleportDist;
        useGameState.getState().triggerScreenShake(0.4);
      } else {
        const speed = phase === 1 ? BOSS_SPEED_P1 : phase === 2 ? BOSS_SPEED_P2 : BOSS_SPEED_P3;

        if (pathfindCooldownRef.current <= 0) {
          pathfindCooldownRef.current = 0.5;
          const myCell = worldToCell(px, pz);
          const playerCell = worldToCell(playerPosition.x, playerPosition.z);
          const path = bfsPath(maze, myCell, playerCell);
          if (path && path.length > 1) {
            chasePathRef.current = path.map(c => ({ x: c.x * CELL_SIZE, z: c.y * CELL_SIZE }));
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
            const moveAmount = Math.min(speed * delta, tdist);
            newX = px + (tdx / tdist) * moveAmount;
            newZ = pz + (tdz / tdist) * moveAmount;
          }
        } else {
          if (distToPlayer > 1.5) {
            const moveAmount = speed * delta;
            newX = px + (dpx / distToPlayer) * moveAmount;
            newZ = pz + (dpz / distToPlayer) * moveAmount;
          }
        }
      }
    }

    currentPosRef.current = { x: newX, z: newZ };
    ref.current.position.set(newX, 0, newZ);
    useGameState.getState().setBossPosition(newX, newZ);

    const faceDirX = playerPosition.x - newX;
    const faceDirZ = playerPosition.z - newZ;
    if (Math.abs(faceDirX) > 0.01 || Math.abs(faceDirZ) > 0.01) {
      ref.current.rotation.y = Math.atan2(faceDirX, faceDirZ);
    }

    const finalDist = Math.sqrt(
      (playerPosition.x - newX) * (playerPosition.x - newX) +
      (playerPosition.z - newZ) * (playerPosition.z - newZ)
    );

    if (finalDist < CONTACT_RANGE && hitCooldownRef.current <= 0 && !isStunned) {
      onHitPlayer(CONTACT_DAMAGE);
      hitCooldownRef.current = 1.5;
    }

    const aoeCd = phase === 1 ? AOE_COOLDOWN_P1 : phase === 2 ? AOE_COOLDOWN_P2 : AOE_COOLDOWN_P3;
    if (aoeCooldownRef.current <= 0 && !isStunned) {
      aoeChargeRef.current = 0.8;
      aoeCooldownRef.current = aoeCd;
    }

    if (aoeChargeRef.current > 0) {
      aoeChargeRef.current -= delta;
      if (aoeChargeRef.current <= 0 && finalDist < AOE_RANGE) {
        onHitPlayer(AOE_DAMAGE);
        useGameState.getState().triggerScreenShake(0.8);
      }
    }

    const walkSpeed = phase === 3 ? 14 : phase === 2 ? 10 : 7;
    const walkAmplitude = isStunned ? 0.1 : (phase === 3 ? 0.9 : 0.6);
    const walkCycle = Math.sin(t * walkSpeed) * walkAmplitude;
    if (leftArmRef.current) leftArmRef.current.rotation.x = walkCycle;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -walkCycle;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -walkCycle * 0.7;
    if (rightLegRef.current) rightLegRef.current.rotation.x = walkCycle * 0.7;

    if (headRef.current) {
      if (isStunned) {
        headRef.current.rotation.z = Math.sin(t * 12) * 0.25;
      } else {
        headRef.current.rotation.z = Math.sin(t * 2.5) * 0.08;
        headRef.current.rotation.x = Math.sin(t * 1.8) * 0.05;
      }
      if (isFlashing) {
        (headRef.current as THREE.Mesh).material = flashHeadMaterials;
      } else {
        (headRef.current as THREE.Mesh).material = headMaterials;
      }
    }

    if (auraRef.current) {
      const scale = 1.2 + Math.sin(t * 3) * 0.2 + (phase - 1) * 0.15;
      auraRef.current.scale.setScalar(scale);
      const baseOp = 0.08 + (phase - 1) * 0.04;
      (auraRef.current.material as THREE.MeshStandardMaterial).opacity = baseOp + Math.sin(t * 5) * 0.03;
    }

    if (innerAuraRef.current) {
      const pulseScale = 0.8 + Math.sin(t * 6 + 1) * 0.15;
      innerAuraRef.current.scale.setScalar(pulseScale);
      (innerAuraRef.current.material as THREE.MeshStandardMaterial).opacity = 0.12 + Math.sin(t * 8) * 0.06;
    }

    if (aoeIndicatorRef.current) {
      if (aoeChargeRef.current > 0) {
        aoeIndicatorRef.current.visible = true;
        const chargeProgress = 1 - (aoeChargeRef.current / 0.8);
        aoeIndicatorRef.current.scale.set(AOE_RANGE * chargeProgress, 0.02, AOE_RANGE * chargeProgress);
        (aoeIndicatorRef.current.material as THREE.MeshStandardMaterial).opacity = 0.3 + chargeProgress * 0.4;
      } else {
        aoeIndicatorRef.current.visible = false;
      }
    }
  });

  const phaseColor1 = "#660088";
  const phaseEmissive1 = "#aa00ff";

  return (
    <group ref={ref} position={[spawnPosition.x, 0, spawnPosition.z]}>
      <mesh position={[0, 1.1, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.9, 1.1, 0.55]} />
      </mesh>

      <mesh position={[0, 0.6, 0]} material={cloakMaterial}>
        <boxGeometry args={[1.05, 0.6, 0.7]} />
      </mesh>

      <mesh ref={headRef} position={[0, 2.0, 0]} material={headMaterials}>
        <boxGeometry args={[0.8, 0.7, 0.7]} />
      </mesh>

      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[0.25, 0.5, 4]} />
        <meshStandardMaterial color="#2a0050" emissive="#6600aa" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-0.2, 2.55, 0]}>
        <coneGeometry args={[0.15, 0.35, 4]} />
        <meshStandardMaterial color="#1a0040" emissive="#5500aa" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.2, 2.55, 0]}>
        <coneGeometry args={[0.15, 0.35, 4]} />
        <meshStandardMaterial color="#1a0040" emissive="#5500aa" emissiveIntensity={1.2} />
      </mesh>

      <mesh ref={leftArmRef} position={[-0.65, 1.1, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.24, 0.9, 0.24]} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.65, 1.1, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.24, 0.9, 0.24]} />
      </mesh>

      <mesh position={[-0.65, 0.6, 0]} material={cloakMaterial}>
        <sphereGeometry args={[0.14, 8, 8]} />
      </mesh>
      <mesh position={[0.65, 0.6, 0]} material={cloakMaterial}>
        <sphereGeometry args={[0.14, 8, 8]} />
      </mesh>

      <mesh ref={leftLegRef} position={[-0.25, 0.35, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.28, 0.7, 0.28]} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.25, 0.35, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.28, 0.7, 0.28]} />
      </mesh>

      <mesh ref={auraRef}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshStandardMaterial
          color={phaseColor1}
          emissive={phaseEmissive1}
          emissiveIntensity={0.8}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh ref={innerAuraRef}>
        <sphereGeometry args={[1.2, 12, 12]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={1.2}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh ref={aoeIndicatorRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshStandardMaterial
          color="#ff0066"
          emissive="#ff0066"
          emissiveIntensity={2}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight position={[0, 2.0, 0.4]} color="#ff00ff" intensity={8} distance={8} />
      <pointLight position={[0, 1.0, 0]} color="#aa00ff" intensity={5} distance={10} />
      <pointLight position={[0, 0.2, 0]} color="#660088" intensity={3} distance={6} />
    </group>
  );
}
