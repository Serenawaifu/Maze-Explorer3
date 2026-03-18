import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playPickup } from "./audioSystem";
import { useGameState } from "./gameState";

const SPARKLE_COUNT = 20;

interface CollectibleProps {
  position: { x: number; z: number };
  onCollect: () => void;
}

export function Collectible({ position, onCollect }: CollectibleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sparkleRef = useRef<THREE.Points>(null);
  const [collected, setCollected] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const sparkleTimerRef = useRef(0);

  const orangeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ff8c00",
    roughness: 0.65,
    metalness: 0.05,
    emissive: "#ff6600",
    emissiveIntensity: 0.6,
  }), []);

  const stemMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#2d5a1e",
    roughness: 0.8,
  }), []);

  const leafMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#3a7a28",
    roughness: 0.7,
    side: THREE.DoubleSide,
  }), []);

  const sparkleData = useMemo(() => {
    const positions = new Float32Array(SPARKLE_COUNT * 3);
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 4
      ));
    }
    return { positions, velocities };
  }, []);

  const sparkleMat = useMemo(() => new THREE.PointsMaterial({
    color: "#ffaa33",
    size: 0.12,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    if (showSparkle && sparkleRef.current) {
      sparkleTimerRef.current += delta;
      const geo = sparkleRef.current.geometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        arr[i * 3] += sparkleData.velocities[i].x * delta;
        arr[i * 3 + 1] += sparkleData.velocities[i].y * delta;
        arr[i * 3 + 2] += sparkleData.velocities[i].z * delta;
        sparkleData.velocities[i].y -= 5 * delta;
      }
      pos.needsUpdate = true;
      sparkleMat.opacity = Math.max(0, 1 - sparkleTimerRef.current * 2);
      if (sparkleTimerRef.current > 0.6) {
        setShowSparkle(false);
      }
      return;
    }

    if (collected) return;
    if (!groupRef.current) return;

    const t = Date.now() * 0.001;
    groupRef.current.rotation.y += delta * 1.5;
    groupRef.current.position.y = 1.2 + Math.sin(t * 2 + position.x * 10) * 0.15;

    const playerPosition = useGameState.getState().playerPosition;
    const dx = playerPosition.x - position.x;
    const dz = playerPosition.z - position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.5) {
      setCollected(true);
      setShowSparkle(true);
      sparkleTimerRef.current = 0;
      sparkleMat.opacity = 1;
      playPickup();
      onCollect();
    }
  });

  if (collected && !showSparkle) return null;

  return (
    <>
      {!collected && (
        <group ref={groupRef} position={[position.x, 1.2, position.z]}>
          <mesh material={orangeMaterial}>
            <sphereGeometry args={[0.25, 16, 16]} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={stemMaterial}>
            <cylinderGeometry args={[0.02, 0.03, 0.1, 6]} />
          </mesh>
          <mesh position={[0.06, 0.3, 0]} rotation={[0, 0, -0.4]} material={leafMaterial}>
            <planeGeometry args={[0.12, 0.06]} />
          </mesh>
          <pointLight color="#ff8c00" intensity={2} distance={5} />
        </group>
      )}
      {showSparkle && (
        <points ref={sparkleRef} position={[position.x, 1.2, position.z]} material={sparkleMat}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[sparkleData.positions, 3]} count={SPARKLE_COUNT} />
          </bufferGeometry>
        </points>
      )}
    </>
  );
}
