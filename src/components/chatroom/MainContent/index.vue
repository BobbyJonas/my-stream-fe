<template>
  <b-overlay :show="!initReady" variant="light" :opacity="0.65" :style="{ width: '100%' }">
    <div class="primary-content-container">
      <div class="video-chat-container">
        <video
          ref="localVideoRef"
          class="video-container local-video"
          muted
          autoplay
          controlsList="nodownload"
          playsinline
          disablePictureInPicture
          @contextmenu="() => false"
        />

        <video
          v-for="item in Object.keys(pcInstanceMap)"
          :ref="`remoteVideoRef_${item}`"
          :key="item"
          class="video-container"
          autoplay
          playsinline
        />
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
import ChatroomStore, { CHATROOM_INIT_STATUS } from "~/store/chatroom";
import { userMediaVideoTrackConstraints } from "~/pages/chatroom/utils";
import { makeToast, Properties } from "~/assets/utils/common";

export interface IMainContentState {
  userMediaAvailable: boolean;
  localStreamRef: Ref<MediaStream | null>;
  remoteStreamList: Record<string, MediaStream | null>;
}

type State = IMainContentState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  props: {
    pcInstanceMap: {
      required: true,
      type: Object as PropType<Record<string, RTCPeerConnection | null>>,
    },
  },

  data() {
    return {
      userMediaAvailable: false,
      remoteStreamList: {},
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

          const localVideoControl: HTMLVideoElement | null = this.$refs.localVideoRef as any;
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
        case CHATROOM_INIT_STATUS.DONE: {
          if (this.currentStepProcess === 0) {
            this.setInitReady(true);
            socketioService.socket?.on("__leave", this.onRemoteDisconnect);
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

    onRemoteDisconnect({ from }: { from: string }): void {
      this.pcInstanceMap[from]?.close();
      this.$delete(this.pcInstanceMap, from);
      this.$delete(this.remoteStreamList, from);
    },

    addLocalStreamToPeer(pcInstance: RTCPeerConnection, receiveSocketId: string): void {
      const localStream = this.localStreamRef.value;

      if (this.localStreamRef.value) {
        localStream?.getTracks().forEach(track => {
          pcInstance.addTrack(track, localStream);
        });
      } else {
        makeToast("错误", "本地视频访问失败", "danger");
      }

      pcInstance.ontrack = e => {
        this.$set(this.remoteStreamList, receiveSocketId, e.streams[0]);
        this.$nextTick(() => {
          let remoteVideoContainer = this.$refs[
            `remoteVideoRef_${receiveSocketId}`
          ] as HTMLVideoElement;
          if (Array.isArray(remoteVideoContainer)) remoteVideoContainer = remoteVideoContainer[0];

          if (remoteVideoContainer) {
            remoteVideoContainer.srcObject = e.streams[0];
          }
        });
      };
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

      &::-webkit-media-controls-fullscreen-button {
        display: none;
      }
    }

    .local-video {
      transform: rotateY(180deg);
    }
  }
}
</style>
