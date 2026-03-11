import express from "express";
import { z } from "zod";
import crypto from "crypto";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Workout from "../models/Workout.js";
import DrinkLog from "../models/DrinkLog.js";
import Todo from "../models/Todo.js";

const router = express.Router();

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12);
}

router.post("/invite", async (req, res, next) => {
  try {
    const { email, name } = inviteSchema.parse(req.body);
    const normalized = email.toLowerCase();
    const exists = await User.findOne({ email: normalized });
    if (exists) return res.status(409).json({ error: "User already exists" });

    const tempPassword = generateTempPassword();
    const passwordHash = await User.hashPassword(tempPassword);
    const user = await User.create({
      email: normalized,
      name: name || normalized.split("@")[0],
      passwordHash,
      role: "user",
      onboardingStartAt: new Date(),
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tempPassword,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/claim-legacy", async (req, res, next) => {
  try {
    const ownerId = req.session.userId;
    const criteria = { $or: [{ userId: { $exists: false } }, { userId: null }] };

    const [exp, wo, dr, td] = await Promise.all([
      Expense.updateMany(criteria, { $set: { userId: ownerId } }),
      Workout.updateMany(criteria, { $set: { userId: ownerId } }),
      DrinkLog.updateMany(criteria, { $set: { userId: ownerId } }),
      Todo.updateMany(criteria, { $set: { userId: ownerId } }),
    ]);

    res.json({
      ok: true,
      expensesUpdated: exp.modifiedCount || 0,
      workoutsUpdated: wo.modifiedCount || 0,
      drinksUpdated: dr.modifiedCount || 0,
      todosUpdated: td.modifiedCount || 0,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/fix-drink-index", async (req, res, next) => {
  try {
    const indexes = await DrinkLog.collection.indexes();
    const legacy = indexes.find((idx) => idx.name === "date_1");
    if (legacy) {
      await DrinkLog.collection.dropIndex("date_1");
    }
    await DrinkLog.collection.createIndex({ userId: 1, date: 1 }, { unique: true });
    res.json({ ok: true, droppedLegacy: Boolean(legacy) });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find()
      .select("email name role isActive createdAt")
      .sort({ createdAt: -1 });
    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/status", async (req, res, next) => {
  try {
    const schema = z.object({ isActive: z.boolean() });
    const { isActive } = schema.parse(req.body);
    const targetId = req.params.id;
    const adminId = req.session.userId;

    if (String(targetId) === String(adminId)) {
      return res.status(400).json({ error: "You cannot change your own status" });
    }

    const target = await User.findById(targetId).select("role isActive email name");
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.role === "admin") {
      return res.status(400).json({ error: "Admin accounts cannot be deactivated" });
    }

    target.isActive = isActive;
    await target.save();
    res.json({
      ok: true,
      user: { id: target.id, email: target.email, name: target.name, role: target.role, isActive: target.isActive },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const adminId = req.session.userId;

    if (String(targetId) === String(adminId)) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const target = await User.findById(targetId).select("role");
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.role === "admin") {
      return res.status(400).json({ error: "Admin accounts cannot be deleted" });
    }

    await Promise.all([
      User.deleteOne({ _id: targetId }),
      Expense.deleteMany({ userId: targetId }),
      Workout.deleteMany({ userId: targetId }),
      DrinkLog.deleteMany({ userId: targetId }),
      Todo.deleteMany({ userId: targetId }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
