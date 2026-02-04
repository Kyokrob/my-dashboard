export function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

export function attachUser(req, res, next) {
  res.locals.userId = req.session?.userId || null;
  next();
}
