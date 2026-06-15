'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/components/ThemeProvider';

function AnimatedMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { theme } = useTheme();

  const colorA = useMemo(() => new THREE.Color(), []);
  const colorB = useMemo(() => new THREE.Color(), []);
  const colorC = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    if (theme === 'dark') {
      colorA.setHSL(0.58, 0.7, 0.15);
      colorB.setHSL(0.5, 0.8, 0.12);
      colorC.setHSL(0.62, 0.6, 0.18);
    } else {
      colorA.setHSL(0.55, 0.7, 0.85);
      colorB.setHSL(0.5, 0.6, 0.92);
      colorC.setHSL(0.6, 0.8, 0.88);
    }
  }, [theme, colorA, colorB, colorC]);

  useFrame(({ clock, pointer }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const material = meshRef.current.material as THREE.ShaderMaterial;
    if (material.uniforms) {
      material.uniforms.uTime.value = t;
      material.uniforms.uPointer.value.set(pointer.x, pointer.y);
      material.uniforms.uColorA.value.copy(colorA);
      material.uniforms.uColorB.value.copy(colorB);
      material.uniforms.uColorC.value.copy(colorC);
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColorA: { value: new THREE.Color() },
      uColorB: { value: new THREE.Color() },
      uColorC: { value: new THREE.Color() },
    }),
    []
  );

  return (
    <mesh ref={meshRef} position={[0, 0, -2]} scale={[4, 4, 1]}>
      <planeGeometry args={[1, 1, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        vertexShader={`
          uniform float uTime;
          uniform vec2 uPointer;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 pos = position;
            float wave1 = sin(pos.x * 2.0 + uTime * 0.4) * 0.08;
            float wave2 = cos(pos.y * 1.5 + uTime * 0.3) * 0.06;
            float wave3 = sin((pos.x + pos.y) * 1.8 + uTime * 0.5) * 0.04;
            float pointerInfluence = exp(-distance(pos.xy * 0.5, uPointer * 0.3) * 2.0) * 0.15;
            pos.z += wave1 + wave2 + wave3 + pointerInfluence;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;
          varying vec2 vUv;
          void main() {
            vec2 uv = vUv - 0.5;
            float dist = length(uv);
            float falloff = smoothstep(0.7, 0.0, dist);
            vec3 col = mix(uColorA, uColorB, uv.x + 0.5);
            col = mix(col, uColorC, uv.y + 0.5);
            float alpha = falloff * 0.65;
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}

function FloatingParticles({ count = 30 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const { theme } = useTheme();

  const { positions, sizes, baseColor } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      sizes[i] = Math.random() * 0.04 + 0.01;
    }
    const baseColor = new THREE.Color();
    return { positions, sizes, baseColor };
  }, [count]);

  useEffect(() => {
    if (theme === 'dark') {
      baseColor.setHSL(0.55, 0.9, 0.7);
    } else {
      baseColor.setHSL(0.55, 0.6, 0.5);
    }
  }, [theme, baseColor]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.z = t * 0.02;
    const positions = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const originalY = positions.getY(i);
      positions.setY(i, originalY + Math.sin(t * 0.5 + i) * 0.002);
    }
    positions.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={baseColor}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function ResponsiveCamera() {
  const { size, camera } = useThree();
  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    if (size.width < 768) {
      persp.fov = 60;
    } else {
      persp.fov = 45;
    }
    persp.updateProjectionMatrix();
  }, [size, camera]);
  return null;
}

export function AmbientBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }

    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!supported || reducedMotion) {
    return (
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--accent) / 0.05) 100%)',
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <ResponsiveCamera />
        <AnimatedMesh />
        <FloatingParticles count={25} />
      </Canvas>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, hsl(var(--background) / 0.3) 50%, hsl(var(--background) / 0.7) 100%)',
        }}
      />
    </div>
  );
}
