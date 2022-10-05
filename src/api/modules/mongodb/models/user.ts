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

export interface IUser {
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
  signUpTime: Date; // 注册时间
  lastLoginTime: Date; // 最后一次登录
}

const userSchema = new Schema<IUser>({
  name: { type: String },
  password: String,
  code: { type: String, unique: true },
  photo: { type: String, default: "/img/picture.png" },
  signature: { type: String, default: "这个人很懒，暂时没有签名哦！" },
  nickname: { type: String, default: "" },
  email: { type: String, default: "" },
  province: { type: Object, default: { name: "北京市", value: "110000" } },
  city: { type: Object, default: { name: "市辖区", value: "110100" } },
  town: { type: Object, default: { name: "海淀区", value: "110108" } },
  sex: { type: String, default: IUserSexEnum.UNKNOWN },
  wallpaper: { type: String, default: "/img/wallpaper.jpg" },
  signUpTime: { type: Date },
  lastLoginTime: { type: Date },
});

const UserModel = db.models.User || model("User", userSchema);

export const createUserItem = (data: Partial<IUser>): Promise<IUser> => {
  const insertObj = new UserModel(data);
  return new Promise((resolve, reject) => {
    insertObj.save((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
    });
  });
};

export const getUserList = (): Promise<Array<IUser>> => {
  return new Promise((resolve, reject) => {
    UserModel.find((reason, result) => {
      if (reason instanceof Error) reject(reason);
      else resolve(result);
      return result;
    });
  });
};
