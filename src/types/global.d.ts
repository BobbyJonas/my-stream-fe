import Vue from "vue";
import { IMemberItem } from "src/components/chatroom/PrimarySidebar/widgets/Member.vue";

interface WindowProperties {
  $bus: Vue;
  $pcInstanceMap: Record<string, RTCPeerConnection | null>;
  memberList: Array<IMemberItem>;
}

declare global {
  interface Window {
    __MY_STREAM__: WindowProperties;
  }
}
