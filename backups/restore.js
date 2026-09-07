#!/usr/bin/env node
/**
 * Database restore script.
 * Usage:  node backups/restore.js backups/backup_2026-09-07T....json
 *         node backups/restore.js backups/backup_2026-09-07T....json --tables announcements,subjects
 *         node backups/restore.js backups/backup_2026-09-07T....json --dry-run
 *
 * WARNING: This truncates target tables and re-inserts all rows from the backup.
 * Always create a fresh backup before restoring.
 */

import { Client } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const args = process.argv.slice(2);
const backupFile = args.find((a) => !a.startsWith("--"));
const tablesFlag = args.indexOf("--tables");
const onlyTables = tablesFlag !== -1 ? args[tablesFlag + 1]?.split(",") : null;
const dryRun = args.includes("--dry-run");

async function main() {
  if (!backupFile) {
    console.error("Usage: node backups/restore.js <backup-file.json> [--tables t1,t2] [--dry-run]");
    process.exit(1);
  }

  const resolved = path.resolve(backupFile);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  const tableNames = onlyTables
    ? Object.keys(backup.tables).filter((t) => onlyTables.includes(t))
    : Object.keys(backup.tables);

  if (tableNames.length === 0) {
    console.error("No tables found in backup to restore.");
    process.exit(1);
  }

  console.log(`Restore source: ${backupFile}`);
  console.log(`Backed up at:   ${backup.backed_up_at}`);
  console.log(`Tables to restore: ${tableNames.join(", ")}`);
  if (dryRun) {
    console.log("\n[DRY RUN] Would restore:");
    for (const t of tableNames) {
      console.log(`  ${t}: ${backup.tables[t].count} rows`);
    }
    return;
  }

  const confirm = await new Promise((resolve) => {
    process.stdout.write("\nThis will TRUNCATE and re-insert data. Type 'yes' to confirm: ");
    process.stdin.once("data", (d) => resolve(d.toString().trim().toLowerCase()));
  });
  if (confirm !== "yes") {
    console.log("Aborted.");
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set in .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  let totalRows = 0;
  for (const table of tableNames) {
    const { rows, count } = backup.tables[table];
    if (count === 0) {
      console.log(`  ${table}: 0 rows (skipping)`);
      continue;
    }

    await client.query("BEGIN");
    await client.query(`TRUNCATE "${table}" RESTART IDENTITY CASCADE`);

    if (rows.length > 0) {
      const cols = Object.keys(rows[0]);
      const colList = cols.map((c) => `"${c}"`).join(", ");
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");

      for (const row of rows) {
        const values = cols.map((c) => row[c] ?? null);
        await client.query(`INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`, values);
      }
    }

    await client.query("COMMIT");
    totalRows += count;
    console.log(`  ${table}: ${count} rows restored`);
  }

  await client.end();
  console.log(`\nRestore complete. ${tableNames.length} tables, ${totalRows} total rows.`);
}

main().catch((err) => {
  console.error("Restore failed:", err.message);
  process.exit(1);
});
