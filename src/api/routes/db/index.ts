import { Router } from "express";
import user from "./user";
import connection from "./connection";
import message from "./message";

const router = Router();

router.use("/user", user);
router.use("/connection", connection);
router.use("/message", message);

export default router;
