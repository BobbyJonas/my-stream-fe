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
            class="operation-btn"
            variant="outline-secondary"
            pill
            @click="onTestClick"
          >
            测试
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
import { AudioNodes } from "./effects";
import socketioService from "~/assets/services/socket-io-client";

import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";

import { makeToast, Properties } from "~/assets/utils/common";
import { IConnectionModel } from "~/api/modules/mongodb/models/connection";

export interface IMainContentState {
  userMediaAvailable: boolean;
  localStreamRef: Ref<MediaStream | null>;
  remoteStreamList: Record<string, MediaStream | null>;
  audioNodes: AudioNodes | null;
  audioContext: AudioContext | null;
}

type State = IMainContentState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  data() {
    return {
      userMediaAvailable: false,
      remoteStreamList: {},
      audioNodes: null,
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

    this.$bus.$emit("connection/addWidgetNum");
  },

  mounted() {
    this.localStreamRef = ref<MediaStream | null>(null);
    this.audioContext = new (window.AudioContext || (window as any)?.webkitAudioContext)();
    this.getLocalMedia();
  },

  beforeDestroy() {
    if (this.localStreamRef.value) {
      this.localStreamRef.value?.getTracks().forEach(track => {
        track?.stop();
      });
    }
    this.audioContext?.close();
    this.$bus.$emit("connection/removeWidgetNum");
  },

  methods: {
    ...mapMutations({
      setInitReady: "connection/setInitReady",
      setVideoSource: "connection/setVideoSource",
    }),
    ...mapActions({
      chatroomEnter: "chatroom/chatroomEnter",
    }),

    removeLocalChannelFromPeer({ from }: { from: string }): void {
      this.$delete(this.remoteStreamList, from);
    },

    getLocalCameraMedia(): Promise<MediaStream> {
      return new Promise((resolve, reject) => {
        if (this.localStreamRef.value) return resolve(this.localStreamRef.value);
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
            if (!this.audioNodes) {
              this.audioNodes = new AudioNodes(stream, this.audioContext!, [
                // "tunachorus",
                // "tunaphaser",
                // "tunawahwah",
                // "tunaoverdrive",
                // "tunatremolo",
                "pitch",
              ]);
            }
            // this.audioNodes.loadPresets(this.audioNodes.funcPresets.pitchHigh);
            const videoTracks = stream.getVideoTracks();
            this.audioNodes.stream?.addTrack(videoTracks[0]);
            resolve(this.audioNodes.stream!);
          });
      });
    },

    getLocalDisplayMedia(): Promise<MediaStream> {
      return new Promise((resolve, reject) => {
        if (this.localStreamRef.value) return resolve(this.localStreamRef.value);
        window.navigator.mediaDevices
          .getDisplayMedia({
            video: true,
            audio: true,
          })
          .then(stream => {
            resolve(stream);
          })
          .catch(err => {
            reject(err);
          });
      });
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
        if (this.localStreamRef.value) {
          this.localStreamRef.value?.getTracks().forEach(track => {
            track?.stop();
          });
        }
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

    onTestClick(): void {
      console.log(this.audioNodes);
      console.log(this.audioNodes?.stream);
      this.audioNodes?.pitchJungle?.setPitchOffset(1);
      const localVideoControl: HTMLVideoElement | null = this.$refs.localVideoRef as any;
      if (localVideoControl && this.audioNodes?.stream)
        localVideoControl.srcObject = this.audioNodes?.stream;
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
