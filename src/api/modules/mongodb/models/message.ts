import type { Types } from "mongoose";
import db from "../database";
const { Schema, model } = db;

export interface IMessageModel {
  _id: string;
  roomId: string; // 房间 id
  socketId: string; // 来自 socketId
  timeSent: Date; // 发送时间
  msgType: string; // 消息类型 text/emoji/image/file
  msgContent: string; // 消息内容
  emoji?: string; // 表情地址
  read: boolean; // 是否已读 0/1
}

const messageSchema = new Schema<IMessageModel>({
  roomId: String,
  timeSent: { type: Date },
  msgType: String,
  msgContent: String,
  emoji: String,
  read: { type: Boolean, default: false },
});

const MessageModel = db.models?.Message || model("Message", messageSchema);

export const createMessageItem = (data: Partial<IMessageModel>): Promise<IMessageModel> => {
  const insertObj = new MessageModel(data);
  return new Promise((resolve, reject) => {
    insertObj.save((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
    });
  });
};

export const getMessageList = (): Promise<Array<IMessageModel>> => {
  return new Promise((resolve, reject) => {
    MessageModel.find((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
      return result;
    });
  });
};
