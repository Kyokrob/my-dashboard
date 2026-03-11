import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { budgetByCategory } from "../config/budget.js";
import { defaultWorkoutTypePrefs } from "../config/workouts.js";
import {
  defaultDrinkReasons,
  defaultDrinkVenues,
  defaultExpenseCategories,
  toPreferenceList,
} from "../config/preferences.js";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "Admin" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isActive: { type: Boolean, default: true },
    onboardingStartAt: { type: Date, default: null },
    budgets: { type: Object, default: budgetByCategory },
    workoutTypes: { type: [{ label: String, enabled: Boolean }], default: defaultWorkoutTypePrefs },
    expenseCategories: { type: [{ label: String, enabled: Boolean }], default: toPreferenceList(defaultExpenseCategories) },
    drinkReasons: { type: [{ label: String, enabled: Boolean }], default: toPreferenceList(defaultDrinkReasons) },
    drinkVenues: { type: [{ label: String, enabled: Boolean }], default: toPreferenceList(defaultDrinkVenues) },
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = async function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.hashPassword = async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export default mongoose.model("User", UserSchema);
