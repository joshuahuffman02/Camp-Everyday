import { defineConfig } from "tsup";

export default defineConfig([
  // Main server build (for local dev)
  {
    entry: ["src/main.ts", "src/serverless.ts"],
    format: ["cjs"],
    platform: "node",
    target: "node18",
    outDir: "dist",
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: false,
    dts: false,
    tsconfig: "./tsconfig.json",
    skipNodeModulesBundle: true,
    shims: false
  },
  // Vercel serverless build (output to api/ folder)
  {
    entry: { "app.bootstrap": "src/app.bootstrap.ts" },
    format: ["cjs"],
    platform: "node",
    target: "node18",
    outDir: "api",
    sourcemap: false,
    clean: false,
    splitting: false,
    minify: false,
    dts: false,
    tsconfig: "./tsconfig.json",
    skipNodeModulesBundle: true,
    shims: false
  }
]);
