<template>
  <b-overlay
    :show="!initReady"
    variant="light"
    :opacity="0.65"
    rounded="sm"
    :style="{ width: '100%' }"
  >
    <div class="primary-content-container">
      <video ref="videoControlRef" class="video-chat-container" muted autoplay></video>
    </div>
  </b-overlay>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState, mapActions } from "vuex";

import type { AxiosInstance } from "axios";
import { iceServerPublicList, userMediaVideoTrackConstraints } from "./utils";

import socketioService from "~/assets/services/socket-io-client";

import { makeToast, Properties } from "~/assets/utils/common";
import { IUserModel } from "~/api/modules/mongodb/models/user";
import ChatroomStore, { ChatroomInitStepEnum } from "~/store/chatroom";

export interface IMainContentState {
  userMediaAvailable: boolean | undefined;
}

type State = IMainContentState;

const PeerConnection =
  window.RTCPeerConnection ||
  (window as any).mozRTCPeerConnection ||
  (window as any).webkitRTCPeerConnection ||
  (window as any).msRTCPeerConnection;

const pcInstance = new PeerConnection({
  iceServers: iceServerPublicList.map(item => ({ urls: item })),
});

const sessionDescription: RTCSessionDescription =
  (window as any).RTCSessionDescription ||
  (window as any).mozRTCSessionDescription ||
  (window as any).webkitRTCSessionDescription ||
  (window as any).msRTCSessionDescription;

const getUserMedia = (constraints: DisplayMediaStreamConstraints): Promise<MediaStream> => {
  if ((window as any).navigator.mediaDevices.getUserMedia) {
    return window.navigator.mediaDevices.getUserMedia(constraints);
  } else if ((window as any).navigator.webkitGetUserMedia) {
    return (window as any).navigator.webkitGetUserMedia(constraints);
  } else if ((window as any).navigator.mozGetUserMedia) {
    return (window as any).navigator.mozGetUserMedia(constraints);
  } else if ((window as any).navigator.getUserMedia) {
    return (window as any).navigator.getUserMedia(constraints);
  }
  return Promise.reject(new Error("浏览器不兼容：没有访问媒体方法，建议安装最新版 Chrome"));
};

export default Vue.extend({
  components: {} as Record<string, Component>,

  data() {
    return {
      userMediaAvailable: undefined,
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["initReady", "currentUserRole", "currentStep"] as Array<
      Properties<typeof ChatroomStore>
    >),
  },

  watch: {
    currentStep(currentValue) {
      switch (currentValue) {
        case ChatroomInitStepEnum.GET_USER_MEDIA: {
          console.log(this.$refs.videoControlRef);

          const videoControl: HTMLVideoElement | null = this.$refs
            .videoControlRef as HTMLVideoElement;
          if (videoControl) {
            getUserMedia({
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
                this.setCurrentStep(ChatroomInitStepEnum.CONFIRM_USER);
                videoControl.srcObject = stream;
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
        case ChatroomInitStepEnum.CONFIRM_USER: {
          const socketId = socketioService.socket.id;
          const roomId = this.$route.params?.id;
          const userId = this.currentUserRole?._id;
          this.chatroomEnter({ socketId, roomId, userId });
          break;
        }
        case ChatroomInitStepEnum.DONE: {
          this.setInitReady(true);
          break;
        }
        default:
          break;
      }
    },
  },

  created() {},

  mounted() {},

  methods: {
    ...mapMutations({
      setInitReady: "chatroom/setInitReady",
      setCurrentStep: "chatroom/setCurrentStep",
    }),
    ...mapActions({
      chatroomEnter: "chatroom/chatroomEnter",
    }),
  },
});
</script>

<style lang="less" scoped>
.primary-content-container {
  flex: 1;
  position: relative;
  height: 100%;

  .video-chat-container {
    height: 100%;
    width: 100%;
  }
}
</style>
