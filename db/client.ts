import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH ?? "./data/ranked.db";

function createSqlite(): Database.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const handle = new Database(dbPath);
  handle.pragma("journal_mode = WAL");
  handle.pragma("foreign_keys = ON");
  return handle;
}

// Singleton, cached on globalThis so dev hot reloads reuse one connection.
const globalForDb = globalThis as unknown as {
  rankedSqlite?: Database.Database;
};

export const sqlite: Database.Database =
  globalForDb.rankedSqlite ?? (globalForDb.rankedSqlite = createSqlite());

export const db = drizzle(sqlite, { schema });
