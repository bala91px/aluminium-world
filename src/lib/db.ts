import fs from "node:fs";
import path from "node:path";
import type { DB } from "./types";
import { buildSeed } from "./seed";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function ensureFile(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(buildSeed(), null, 2));
  }
}

export function readDB(): DB {
  ensureFile();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DB;
}

export function writeDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function resetDB(): DB {
  const fresh = buildSeed();
  writeDB(fresh);
  return fresh;
}
