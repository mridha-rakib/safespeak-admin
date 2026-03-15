import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ESBUILD_PACKAGE_BY_PLATFORM = {
  aix: {
    ppc64: "@esbuild/aix-ppc64",
  },
  android: {
    arm64: "@esbuild/android-arm64",
    x64: "@esbuild/android-x64",
  },
  darwin: {
    arm64: "@esbuild/darwin-arm64",
    x64: "@esbuild/darwin-x64",
  },
  freebsd: {
    arm64: "@esbuild/freebsd-arm64",
    x64: "@esbuild/freebsd-x64",
  },
  linux: {
    arm: "@esbuild/linux-arm",
    arm64: "@esbuild/linux-arm64",
    ia32: "@esbuild/linux-ia32",
    loong64: "@esbuild/linux-loong64",
    mips64el: "@esbuild/linux-mips64el",
    ppc64: "@esbuild/linux-ppc64",
    riscv64: "@esbuild/linux-riscv64",
    s390x: "@esbuild/linux-s390x",
    x64: "@esbuild/linux-x64",
  },
  netbsd: {
    arm64: "@esbuild/netbsd-arm64",
    x64: "@esbuild/netbsd-x64",
  },
  openbsd: {
    arm64: "@esbuild/openbsd-arm64",
    x64: "@esbuild/openbsd-x64",
  },
  sunos: {
    x64: "@esbuild/sunos-x64",
  },
  win32: {
    arm64: "@esbuild/win32-arm64",
    ia32: "@esbuild/win32-ia32",
    x64: "@esbuild/win32-x64",
  },
};

function getViteRequire() {
  const vitePackageJsonPath = require.resolve("vite/package.json");
  return createRequire(vitePackageJsonPath);
}

function getEsbuildPackageName() {
  const packageName = ESBUILD_PACKAGE_BY_PLATFORM[process.platform]?.[process.arch];

  if (!packageName) {
    throw new Error(`Unsupported platform for esbuild: ${process.platform}/${process.arch}`);
  }

  return packageName;
}

function getNativeBinaryPath() {
  const viteRequire = getViteRequire();
  const packageName = getEsbuildPackageName();
  const packageJsonPath = viteRequire.resolve(`${packageName}/package.json`);
  const packageRoot = path.dirname(packageJsonPath);

  const candidatePaths = [
    path.join(packageRoot, "bin", "esbuild"),
    path.join(packageRoot, "bin", "esbuild.exe"),
    path.join(packageRoot, "esbuild.exe"),
  ];

  const binaryPath = candidatePaths.find(candidatePath => fs.existsSync(candidatePath));

  if (!binaryPath) {
    throw new Error(`Unable to locate native esbuild binary for ${packageName}.`);
  }

  return binaryPath;
}

function getEsbuildVersion() {
  const viteRequire = getViteRequire();
  const packageJsonPath = viteRequire.resolve("esbuild/package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  return packageJson.version;
}

export function ensureEsbuildBinaryPath() {
  const configuredBinaryPath = process.env.ESBUILD_BINARY_PATH;

  if (configuredBinaryPath && fs.existsSync(configuredBinaryPath)) {
    return configuredBinaryPath;
  }

  const sourceBinaryPath = getNativeBinaryPath();
  const version = getEsbuildVersion();
  const extension = path.extname(sourceBinaryPath);
  const binaryDigest = crypto.createHash("sha1").update(sourceBinaryPath).digest("hex").slice(0, 8);
  const targetDirectory = path.join(os.tmpdir(), "safespeak-admin-esbuild");
  const targetBinaryPath = path.join(
    targetDirectory,
    `esbuild-${version}-${process.platform}-${process.arch}-${binaryDigest}${extension}`,
  );

  fs.mkdirSync(targetDirectory, { recursive: true });

  const shouldCopyBinary = !fs.existsSync(targetBinaryPath)
    || fs.statSync(targetBinaryPath).size !== fs.statSync(sourceBinaryPath).size;

  if (shouldCopyBinary) {
    fs.copyFileSync(sourceBinaryPath, targetBinaryPath);
  }

  if (process.platform !== "win32") {
    fs.chmodSync(targetBinaryPath, 0o755);
  }

  return targetBinaryPath;
}
