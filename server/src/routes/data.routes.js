import express from "express";
import { z } from "zod";
import Expense from "../models/Expense.js";
import Workout from "../models/Workout.js";
import DrinkLog from "../models/DrinkLog.js";
import Todo from "../models/Todo.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/export", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const [expenses, workouts, drinks, todos, user] = await Promise.all([
      Expense.find({ userId }).sort({ date: 1 }),
      Workout.find({ userId }).sort({ date: 1 }),
      DrinkLog.find({ userId }).sort({ date: 1 }),
      Todo.find({ userId }).sort({ createdAt: -1 }),
      User.findById(userId).select(
        "budgets workoutTypes expenseCategories drinkReasons drinkVenues name email"
      ),
    ]);

    res.json({
      meta: {
        exportedAt: new Date().toISOString(),
        version: 1,
      },
      settings: {
        budgets: user?.budgets || null,
        workoutTypes: user?.workoutTypes || null,
        expenseCategories: user?.expenseCategories || null,
        drinkReasons: user?.drinkReasons || null,
        drinkVenues: user?.drinkVenues || null,
      },
      profile: {
        name: user?.name || "",
        email: user?.email || "",
      },
      expenses,
      workouts,
      drinks,
      todos,
    });
  } catch (err) {
    next(err);
  }
});

const importSchema = z.object({
  mode: z.enum(["overwrite", "append"]).optional(),
  data: z.object({
    expenses: z.array(z.any()).optional(),
    workouts: z.array(z.any()).optional(),
    drinks: z.array(z.any()).optional(),
    todos: z.array(z.any()).optional(),
    settings: z.object({
      budgets: z.any().optional(),
      workoutTypes: z.any().optional(),
      expenseCategories: z.any().optional(),
      drinkReasons: z.any().optional(),
      drinkVenues: z.any().optional(),
    }).optional(),
  }),
});

function stripIds(items = []) {
  return items.map((item) => {
    const copy = { ...item };
    delete copy._id;
    delete copy.id;
    delete copy.userId;
    return copy;
  });
}

router.post("/import", async (req, res, next) => {
  try {
    const { mode = "append", data } = importSchema.parse(req.body || {});
    const userId = req.session.userId;

    if (mode === "overwrite") {
      await Promise.all([
        Expense.deleteMany({ userId }),
        Workout.deleteMany({ userId }),
        DrinkLog.deleteMany({ userId }),
        Todo.deleteMany({ userId }),
      ]);
    }

    const expenses = stripIds(data.expenses || []).map((e) => ({ ...e, userId }));
    const workouts = stripIds(data.workouts || []).map((w) => ({ ...w, userId }));
    const drinks = stripIds(data.drinks || []).map((d) => ({ ...d, userId }));
    const todos = stripIds(data.todos || []).map((t) => ({ ...t, userId }));

    const [expInserted, woInserted, tdInserted] = await Promise.all([
      expenses.length ? Expense.insertMany(expenses, { ordered: false }) : [],
      workouts.length ? Workout.insertMany(workouts, { ordered: false }) : [],
      todos.length ? Todo.insertMany(todos, { ordered: false }) : [],
    ]);

    if (drinks.length) {
      const ops = drinks.map((d) => ({
        updateOne: {
          filter: { userId, date: d.date },
          update: { $set: d },
          upsert: true,
        },
      }));
      try {
        await DrinkLog.bulkWrite(ops, { ordered: false });
      } catch (err) {
        if (err?.code === 11000) {
          return res.status(409).json({
            error:
              "Duplicate drink date index detected. Run Admin → Fix Drink Index, then retry import.",
          });
        }
        throw err;
      }
    }

    if (data.settings?.budgets || data.settings?.workoutTypes) {
    const updates = {};
      if (data.settings?.budgets) updates.budgets = data.settings.budgets;
      if (data.settings?.workoutTypes) updates.workoutTypes = data.settings.workoutTypes;
      if (data.settings?.expenseCategories) updates.expenseCategories = data.settings.expenseCategories;
      if (data.settings?.drinkReasons) updates.drinkReasons = data.settings.drinkReasons;
      if (data.settings?.drinkVenues) updates.drinkVenues = data.settings.drinkVenues;
      await User.findByIdAndUpdate(userId, updates);
    }

    res.json({
      ok: true,
      expensesInserted: expInserted.length || 0,
      workoutsInserted: woInserted.length || 0,
      todosInserted: tdInserted.length || 0,
      drinksUpserted: drinks.length || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
