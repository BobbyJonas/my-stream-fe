<template>
  <b-overlay
    class="primary-content-overlay"
    :show="!initReady"
    variant="light"
    :opacity="0.65"
    :style="{ width: '100%' }"
  >
    <div class="primary-content-container">
      <div class="video-chat-container">
        <aside role="navigation" class="toolbox">
          <b-button
            v-b-tooltip.hover.v-secondary.noninteractive
            title="刷新"
            class="operation-btn"
            variant="outline-secondary"
            pill
            @click="onRefreshConnection"
          >
            <b-icon class="btn-icon" icon="slash-square" />
          </b-button>
          <span class="separator" />
          <b-button
            v-b-tooltip.hover.v-secondary.noninteractive
            title="语音开启"
            class="operation-btn"
            variant="outline-secondary"
            pill
          >
            <b-icon class="btn-icon" icon="mic-fill" />
          </b-button>
          <b-button
            v-b-tooltip.hover.v-secondary.noninteractive
            :title="videoSource === 'webcam' ? '切换屏幕分享' : '切换到摄像头'"
            class="operation-btn"
            variant="outline-secondary"
            pill
            @click="onSwitchMediaSource"
          >
            <b-icon v-if="videoSource === 'webcam'" class="btn-icon" icon="window" />
            <b-icon v-if="videoSource === 'screen'" class="btn-icon" icon="camera-video" />
          </b-button>
          <span class="separator" />
          <b-button
            v-b-tooltip.hover.v-secondary.noninteractive
            title="音调升高"
            class="operation-btn"
            variant="outline-secondary"
            pill
            @click="onChangeVoicePitchClick"
          >
            <b-icon class="btn-icon" icon="emoji-sunglasses-fill" />
          </b-button>
          <span class="separator" />
          <b-button
            v-b-tooltip.hover.v-secondary.noninteractive
            title="结束通话"
            class="operation-btn"
            variant="danger"
            pill
            @click="onExitRoom"
          >
            <b-icon class="btn-icon" icon="telephone-fill" />
          </b-button>
        </aside>
        <video
          ref="localVideoRef"
          :class="['video-container', { 'local-video': videoSource === 'webcam' }]"
          muted
          autoplay
          playsinline
          disablePictureInPicture
          @contextmenu="() => false"
        />

        <video
          v-for="item in Object.keys(remoteStreamList)"
          :ref="`remoteVideoRef_${item}`"
          :key="item"
          class="video-container"
          autoplay
          playsinline
          disablePictureInPicture
          @contextmenu="() => false"
        />
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState, mapActions } from "vuex";
import { Ref, ref } from "@nuxtjs/composition-api";

import { userMediaVideoTrackConstraints } from "../utils";
import { AudioNodes } from "./audioNodes";

import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";

import { makeToast, Properties } from "~/assets/utils/common";

export interface IMainContentState {
  localAudioAvailable: boolean;
  localAudioRawStreamRef: Ref<MediaStream | null>;
  localAudioStreamRef: Ref<MediaStream | null>;
  audioContext: AudioContext | null;
  audioNodes: AudioNodes | null;

  localVideoAvailable: boolean;
  localStreamRef: Ref<MediaStream | null>;
  remoteStreamList: Record<string, MediaStream | null>;
}

