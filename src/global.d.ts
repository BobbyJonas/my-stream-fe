import Vue from "vue";

interface WindowProperties {
  $bus: Vue;
  $pcInstanceMap: Record<string, RTCPeerConnection | null>;
}

declare global {
  interface Window {
    __MY_STREAM__: WindowProperties;
  }
}
