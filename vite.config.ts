import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    /* qa-prep is a separate project with its own vitest config and setup.
       Without this, the default glob reaches down into it and runs its tests
       under the wrong environment. Its own CI job covers them. */
    exclude: ["**/node_modules/**", "**/dist/**", "qa-prep/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/test/**",
        "src/data/**",
        "src/components/three/**",
      ],
    },
  },
});
