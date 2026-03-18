import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameState } from "./gameState";

const TRAP_SIZE = 2.8;

interface SpikeTrapProps {
  position: { x: number; z: number };
  onHitPlayer: () => void;
}

export function SpikeTrap({ position, onHitPlayer }: SpikeTrapProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const hitCooldownRef = useRef(0);

  const trapMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#661111",
    emissive: "#cc0000",
    emissiveIntensity: 0.3,
    roughness: 0.5,
    metalness: 0.3,
  }), []);

  const spikeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#888888",
    roughness: 0.3,
    metalness: 0.8,
  }), []);

  const spikePositions = useMemo(() => {
    const spikes: [number, number][] = [];
    const spacing = 0.55;
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        spikes.push([x * spacing, z * spacing]);
      }
    }
    return spikes;
  }, []);

  useFrame((_, delta) => {
    hitCooldownRef.current = Math.max(0, hitCooldownRef.current - delta);
    const t = Date.now() * 0.001;
    const pulse = 0.3 + Math.sin(t * 4) * 0.3;

    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
    if (lightRef.current) {
      lightRef.current.intensity = pulse * 2;
    }

    const playerPosition = useGameState.getState().playerPosition;
    const dx = playerPosition.x - position.x;
    const dz = playerPosition.z - position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.2 && hitCooldownRef.current <= 0) {
      onHitPlayer();
      hitCooldownRef.current = 1.5;
    }
  });

  return (
    <group position={[position.x, 0.01, position.z]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} material={trapMat}>
        <planeGeometry args={[TRAP_SIZE, TRAP_SIZE]} />
      </mesh>

      {spikePositions.map(([sx, sz], i) => (
        <mesh key={i} position={[sx, 0.15, sz]} material={spikeMat}>
          <coneGeometry args={[0.06, 0.3, 4]} />
        </mesh>
      ))}

      <pointLight ref={lightRef} color="#ff2200" intensity={0.6} distance={5} position={[0, 0.5, 0]} />
    </group>
  );
}
