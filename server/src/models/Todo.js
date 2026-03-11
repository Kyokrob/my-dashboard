import mongoose from "mongoose";

const TodoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TodoSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Todo", TodoSchema);
