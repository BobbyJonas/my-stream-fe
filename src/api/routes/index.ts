import { Router } from "express";
import test from "./test";
import chat from "./chat";

const router = Router();

// api 路由
router.use("/test", test);
router.use("/chat", chat);

export default router;
