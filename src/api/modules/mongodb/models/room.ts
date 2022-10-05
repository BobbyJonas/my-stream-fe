import db from "../database";
const { Schema, model } = db;

export interface IRoom {
  name: string;
  code: string; // 唯一的 code
  photo: string; // 头像
  desc?: string;
  wallpaper: string; // 聊天壁纸
  createTime: Date; // 创建时间
  lastActiveTime: Date; // 最后一次活跃时间
}

const roomSchema = new Schema<IRoom>({
  name: { type: String },
  code: { type: String, unique: true },
  photo: { type: String, default: "/img/picture.png" },
  desc: { type: String, default: "这个群暂时没有介绍哦！" },
  wallpaper: { type: String, default: "/img/wallpaper.jpg" },
  createTime: { type: Date, default: Date.now() },
  lastActiveTime: { type: Date, default: Date.now() },
});

const RoomModel = db.models.Room || model("Room", roomSchema);

export const createRoomItem = (data: Partial<IRoom>): Promise<IRoom> => {
  const insertObj = new RoomModel(data);
  return new Promise((resolve, reject) => {
    insertObj.save((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
    });
  });
};

export const getRoomList = (): Promise<Array<IRoom>> => {
  return new Promise((resolve, reject) => {
    RoomModel.find((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
      return result;
    });
  });
};
