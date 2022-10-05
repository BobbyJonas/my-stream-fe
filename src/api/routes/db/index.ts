import { Router } from "express";
import user from "./user";
import message from "./message";

const router = Router();

router.use("/user", user);
router.use("/message", message);

export default router;
