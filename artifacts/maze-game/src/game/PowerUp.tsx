import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PowerUpType } from "./mazeGenerator";
import { playPickup } from "./audioSystem";
import { useGameState } from "./gameState";

const POWERUP_COLORS: Record<PowerUpType, { main: string; emissive: string; light: string }> = {
  speed_boost: { main: "#3388ff", emissive: "#2266dd", light: "#4499ff" },
  shield: { main: "#00ddff", emissive: "#00aacc", light: "#44eeff" },
  health_potion: { main: "#44dd55", emissive: "#22aa33", light: "#55ff66" },
  torch_upgrade: { main: "#ffcc00", emissive: "#ddaa00", light: "#ffdd44" },
};

interface PowerUpProps {
  position: { x: number; z: number };
  type: PowerUpType;
  onCollect: (type: PowerUpType) => void;
}

export function PowerUp({ position, type, onCollect }: PowerUpProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [collected, setCollected] = useState(false);
  const colors = POWERUP_COLORS[type];

  const mainMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: colors.main,
    emissive: colors.emissive,
    emissiveIntensity: 1.2,
    roughness: 0.2,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  }), [colors]);

  useFrame((_, delta) => {
    if (collected || !groupRef.current) return;
    const t = Date.now() * 0.001;
    groupRef.current.rotation.y += delta * 2.5;
    groupRef.current.position.y = 1.4 + Math.sin(t * 3 + position.x * 7) * 0.2;

    const playerPosition = useGameState.getState().playerPosition;
    const dx = playerPosition.x - position.x;
    const dz = playerPosition.z - position.z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
      setCollected(true);
      playPickup();
      onCollect(type);
    }
  });

  if (collected) return null;

  if (type === "health_potion") {
    return (
      <group ref={groupRef} position={[position.x, 1.4, position.z]}>
        <mesh material={mainMat}>
          <cylinderGeometry args={[0.12, 0.15, 0.35, 8]} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={colors.main} emissive={colors.emissive} emissiveIntensity={2} transparent opacity={0.7} />
        </mesh>
        <pointLight color={colors.light} intensity={3} distance={6} />
      </group>
    );
  }

  if (type === "shield") {
    return (
      <group ref={groupRef} position={[position.x, 1.4, position.z]}>
        <mesh material={mainMat}>
          <octahedronGeometry args={[0.25, 0]} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.35, 0.03, 8, 24]} />
          <meshStandardMaterial color={colors.main} emissive={colors.emissive} emissiveIntensity={1.5} transparent opacity={0.5} />
        </mesh>
        <pointLight color={colors.light} intensity={3} distance={6} />
      </group>
    );
  }

  if (type === "torch_upgrade") {
    return (
      <group ref={groupRef} position={[position.x, 1.4, position.z]}>
        <mesh material={mainMat}>
          <coneGeometry args={[0.2, 0.4, 6]} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffee88" emissiveIntensity={4} />
        </mesh>
        <pointLight color={colors.light} intensity={4} distance={7} />
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[position.x, 1.4, position.z]}>
      <mesh material={mainMat}>
        <dodecahedronGeometry args={[0.22, 0]} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.32, 0.02, 8, 20]} />
        <meshStandardMaterial color={colors.main} emissive={colors.emissive} emissiveIntensity={1.5} transparent opacity={0.4} />
      </mesh>
      <pointLight color={colors.light} intensity={3} distance={6} />
    </group>
  );
}
