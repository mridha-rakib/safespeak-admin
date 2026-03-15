import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function run() {
  const currentWorkingDirectory = process.cwd();
  const gitDirectoryPath = path.join(currentWorkingDirectory, ".git");

  if (!fs.existsSync(gitDirectoryPath)) {
    process.exit(0);
  }

  const gitCheck = spawnSync("git", ["rev-parse", "--git-dir"], {
    cwd: currentWorkingDirectory,
    stdio: "ignore",
  });

  if (gitCheck.status !== 0) {
    process.exit(0);
  }

  let huskyBinPath;

  try {
    const huskyPackageJsonPath = require.resolve("husky/package.json");
    huskyBinPath = path.join(path.dirname(huskyPackageJsonPath), "bin.js");
  }
  catch {
    process.exit(0);
  }

  const huskyRun = spawnSync(process.execPath, [huskyBinPath], {
    cwd: currentWorkingDirectory,
    stdio: "inherit",
  });

  process.exit(huskyRun.status ?? 0);
}

run();
