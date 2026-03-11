import express from "express";
import Todo from "../models/Todo.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const data = await Todo.find({ userId: req.session.userId }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { text, done = false } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Text is required" });
    }
    const created = await Todo.create({
      text: String(text).trim(),
      done: Boolean(done),
      userId: req.session.userId,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { text, done } = req.body || {};
    const updates = {};
    if (text !== undefined) updates.text = String(text).trim();
    if (done !== undefined) updates.done = Boolean(done);

    const updated = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId },
      updates,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Todo.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
