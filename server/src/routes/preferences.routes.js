import express from "express";
import { z } from "zod";
import User from "../models/User.js";
import {
  defaultDrinkReasons,
  defaultDrinkVenues,
  defaultExpenseCategories,
  toPreferenceList,
} from "../config/preferences.js";

const router = express.Router();

const itemSchema = z.object({
  label: z.string().min(1),
  enabled: z.boolean().optional(),
});

function normalizeList(list, fallback) {
  const cleaned = Array.isArray(list) ? list : [];
  const seen = new Set();
  const out = [];
  cleaned.forEach((item) => {
    const label = String(item.label || "").trim();
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ label, enabled: item.enabled !== false });
  });
  return out.length ? out : toPreferenceList(fallback);
}

router.get("/", async (req, res) => {
  const user = await User.findById(req.session.userId).select(
    "expenseCategories drinkReasons drinkVenues"
  );
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  res.json({
    expenseCategories:
      user.expenseCategories?.length ? user.expenseCategories : toPreferenceList(defaultExpenseCategories),
    drinkReasons:
      user.drinkReasons?.length ? user.drinkReasons : toPreferenceList(defaultDrinkReasons),
    drinkVenues:
      user.drinkVenues?.length ? user.drinkVenues : toPreferenceList(defaultDrinkVenues),
  });
});

router.put("/", async (req, res, next) => {
  try {
    const schema = z.object({
      expenseCategories: z.array(itemSchema).optional(),
      drinkReasons: z.array(itemSchema).optional(),
      drinkVenues: z.array(itemSchema).optional(),
    });
    const payload = schema.parse(req.body || {});
    const updates = {};
    if (payload.expenseCategories) {
      updates.expenseCategories = normalizeList(payload.expenseCategories, defaultExpenseCategories);
    }
    if (payload.drinkReasons) {
      updates.drinkReasons = normalizeList(payload.drinkReasons, defaultDrinkReasons);
    }
    if (payload.drinkVenues) {
      updates.drinkVenues = normalizeList(payload.drinkVenues, defaultDrinkVenues);
    }

    const user = await User.findByIdAndUpdate(req.session.userId, updates, {
      new: true,
      select: "expenseCategories drinkReasons drinkVenues",
    });
    res.json({
      expenseCategories: user.expenseCategories,
      drinkReasons: user.drinkReasons,
      drinkVenues: user.drinkVenues,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
