import express from "express";
import { z } from "zod";
import User from "../models/User.js";
import { defaultWorkoutTypes } from "../config/workouts.js";

const router = express.Router();

const listSchema = z.array(z.string().min(1)).max(100);

router.get("/", async (req, res) => {
  const user = await User.findById(req.session.userId).select("workoutTypes");
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const workoutTypes =
    Array.isArray(user.workoutTypes) && user.workoutTypes.length
      ? user.workoutTypes
      : defaultWorkoutTypes;
  res.json({ workoutTypes });
});

router.put("/", async (req, res, next) => {
  try {
    const { workoutTypes } = z.object({ workoutTypes: listSchema }).parse(req.body);
    const unique = Array.from(new Set(workoutTypes.map((t) => t.trim()).filter(Boolean)));
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
