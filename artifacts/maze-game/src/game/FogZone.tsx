import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameState } from "./gameState";

interface FogZoneProps {
  position: { x: number; z: number };
  radius: number;
  onEnter: () => void;
  onExit: () => void;
}

export function FogZone({ position, radius, onEnter, onExit }: FogZoneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wasInsideRef = useRef(false);

  useEffect(() => {
    return () => {
      if (wasInsideRef.current) {
        onExit();
        wasInsideRef.current = false;
      }
    };
  }, [onExit]);
  const particlesRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * 2.5;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      speeds[i] = 0.3 + Math.random() * 0.5;
    }
    return { positions, speeds, count };
  }, [radius]);

  const fogMat = useMemo(() => new THREE.PointsMaterial({
    color: "#667788",
    size: 0.4,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  useFrame((_, delta) => {
    const playerPosition = useGameState.getState().playerPosition;
    const dx = playerPosition.x - position.x;
    const dz = playerPosition.z - position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const inside = dist < radius;

    if (inside && !wasInsideRef.current) {
      onEnter();
    } else if (!inside && wasInsideRef.current) {
      onExit();
    }
    wasInsideRef.current = inside;

    if (particlesRef.current) {
      const geo = particlesRef.current.geometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const t = Date.now() * 0.001;
      for (let i = 0; i < particleData.count; i++) {
        arr[i * 3 + 1] += delta * particleData.speeds[i] * 0.3;
        arr[i * 3] += Math.sin(t + i) * delta * 0.1;
        if (arr[i * 3 + 1] > 3) arr[i * 3 + 1] = 0;
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, 0, position.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshStandardMaterial
          color="#334455"
          emissive="#223344"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      <points ref={particlesRef} material={fogMat}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
            count={particleData.count}
          />
        </bufferGeometry>
      </points>
    </group>
  );
}
