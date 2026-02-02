import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: "-" },
    type: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", ExpenseSchema);
