import mongoose from "mongoose";

const DrinkLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    drank: { type: Boolean, default: true },
    name: { type: String, default: "" },
    level: { type: Number, min: 1, max: 5, default: 1 },
    durationHours: { type: Number, default: null },
    reasons: { type: [String], default: [] },
    otherReason: { type: String, default: "" },
    venue: { type: String, default: "" },
    startTime: { type: String, default: "" },
    enjoyment: { type: Number, min: 1, max: 5, default: null },
    regret: { type: String, enum: ["None", "Mid", "High", ""], default: "" },
    wouldRepeat: { type: Boolean, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

DrinkLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DrinkLog", DrinkLogSchema);
