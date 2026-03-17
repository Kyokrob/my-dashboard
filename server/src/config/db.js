import mongoose from "mongoose";

export async function connectDB(uri, { isProd = false } = {}) {
  mongoose.set("strictQuery", true);
  const started = Date.now();
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: isProd ? 1 : 0,
    autoIndex: !isProd,
  });
  const elapsed = Date.now() - started;
  console.log(`✅ MongoDB connected (${elapsed}ms)`);
}
