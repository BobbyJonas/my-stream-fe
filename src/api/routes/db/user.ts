import { Router } from "express";
import * as userController from "../../modules/mongodb/controller/user";

const router = Router();

router.get("/", userController.read);
router.get("/:_id", userController.read);
router.post("/", userController.create);
router.delete("/:_id", userController.del);

export default router;
