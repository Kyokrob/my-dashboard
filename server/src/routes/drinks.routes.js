import express from "express";
import DrinkLog from "../models/DrinkLog.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { month } = req.query;
    const query = { userId: req.session.userId };
    if (month) query.date = { $regex: `^${month}` };
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
    payload.userId = req.session.userId;

    const legacy = await DrinkLog.findOne({
      date: payload.date,
      $or: [{ userId: { $exists: false } }, { userId: null }],
    });

    const created = legacy
      ? await DrinkLog.findByIdAndUpdate(
          legacy.id,
          { $set: payload },
          { new: true }
        )
      : await DrinkLog.findOneAndUpdate(
          { userId: req.session.userId, date: payload.date },
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
    const updated = await DrinkLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await DrinkLog.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
