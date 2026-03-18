import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playLoreDiscovery } from "./audioSystem";
import { useGameState } from "./gameState";

const PARTICLE_COUNT = 12;

interface LoreFragmentProps {
  position: { x: number; z: number };
  onCollect: () => void;
}

export function LoreFragment({ position, onCollect }: LoreFragmentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particleRef = useRef<THREE.Points>(null);
  const [collected, setCollected] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const burstTimerRef = useRef(0);

  const scrollMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#e8d5a3",
    roughness: 0.85,
    metalness: 0.05,
    emissive: "#ffd700",
    emissiveIntensity: 0.4,
  }), []);

  const sealMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#8b0000",
    roughness: 0.5,
    metalness: 0.3,
    emissive: "#cc2200",
    emissiveIntensity: 0.3,
  }), []);

  const runeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#aa88ff",
    roughness: 0.3,
    metalness: 0.6,
    emissive: "#9966ff",
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.9,
  }), []);

  const burstData = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * (1.5 + Math.random()),
        1.5 + Math.random() * 2,
        Math.sin(angle) * (1.5 + Math.random())
      ));
    }
    return { positions, velocities };
  }, []);

  const burstMat = useMemo(() => new THREE.PointsMaterial({
    color: "#ffd700",
    size: 0.1,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    if (showBurst && particleRef.current) {
      burstTimerRef.current += delta;
      const geo = particleRef.current.geometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        arr[i * 3] += burstData.velocities[i].x * delta;
        arr[i * 3 + 1] += burstData.velocities[i].y * delta;
        arr[i * 3 + 2] += burstData.velocities[i].z * delta;
        burstData.velocities[i].y -= 4 * delta;
      }
      pos.needsUpdate = true;
      burstMat.opacity = Math.max(0, 1 - burstTimerRef.current * 1.5);
      if (burstTimerRef.current > 0.8) {
        setShowBurst(false);
      }
      return;
    }

    if (collected) return;
    if (!groupRef.current) return;

    const t = Date.now() * 0.001;
    groupRef.current.rotation.y += delta * 0.8;
    groupRef.current.position.y = 1.4 + Math.sin(t * 1.5 + position.x * 7) * 0.1;

    const pulse = 0.3 + Math.sin(t * 3) * 0.15;
    runeMat.emissiveIntensity = 0.8 + pulse;

    const playerPosition = useGameState.getState().playerPosition;
    const dx = playerPosition.x - position.x;
    const dz = playerPosition.z - position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.8) {
      setCollected(true);
      setShowBurst(true);
      burstTimerRef.current = 0;
      burstMat.opacity = 1;
      playLoreDiscovery();
      onCollect();
    }
  });

  if (collected && !showBurst) return null;

  return (
    <>
      {!collected && (
        <group ref={groupRef} position={[position.x, 1.4, position.z]}>
          <mesh material={scrollMat} rotation={[0, 0, Math.PI / 12]}>
            <cylinderGeometry args={[0.08, 0.08, 0.45, 8]} />
          </mesh>

          <mesh material={scrollMat} position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 12]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 8]} />
          </mesh>
          <mesh material={scrollMat} position={[0, -0.25, 0]} rotation={[0, 0, Math.PI / 12]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 8]} />
          </mesh>

          <mesh material={sealMat} position={[0.09, 0, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
          </mesh>

          <mesh material={runeMat} position={[0, 0, 0.12]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.15, 0.015, 6, 16]} />
          </mesh>
          <mesh material={runeMat} position={[0, 0, -0.12]} rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.12, 0.012, 6, 16]} />
          </mesh>

          <pointLight color="#ffd700" intensity={3} distance={6} />
          <pointLight color="#aa88ff" intensity={1.5} distance={4} />
        </group>
      )}
      {showBurst && (
        <points ref={particleRef} position={[position.x, 1.4, position.z]} material={burstMat}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[burstData.positions, 3]} count={PARTICLE_COUNT} />
          </bufferGeometry>
        </points>
      )}
    </>
  );
}
