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
            :title="!micMuted ? '语音开启' : '语音关闭'"
            class="operation-btn"
            variant="outline-secondary"
            pill
            @click="onSwitchMicStatus"
          >
            <b-icon v-if="!micMuted" class="btn-icon" icon="mic-fill" />
            <b-icon v-else class="btn-icon" icon="mic-mute" />
          </b-button>
          <b-button
            v-b-tooltip.hover.v-secondary.noninteractive
            :title="!speakerMuted ? '关闭扬声器' : '打开扬声器'"
            class="operation-btn"
            variant="outline-secondary"
            pill
            @click="onSwitchSpeakerStatus"
          >
            <b-icon v-if="!speakerMuted" class="btn-icon" icon="volume-up-fill" />
            <b-icon v-else class="btn-icon" icon="volume-mute" />
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
          <b-button
            v-b-tooltip.hover.v-secondary.noninteractive
            title="启用背景模糊"
            class="operation-btn"
            variant="outline-secondary"
            pill
            @click="onToggleBlurClick"
          >
            <b-icon class="btn-icon" icon="person-square" />
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
        <div :class="['video-container', { 'local-video': videoSource === 'webcam' }]">
          <video
            ref="localVideoRef"
            class="video"
            muted
            autoplay
            playsinline
            disablePictureInPicture
            @contextmenu="() => false"
          />
          <canvas
            v-show="videoSource === 'webcam'"
            ref="localCanvasRef"
            class="canvas"
            width="640"
            height="480"
          />
        </div>

        <video
          v-for="item in Object.keys(remoteStreamList)"
          :ref="`remoteVideoRef_${item}`"
          :key="item"
          :muted="speakerMuted"
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
import { AudioNodeList } from "./extensions/audio/effectNodeList";

import VideoEffectInit, { videoExtensions } from "./extensions/video/effectCanvas";
import { VideoBlurEffect } from "./extensions/video/blur";

import PitchNode from "./extensions/audio/pitch";
import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";

import { makeToast, Properties } from "~/assets/utils/common";

export interface IMainContentState {
  localAudioAvailable: boolean;
  localAudioRawStreamRef: Ref<MediaStream | null>;
  localAudioStreamRef: Ref<MediaStream | null>;
  audioContext: AudioContext | null;
  audioNodeList: AudioNodeList | null;

  videoEffectInit: VideoEffectInit | null;
  videoBlurEffect: VideoBlurEffect | null;

  micMuted: boolean;
  speakerMuted: boolean;

  localVideoAvailable: boolean;
  localDisplayStreamRef: Ref<MediaStream | null>;

  localCanvasStreamRef: Ref<MediaStream | null>;
  localCanvasContext: Ref<CanvasRenderingContext2D | null>;
  localStreamRef: Ref<MediaStream | null>;

  remoteStreamList: Record<string, MediaStream | null>;
  onRemoteTrackMap: Record<string, (e: RTCTrackEvent) => void>;
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
      audioNodeList: null,

      videoEffectInit: null,
      videoBlurEffect: null,

      micMuted: false,
      speakerMuted: false,

      localVideoAvailable: false,
      localDisplayStreamRef: ref(null), // 本地video标签里展示的视频

      localCanvasStreamRef: ref(null),
      localCanvasContext: ref(null),
      localStreamRef: ref(null),

      remoteStreamList: {},
      onRemoteTrackMap: {},
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

