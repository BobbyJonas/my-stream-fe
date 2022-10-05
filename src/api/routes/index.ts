import { Router } from "express";

import { rateLimit } from "express-rate-limit";

import test from "./test";
import chat from "./chat";
import db from "./db";

const dbLimiter = rateLimit({
  max: 1,
  windowMs: 1000,
  message: "Too many request from this IP",
});

const router = Router();

// api 路由
router.use("/test", test);
router.use("/chat", chat);
router.use("/db", dbLimiter, db);

export default router;
