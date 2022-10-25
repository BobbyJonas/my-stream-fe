import { Module, VuexModule, Mutation, Action, MutationAction } from "vuex-module-decorators";
/* eslint-disable @typescript-eslint/ban-types */
import { $axios } from "~/assets/utils/store-api";
import type { IUserModel } from "~/api/modules/mongodb/models/user";
import type { IRoomModel } from "~/api/modules/mongodb/models/room";
import type { IConnectionModel } from "~/api/modules/mongodb/models/connection";

export enum CHATROOM_INIT_STATUS {
  "PREPARED" = 0,
  "INIT_SOCKET" = 1,
  "GET_USER_MEDIA" = 2,
  "CONFIRM_USER" = 3,
  "DONE" = 5,
}

@Module({
  name: "chatroom",
  namespaced: true,
})
export default class ChatroomStore extends VuexModule {
  public currentUserRole: Partial<IUserModel> | undefined = undefined;
  public currentRoomId: string | undefined = undefined;
  public currentRoom: IRoomModel | undefined = undefined;

  public currentStep: number = CHATROOM_INIT_STATUS.PREPARED;
  public currentStepProcess: number = 0;
  public initReady: boolean = false;

  @Mutation
  public setCurrentUserRole(value: Partial<IUserModel>): void {
    this.currentUserRole = value;
  }

  @Mutation
  public setCurrentRoomId(value: string): void {
    this.currentRoomId = value;
  }

  @Mutation
  public setCurrentStep(value: number): void {
    this.currentStep = value;
  }

  @Mutation
  public addCurrentStepProcess(): void {
    this.currentStepProcess++;
  }

  @Mutation
  public removeCurrentStepProcess(): void {
    this.currentStepProcess--;
  }

  @Mutation
  public setInitReady(value: boolean): void {
    this.initReady = value;
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
