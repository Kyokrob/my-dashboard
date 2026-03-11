import express from "express";
import { z } from "zod";
import User from "../models/User.js";
import { defaultWorkoutTypePrefs } from "../config/workouts.js";

const router = express.Router();

const listSchema = z.array(
  z.union([
    z.string().min(1),
    z.object({
      label: z.string().min(1),
      enabled: z.boolean().optional(),
    }),
  ])
).max(200);

function normalizeList(list) {
  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((item) => {
    const label = typeof item === "string" ? item : item?.label;
    const enabled = typeof item === "string" ? true : item?.enabled !== false;
    const clean = String(label || "").trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ label: clean, enabled });
  });
  return out.length ? out : defaultWorkoutTypePrefs;
}

router.get("/", async (req, res) => {
  const user = await User.findById(req.session.userId).select("workoutTypes");
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const workoutTypes =
    Array.isArray(user.workoutTypes) && user.workoutTypes.length
      ? user.workoutTypes
      : defaultWorkoutTypePrefs;
  res.json({
    workoutTypes: workoutTypes.map((w) =>
      typeof w === "string" ? { label: w, enabled: true } : w
    ),
  });
});

router.put("/", async (req, res, next) => {
  try {
    const { workoutTypes } = z.object({ workoutTypes: listSchema }).parse(req.body);
    const unique = normalizeList(workoutTypes);
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { workoutTypes: unique },
      { new: true, select: "workoutTypes" }
    );
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({ workoutTypes: user.workoutTypes });
  } catch (err) {
    next(err);
  }
});

export default router;
