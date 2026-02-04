import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import expensesRoutes from "./routes/expenses.routes.js";
import workoutsRoutes from "./routes/workouts.routes.js";
import { errorHandler } from "./middleware/error.js";
import { requireAuth, attachUser } from "./middleware/auth.js";

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
    cookie: {
      httpOnly: true,
      secure: isProd, // true on HTTPS (Render/Vercel)
      sameSite: isProd ? "none" : "lax", // allow cross-site cookie in prod
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ✅ Attach user from session (if present)
app.use(attachUser);

// ✅ Health (public)
app.get("/health", (req, res) => res.json({ ok: true }));

/* ======================
   API ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/expenses", requireAuth, expensesRoutes);
app.use("/api/workouts", requireAuth, workoutsRoutes);

/* ======================
   STATIC (PRODUCTION)
   Serve Vite dist from repo root
====================== */
if (isProd) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // server/src -> server -> repo root
  const ROOT_DIR = path.resolve(__dirname, "..", "..");
  const DIST_DIR = path.join(ROOT_DIR, "dist");

  // Serve static assets (css/js under dist/assets)
  app.use(express.static(DIST_DIR));

  // SPA fallback (but never intercept /api)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(DIST_DIR, "index.html"));
  });
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