    this.$bus.$emit("connection/addWidgetNum", "MainContent");
  },

  mounted() {
    this.audioContext = new (window.AudioContext || (window as any)?.webkitAudioContext)();

    this.localAudioRawStreamRef = ref(null);
    this.localAudioStreamRef = ref(null);

    const canvas = this.$refs.localCanvasRef as HTMLCanvasElement;
    this.localCanvasContext = ref(canvas.getContext("2d"));
    this.localCanvasStreamRef = ref(canvas.captureStream());
    this.localDisplayStreamRef = ref(null);

    this.getLocalAudio().finally(() => {
      this.getLocalMedia();
    });

    this.videoEffectInit = null;
    this.videoBlurEffect = null;
  },

  beforeDestroy() {
    this.closeTracks(this.localDisplayStreamRef.value, true);
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
      this.$delete(this.onRemoteTrackMap, from);
    },

    getLocalAudio(): Promise<MediaStream> {
      return new Promise((resolve, reject) => {
        if (this.localAudioStreamRef.value) return resolve(this.localAudioStreamRef.value);
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
              resolve(stream);
            } else {
              this.audioNodeList = new AudioNodeList(stream, this.audioContext);
              this.localAudioStreamRef = ref(this.audioNodeList.stream);
              resolve(this.audioNodeList.stream);
            }
          })
          .catch(err => {
            this.localAudioAvailable = false;
            reject(err);
          });
      });
    },

    getLocalCameraMedia(): Promise<MediaStream> {
      return new Promise((resolve, reject) => {
        if (this.localDisplayStreamRef.value) return resolve(this.localDisplayStreamRef.value);
        this.localStreamRef = ref(null);
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
          .then(originalStream => {
            this.localVideoAvailable = true;

            if (!this.videoEffectInit) {
              this.videoEffectInit = new VideoEffectInit(
                this.$refs.localCanvasRef as HTMLCanvasElement,
                this.localCanvasContext.value!,
                originalStream,
                this.$refs.localVideoRef as HTMLVideoElement
              );
            } else {
              this.videoEffectInit.setNewMediaSource(originalStream);
            }

            const audioTracks = this.localAudioStreamRef.value?.getAudioTracks();
            if (audioTracks?.[0]) {
              this.localCanvasStreamRef.value?.getAudioTracks().forEach(track => {
                this.localCanvasStreamRef.value?.removeTrack(track);
              });
              this.localCanvasStreamRef.value?.addTrack(audioTracks[0]);
              originalStream.addTrack(audioTracks[0]);
            }

            this.localStreamRef = ref(this.localCanvasStreamRef.value);
            resolve(originalStream);
          })
          .catch(err => {
            reject(err);
          });
      });
    },

    getLocalScreenMedia(): Promise<MediaStream> {
      return new Promise((resolve, reject) => {
        if (this.localDisplayStreamRef.value) return resolve(this.localDisplayStreamRef.value);
        this.localStreamRef = ref(null);
        this.localVideoAvailable = false;
        window.navigator.mediaDevices
          .getDisplayMedia({
            video: true,
            audio: false,
          })
          .then(stream => {
            this.localVideoAvailable = true;
            const audioTracks = this.localAudioStreamRef.value?.getAudioTracks();
            if (audioTracks?.[0]) stream.addTrack(audioTracks[0]);
            this.localStreamRef = ref(stream);
            resolve(stream);
          })
          .catch(err => {
            reject(err);
          });
      });
    },

    closeTracks(value: MediaStream | null, audio = false, video = true): void {
      console.log("close");

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

      const getLocalMedia =
        (this.videoSource as "webcam" | "screen") === "webcam"
          ? this.getLocalCameraMedia
          : this.getLocalScreenMedia;

      return getLocalMedia()
        .then(stream => {
          this.localDisplayStreamRef = ref(stream);
          if (localVideoControl) localVideoControl.srcObject = stream;
        })
        .catch(err => {
          makeToast("发生错误", "访问用户媒体设备失败: " + err.message, "danger");
          console.error(err);
        });
    },

    onRemoteTrack(e: RTCTrackEvent, socketId: string): void {
      console.log("on-track");

      this.$set(this.remoteStreamList, socketId, e.streams[0]);
      this.$nextTick(() => {
        let remoteVideoContainer = this.$refs[`remoteVideoRef_${socketId}`] as HTMLVideoElement;
        if (Array.isArray(remoteVideoContainer)) remoteVideoContainer = remoteVideoContainer[0];

        if (remoteVideoContainer) {
          remoteVideoContainer.srcObject = e.streams[0];
        }
      });
    },

    addLocalChannelToPeer(
      pcInstance: RTCPeerConnection,
      receiveSocketId: string,
      next?: () => void
    ): void {
      console.log("add-track");

      if (!this.onRemoteTrackMap[receiveSocketId]) {
        this.onRemoteTrackMap[receiveSocketId] = (e: RTCTrackEvent): void => {
          this.onRemoteTrack(e, receiveSocketId);
        };
      }
      pcInstance.ontrack = this.onRemoteTrackMap[receiveSocketId];

      this.getLocalMedia()
        .then(stream => {
          this.localStreamRef.value?.getTracks().forEach(track => {
            pcInstance.addTrack(track, this.localStreamRef.value!);
          });
        })
        .catch(err => {
          console.error(err);
          makeToast("错误", "本地视频访问失败", "danger");
        })
        .finally(() => {
          next?.();
        });
    },

    onRefreshConnection(): void {
      this.$bus.$emit("connection/start");
    },

    onSwitchMicStatus(): void {
      this.micMuted = !this.micMuted;
      if (this.micMuted) {
        this.localDisplayStreamRef.value?.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
        this.localStreamRef.value?.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      } else {
        this.localDisplayStreamRef.value?.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
        this.localStreamRef.value?.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
      }
    },

    onSwitchSpeakerStatus(): void {
      this.speakerMuted = !this.speakerMuted;
    },

    onSwitchMediaSource(): void {
      this.$bus.$emit("connection/stop");
      this.$nextTick(() => {
        this.closeTracks(this.localDisplayStreamRef.value);
        this.closeTracks(this.localStreamRef.value);
        this.localDisplayStreamRef = ref(null);
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
      (this.audioNodeList?.extensionNodeMap.pitch as PitchNode)?.applyPresets({ offset: 1 });
    },

    onToggleBlurClick(): void {
      this.videoEffectInit?.initExtension(videoExtensions);
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
      position: relative;
      flex: 1;
      width: 0;
      height: 100%;

      .video,
      .canvas {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
      }

      .canvas {
        aspect-ratio: 4 / 3;
        top: 50%;
        width: 100%;
        height: auto;
        max-height: 100%;
        pointer-events: none;
        transform: translateY(-50%);
        object-fit: contain;
      }

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
