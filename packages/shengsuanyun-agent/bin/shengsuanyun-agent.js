#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PROVIDER = "shengsuanyun";
const DEFAULT_MODEL = "deepseek/deepseek-v4-pro";
const MODEL_SCOPE = "shengsuanyun/*";
const MODEL_ENV = "SHENGSUANYUN_GATEWAY_MODEL";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const piDistDir = dirname(fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent")));
const piCliPath = resolve(piDistDir, "cli.js");
const extensionPath = resolve(packageDir, "src/extension.ts");
const themePath = resolve(packageDir, "themes/shengsuanyun-dark.json");

const defaultArgs = [
	"--extension",
	extensionPath,
	"--theme",
	themePath,
	"--provider",
	DEFAULT_PROVIDER,
	"--model",
	process.env[MODEL_ENV] ?? DEFAULT_MODEL,
	"--models",
	MODEL_SCOPE,
];

const result = spawnSync(process.execPath, [piCliPath, ...defaultArgs, ...process.argv.slice(2)], {
	cwd: process.cwd(),
	env: process.env,
	stdio: "inherit",
});

if (result.error) {
	throw result.error;
}

if (result.signal) {
	process.kill(process.pid, result.signal);
} else {
	process.exit(result.status ?? 1);
}
