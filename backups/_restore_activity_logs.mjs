#!/usr/bin/env node
import { Client } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const backup = JSON.parse(fs.readFileSync(path.resolve(__dirname, "backup_2026-09-13T08-00-06-242Z.json"), "utf-8"));
const table = backup.tables.activity_logs;
console.log("Rows to restore:", table.count);

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query("BEGIN");
await client.query('TRUNCATE "activity_logs" RESTART IDENTITY CASCADE');

const cols = Object.keys(table.rows[0]);
const colList = cols.map((c) => `"${c}"`).join(", ");
const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");

for (let i = 0; i < table.rows.length; i += 100) {
  const batch = table.rows.slice(i, i + 100);
  const values = [];
  const paramIdx = [];
  let p = 1;
  for (const row of batch) {
    const rowVals = cols.map((c) => row[c] ?? null);
    paramIdx.push(`(${cols.map(() => `$${p++}`).join(", ")})`);
    values.push(...rowVals);
  }
  await client.query(`INSERT INTO "activity_logs" (${colList}) VALUES ${paramIdx.join(", ")}`, values);
}

await client.query("COMMIT");
console.log("Restored", table.count, "rows to activity_logs");
await client.end();
