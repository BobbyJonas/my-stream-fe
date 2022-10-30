import type { Types } from "mongoose";
import db from "../database";
const { Schema, model } = db;

export interface IConnectionModel {
  _id: string;
  socketId: string;
  roomId: string;
  userId: Types.ObjectId; // 用户登录 id
  time: number;
}

const connectionSchema = new Schema<IConnectionModel>({
  socketId: { type: String, unique: true },
  roomId: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  } as any,
  time: {
    type: Number,
    default: Date.now(),
  },
});

connectionSchema.index({ time: 1 });

const ConnectionModel = db.models?.Connection || model("Connection", connectionSchema);

export const createConnectionItem = (
  data: Partial<IConnectionModel>
): Promise<IConnectionModel> => {
  return new Promise((resolve, reject) => {
    const insertObj = new ConnectionModel(data);
    insertObj.save((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
    });
  });
};

export const getConnectionList = (
  constraints?: Partial<IConnectionModel>
): Promise<Array<IConnectionModel>> => {
  return new Promise((resolve, reject) => {
    ConnectionModel.find(constraints || {})
      .populate("userId")
      .exec((reason, result) => {
        if (reason instanceof Error) reject(reason);
        else resolve(result as any);
        return result;
      });
  });
};

export const removeConnectionItem = (constraints: Partial<IConnectionModel>) => {
  return ConnectionModel.findOneAndDelete(constraints);
};

export const modifyConnectionItem = (
  constraints: Partial<IConnectionModel>,
  value: Partial<IConnectionModel>
) => {
  return ConnectionModel.findOneAndUpdate(constraints, { $set: value });
};
