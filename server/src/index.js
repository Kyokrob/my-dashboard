import express from "express";
import cors from "cors";
import fs from "fs";
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
   SERVE FRONTEND IN PROD
====================== */
if (isProd) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const candidates = [
    path.join(process.cwd(), "dist"),                 // if cwd is repo root
    path.join(process.cwd(), "..", "dist"),           // if cwd is /server
    path.resolve(__dirname, "..", "..", "dist"),      // server/src -> repo/dist
    path.resolve(__dirname, "..", "..", "..", "dist") // safety
  ];

  const DIST_DIR = candidates.find((p) => fs.existsSync(path.join(p, "index.html")));

  console.log("process.cwd() =", process.cwd());
  console.log("dist candidates =", candidates);
  console.log("✅ Using DIST_DIR =", DIST_DIR);

  if (!DIST_DIR) {
    console.error("❌ Could not find dist/index.html at runtime.");
  } else {
    app.use(express.static(DIST_DIR));

    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
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
