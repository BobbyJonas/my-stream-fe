import { Router } from "express";

const router = Router();

// Test route
router.use("/", (req, res) => {
  res.end("Ok");
});

export default router;
