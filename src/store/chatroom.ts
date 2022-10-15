/* eslint-disable @typescript-eslint/ban-types */
import { Module, VuexModule, Mutation, Action, MutationAction } from "vuex-module-decorators";
import { $axios } from "~/assets/utils/store-api";
import type { IUserModel } from "~/api/modules/mongodb/models/user";
import type { IConnectionModel } from "~/api/modules/mongodb/models/connection";

export enum ChatroomInitStepEnum {
  "INIT" = 0,
  "GET_USER_MEDIA" = 1,
  "CONFIRM_USER" = 2,
  "DONE" = 3,
}

@Module({
  name: "chatroom",
  namespaced: true,
})
export default class ChatroomStore extends VuexModule {
  public currentUserRole: Partial<IUserModel> | undefined = undefined;
  public initReady: boolean = false;

  public currentStep: number = ChatroomInitStepEnum.INIT;

  @Mutation
  public setCurrentUserRole(value: Partial<IUserModel>): void {
    this.currentUserRole = value;
  }

  @Mutation
  public setInitReady(value: boolean): void {
    this.initReady = value;
  }

  @Mutation
  public setCurrentStep(value: number): void {
    this.currentStep = value;
  }

  @MutationAction({ mutate: ["currentStep"] })
  public async chatroomEnter(value: Partial<IConnectionModel>) {
    const res = await $axios.post("/chat/room/enter", value);
    console.log(res);

    return { currentStep: ChatroomInitStepEnum.DONE };
  }
}
