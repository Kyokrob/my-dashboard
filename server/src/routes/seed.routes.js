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
    await Expense.deleteMany({ userId: req.session.userId });
    await Workout.deleteMany({ userId: req.session.userId });
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

    const expPayload = expenses.map((e) => ({ ...e, userId: req.session.userId }));
    const woPayload = workouts.map((w) => ({ ...w, userId: req.session.userId }));

    const expInserted = expPayload.length ? await Expense.insertMany(expPayload) : [];
    const woInserted = woPayload.length ? await Workout.insertMany(woPayload) : [];

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
