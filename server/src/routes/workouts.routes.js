import express from "express";
import Workout from "../models/Workout.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { month } = req.query;
  const query = { userId: req.session.userId };
  if (month) query.date = { $regex: `^${month}` };
  const data = await Workout.find(query).sort({ date: 1 });
  res.json(data);
});

router.post("/", async (req, res) => {
  const created = await Workout.create({ ...req.body, userId: req.session.userId });
  res.status(201).json(created);
});

router.put("/:id", async (req, res) => {
  const updated = await Workout.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.userId },
    req.body,
    { new: true }
  );
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await Workout.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
  res.status(204).end();
});

export default router;
