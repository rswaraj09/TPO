import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "../utils/logger/logger";

import authRoutes from "./routes/auth";
import studentRoutes from "./routes/student";
import facultyRoutes from "./routes/faculty";
import adminRoutes from "./routes/admin";
import alumniRoutes from "./routes/alumni";
import aptitudeRoutes from "./routes/aptitude";
import publicRoutes from "./routes/public";
import notificationRoutes from "./routes/notification";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = ["localhost", "vimeettpo.xyz", "vercel.app"];
      if (allowed.some((domain) => origin.includes(domain))) {
        callback(null, true);
      } else {
        callback(null, process.env.FRONTEND_URL || "http://localhost:5173");
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "TPO API is running", status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/faculty", facultyRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/alumni", alumniRoutes);
app.use("/api/v1/aptitude", aptitudeRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
