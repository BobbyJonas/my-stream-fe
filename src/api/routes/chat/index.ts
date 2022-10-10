import { Router } from "express";
import chatroom from "./chatroom";

const router = Router();

router.use("/chatroom", chatroom);

export default router;
