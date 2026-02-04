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
const isProd = process.env.NODE_ENV === "production";

// REQUIRED for Render / proxies
app.set("trust proxy", 1);

// CORS (keep credentials ON)
const rawOrigins = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow server-to-server / curl
      if (rawOrigins.length === 0) return cb(null, true); // unblock early
      return rawOrigins.includes(origin) ? cb(null, true) : cb(new Error("CORS blocked"));
    },
    credentials: true,
  })
);


app.use(express.json());

// Session (cookie-based auth, production-safe)
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,                  // must be true on HTTPS (Render)
      sameSite: isProd ? "none" : "lax", // cross-site cookies in prod
      maxAge: 1000 * 60 * 60 * 24 * 7,   // 7 days
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