type State = IMainContentState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  data() {
    return {
      localAudioAvailable: false,
      localAudioRawStreamRef: ref(null),
      localAudioStreamRef: ref(null),
      audioContext: null,
      audioNodes: null,

      localVideoAvailable: false,
      localStreamRef: ref(null),
      remoteStreamList: {},
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentUserRole", "currentRoomId"] as Array<
      Properties<typeof ChatroomStore>
    >),
    ...mapState("connection", ["pcInstanceMap", "videoSource", "currentStep", "initReady"] as Array<
      Properties<typeof ConnectionStore>
    >),
  },

  watch: {
    currentStep(currentValue) {
      switch (currentValue) {
        case CONNECTION_INIT_STATUS.INIT_MAIN_CONTENT: {
          this.setCurrentStep(CONNECTION_INIT_STATUS.INIT_SIDEBAR);
          break;
        }
        case CONNECTION_INIT_STATUS.DONE: {
          this.setInitReady(true);
          break;
        }
        default:
          break;
      }
    },
  },

  created() {
    this.$bus.$on("global/createChannel", this.addLocalChannelToPeer);
    this.$bus.$on("global/removeChannel", this.removeLocalChannelFromPeer);

    console.log("add");

    this.$bus.$emit("connection/addWidgetNum", "MainContent");
  },

  mounted() {
    this.audioContext = new (window.AudioContext || (window as any)?.webkitAudioContext)();
    this.getLocalAudio();
    this.getLocalMedia();
  },

  beforeDestroy() {
    this.closeTracks(this.localStreamRef.value, true);
    this.closeTracks(this.localAudioRawStreamRef.value, true);

    this.audioContext?.close();

    this.$bus.$emit("connection/removeWidgetNum", "MainContent");
  },

  methods: {
    ...mapMutations({
      setInitReady: "connection/setInitReady",
      setCurrentStep: "connection/setCurrentStep",
      setVideoSource: "connection/setVideoSource",
    }),
    ...mapActions({
      chatroomEnter: "chatroom/chatroomEnter",
    }),

    removeLocalChannelFromPeer({ from }: { from: string }): void {
      this.$delete(this.remoteStreamList, from);
    },

    getLocalAudio(): void {
      window.navigator.mediaDevices
        .getUserMedia({
          video: false,
          audio: true,
        })
        .then(stream => {
          this.localAudioAvailable = true;
          this.localAudioRawStreamRef = ref(stream);
          if (!this.audioContext) {
            this.localAudioStreamRef = ref(stream);
          } else {
            this.audioNodes = new AudioNodes(stream, this.audioContext, [
              // "tunachorus",
              // "tunaphaser",
              // "tunawahwah",
              // "tunaoverdrive",
              // "tunatremolo",
              "pitch",
            ]);
            // this.audioNodes.loadPresets(this.audioNodes.funcPresets.pitchHigh);
            this.localAudioStreamRef = ref(this.audioNodes.stream);
          }
        })
        .catch(() => {
          this.localAudioAvailable = false;
        });
    },

    getLocalCameraMedia(): Promise<MediaStream> {
      return new Promise((resolve, reject) => {
        if (this.localStreamRef.value) return resolve(this.localStreamRef.value);
        this.localVideoAvailable = false;
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
            audio: false,
          })
          .then(stream => {
            this.localVideoAvailable = true;
            const audioTracks = this.localAudioStreamRef.value?.getAudioTracks();
            if (audioTracks?.[0]) stream.addTrack(audioTracks[0]);
            resolve(stream);
          })
          .catch(err => {
            reject(err);
          });
      });
    },

    getLocalDisplayMedia(): Promise<MediaStream> {
      return new Promise((resolve, reject) => {
        if (this.localStreamRef.value) return resolve(this.localStreamRef.value);
        this.localVideoAvailable = false;
        window.navigator.mediaDevices
          .getDisplayMedia({
            video: true,
            audio: false,
          })
          .then(stream => {
            this.localVideoAvailable = true;
            const audioTracks = this.localAudioStreamRef.value?.getAudioTracks();
            console.log(audioTracks);

            if (audioTracks?.[0]) stream.addTrack(audioTracks[0]);
            resolve(stream);
          })
          .catch(err => {
            reject(err);
          });
      });
    },

    closeTracks(value: MediaStream | null, audio = false, video = true): void {
      if (audio && video) {
        value?.getTracks().forEach(track => {
          track?.stop();
        });
        return;
      }
      if (audio) {
        value?.getAudioTracks().forEach(track => {
          track?.stop();
        });
      }
      if (video) {
        value?.getVideoTracks().forEach(track => {
          track?.stop();
        });
      }
    },

    getLocalMedia(): Promise<void> {
      const localVideoControl: HTMLVideoElement | null = this.$refs.localVideoRef as any;
      if (localVideoControl) localVideoControl.srcObject = null;

      const getLocalMedia =
        (this.videoSource as "webcam" | "screen") === "webcam"
          ? this.getLocalCameraMedia
          : this.getLocalDisplayMedia;

      return getLocalMedia()
        .then(stream => {
          this.localStreamRef = ref(stream);
          if (localVideoControl) localVideoControl.srcObject = stream;
        })
        .catch(err => {
          makeToast("发生错误", "访问用户媒体设备失败: " + err.message, "danger");
        });
    },

    addLocalChannelToPeer(
      pcInstance: RTCPeerConnection,
      receiveSocketId: string,
      next: () => void
    ): void {
      pcInstance.ontrack = (e: RTCTrackEvent): void => {
        console.log("on-track");

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

      const getLocalMedia =
        (this.videoSource as "webcam" | "screen") === "webcam"
          ? this.getLocalCameraMedia
          : this.getLocalDisplayMedia;

      getLocalMedia()
        .then(stream => {
          stream?.getTracks().forEach(track => {
            pcInstance.addTrack(track, stream);
          });
        })
        .catch(() => {
          makeToast("错误", "本地视频访问失败", "danger");
        })
        .finally(() => {
          next();
        });
    },

    onRefreshConnection(): void {
      this.$bus.$emit("connection/start");
    },

    onSwitchMediaSource(): void {
      this.$bus.$emit("connection/stop");
      this.$nextTick(() => {
        this.closeTracks(this.localStreamRef.value);
        this.localStreamRef = ref(null);
        this.setVideoSource(this.videoSource === "screen" ? "webcam" : "screen");
        this.getLocalMedia().then(() => {
          this.$bus.$emit("connection/start");
        });
      });
    },

    onExitRoom(): void {
      this.$bus.$emit("connection/stop");
      this.$nextTick(() => {
        this.$bus.$emit("global/exit");
      });
    },

    onChangeVoicePitchClick(): void {
      this.audioNodes?.pitchJungle?.setPitchOffset(1);
    },
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.primary-content-overlay {
  flex: 1;
}

.primary-content-container {
  position: relative;
  height: 100%;

  .video-chat-container {
    position: relative;
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

    .toolbox {
      position: absolute;
      bottom: 58px;
      left: 50%;
      z-index: 9;
      padding: 8px;
      transform: translate(-50%);
      border-radius: @border-radius-infinite;
      background-color: @text-color-base;
      white-space: nowrap;
      opacity: 0.75;
      transition: opacity 0.3s;

      .operation-btn {
        width: 40px;
        height: 40px;
        line-height: 40px;
        text-align: center;
        font-size: 16px;
        color: whitesmoke;

        &:not(:last-child) {
          margin-right: 4px;
        }

        .btn-icon {
          vertical-align: 2px;
        }
      }

      .separator {
        display: inline-block;
        width: 1px;
        height: 28px;
        margin-right: 6px;
        margin-left: 2px;
        background-color: rgba(@text-color-light, 0.5);
        vertical-align: middle;
      }
    }

    &:hover {
      .toolbox {
        opacity: 1;
      }
    }
  }
}
</style>
