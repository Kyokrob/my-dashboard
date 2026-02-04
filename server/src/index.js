import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import { connectDB } from "./config/db.js";
import expensesRoutes from "./routes/expenses.routes.js";
import workoutsRoutes from "./routes/workouts.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.js";
import { requireAuth, attachUser } from "./middleware/auth.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());

app.set("trust proxy", 1);
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.use(attachUser);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", requireAuth, expensesRoutes);
app.use("/api/workouts", requireAuth, workoutsRoutes);

app.use(errorHandler);

const port = process.env.PORT || 5050;

const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);

    app.listen(port, () => {
      console.log(`🚀 API running on http://127.0.0.1:${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
