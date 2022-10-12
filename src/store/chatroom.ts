import { Module, VuexModule, Mutation, Action } from "vuex-module-decorators";
import { $axios } from "~/assets/utils/store-api";
import { IUserModel } from "~/api/modules/mongodb/models/user";

@Module({
  name: "chatroom",
  stateFactory: true,
  namespaced: true,
})
export default class Chatroom extends VuexModule {
  public currentUserRole: Partial<IUserModel> | undefined;

  @Mutation
  public setCurrentUserRole(value: Partial<IUserModel>) {
    this.currentUserRole = value;
  }

  @Action
  public async enterChatroom() {
    // const { data } = await $axios.get<IChatroomState[]>("/api/todos");
    // this.set(data);
  }
}
