<template>
  <div class="primary-content-container">
    <video ref="videoControlRef" class="video-chat-container" autoplay></video>
  </div>
</template>

<script lang="ts" setup>
import { Component, Prop, Vue } from "vue-property-decorator";
import {
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  reactive,
  computed,
  defineComponent,
  getCurrentInstance,
} from "@nuxtjs/composition-api";
import socketioService from "~/assets/services/socket-io-client";

const _this: any = getCurrentInstance()?.root.type.$app;

const videoControlRef = ref<HTMLVideoElement | null>(null);

const iceServers = [
  { url: "stun:stun1.l.google.com:19302" },
  { url: "stun:stun.miwifi.com" },
  { url: "stun:stun.qq.com" },
  { url: "stun:stun3.l.google.com:19302" },
  { url: "stun:stun.syncthing.net" },
  { url: "stun:stun4.l.google.com:19302" },
  { url: "stun:stun.newtocktech.com" },
];

const peerConnection: RTCPeerConnection =
  (window as any).RTCPeerConnection ||
  (window as any).mozRTCPeerConnection ||
  (window as any).webkitRTCPeerConnection ||
  (window as any).msRTCPeerConnection;

const sessionDescription: RTCSessionDescription =
  (window as any).RTCSessionDescription ||
  (window as any).mozRTCSessionDescription ||
  (window as any).webkitRTCSessionDescription ||
  (window as any).msRTCSessionDescription;

const getUserMedia = (
  constraints: DisplayMediaStreamConstraints,
  success: (value: MediaStream) => void,
  error: (reason: DOMException) => void
): void => {
  if ((window as any).navigator.mediaDevices.getUserMedia) {
    window.navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
  } else if ((window as any).navigator.webkitGetUserMedia) {
    (window as any).navigator.webkitGetUserMedia(constraints).then(success).catch(error);
  } else if ((window as any).navigator.mozGetUserMedia) {
    (window as any).navigator.mozGetUserMedia(constraints).then(success).catch(error);
  } else if ((window as any).navigator.getUserMedia) {
    (window as any).navigator.getUserMedia(constraints).then(success).catch(error);
  }
};

const canGetUserMediaUse = computed((): boolean => !!getUserMedia);

const makeToast = (
  title?: string,
  content?: string,
  variant?: "default" | "primary" | "secondary" | "danger" | "warning" | "success" | "info"
) => {
  const _this: any = getCurrentInstance()?.root.type.$app;

  _this?.$bvToast.toast(content, {
    title: title ?? "提示",
    variant: variant || "default",
    solid: true,
  });
};

onMounted(() => {
  const videoControl = videoControlRef.value;

  if (videoControl && canGetUserMediaUse) {
    getUserMedia(
      {
        video: true,
        audio: false,
      },
      stream => {
        videoControl.srcObject = stream;
      },
      err => {
        makeToast("发生错误", "访问用户媒体设备失败: " + err.message, "danger");
        // eslint-disable-next-line no-console
        console.error("访问用户媒体设备失败:", err.message);
      }
    );
  } else {
    makeToast("发生错误", "您的浏览器不兼容，建议安装最新版 Chrome", "danger");
  }
});
</script>

<style lang="less" scoped>
.primary-content-container {
  flex: 1;
  position: relative;
  width: 0;
  height: 100%;

  .video-chat-container {
    height: 100%;
    width: 100%;
  }
}
</style>
