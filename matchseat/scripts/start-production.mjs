import { spawn, spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    console.error(`[start] ${command} ${args.join(" ")} exited with ${result.status}`);
  }
}

run("npx", ["prisma", "db", "push"]);
run("npx", ["tsx", "scripts/ensure-seed.ts"]);

const port = process.env.PORT || "3000";
const child = spawn("npx", ["next", "start", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
