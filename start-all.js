const { spawn } = require('child_process');
const path = require('path');

const fs = require('fs');

let GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  try {
    const envPath = path.join(__dirname, 'frontend', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/VITE_GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
      if (match) {
        GEMINI_API_KEY = match[1];
      }
    }
  } catch (err) {
    console.error("Error reading frontend/.env:", err.message);
  }
}

function runProcess(name, command, args, cwd, env = {}) {
  const p = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    shell: true
  });

  p.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`[${name}] ${line}`);
    });
  });

  p.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.error(`[${name} ERROR] ${line}`);
    });
  });

  p.on('close', (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  return p;
}

console.log("Starting ARCOLAB 5S local development services...");

// 1. Run Deno Edge Functions
// employee-login on port 8001
const employeeLogin = runProcess(
  "Auth Function",
  "npx",
  ["deno-bin", "run", "-A", "supabase/functions/employee-login/index.ts"],
  process.cwd(),
  { PORT: "8001" }
);

// analyze-5s on port 8002
const analyze5s = runProcess(
  "CV Function",
  "npx",
  ["deno-bin", "run", "-A", "supabase/functions/analyze-5s/index.ts"],
  process.cwd(),
  { PORT: "8002", GEMINI_API_KEY: GEMINI_API_KEY }
);

// save-analysis-log on port 8003
const saveLog = runProcess(
  "Log Function",
  "npx",
  ["deno-bin", "run", "-A", "supabase/functions/save-analysis-log/index.ts"],
  process.cwd(),
  { PORT: "8003" }
);

// 2. Run Deno Gateway on port 54321
const gateway = runProcess(
  "Gateway Proxy",
  "npx",
  ["deno-bin", "run", "-A", "gateway.ts"],
  process.cwd()
);

// 3. Run Frontend Vite server on port 8081 (in frontend directory)
const frontend = runProcess(
  "Vite Frontend",
  "npm",
  ["run", "dev"],
  path.join(process.cwd(), "frontend")
);

// Handle clean shutdown of child processes
process.on('SIGINT', () => {
  console.log("\nShutting down all services...");
  employeeLogin.kill();
  analyze5s.kill();
  saveLog.kill();
  gateway.kill();
  frontend.kill();
  process.exit();
});
