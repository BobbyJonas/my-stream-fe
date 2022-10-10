import { Router } from "express";
// import * as userController from "../../modules/mongodb/controller/user";

const router = Router();

// router.get("/", userController.read);
// router.post("/", userController.create);

// Test route
router.post("/enter", (req, res) => {
  res.end("Test API!");
  const postData = req.body;
});

export default router;
