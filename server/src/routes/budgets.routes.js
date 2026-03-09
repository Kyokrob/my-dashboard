import express from "express";
import { z } from "zod";
import User from "../models/User.js";
import { budgetByCategory, categoryOrder } from "../config/budget.js";

const router = express.Router();

const budgetSchema = z.record(
  z.object({
    low: z.number().min(0),
    mid: z.number().min(0),
    high: z.number().min(0),
  })
);

router.get("/", async (req, res) => {
  const user = await User.findById(req.session.userId).select("budgets");
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const budgets = user.budgets && Object.keys(user.budgets).length ? user.budgets : budgetByCategory;
  res.json({ budgets });
});

router.put("/", async (req, res, next) => {
  try {
    const { budgets } = z.object({ budgets: budgetSchema }).parse(req.body);
    const keys = Object.keys(budgets);
    const missing = categoryOrder.filter((c) => !keys.includes(c));
    if (missing.length) {
      return res.status(400).json({ error: `Missing categories: ${missing.join(", ")}` });
    }
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { budgets },
      { new: true, select: "budgets" }
    );
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({ budgets: user.budgets });
  } catch (err) {
    next(err);
  }
});

export default router;
