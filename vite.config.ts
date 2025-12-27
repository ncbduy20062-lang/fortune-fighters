import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Vite configuration with COOP/COEP headers required for FHE WASM
 * These headers enable SharedArrayBuffer which is necessary for
 * the Zama FHE SDK to load and execute WebAssembly modules
 */
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Required for FHE SDK WASM execution
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimize FHE SDK bundle loading
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk"],
  },
}));
