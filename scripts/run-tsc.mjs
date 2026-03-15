import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function run() {
  let tscCliPath;

  try {
    const typescriptPackageJsonPath = require.resolve("typescript/package.json");
    tscCliPath = path.join(path.dirname(typescriptPackageJsonPath), "bin", "tsc");
  }
  catch {
    console.error("TypeScript is not installed yet. Run `bun install` before building.");
    process.exit(1);
  }

  const child = spawn(process.execPath, [tscCliPath, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
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
