const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

// Verify access token
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query(
      "SELECT id, uuid, name, email, phone, role FROM users WHERE id = $1",
      [decoded.userId],
    );
    if (!rows.length) return res.status(401).json({ error: "User not found" });

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Optional auth (does not fail if no token)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query(
      "SELECT id, uuid, name, email, phone, role FROM users WHERE id = $1",
      [decoded.userId],
    );
    if (rows.length) req.user = rows[0];
  } catch (_) {
    // ignore auth errors in optional mode
  }
  next();
}

// Role guard — must come after authenticate
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Hospital admin guard — user must manage this hospital
async function requireHospitalAdmin(req, res, next) {
  try {
    const hospitalId = req.params.hospitalId || req.body.hospitalId;
    if (req.user.role === "super_admin") return next();

    const { rows } = await query(
      "SELECT 1 FROM hospital_admins WHERE hospital_id = $1 AND user_id = $2",
      [hospitalId, req.user.id],
    );
    if (!rows.length) {
      return res
        .status(403)
        .json({ error: "Not authorized for this hospital" });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireHospitalAdmin,
};
