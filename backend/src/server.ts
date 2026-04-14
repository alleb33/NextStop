import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/dbconfig";

import testRoutes from "./routes/test.routes";
import itineraryRoutes from "./routes/itinerary.routes";

dotenv.config();
// connectDb();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed."));
    },
  })
);
app.use(express.json());
app.use("/api", testRoutes);
app.use("/api/itinerary", itineraryRoutes);

app.get("/", (req, res) => {
  res.send("NextStop API is running.");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;
