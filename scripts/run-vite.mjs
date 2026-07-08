import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import net from "node:net";

import { ensureEsbuildBinaryPath } from "./esbuild-binary-path.mjs";

const require = createRequire(import.meta.url);

function getRequestedPort() {
  const args = process.argv.slice(2);
  const portFlagIndex = args.findIndex((arg) => arg === "--port");

  if (portFlagIndex !== -1 && args[portFlagIndex + 1]) {
    const parsedPort = Number.parseInt(args[portFlagIndex + 1], 10);

    if (!Number.isNaN(parsedPort)) {
      return parsedPort;
    }
  }

  const command = args[0];

  if (!command || command === "dev") {
    return 5174;
  }

  if (command === "preview") {
    return 4174;
  }

  return null;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port, host: "127.0.0.1" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort, maxAttempts = 25) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidatePort = startPort + offset;

    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(candidatePort)) {
      return candidatePort;
    }
  }

  throw new Error(
    `No available port found between ${startPort} and ${startPort + maxAttempts - 1}.`
  );
}

async function run() {
  let viteCliPath;

  try {
    const vitePackageJsonPath = require.resolve("vite/package.json");
    viteCliPath = path.join(path.dirname(vitePackageJsonPath), "bin", "vite.js");
  }
  catch {
    console.error("Vite is not installed yet. Run `bun install` before starting the dev server.");
    process.exit(1);
  }

  const scriptArgs = process.argv.slice(2);
  const hasExplicitPort = scriptArgs.includes("--port");
  const requestedPort = getRequestedPort();
  const command = scriptArgs[0] && !scriptArgs[0].startsWith("-")
    ? scriptArgs[0]
    : "dev";
  const viteArgs = [...scriptArgs];
  process.env.ESBUILD_BINARY_PATH = ensureEsbuildBinaryPath();

  if (!hasExplicitPort && requestedPort !== null) {
    const resolvedPort = await findAvailablePort(requestedPort);

    if (resolvedPort !== requestedPort) {
      console.log(
        `[SafeSpeak admin] Port ${requestedPort} is busy, using ${resolvedPort} instead.`
      );
    }

    console.log(
      `[SafeSpeak admin] Starting on http://localhost:${resolvedPort}.`
    );
    viteArgs.push("--port", String(resolvedPort));
  }

  if (command === "dev") {
    // Keep a ref'ed handle alive so npm/PowerShell don't detach from the
    // wrapper before the spawned Vite process is done.
    const keepAlive = setInterval(() => {}, 1 << 30);
    const child = spawn(process.execPath, [viteCliPath, ...viteArgs], {
      stdio: "inherit",
      env: {
        ...process.env,
        ESBUILD_BINARY_PATH: ensureEsbuildBinaryPath(),
      },
    });

    const cleanup = (code) => {
      clearInterval(keepAlive);
      process.exit(code ?? 0);
    };

    child.on("exit", (code, signal) => {
      if (signal) {
        clearInterval(keepAlive);
        process.kill(process.pid, signal);
        return;
      }

      cleanup(code);
    });

    child.on("error", (error) => {
      clearInterval(keepAlive);
      console.error(
        `[SafeSpeak admin] Failed to start dev server: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    });

    return;
  }

  const child = spawn(process.execPath, [viteCliPath, ...viteArgs], {
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

run().catch((error) => {
  console.error(
    `[SafeSpeak admin] Failed to start dev server: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
