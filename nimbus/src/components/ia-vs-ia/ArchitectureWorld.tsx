
'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ArchitectureWorldProps {
  amplitude: number;
  metacognition: { thought: string, goal: string };
}

export default function ArchitectureWorld({ amplitude, metacognition }: ArchitectureWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ampRef = useRef(amplitude);

  useEffect(() => {
    ampRef.current = amplitude;
  }, [amplitude]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.Fog(0x020617, 2, 15);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- OBJETOS SAGRADOS ---
    // 1. El Núcleo de la Conciencia (Geometría Sagrada)
    const coreGeom = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x4338ca,
      emissive: 0x6366f1,
      emissiveIntensity: 1,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    scene.add(core);

    // 2. Fragmentos de Memoria (Nube de Partículas)
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15;
    }
    const particlesGeom = new THREE.BufferGeometry();
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    // --- ILUMINACIÓN ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x6366f1, 5, 20);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const currentAmp = ampRef.current;
      const time = Date.now() * 0.001;

      // Reacción al "pulso vital" (voz)
      const targetScale = 1 + currentAmp * 1.5;
      core.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      core.rotation.y += 0.005 + currentAmp * 0.1;
      core.rotation.z += 0.002;

      particles.rotation.y -= 0.001 + currentAmp * 0.02;
      particles.rotation.z += 0.0005;

      coreMat.emissiveIntensity = 0.5 + currentAmp * 5 + Math.sin(time * 2) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      coreGeom.dispose();
      coreMat.dispose();
      particlesGeom.dispose();
      particlesMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <p className="text-blue-400 text-[8px] uppercase font-black tracking-widest bg-black/40 px-2 py-1 rounded">Arquitectura en Tiempo Real</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none z-10" />
    </div>
  );
}
