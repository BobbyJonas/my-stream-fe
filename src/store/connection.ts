import { Module, VuexModule, Mutation, Action, MutationAction } from "vuex-module-decorators";

export enum CONNECTION_INIT_STATUS {
  "PREPARED" = 0,
  "INIT_SOCKET" = 1,
  "GET_USER_MEDIA" = 2,
  "CONFIRM_USER" = 3,
  "DONE" = 4,
}

@Module({
  name: "connection",
  namespaced: true,
})
export default class ConnectionStore extends VuexModule {
  public pcInstanceMap: Record<string, RTCPeerConnection | null> = {};
  public currentStep: number = CONNECTION_INIT_STATUS.PREPARED;
  public currentStepProcess: number = 0;
  public initReady: boolean = false;

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

  @Mutation
  public setPcInstanceMap(value: Record<string, RTCPeerConnection | null>): void {
    this.pcInstanceMap = value;
  }
}
