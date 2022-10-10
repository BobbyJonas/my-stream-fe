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
import { iceServerPublicList, userMediaVideoTrackConstraints } from "./utils";
import socketioService from "~/assets/services/socket-io-client";

const _this: any = getCurrentInstance()?.root.type.$app;

const videoControlRef = ref<HTMLVideoElement | null>(null);

const PeerConnection =
  window.RTCPeerConnection ||
  (window as any).mozRTCPeerConnection ||
  (window as any).webkitRTCPeerConnection ||
  (window as any).msRTCPeerConnection;

const peer = new PeerConnection({
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
        videoControl.srcObject = stream;
      })
      .catch(err => {
        makeToast("发生错误", "访问用户媒体设备失败: " + err.message, "danger");
        // eslint-disable-next-line no-console
        console.error("访问用户媒体设备失败:", err.message);
      });
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
