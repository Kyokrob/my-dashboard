import express from "express";
import Expense from "../models/Expense.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { month } = req.query;
  const query = month ? { date: { $regex: `^${month}` } } : {};
  const data = await Expense.find(query).sort({ date: 1 });
  res.json(data);
});

router.post("/", async (req, res) => {
  const created = await Expense.create(req.body);
  res.status(201).json(created);
});

router.put("/:id", async (req, res) => {
  const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
