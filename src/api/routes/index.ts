import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import healthCheck from "./health-check";
import chat from "./chat";
import db from "./db";

const env = process.env.NODE_ENV;

const dbLimiter = rateLimit({
  max: env === "development" ? 20 : 1,
  windowMs: 1000,
  message: "Too many request from this IP",
});

const router = Router();

// api 路由
router.use("/health-check", healthCheck);
router.use("/chat", chat);
router.use("/db", dbLimiter, db);

export default router;
