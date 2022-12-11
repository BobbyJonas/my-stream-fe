import Vue from "vue";
import { Store } from "vuex";
import type { IMemberItem } from "src/components/chatroom/PrimarySidebar/widgets/Member.vue";
import type { BvToast } from "bootstrap-vue/src/components/toast";

interface WindowProperties {
  $bus: Vue;
  $pcInstanceMap: Record<string, RTCPeerConnection | null>;
  memberList: Array<IMemberItem>;
}

declare global {
  interface Window {
    __MY_STREAM__: WindowProperties;
    $nuxt: { $bvToast: BvToast };
    $store: Store<any>;
  }
}
