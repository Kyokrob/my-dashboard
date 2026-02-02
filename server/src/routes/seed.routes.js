import express from "express";
import Expense from "../models/Expense.js";
import Workout from "../models/Workout.js";

const router = express.Router();

/**
 * POST /api/seed/reset
 * Clears expenses & workouts collections
 */
router.post("/reset", async (req, res, next) => {
  try {
    await Expense.deleteMany({});
    await Workout.deleteMany({});
    res.json({ ok: true, message: "Cleared expenses & workouts" });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/seed/import
 * body: { expenses: [], workouts: [] }
 */
router.post("/import", async (req, res, next) => {
  try {
    const { expenses = [], workouts = [] } = req.body;

    const expInserted = expenses.length ? await Expense.insertMany(expenses) : [];
    const woInserted = workouts.length ? await Workout.insertMany(workouts) : [];

    res.json({
      ok: true,
      expensesInserted: expInserted.length,
      workoutsInserted: woInserted.length
    });
  } catch (e) {
    next(e);
  }
});

export default router;
