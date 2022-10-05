import { Router } from "express";
import * as userController from "../../modules/mongodb/controller/user";

const router = Router();

router.get("/", userController.read);
router.post("/", userController.create);

export default router;
