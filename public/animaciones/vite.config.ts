import { defineConfig } from 'vite';

/**
 * Configuración de Vite optimizada para un motor 3D de alto rendimiento.
 * - Habilita la source-map para depurar escenas.
 * - Define el puerto del dev server.
 * - Permite cargar modelos .glb / .gltf / .drc como assets estáticos.
 */
export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    open: true,
    strictPort: false
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
          anime: ['animejs']
        }
      }
    }
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.drc', '**/*.hdr']
});
