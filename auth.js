const COOKIE_NAME = "session";
const isProd = process.env.NODE_ENV === "production";

export function setSessionCookie(res, inviteId) {
  res.cookie(COOKIE_NAME, String(inviteId), {
    httpOnly: true,
    signed: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function readInviteId(req) {
  const raw = req.signedCookies?.[COOKIE_NAME];
  return raw ? Number(raw) : null;
}

export function pageAuth(req, res, next) {
  const inviteId = readInviteId(req);
  if (!inviteId) return res.redirect("/login.html");
  req.inviteId = inviteId;
  next();
}

export function apiAuth(req, res, next) {
  const inviteId = readInviteId(req);
  if (!inviteId) return res.status(401).json({ error: "not authenticated" });
  req.inviteId = inviteId;
  next();
}
