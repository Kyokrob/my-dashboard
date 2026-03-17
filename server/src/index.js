import express from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import dataRoutes from "./routes/data.routes.js";
import expensesRoutes from "./routes/expenses.routes.js";
import workoutsRoutes from "./routes/workouts.routes.js";
import todosRoutes from "./routes/todos.routes.js";
import drinksRoutes from "./routes/drinks.routes.js";
import budgetsRoutes from "./routes/budgets.routes.js";
import workoutTypesRoutes from "./routes/workout-types.routes.js";
import preferencesRoutes from "./routes/preferences.routes.js";
import { errorHandler } from "./middleware/error.js";
import { requireAuth, attachUser, requireAdmin } from "./middleware/auth.js";

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === "production";

// ✅ REQUIRED for Render / reverse proxies (secure cookies + correct IP)
app.set("trust proxy", 1);

// ✅ Parse JSON
app.use(express.json());

// ✅ CORS (cookie sessions)
const rawOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server / curl
      if (!origin) return cb(null, true);

      // if no origins configured, allow all (useful during setup)
      if (rawOrigins.length === 0) return cb(null, true);

      return rawOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ✅ Session (cookie-based auth)
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    proxy: true, // ✅ important when trust proxy is enabled
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 60 * 60 * 24 * 7, // allow up to 7 days
    }),
    cookie: {
      httpOnly: true,
      secure: isProd, // true on HTTPS (Render/Vercel)
      sameSite: isProd ? "none" : "lax", // allow cross-site cookie in prod
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ✅ Attach user from session (if present)
// (If your attachUser sometimes throws, you can early-return for assets/api here)
app.use(attachUser);

// ✅ Root (public)
app.get("/", (req, res) => res.json({ ok: true, message: "API is running" }));

// ✅ Health (public)
app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/health", (req, res) =>
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() })
);

/* ======================
   API ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);
app.use("/api/data", requireAuth, dataRoutes);
app.use("/api/expenses", requireAuth, expensesRoutes);
app.use("/api/workouts", requireAuth, workoutsRoutes);
app.use("/api/todos", requireAuth, todosRoutes);
app.use("/api/drinks", requireAuth, drinksRoutes);
app.use("/api/budgets", requireAuth, budgetsRoutes);
app.use("/api/workout-types", requireAuth, workoutTypesRoutes);
app.use("/api/preferences", requireAuth, preferencesRoutes);

/* ======================
   SERVE FRONTEND IN PROD
====================== */
if (isProd) {
  // On Render, repo root is usually process.cwd() = /opt/render/project/src
  const candidates = [
    path.join(process.cwd(), "dist"),
    path.join(process.cwd(), "..", "dist"),
  ];

  const DIST_DIR = candidates.find((p) => fs.existsSync(path.join(p, "index.html")));

  console.log("process.cwd() =", process.cwd());
  console.log("dist candidates =", candidates);
  console.log("✅ Using DIST_DIR =", DIST_DIR);

  if (!DIST_DIR) {
    console.error("❌ Could not find dist/index.html at runtime.");
  } else {
    const ASSETS_DIR = path.join(DIST_DIR, "assets");

    // ✅ Serve assets explicitly first (prevents SPA fallback from touching /assets/*)
    app.use("/assets", express.static(ASSETS_DIR));

    // ✅ Serve the rest of dist (favicon, manifest, etc.)
    app.use(express.static(DIST_DIR));

    // ✅ SPA fallback LAST (never intercept /api or /assets)
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      if (req.path.startsWith("/assets")) return next();
      return res.sendFile(path.join(DIST_DIR, "index.html"));
    });
  }
}

// ✅ Error handler must be last
app.use(errorHandler);

const port = Number(process.env.PORT || 5050);

async function startServer() {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(port, () => {
      console.log(`🚀 API running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
