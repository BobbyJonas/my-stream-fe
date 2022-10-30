import db from "../database";
const { Schema, model } = db;

export interface IUserLocationType {
  name: string;
  value: string;
}

export enum IUserSexEnum {
  UNKNOWN = "0",
  MALE = "1",
  FEMALE = "2",
}

export interface IUserModel {
  _id: string;
  name: string;
  password: string;
  code: string; // 唯一的 code
  photo: string; // 头像
  signature?: string;
  nickname: string;
  email: string;
  province: IUserLocationType;
  city: IUserLocationType;
  town: IUserLocationType;
  sex: IUserSexEnum; // 0: 保密; 1: 男; 2: 女
  wallpaper: string; // 聊天壁纸
  signUpTime: number; // 注册时间
  lastLoginTime: number; // 最后一次登录
}

const userSchema = new Schema<IUserModel>({
  name: { type: String },
  password: String,
  code: { type: String },
  photo: { type: String, default: "" },
  signature: { type: String, default: "这个人很懒，暂时没有签名哦！" },
  nickname: { type: String, default: "" },
  email: { type: String, default: "" },
  province: { type: Object, default: { name: "北京市", value: "110000" } },
  city: { type: Object, default: { name: "市辖区", value: "110100" } },
  town: { type: Object, default: { name: "海淀区", value: "110108" } },
  sex: { type: String, default: IUserSexEnum.UNKNOWN },
  wallpaper: { type: String, default: "/img/wallpaper.jpg" },
  signUpTime: { type: Number, default: Date.now() },
  lastLoginTime: { type: Number, default: Date.now() },
});

userSchema.index({ signUpTime: 1 });

const UserModel = db.models?.User || model("User", userSchema);

export const createUserItem = (data: Partial<IUserModel>): Promise<IUserModel> => {
  return new Promise((resolve, reject) => {
    const insertObj = new UserModel(data);
    insertObj.save((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
    });
  });
};

export const getUserList = (constraints: Partial<IUserModel>): Promise<Array<IUserModel>> => {
  return new Promise((resolve, reject) => {
    UserModel.find(constraints, (reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
      return result;
    });
  });
};

export const removeUserItem = (constraints: Partial<IUserModel>) => {
  return UserModel.findOneAndDelete(constraints);
};
