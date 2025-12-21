const User = require("../models/User");
const { signToken } = require("../utils/jwt");

function sanitizeUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

async function register(req, res) {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!["admin", "student"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await User.hashPassword(String(password));
  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role
  });

  const token = signToken({ userId: user._id, role: user.role });
  res.status(201).json({ token, user: sanitizeUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select(
    "+passwordHash name email role"
  );
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await user.verifyPassword(String(password));
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ userId: user._id, role: user.role });
  res.json({ token, user: sanitizeUser(user) });
}

async function me(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

module.exports = { register, login, me };

