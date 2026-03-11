import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: "-" },
    type: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: 1 });

export default mongoose.model("Expense", ExpenseSchema);
