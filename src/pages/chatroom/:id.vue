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
import _ from "lodash";

import { iceServerPublicList } from "./utils";
import socketioService from "~/assets/services/socket-io-client";
import type { IUserModel } from "~/api/modules/mongodb/models/user";
import type { ISocketRTCConnectionMessage } from "~/api/modules/socket-io/handler";

import MainContent from "~/components/chatroom/MainContent/index.vue";
import PrimarySidebar from "~/components/chatroom/PrimarySidebar/index.vue";

import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";
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
      pcInstanceMap: {} as Record<string, RTCPeerConnection | null>,
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentUserRole", "currentRoomId"] as Array<
      Properties<typeof ChatroomStore>
    >),
    ...mapState("connection", ["currentStep", "currentStepProcess", "widgetNum"] as Array<
      Properties<typeof ConnectionStore>
    >),
  },

  watch: {
    currentStep(currentValue) {
      switch (currentValue) {
        case CONNECTION_INIT_STATUS.INIT_SOCKET: {
          if (!socketioService.socket?.connected) {
            socketioService.setupSocketConnection();

            socketioService.socket.on("connect", () => {
              if (this.currentUserRole) {
                setTimeout(() => {
                  this.setCurrentStep(CONNECTION_INIT_STATUS.CONFIRM_USER);
                }, 0);
              } else {
                makeToast("加载错误", "当前用户信息为空，请选择用户信息后再进入", "danger");
              }
            });
          }
          break;
        }
        case CONNECTION_INIT_STATUS.CONFIRM_USER: {
          socketioService.socket.on("__join", this.onSocketJoin);
          socketioService.socket.on("__offer", this.onSocketOffer);
          socketioService.socket.on("__answer", this.onSocketAnswer);
          socketioService.socket.on("__candidate", this.onSocketCandidate);
          socketioService.socket.on("__leave", this.onRemoteDisconnect);

          const connectionModel: Partial<IConnectionModel> = {
            socketId: socketioService.socket.id,
            roomId: this.currentRoomId,
            userId: this.currentUserRole?._id,
          };

          (this.chatroomEnter(connectionModel) as Promise<void>)?.finally(() => {
            socketioService.socket.emit("__join", connectionModel);
            this.setCurrentStep(CONNECTION_INIT_STATUS.DONE);
          });
          break;
        }
        case CONNECTION_INIT_STATUS.DONE:
          break;
        default:
          break;
      }
    },
  },

  created() {
    this.$bus.$on("connection/addWidgetNum", this.addWidgetNum);
    this.$bus.$on("connection/removeWidgetNum", this.removeWidgetNum);
    this.$bus.$on("connection/start", this.onSocketJoin);
  },

  beforeMount() {
    window.__MY_STREAM__ = _.defaultsDeep({ $bus: this?.$bus }, window.__MY_STREAM__ || {});
    // console.log(adapter.browserDetails.browser);
    this.setCurrentRoomId(this.$route.params?.id);

    const storageCurrentRole: string = window.localStorage["current-role"];
    if (storageCurrentRole) {
      const currentRoleObj: IUserModel = JSON.parse(storageCurrentRole);
      this.setCurrentUserRole(currentRoleObj);
    }

    setTimeout(() => {
      this.setCurrentStep(CONNECTION_INIT_STATUS.INIT_SOCKET);
    }, 0);
  },

  beforeDestroy() {
    socketioService.disconnect();
    this.setCurrentRoomId(undefined);
    this.setCurrentStep(CONNECTION_INIT_STATUS.PREPARED);
    this.resetWidgetNum();

    this.$bus.$off("global/createChannel");
    this.$bus.$off("global/removeChannel");
    this.$bus.$off("global/start");
    this.$bus.$off("connection/addWidgetNum");
    this.$bus.$off("connection/removeWidgetNum");

    const nullMap = {};
    _.unset(window.__MY_STREAM__, "$pcInstanceMap");
    this.setPcInstanceMap(nullMap);
  },

  methods: {
    ...(mapMutations({
      setCurrentUserRole: "chatroom/setCurrentUserRole",
      setCurrentRoomId: "chatroom/setCurrentRoomId",
    }) as {
      [x in Properties<typeof ChatroomStore>]: ChatroomStore[x];
    }),

    ...(mapMutations({
      setPcInstanceMap: "connection/setPcInstanceMap",
      setCurrentStep: "connection/setCurrentStep",
      addCurrentStepProcess: "connection/addCurrentStepProcess",
      removeCurrentStepProcess: "connection/removeCurrentStepProcess",
      addWidgetNum: "connection/addWidgetNum",
      removeWidgetNum: "connection/removeWidgetNum",
      resetWidgetNum: "connection/resetWidgetNum",
    }) as {
      [x in Properties<typeof ConnectionStore>]: ConnectionStore[x];
    }),

    ...(mapActions({
      chatroomEnter: "chatroom/chatroomEnter",
    }) as {
      [x in Properties<typeof ChatroomStore>]: ChatroomStore[x];
    }),

    onSocketJoin(args: IConnectionModel[]) {
      const currentIndex = args.findIndex(item => item.socketId === socketioService.socket.id);
      const pcInstanceMap: Record<string, RTCPeerConnection | null> = this.pcInstanceMap;
      console.log(currentIndex);

      Promise.all(
        args
          .filter(item => item.socketId !== socketioService.socket.id)
          .map((item): Promise<void> => {
            const socketId = item.socketId;
            if (socketId === socketioService.socket.id) return Promise.resolve();
            let pcInstance = pcInstanceMap?.[socketId];
            console.log(pcInstance);

            if (!(pcInstance?.connectionState === "connected")) {
              pcInstance = new window.RTCPeerConnection({
                iceServers: iceServerPublicList.map(item => ({ urls: item })),
              });
              pcInstance.onicecandidate = this.onRtcIceCandidate;
              this.$set(this.pcInstanceMap, socketId, pcInstance);
              this.setPcInstanceMap(this.pcInstanceMap);
              window.__MY_STREAM__ = _.defaultsDeep(
                { $pcInstanceMap: this.pcInstanceMap },
                window.__MY_STREAM__ || {}
              );
            }
            return new Promise((resolve, reject) => {
              let readyWidgetNum = 0;
              const internalResolve = () => {
                readyWidgetNum++;
                console.log("readyWidget:", readyWidgetNum, "/", this.widgetNum);

                if (readyWidgetNum >= this.widgetNum) return resolve();
              };
              this.$bus.$emit("global/createChannel", pcInstance, socketId, internalResolve);
            });
          })
      ).then(() => {
        if (currentIndex >= 0) {
          if (currentIndex === args.length - 1) {
            const receiverList = args.slice(0, currentIndex).map(item => item.socketId);
            receiverList.forEach(socketId => {
              this.createOffer(socketId);
            });
          }
        } else {
          makeToast("连接发生错误", "与后端数据库连接异常", "danger");
        }
      });
    },

    onSocketOffer(args: ISocketRTCConnectionMessage) {
      console.log("on-offer");

      const { data, from } = args;
      const pcInstance: RTCPeerConnection = new window.RTCPeerConnection({
        iceServers: iceServerPublicList.map(item => ({ urls: item })),
      });

      pcInstance.onicecandidate = this.onRtcIceCandidate;
      pcInstance.setRemoteDescription(new RTCSessionDescription(JSON.parse(data)));

      new Promise<void>((resolve, reject) => {
        if (pcInstance !== this.pcInstanceMap[from]) {
          this.$set(this.pcInstanceMap, from, pcInstance);
          this.setPcInstanceMap(this.pcInstanceMap);
          window.__MY_STREAM__ = _.defaultsDeep(
            { $pcInstanceMap: this.pcInstanceMap },
            window.__MY_STREAM__ || {}
          );
          let readyWidgetNum = 0;
          const internalResolve = () => {
            readyWidgetNum++;
            console.log("readyWidget:", readyWidgetNum, "/", this.widgetNum);
            if (readyWidgetNum >= this.widgetNum) return resolve();
          };
          this.$bus.$emit("global/createChannel", pcInstance, from, internalResolve);
        } else {
          return resolve();
        }
      }).then(() => {
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
      console.log("create-offer");

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
      this.$bus.$emit("global/removeChannel", args);
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
