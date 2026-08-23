// adminAuth.js — simple HTTP Basic Auth gate for /api/admin/*.
// Username is fixed as "admin"; password comes from ADMIN_PASSWORD.
// Good enough for a single-operator dashboard; swap for real auth
// (sessions, OAuth, etc.) if more than one person needs access.

function adminAuth(req, res, next) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    return res.status(503).json({ error: "Admin dashboard not configured (set ADMIN_PASSWORD)" });
  }

  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme !== "Basic" || !encoded) {
    res.set("WWW-Authenticate", 'Basic realm="Shaneh Admin"');
    return res.status(401).json({ error: "Authentication required" });
  }

  const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");

  if (user !== "admin" || pass !== configured) {
    res.set("WWW-Authenticate", 'Basic realm="Shaneh Admin"');
    return res.status(401).json({ error: "Invalid credentials" });
  }

  next();
}

module.exports = adminAuth;
