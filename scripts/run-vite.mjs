import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

import { ensureEsbuildBinaryPath } from "./esbuild-binary-path.mjs";

const require = createRequire(import.meta.url);

function run() {
  let viteCliPath;

  try {
    const vitePackageJsonPath = require.resolve("vite/package.json");
    viteCliPath = path.join(path.dirname(vitePackageJsonPath), "bin", "vite.js");
  }
  catch {
    console.error("Vite is not installed yet. Run `bun install` before starting the dev server.");
    process.exit(1);
  }

  const child = spawn(process.execPath, [viteCliPath, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: {
      ...process.env,
      ESBUILD_BINARY_PATH: ensureEsbuildBinaryPath(),
    },
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

run();
