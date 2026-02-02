import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import expensesRoutes from "./routes/expenses.routes.js";
import workoutsRoutes from "./routes/workouts.routes.js";
import { errorHandler } from "./middleware/error.js";
import seedRoutes from "./routes/seed.routes.js";

dotenv.config();
console.log("MONGODB_URI =", process.env.MONGODB_URI);


const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/expenses", expensesRoutes);
app.use("/api/workouts", workoutsRoutes);
app.use("/api/seed", seedRoutes);


app.use(errorHandler);

const port = process.env.PORT || 5000;

await connectDB(process.env.MONGODB_URI);

app.listen(port, () => {
  console.log(`🚀 API running on http://localhost:${port}`);
});
