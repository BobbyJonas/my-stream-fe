import { Types } from "mongoose";
import db from "../database";
const { Schema, model } = db;

export interface IConnectionModel {
  socketId: string;
  roomId: string;
  userId: Types.ObjectId;
}

const connectionSchema = new Schema<IConnectionModel>({
  socketId: String,
  roomId: String,
  userId: {
    type: Types.ObjectId,
    ref: "User",
  } as any,
});

const ConnectionModel = db.models.Connection || model("Connection", connectionSchema);

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

export const getConnectionList = (): Promise<Array<IConnectionModel>> => {
  return new Promise((resolve, reject) => {
    ConnectionModel.find((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
      return result;
    });
  });
};

export const removeConnectionItem = (constraints: Record<string, any>) => {
  return ConnectionModel.deleteOne(constraints);
};
