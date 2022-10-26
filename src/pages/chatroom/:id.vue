<template>
  <div class="chatroom-content">
    <MainContent ref="mainContentRef"></MainContent>
    <PrimarySidebar ref="primarySidebarRef"></PrimarySidebar>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapActions, mapMutations, mapState } from "vuex";

import adapter from "webrtc-adapter";

import { iceServerPublicList } from "./utils";
import socketioService from "~/assets/services/socket-io-client";
import type { IUserModel } from "~/api/modules/mongodb/models/user";
import type { IMessageModel } from "~/api/modules/mongodb/models/message";
import type { ISocketRTCConnectionMessage } from "~/api/modules/socket-io/handler";

import MainContent from "~/components/chatroom/MainContent/index.vue";
import PrimarySidebar from "~/components/chatroom/PrimarySidebar/index.vue";

import ChatroomStore, { CHATROOM_INIT_STATUS } from "~/store/chatroom";
import { makeToast, Properties } from "~/assets/utils/common";
import { IConnectionModel } from "~/api/modules/mongodb/models/connection";

export interface IChatroomPageState {
  pcInstanceMap: Record<string, RTCPeerConnection | null>;
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
    return {
      pcInstanceMap: {},
    } as State;
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

            socketioService.socket.on("connect", () => {
              if (this.currentUserRole) {
                setTimeout(() => {
                  this.setCurrentStep(CHATROOM_INIT_STATUS.GET_USER_MEDIA);
                }, 0);
              } else {
                makeToast("加载错误", "当前用户信息为空，请选择用户信息后再进入", "danger");
              }
            });

            socketioService.socket.on("__join", this.onSocketJoin);
            socketioService.socket.on("__offer", this.onSocketOffer);
            socketioService.socket.on("__answer", this.onSocketAnswer);
            socketioService.socket.on("__candidate", this.onSocketCandidate);
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
            if (this.currentStepProcess === 0) this.setCurrentStep(CHATROOM_INIT_STATUS.DONE);
          }, 0);
          break;
        }
        case CHATROOM_INIT_STATUS.DONE: {
          socketioService.socket?.on("__leave", this.onRemoteDisconnect);
          break;
        }
        default:
          break;
      }
    },
  },

  beforeMount() {
    // console.log(adapter.browserDetails.browser);
    this.setCurrentRoomId(this.$route.params?.id);

    const storageCurrentRole: string = window.localStorage["current-role"];
    if (storageCurrentRole) {
      const currentRoleObj: IUserModel = JSON.parse(storageCurrentRole);
      this.setCurrentUserRole(currentRoleObj);
    }

    socketioService.socket?.on("__leave", this.onRemoteDisconnect);

    setTimeout(() => {
      this.setCurrentStep(CHATROOM_INIT_STATUS.INIT_SOCKET);
    }, 0);
  },

  beforeDestroy() {
    socketioService.disconnect();
    this.setCurrentRoomId(undefined);
    this.setCurrentStep(CHATROOM_INIT_STATUS.PREPARED);
    this.$bus.$off("global/join");
    this.$bus.$off("global/leave");
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

    onSocketJoin(args: IConnectionModel[]) {
      const currentIndex = args.findIndex(item => item.socketId === socketioService.socket.id);
      const pcInstanceMap: Record<string, RTCPeerConnection | null> = this.pcInstanceMap;

      args
        .filter(item => item.socketId !== socketioService.socket.id)
        .forEach(item => {
          const socketId = item.socketId;
          if (socketId === socketioService.socket.id) return;

          const pcInstance = pcInstanceMap?.[socketId];
          if (!pcInstance) {
            const pcInstance = new window.RTCPeerConnection({
              iceServers: iceServerPublicList.map(item => ({ urls: item })),
            });
            pcInstance.onicecandidate = this.onRtcIceCandidate;
            this.$set(this.pcInstanceMap, socketId, pcInstance);
            this.$bus.$emit("global/join", pcInstance, socketId);
          }
        });
      if (currentIndex >= 0) {
        if (currentIndex === args.length - 1) {
          const receiverList = args.slice(0, currentIndex).map(item => item.socketId);

          receiverList.forEach(socketId => {
            this.createOffer(socketId);
          });
        } else {
          // const socketId = args[args.length - 1].socketId;
          // this.createOffer(socketId);
        }
      } else {
        args.forEach(item => {
          this.createOffer(item.socketId);
        });
      }
    },

    onSocketOffer(args: ISocketRTCConnectionMessage) {
      console.log("on-offer");

      const { data, from } = args;
      const pcInstance: RTCPeerConnection =
        this.pcInstanceMap?.[from] ||
        new window.RTCPeerConnection({
          iceServers: iceServerPublicList.map(item => ({ urls: item })),
        });
      pcInstance.onicecandidate = this.onRtcIceCandidate;
      pcInstance.setRemoteDescription(new RTCSessionDescription(JSON.parse(data)));

      if (pcInstance !== this.pcInstanceMap[from]) {
        this.$bus.$emit("global/join", pcInstance, from);
        this.$set(this.pcInstanceMap, from, pcInstance);
      }

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

    onSocketAnswer(args: { to: string } & ISocketRTCConnectionMessage) {
      console.log("on-answer");

      const { data, from } = args;

      const pcInstance: RTCPeerConnection = this.pcInstanceMap?.[from] || ({} as any);
      pcInstance.setRemoteDescription?.(new RTCSessionDescription(JSON.parse(data)));
    },

    onSocketCandidate(args: ISocketRTCConnectionMessage) {
      console.log("on-candidate");

      const { data, from } = args;
      const pcInstance: RTCPeerConnection = this.pcInstanceMap?.[from] || ({} as any);
      pcInstance.addIceCandidate?.(new RTCIceCandidate(JSON.parse(data)));
    },

    onRtcIceCandidate(e: RTCPeerConnectionIceEvent) {
      if (e.candidate) {
        socketioService.socket.emit("__candidate", {
          from: socketioService.socket.id,
          roomId: this.currentRoomId,
          data: JSON.stringify(e.candidate),
        } as ISocketRTCConnectionMessage);
      }
    },

    createOffer(socketId: string) {
      const pcInstance: RTCPeerConnection = this.pcInstanceMap?.[socketId] || ({} as any);
      pcInstance
        .createOffer?.({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true,
        })
        .then(sdp => {
          pcInstance.setLocalDescription(sdp);
          socketioService.socket.emit("__offer", {
            from: socketioService.socket.id,
            to: socketId,
            roomId: this.currentRoomId,
            data: JSON.stringify(sdp),
          });
        });
    },

    onRemoteDisconnect(args: { from: string }) {
      this.pcInstanceMap[args.from]?.close();
      this.$delete(this.pcInstanceMap, args.from);
      this.$bus.$emit("global/leave", args);
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
