<template>
  <div class="chatroom-content">
    <MainContent :pc-instance="pcInstance"></MainContent>
    <PrimarySidebar></PrimarySidebar>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapActions, mapMutations, mapState } from "vuex";
import { Ref, ref } from "@nuxtjs/composition-api";

import { iceServerPublicList } from "./utils";
import socketioService from "~/assets/services/socket-io-client";
import type { IUserModel } from "~/api/modules/mongodb/models/user";
import type { IMessageModel } from "~/api/modules/mongodb/models/message";
import type { ISocketRTCConnectionMessage } from "~/api/modules/socket-io/handler";

import MainContent from "~/components/chatroom/MainContent/index.vue";
import PrimarySidebar from "~/components/chatroom/PrimarySidebar/index.vue";

import ChatroomStore, { CHATROOM_INIT_STATUS } from "~/store/chatroom";
import { makeToast, Properties } from "~/assets/utils/common";

export interface IChatroomPageState {
  pcInstance: Ref<RTCPeerConnection | null>;
}

type State = IChatroomPageState;

const PeerConnection =
  window.RTCPeerConnection ||
  (window as any).mozRTCPeerConnection ||
  (window as any).webkitRTCPeerConnection ||
  (window as any).msRTCPeerConnection;

const sessionDescription: RTCSessionDescription =
  (window as any).RTCSessionDescription ||
  (window as any).mozRTCSessionDescription ||
  (window as any).webkitRTCSessionDescription ||
  (window as any).msRTCSessionDescription;

export default Vue.extend({
  components: {
    MainContent,
    PrimarySidebar,
  } as Record<string, Component>,

  layout: "app",
  middleware: "chatroom-auth",

  data() {
    return {} as State;
  },
  computed: {
    ...mapState("chatroom", [
      "currentUserRole",
      "currentRoomId",
      "currentStep",
      "currentStepProcess",
    ] as Array<Properties<typeof ChatroomStore>>),
  },

  watch: {
    currentStep(currentValue) {
      switch (currentValue) {
        case CHATROOM_INIT_STATUS.INIT_SOCKET: {
          socketioService.setupSocketConnection();

          socketioService.socket.on("connect", () => {
            if (this.currentUserRole) {
              setTimeout(() => {
                this.setCurrentStep(CHATROOM_INIT_STATUS.GET_USER_MEDIA);
              }, 0);
            } else {
              makeToast("加载错误", "当前用户信息为空，请选择用户信息后再进入", "danger");
            }
          });

          this.setCurrentRoomId(this.$route.params?.id);
          break;
        }
        case CHATROOM_INIT_STATUS.CONFIRM_USER: {
          this.addCurrentStepProcess();

          const socketId = socketioService.socket.id;
          const roomId = this.currentRoomId;
          const userId = this.currentUserRole?._id;
          this.chatroomEnter({ socketId, roomId, userId });

          socketioService.socket.emit("__join", {
            socketId,
            roomId,
            userId,
          });

          this.removeCurrentStepProcess();

          setTimeout(() => {
            if (this.currentStepProcess === 0)
              this.setCurrentStep(CHATROOM_INIT_STATUS.RTC_CONNECTION);
          }, 0);
          break;
        }
        case CHATROOM_INIT_STATUS.RTC_CONNECTION: {
          this.addCurrentStepProcess();

          if (!this.pcInstance?.value) break;
          const pcInstance: RTCPeerConnection = this.pcInstance?.value || ({} as any);
          pcInstance.onicecandidate = e => {
            if (e.candidate) {
              socketioService.socket.emit("__candidate", {
                from: socketioService.socket.id,
                roomId: this.currentRoomId,
                data: JSON.stringify(e.candidate),
              } as ISocketRTCConnectionMessage);
            }
          };

          this.removeCurrentStepProcess();
          setTimeout(() => {
            if (this.currentStepProcess === 0) this.setCurrentStep(CHATROOM_INIT_STATUS.DONE);
          }, 0);
          break;
        }
        default:
          break;
      }
    },
  },

  created() {
    this.pcInstance = ref(
      new PeerConnection({
        iceServers: iceServerPublicList.map(item => ({ urls: item })),
      })
    );
  },

  beforeMount() {
    const storageCurrentRole: string = window.localStorage["current-role"];
    if (storageCurrentRole) {
      const currentRoleObj: IUserModel = JSON.parse(storageCurrentRole);
      this.setCurrentUserRole(currentRoleObj);
    }
    this.setCurrentStep(CHATROOM_INIT_STATUS.INIT_SOCKET);
  },

  beforeDestroy() {
    socketioService.disconnect();
    this.setCurrentRoomId = undefined;
  },

  methods: {
    ...mapMutations({
      setCurrentUserRole: "chatroom/setCurrentUserRole",
      setCurrentRoomId: "chatroom/setCurrentRoomId",
      setCurrentStep: "chatroom/setCurrentStep",
      addCurrentStepProcess: "chatroom/addCurrentStepProcess",
      removeCurrentStepProcess: "chatroom/removeCurrentStepProcess",
    }),
    ...mapActions({
      chatroomEnter: "chatroom/chatroomEnter",
    }),
  },
});
</script>

<style lang="less" scoped>
.chatroom-content {
  @apply w-full h-full;

  display: flex;
  flex-direction: row;
  background-color: black;
  overflow: hidden;
}
</style>
