import { Router } from "express";
import * as connectionController from "../../modules/mongodb/controller/connection";

const router = Router();

router.get("/", connectionController.read);
// router.post("/", userController.create);

export default router;
