import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(resolve(".env.local"));
loadEnvFile(resolve(".env"));

const { sql } = await import("../db/neon.js");
const [result] = await sql`select current_database() as database, now() as checked_at`;

console.log(`Connected to Neon database "${result.database}" at ${result.checked_at.toISOString()}`);
