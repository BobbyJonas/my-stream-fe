import { Router } from "express";
import room from "./room";

const router = Router();

router.use("/room", room);

export default router;
