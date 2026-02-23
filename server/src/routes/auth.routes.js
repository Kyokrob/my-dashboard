import express from "express";
import { z } from "zod";
import User from "../models/User.js";

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  remember: z.boolean().optional(),
});

const bootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
  remember: z.boolean().optional(),
});

router.get("/me", async (req, res) => {
  if (!req.session?.userId) return res.json({ user: null });
  const user = await User.findById(req.session.userId).select("email name role");
  if (!user) return res.json({ user: null });
  res.json({ user });
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, remember } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    req.session.cookie.maxAge = remember ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24;
    req.session.userId = user.id;
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

// Verify current password (must be logged in)
router.post("/verify-password", async (req, res, next) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });

    const schema = z.object({
      password: z.string().min(6),
    });
    const { password } = schema.parse(req.body);

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid password" });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Reset password (must be logged in)
router.post("/reset-password", async (req, res, next) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });

    const schema = z.object({
      currentPassword: z.string().min(6),
      newPassword: z.string().min(6),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const ok = await user.verifyPassword(currentPassword);
    if (!ok) return res.status(401).json({ error: "Invalid current password" });

    const passwordHash = await User.hashPassword(newPassword);
    await User.findByIdAndUpdate(req.session.userId, { passwordHash });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Create the first admin (only if no users exist)
router.post("/bootstrap", async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return res.status(409).json({ error: "Admin already exists" });
    const { email, password, name, remember } = bootstrapSchema.parse(req.body);
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      email: email.toLowerCase(),
      name: name || "Admin",
      passwordHash,
      role: "admin",
    });
    req.session.cookie.maxAge = remember ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24;
    req.session.userId = user.id;
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

export default router;
