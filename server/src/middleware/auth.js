export function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

export function attachUser(req, res, next) {
  res.locals.userId = req.session?.userId || null;
  next();
}

export async function requireAdmin(req, res, next) {
  try {
    if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
    const { default: User } = await import("../models/User.js");
    const user = await User.findById(req.session.userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
