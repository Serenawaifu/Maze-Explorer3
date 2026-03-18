import { useRef, useEffect, useCallback, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MazeData } from "./mazeGenerator";
import { useGameState } from "./gameState";
import { playFootstep, playPlayerAttack, playBossHit } from "./audioSystem";
import { getSpeedMultiplier, getFlashlightMultiplier, getAttackDamageBonus } from "./metaProgression";

const CELL_SIZE = 4;
const MOVE_SPEED = 5;
const SPEED_BOOST_MULTIPLIER = 1.7;
const MOUSE_SENSITIVITY = 0.002;
const PLAYER_RADIUS = 0.4;
const WALL_THICKNESS = 0.3;
const DUST_COUNT = 30;
const ATTACK_RANGE = 3.5;
const BASE_ATTACK_DAMAGE = 25;
const STUN_DURATION = 1.0;

interface PlayerControllerProps {
  maze: MazeData;
}

export function PlayerController({ maze }: PlayerControllerProps) {
  const { camera, gl } = useThree();
  const keysRef = useRef<Set<string>>(new Set());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const lockedRef = useRef(false);
  const setPlayerPosition = useGameState((s) => s.setPlayerPosition);
  const setPlayerYaw = useGameState((s) => s.setPlayerYaw);
  const screen = useGameState((s) => s.screen);
  const shakeOffsetRef = useRef(new THREE.Vector3());
  const logicalPosRef = useRef(new THREE.Vector3(0, 1.6, 0));

  const wallBoxes = useRef<{ minX: number; maxX: number; minZ: number; maxZ: number }[]>([]);

  useEffect(() => {
    const boxes: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];
        const cx = x * CELL_SIZE;
        const cz = y * CELL_SIZE;
        if (cell.walls.north) {
          boxes.push({ minX: cx - CELL_SIZE / 2, maxX: cx + CELL_SIZE / 2, minZ: cz - CELL_SIZE / 2 - WALL_THICKNESS / 2, maxZ: cz - CELL_SIZE / 2 + WALL_THICKNESS / 2 });
        }
        if (cell.walls.west) {
          boxes.push({ minX: cx - CELL_SIZE / 2 - WALL_THICKNESS / 2, maxX: cx - CELL_SIZE / 2 + WALL_THICKNESS / 2, minZ: cz - CELL_SIZE / 2, maxZ: cz + CELL_SIZE / 2 });
        }
        if (x === maze.width - 1 && cell.walls.east) {
          boxes.push({ minX: cx + CELL_SIZE / 2 - WALL_THICKNESS / 2, maxX: cx + CELL_SIZE / 2 + WALL_THICKNESS / 2, minZ: cz - CELL_SIZE / 2, maxZ: cz + CELL_SIZE / 2 });
        }
        if (y === maze.height - 1 && cell.walls.south) {
          boxes.push({ minX: cx - CELL_SIZE / 2, maxX: cx + CELL_SIZE / 2, minZ: cz + CELL_SIZE / 2 - WALL_THICKNESS / 2, maxZ: cz + CELL_SIZE / 2 + WALL_THICKNESS / 2 });
        }
      }
    }
    wallBoxes.current = boxes;
  }, [maze]);

  useEffect(() => {
    camera.position.set(0, 1.6, 0);
    logicalPosRef.current.set(0, 1.6, 0);
    yawRef.current = 0;
    pitchRef.current = 0;
  }, [camera, maze]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => { keysRef.current.add(e.code); }, []);
  const handleKeyUp = useCallback((e: KeyboardEvent) => { keysRef.current.delete(e.code); }, []);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!lockedRef.current) return;
    yawRef.current -= e.movementX * MOUSE_SENSITIVITY;
    pitchRef.current -= e.movementY * MOUSE_SENSITIVITY;
    pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current));
  }, []);
  const handlePointerLockChange = useCallback(() => {
    lockedRef.current = document.pointerLockElement === gl.domElement;
  }, [gl]);
  const attackBlastRef = useRef<THREE.Mesh>(null);
  const attackBlastTimerRef = useRef(0);

  const handleClick = useCallback(() => {
    if (screen !== "playing") return;
    if (!lockedRef.current) {
      gl.domElement.requestPointerLock();
      return;
    }
    const state = useGameState.getState();
    if (!state.bossActive || state.bossDefeated) return;
    const attacked = state.playerAttack();
    if (!attacked) return;
    playPlayerAttack();
    attackBlastTimerRef.current = 0.3;

    const dx = state.bossPosition.x - logicalPosRef.current.x;
    const dz = state.bossPosition.z - logicalPosRef.current.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= ATTACK_RANGE) {
      const metaState = useGameState.getState().meta;
      const totalDamage = BASE_ATTACK_DAMAGE + getAttackDamageBonus(metaState);
      useGameState.getState().damageBoss(totalDamage);
      useGameState.setState({ bossStunTimer: STUN_DURATION });
      playBossHit();
    }
  }, [gl, screen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    gl.domElement.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handlePointerLockChange, handleClick, gl]);

  const resolveAxis = useCallback((px: number, pz: number, axis: "x" | "z"): number => {
    const r = PLAYER_RADIUS;
    let curX = px;
    let curZ = pz;
    for (const box of wallBoxes.current) {
      const closestX = Math.max(box.minX, Math.min(curX, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(curZ, box.maxZ));
      const dx = curX - closestX;
      const dz = curZ - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq >= r * r) continue;
      if (distSq < 0.0001) {
        const penLeft = curX - box.minX + r;
        const penRight = box.maxX - curX + r;
        const penTop = curZ - box.minZ + r;
        const penBottom = box.maxZ - curZ + r;
        if (axis === "x") {
          curX += penLeft < penRight ? -penLeft : penRight;
        } else {
          curZ += penTop < penBottom ? -penTop : penBottom;
        }
      } else {
        const dist = Math.sqrt(distSq);
        const penetration = r - dist;
        if (axis === "x") {
          curX += (dx / dist) * penetration;
        } else {
          curZ += (dz / dist) * penetration;
        }
      }
    }
    return axis === "x" ? curX : curZ;
  }, []);

  const lightRef = useRef<THREE.PointLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const dustRef = useRef<THREE.Points>(null);
  const dustTimerRef = useRef(0);

  const dustPositions = useMemo(() => new Float32Array(DUST_COUNT * 3), []);
  const dustAlphas = useRef(new Float32Array(DUST_COUNT));

  const dustMat = useMemo(() => new THREE.PointsMaterial({
    color: "#aa8866",
    size: 0.06,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }), []);

  useFrame((_, delta) => {
    if (screen !== "playing") return;

    const state = useGameState.getState();
    if (state.frameFreezeTimer > 0) return;
    const hasSpeedBoost = state.hasPowerUp("speed_boost");
    const hasTorchUpgrade = state.hasPowerUp("torch_upgrade");
    const shake = state.screenShake;

    if (shake > 0.01) {
      const intensity = shake * 0.15;
      shakeOffsetRef.current.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity * 0.6,
        (Math.random() - 0.5) * intensity * 0.3
      );
    } else {
      shakeOffsetRef.current.set(0, 0, 0);
    }

    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);

    const keys = keysRef.current;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    const moveDir = new THREE.Vector3();
    if (keys.has("KeyW") || keys.has("ArrowUp")) moveDir.add(forward);
    if (keys.has("KeyS") || keys.has("ArrowDown")) moveDir.sub(forward);
    if (keys.has("KeyD") || keys.has("ArrowRight")) moveDir.add(right);
    if (keys.has("KeyA") || keys.has("ArrowLeft")) moveDir.sub(right);

    const lp = logicalPosRef.current;
    let isMoving = false;
    if (moveDir.lengthSq() > 0) {
      const metaSpeedMul = getSpeedMultiplier(useGameState.getState().meta);
      const speed = (hasSpeedBoost ? MOVE_SPEED * SPEED_BOOST_MULTIPLIER : MOVE_SPEED) * metaSpeedMul;
      moveDir.normalize().multiplyScalar(speed * delta);
      const prevX = lp.x;
      const prevZ = lp.z;

      lp.x = resolveAxis(lp.x + moveDir.x, lp.z, "x");
      lp.z = resolveAxis(lp.x, lp.z + moveDir.z, "z");

      const moved = Math.abs(lp.x - prevX) > 0.001 || Math.abs(lp.z - prevZ) > 0.001;
      if (moved) {
        playFootstep();
        isMoving = true;
      }
    }

    camera.position.set(
      lp.x + shakeOffsetRef.current.x,
      1.6 + shakeOffsetRef.current.y,
      lp.z + shakeOffsetRef.current.z
    );

    const flashMul = getFlashlightMultiplier(useGameState.getState().meta);
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position);
      lightRef.current.intensity = (hasTorchUpgrade ? 6 : 4) * flashMul;
      lightRef.current.distance = (hasTorchUpgrade ? 18 : 12) * flashMul;
    }
    if (spotRef.current) {
      spotRef.current.position.copy(camera.position);
      const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      spotRef.current.target.position.copy(camera.position).add(lookDir.multiplyScalar(5));
      spotRef.current.target.updateMatrixWorld();
      spotRef.current.intensity = (hasTorchUpgrade ? 8 : 5) * flashMul;
      spotRef.current.distance = (hasTorchUpgrade ? 25 : 18) * flashMul;
    }

    if (dustRef.current && isMoving) {
      dustTimerRef.current += delta;
      if (dustTimerRef.current > 0.08) {
        dustTimerRef.current = 0;
        const geo = dustRef.current.geometry;
        const pos = geo.attributes.position as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = DUST_COUNT - 1; i > 0; i--) {
          arr[i * 3] = arr[(i - 1) * 3];
          arr[i * 3 + 1] = arr[(i - 1) * 3 + 1];
          arr[i * 3 + 2] = arr[(i - 1) * 3 + 2];
        }
        arr[0] = camera.position.x + (Math.random() - 0.5) * 0.3;
        arr[1] = 0.05 + Math.random() * 0.15;
        arr[2] = camera.position.z + (Math.random() - 0.5) * 0.3;
        pos.needsUpdate = true;
      }
    }

    if (attackBlastRef.current) {
      attackBlastTimerRef.current = Math.max(0, attackBlastTimerRef.current - delta);
      if (attackBlastTimerRef.current > 0) {
        attackBlastRef.current.visible = true;
        const progress = 1 - (attackBlastTimerRef.current / 0.3);
        const scale = 0.3 + progress * ATTACK_RANGE;
        attackBlastRef.current.scale.setScalar(scale);
        (attackBlastRef.current.material as THREE.MeshStandardMaterial).opacity = 0.4 * (1 - progress);
        attackBlastRef.current.position.copy(camera.position);
        attackBlastRef.current.position.y = 1.0;
      } else {
        attackBlastRef.current.visible = false;
      }
    }

    setPlayerPosition(lp.x, lp.z);
    setPlayerYaw(yawRef.current);
  });

  return (
    <>
      <pointLight ref={lightRef} color="#aabbff" intensity={4} distance={12} />
      <spotLight ref={spotRef} color="#ffffff" intensity={5} distance={18} angle={0.6} penumbra={0.5}>
        <object3D />
      </spotLight>
      <points ref={dustRef} material={dustMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} count={DUST_COUNT} />
        </bufferGeometry>
      </points>
      <mesh ref={attackBlastRef} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#88ccff"
          emissive="#44aaff"
          emissiveIntensity={3}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
