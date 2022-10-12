import { Router } from "express";
import { IConnectionModel, modifyConnectionItem } from "~/api/modules/mongodb/models/connection";

const router = Router();

router.post("/enter", async (req, res) => {
  res.end("Test API!");
  const postData = req.body as IConnectionModel;
  if (!postData.socketId || !postData.roomId) {
    res.status(403).send("传入信息不完整");
  } else {
    const _res = await modifyConnectionItem({ socketId: postData.socketId }, postData);
    res.end(_res);
  }
});

router.post("/modify", (req, res) => {
  res.end("Test API!");
  const postData = req.body;
});

export default router;
