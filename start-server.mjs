import { spawn } from "child_process";

const server = spawn("npx", ["next", "dev", "--port", "3000"], {
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
  cwd: "/home/z/my-project",
  env: { ...process.env },
});

server.stdout.on("data", (d) => process.stdout.write(d));
server.stderr.on("data", (d) => process.stderr.write(d));

server.unref();

// Keep this process alive by setInterval
setInterval(() => {}, 10000);

console.log("Server launched with PID:", server.pid);
