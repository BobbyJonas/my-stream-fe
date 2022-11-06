import consola from "consola";
import { Router } from "express";
import { IConnectionModel, modifyConnectionItem } from "../../modules/mongodb/models/connection";

const router = Router();

router.post("/enter", async (req, res) => {
  const postData = req.body as IConnectionModel;
  if (!postData.socketId || !postData.roomId) {
    res.status(403).send("传入信息不完整");
  } else {
    modifyConnectionItem({ socketId: postData.socketId }, postData)
      .then(_res => {
        res.status(200).send("ok");
      })
      .catch(err => {
        consola.error(err);
        res.status(403).send("传入信息不完整");
      });
  }
});

// 修改房间信息
router.post("/", (req, res) => {
  res.end("Test API!");
  const data = req.body;
});

export default router;
