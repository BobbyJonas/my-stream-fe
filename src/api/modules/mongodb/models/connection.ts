import { Types } from "mongoose";
import db from "../database";
const { Schema, model } = db;

export interface IConnectionModel {
  socketId: string;
  roomId: string;
  userId: string;
}

const connectionSchema = new Schema<IConnectionModel>({
  socketId: { type: String, unique: true },
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

export const removeConnectionItem = (constraints: Partial<IConnectionModel>) => {
  return ConnectionModel.deleteOne(constraints);
};

export const modifyConnectionItem = (
  constraints: Partial<IConnectionModel>,
  value: Partial<IConnectionModel>
) => {
  return ConnectionModel.findOneAndUpdate(constraints, { $set: value });
};
