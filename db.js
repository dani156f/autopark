import Database from "better-sqlite3";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "autopark.db");
const legacyJsonPath = join(__dirname, "database.json");

export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    label TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invite_id INTEGER REFERENCES invites(id),
    license TEXT NOT NULL,
    phone TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Migration path for a vehicles table created before invite_id/active existed.
const vehicleColumns = db.prepare("PRAGMA table_info(vehicles)").all().map((c) => c.name);
if (!vehicleColumns.includes("invite_id")) {
  db.exec("ALTER TABLE vehicles ADD COLUMN invite_id INTEGER REFERENCES invites(id)");
}
if (!vehicleColumns.includes("active")) {
  db.exec("ALTER TABLE vehicles ADD COLUMN active INTEGER NOT NULL DEFAULT 1");
}

export function createInvite(label) {
  const code = crypto.randomBytes(6).toString("base64url");
  db.prepare("INSERT INTO invites (code, label) VALUES (?, ?)").run(code, label ?? null);
  return db.prepare("SELECT * FROM invites WHERE code = ?").get(code);
}

export function findInviteByCode(code) {
  return db.prepare("SELECT * FROM invites WHERE code = ?").get(code);
}

export function findInviteById(id) {
  return db.prepare("SELECT * FROM invites WHERE id = ?").get(id);
}

// Used by app.js: every active vehicle across every invite, for the daily registration run.
export function listVehicles() {
  return db.prepare("SELECT id, license, phone FROM vehicles WHERE active = 1 ORDER BY id").all();
}

export function listVehiclesForInvite(inviteId) {
  return db
    .prepare("SELECT id, license, phone, active FROM vehicles WHERE invite_id = ? ORDER BY id")
    .all(inviteId)
    .map((v) => ({ ...v, active: Boolean(v.active) }));
}

export function addVehicleForInvite(inviteId, license, phone) {
  const result = db
    .prepare("INSERT INTO vehicles (invite_id, license, phone) VALUES (?, ?, ?)")
    .run(inviteId, license, phone ?? "");
  return { id: result.lastInsertRowid, license, phone, active: true };
}

export function deleteVehicleForInvite(inviteId, id) {
  db.prepare("DELETE FROM vehicles WHERE id = ? AND invite_id = ?").run(id, inviteId);
}

export function setVehicleActiveForInvite(inviteId, id, active) {
  db.prepare("UPDATE vehicles SET active = ? WHERE id = ? AND invite_id = ?").run(
    active ? 1 : 0,
    id,
    inviteId
  );
}

// One-time migration from the old database.json flat file, if present and not yet imported.
const vehicleCount = db.prepare("SELECT COUNT(*) AS count FROM vehicles").get().count;
if (vehicleCount === 0 && existsSync(legacyJsonPath)) {
  try {
    const raw = await readFile(legacyJsonPath, "utf-8");
    const vehicles = JSON.parse(raw).vehicles ?? [];
    if (vehicles.length > 0) {
      const owner = createInvite("Owner");
      console.log(`Migrated legacy vehicles to a new "Owner" invite. Login code: ${owner.code}`);
      const insert = db.prepare("INSERT INTO vehicles (invite_id, license, phone) VALUES (?, ?, ?)");
      for (const vehicle of vehicles) {
        insert.run(owner.id, vehicle.license, vehicle.phone ?? "");
      }
    }
  } catch (err) {
    console.log("no legacy database.json to migrate", err.message);
  }
}
