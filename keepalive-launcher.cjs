#!/usr/bin/env node
// Flux Stream - Ultra-lightweight keepalive launcher
// Spawns the Next.js production server and keeps the process alive

const { spawn } = require("child_process");
const http = require("http");

const PORT = 3000;

function startServer() {
  const server = spawn("node", [".next/standalone/server.js", "-p", String(PORT)], {
    cwd: "/home/z/my-project",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) },
  });

  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));

  server.on("exit", (code) => {
    console.log(`Server exited (${code}), restarting in 3s...`);
    setTimeout(startServer, 3000);
  });

  return server;
}

const prod = startServer();

// Self-healthcheck — keeps this node process alive
setInterval(() => {
  http.get(`http://localhost:${PORT}/`, (res) => {
    res.resume();
  }).on("error", () => {});
}, 15000);

// Prevent process from exiting
process.on("SIGTERM", () => {
  prod.kill();
  setTimeout(() => process.exit(0), 500);
});
