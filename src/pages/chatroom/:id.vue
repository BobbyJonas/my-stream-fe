<template>
  <div class="chatroom-content">
    <MainContent :pc-instance="pcInstance"></MainContent>
    <PrimarySidebar :pc-instance="pcInstance"></PrimarySidebar>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapActions, mapMutations, mapState } from "vuex";
import { Ref, ref } from "@nuxtjs/composition-api";

import adapter from "webrtc-adapter";

import { Socket } from "socket.io-client";
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
          if (!socketioService.socket?.connected) {
            socketioService.setupSocketConnection();

            (socketioService.socket as Socket).on("connect", () => {
              if (this.currentUserRole) {
                setTimeout(() => {
                  this.setCurrentStep(CHATROOM_INIT_STATUS.GET_USER_MEDIA);
                }, 0);
              } else {
                makeToast("加载错误", "当前用户信息为空，请选择用户信息后再进入", "danger");
              }
            });
          } else {
            setTimeout(() => {
              this.setCurrentStep(CHATROOM_INIT_STATUS.GET_USER_MEDIA);
            }, 0);
          }
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
          socketioService.socket?.on("__offer", this.onSocketOffer);
          socketioService.socket?.on("__answer", this.onSocketAnswer);
          socketioService.socket?.on("__candidate", this.onSocketCandidate);

          this.removeCurrentStepProcess();
          setTimeout(() => {
            if (this.currentStepProcess === 0) this.setCurrentStep(CHATROOM_INIT_STATUS.DONE);
          }, 0);
          break;
        }
        case CHATROOM_INIT_STATUS.DONE: {
          this.createOffer();
          break;
        }
        default:
          break;
      }
    },
  },

  created() {},

  beforeMount() {
    this.pcInstance = ref(
      new window.RTCPeerConnection({
        iceServers: iceServerPublicList.map(item => ({ urls: item })),
      })
    );
    // console.log(adapter.browserDetails.browser);
    this.setCurrentRoomId(this.$route.params?.id);

    const storageCurrentRole: string = window.localStorage["current-role"];
    if (storageCurrentRole) {
      const currentRoleObj: IUserModel = JSON.parse(storageCurrentRole);
      this.setCurrentUserRole(currentRoleObj);
    }

    setTimeout(() => {
      this.setCurrentStep(CHATROOM_INIT_STATUS.INIT_SOCKET);
    }, 0);
  },

  beforeDestroy() {
    socketioService.disconnect();
    this.pcInstance.value?.close();
    this.setCurrentRoomId(undefined);
    this.setCurrentStep(CHATROOM_INIT_STATUS.PREPARED);
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

    onSocketOffer(args: ISocketRTCConnectionMessage) {
      const { data, from } = args;
      const pcInstance: RTCPeerConnection = this.pcInstance?.value || ({} as any);
      pcInstance.setRemoteDescription?.(new RTCSessionDescription(JSON.parse(data)));

      // 创建应答
      pcInstance
        .createAnswer?.({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true,
        })
        .then(sdp => {
          pcInstance.setLocalDescription(sdp);
          socketioService.socket.emit("__answer", {
            to: from,
            data: JSON.stringify(sdp),
            from: socketioService.socket.id,
            roomId: this.currentRoomId,
          } as { to: string } & ISocketRTCConnectionMessage);
        });
    },

    onSocketAnswer(args: ISocketRTCConnectionMessage) {
      const { data } = args;
      const pcInstance: RTCPeerConnection = this.pcInstance?.value || ({} as any);
      pcInstance.setRemoteDescription?.(new RTCSessionDescription(JSON.parse(data)));
    },

    onSocketCandidate(args: ISocketRTCConnectionMessage) {
      const { data } = args;
      const pcInstance: RTCPeerConnection = this.pcInstance?.value || ({} as any);
      pcInstance.addIceCandidate(new RTCIceCandidate(JSON.parse(data)));
    },

    createOffer() {
      const pcInstance: RTCPeerConnection = this.pcInstance?.value || ({} as any);
      pcInstance
        .createOffer?.({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true,
        })
        .then(sdp => {
          pcInstance.setLocalDescription(sdp);
          socketioService.socket.emit("__offer", {
            from: socketioService.socket.id,
            roomId: this.currentRoomId,
            data: JSON.stringify(sdp),
          });
        });
    },
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
