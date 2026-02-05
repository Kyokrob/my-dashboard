import express from "express";
import DrinkLog from "../models/DrinkLog.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { month } = req.query;
    const query = month ? { date: { $regex: `^${month}` } } : {};
    const data = await DrinkLog.find(query).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload.date) {
      return res.status(400).json({ error: "Date is required" });
    }

    payload.drank = true;

    const created = await DrinkLog.findOneAndUpdate(
      { date: payload.date },
      { $set: payload },
      { new: true, upsert: true }
    );

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await DrinkLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await DrinkLog.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
