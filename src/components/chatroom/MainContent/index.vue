<template>
  <b-overlay :show="!initReady" variant="light" :opacity="0.65" :style="{ width: '100%' }">
    <div class="primary-content-container">
      <div class="video-chat-container">
        <video
          ref="localVideoControlRef"
          class="video-container local-video"
          muted
          autoplay
          playsinline
        />
        <video ref="remoteVideoControlRef" class="video-container" autoplay playsinline />
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState, mapActions } from "vuex";
import type { AxiosInstance } from "axios";
import { PropType, Ref, ref } from "@nuxtjs/composition-api";

import socketioService from "~/assets/services/socket-io-client";

import type { IUserModel } from "~/api/modules/mongodb/models/user";
import type { ISocketRTCConnectionMessage } from "~/api/modules/socket-io/handler";
import ChatroomStore, { CHATROOM_INIT_STATUS } from "~/store/chatroom";
import { userMediaVideoTrackConstraints } from "~/pages/chatroom/utils";
import { makeToast, Properties } from "~/assets/utils/common";

export enum RTC_CONNECTION_STATUS {
  "PREPARED" = 0,
  "WAITING_FOR_OTHER_ANSWER" = 11,
  "WAITING_FOR_CURRENT_ANSWER" = 12,
  "ESTABLISHED" = 2,
}

export interface IMainContentState {
  userMediaAvailable: boolean;
  connectStatus: RTC_CONNECTION_STATUS;
  localStreamRef: Ref<MediaStream | null>;
}

type State = IMainContentState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  props: {
    pcInstance: {
      required: true,
      type: Object as PropType<Ref<RTCPeerConnection | null>>,
    },
  },

  data() {
    return {
      userMediaAvailable: false,
      connectStatus: RTC_CONNECTION_STATUS.PREPARED,
    } as State;
  },

  computed: {
    ...mapState("chatroom", [
      "currentUserRole",
      "currentRoomId",
      "currentStep",
      "currentStepProcess",
      "initReady",
    ] as Array<Properties<typeof ChatroomStore>>),
  },

  watch: {
    currentStep(currentValue) {
      switch (currentValue) {
        case CHATROOM_INIT_STATUS.GET_USER_MEDIA: {
          this.addCurrentStepProcess();

          const localVideoControl: HTMLVideoElement | null = this.$refs.localVideoControlRef as any;
          if (localVideoControl) {
            window.navigator.mediaDevices
              .getUserMedia({
                video: {
                  width: {
                    min: userMediaVideoTrackConstraints["360p"].width,
                    max: userMediaVideoTrackConstraints["1080p"].width,
                  },
                  height: {
                    min: userMediaVideoTrackConstraints["360p"].height,
                    max: userMediaVideoTrackConstraints["1080p"].height,
                  },
                },
                audio: true,
              })
              .then(stream => {
                this.userMediaAvailable = true;
                this.localStreamRef = ref(stream);
                localVideoControl.srcObject = stream;

                this.removeCurrentStepProcess();
                if (this.currentStepProcess === 0) {
                  this.setCurrentStep(CHATROOM_INIT_STATUS.CONFIRM_USER);
                }
              })
              .catch(err => {
                this.userMediaAvailable = false;
                makeToast("发生错误", "访问用户媒体设备失败: " + err.message, "danger");
                // eslint-disable-next-line no-console
                console.error("访问用户媒体设备失败:", err.message);
              });
          }
          break;
        }
        case CHATROOM_INIT_STATUS.RTC_CONNECTION: {
          this.addCurrentStepProcess();

          const pcInstance: RTCPeerConnection = this.pcInstance?.value || ({} as any);
          const localStream = this.localStreamRef.value;

          localStream?.getTracks().forEach(track => {
            pcInstance.addTrack(track, localStream);
          });
          pcInstance.ontrack = this.onPeerConnectionRemoteTrack;

          this.removeCurrentStepProcess();
          setTimeout(() => {
            if (this.currentStepProcess === 0) this.setCurrentStep(CHATROOM_INIT_STATUS.DONE);
          }, 0);
          break;
        }
        case CHATROOM_INIT_STATUS.DONE: {
          if (this.currentStepProcess === 0) {
            this.setInitReady(true);
          }
          break;
        }
        default:
          break;
      }
    },
  },

  created() {
    this.localStreamRef = ref<MediaStream | null>(null);
  },

  mounted() {
    socketioService.socket?.on("__leave", this.onRemoteDisconnect);
  },

  methods: {
    ...mapMutations({
      setInitReady: "chatroom/setInitReady",
      setCurrentStep: "chatroom/setCurrentStep",
      addCurrentStepProcess: "chatroom/addCurrentStepProcess",
      removeCurrentStepProcess: "chatroom/removeCurrentStepProcess",
    }),
    ...mapActions({
      chatroomEnter: "chatroom/chatroomEnter",
    }),

    onPeerConnectionRemoteTrack(e: RTCTrackEvent) {
      console.log("track");

      const remoteVideoControl: HTMLVideoElement | null = this.$refs.remoteVideoControlRef as any;
      if (!remoteVideoControl) return;

      remoteVideoControl.srcObject = e.streams[0];
    },

    onRemoteDisconnect() {
      console.log("remote-disconnect");
    },
  },
});
</script>

<style lang="less" scoped>
.primary-content-container {
  flex: 1;
  position: relative;
  height: 100%;

  .video-chat-container {
    display: flex;
    height: 100%;
    width: 100%;

    .video-container {
      flex: 1;
      width: 0;
      height: 100%;
    }

    .local-video {
      transform: rotateY(180deg);
    }
  }
}
</style>
