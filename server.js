import express from "express";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  listVehiclesForInvite,
  addVehicleForInvite,
  deleteVehicleForInvite,
  setVehicleActiveForInvite,
  findInviteByCode,
} from "./db.js";
import { pageAuth, apiAuth, setSessionCookie, clearSessionCookie } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.COOKIE_SECRET) {
  console.warn(
    "WARNING: COOKIE_SECRET is not set — using a random secret for this process only. " +
      "Every restart will log everyone out. Set COOKIE_SECRET before deploying."
  );
}
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString("hex");

app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));
app.use(express.static(join(__dirname, "src"), { index: false }));

app.post("/api/login", (req, res) => {
  const { code } = req.body ?? {};
  const invite = code ? findInviteByCode(String(code).trim()) : null;
  if (!invite) return res.status(401).json({ error: "invalid code" });

  setSessionCookie(res, invite.id);
  res.json({ ok: true, redirect: "/index.html" });
});

app.post("/api/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/login.html", (req, res) => {
  res.sendFile(join(__dirname, "src", "html", "login.html"));
});

app.get(["/", "/index.html"], pageAuth, (req, res) => {
  res.sendFile(join(__dirname, "src", "html", "index.html"));
});

app.get("/api/vehicles", apiAuth, (req, res) => {
  res.json(listVehiclesForInvite(req.inviteId));
});

app.post("/api/vehicles", apiAuth, (req, res) => {
  const { license, phone } = req.body ?? {};
  if (!license || typeof license !== "string") {
    return res.status(400).json({ error: "license is required" });
  }
  res.status(201).json(addVehicleForInvite(req.inviteId, license.trim(), (phone ?? "").trim()));
});

app.patch("/api/vehicles/:id", apiAuth, (req, res) => {
  const { active } = req.body ?? {};
  if (typeof active !== "boolean") {
    return res.status(400).json({ error: "active (boolean) is required" });
  }
  setVehicleActiveForInvite(req.inviteId, Number(req.params.id), active);
  res.status(204).end();
});

app.delete("/api/vehicles/:id", apiAuth, (req, res) => {
  deleteVehicleForInvite(req.inviteId, Number(req.params.id));
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Autopark running at http://localhost:${PORT}`);
});
