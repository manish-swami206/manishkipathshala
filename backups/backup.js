#!/usr/bin/env node
/**
 * Full database backup script.
 * Usage:  node backups/backup.js              (backs up all tables to backups/)
 *         node backups/backup.js --tables foo,bar  (only specific tables)
 *         node backups/backup.js --stdout          (dump JSON to stdout instead of file)
 */

import { Client } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const args = process.argv.slice(2);
const tablesFlag = args.indexOf("--tables");
const onlyTables = tablesFlag !== -1 ? args[tablesFlag + 1]?.split(",") : null;
const toStdout = args.includes("--stdout");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set in .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Discover all tables in the public schema
  const { rows: tableRows } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
  );
  const allTables = tableRows.map((r) => r.table_name);
  const tables = onlyTables
    ? allTables.filter((t) => onlyTables.includes(t))
    : allTables;

  if (tables.length === 0) {
    console.error("No tables found to back up.");
    await client.end();
    process.exit(1);
  }

  const backup = {
    backed_up_at: new Date().toISOString(),
    database: "neondb",
    tables: {},
  };

  let totalRows = 0;
  for (const table of tables) {
    const res = await client.query(`SELECT * FROM "${table}"`);
    backup.tables[table] = { rows: res.rows, count: res.rowCount };
    totalRows += res.rowCount;
    process.stdout.write(`  ${table}: ${res.rowCount} rows\n`);
  }

  await client.end();

  if (toStdout) {
    process.stdout.write(JSON.stringify(backup, null, 2));
    return;
  }

  // Write to file
  if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
  const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

  const sizeMB = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);
  process.stdout.write(`\nBackup saved: ${filepath} (${sizeMB} MB, ${tables.length} tables, ${totalRows} total rows)\n`);
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
