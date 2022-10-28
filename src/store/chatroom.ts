import { Module, VuexModule, Mutation, Action, MutationAction } from "vuex-module-decorators";
import { $axios } from "~/assets/utils/storeApi";
import type { IUserModel } from "~/api/modules/mongodb/models/user";
import type { IRoomModel } from "~/api/modules/mongodb/models/room";
import type { IConnectionModel } from "~/api/modules/mongodb/models/connection";

@Module({
  name: "chatroom",
  namespaced: true,
})
export default class ChatroomStore extends VuexModule {
  public currentUserRole: Partial<IUserModel> | undefined = undefined;
  public currentRoomId: string | undefined = undefined;
  public currentRoom: IRoomModel | undefined = undefined;

  @Mutation
  public setCurrentUserRole(value: Partial<IUserModel>): void {
    this.currentUserRole = value;
  }

  @Mutation
  public setCurrentRoomId(value: string): void {
    this.currentRoomId = value;
  }

  @Action
  public async chatroomEnter(value: Partial<IConnectionModel>): Promise<void> {
    await $axios.post("/chat/room/enter", value);
  }

  @MutationAction({ mutate: ["currentRoom"] })
  public async chatroomModify(value: Partial<IRoomModel>) {
    await $axios.post("/chat/room/modify", value);
    return { currentRoom: undefined };
  }
}
