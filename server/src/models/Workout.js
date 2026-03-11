import mongoose from "mongoose";

const WorkoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    workoutType: { type: String, required: true },
    intensity: { type: Number, default: 1 },
    weight: { type: Number, default: null },
    bodyFat: { type: Number, default: null },
    feel: { type: String, default: "" },
    drink: { type: Boolean, default: false },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

WorkoutSchema.index({ userId: 1, date: 1 });

export default mongoose.model("Workout", WorkoutSchema);
