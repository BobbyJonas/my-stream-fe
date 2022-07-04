import { Router } from "express";

const router = Router();

// Test route
router.use("/demo", (req, res) => {
  res.end("Test API demo1!");
});

export default router;
