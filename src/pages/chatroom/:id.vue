<template>
  <div class="chatroom-content">
    <MainContent></MainContent>
    <PrimarySidebar></PrimarySidebar>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState } from "vuex";

import socketioService from "~/assets/services/socket-io-client";
import type { IUserModel } from "~/api/modules/mongodb/models/user";
import type { IMessageModel } from "~/api/modules/mongodb/models/message";

import MainContent from "~/components/chatroom/MainContent/index.vue";
import PrimarySidebar from "~/components/chatroom/PrimarySidebar/index.vue";
import ChatroomStore from "~/store/chatroom";
import { makeToast, Properties } from "~/assets/utils/common";

export interface IChatroomPageState {}

type State = IChatroomPageState;

export default Vue.extend({
  components: {
    MainContent,
    PrimarySidebar,
  } as Record<string, Component>,

  layout: "app",
  middleware: "chatroom-auth",

  data() {
    return {} as State;
  },
  computed: {
    ...mapState("chatroom", ["currentUserRole"] as Array<Properties<typeof ChatroomStore>>),
  },

  beforeMount() {
    socketioService.setupSocketConnection();

    const storageCurrentRole: string = window.localStorage["current-role"];
    if (storageCurrentRole) {
      const currentRoleObj: IUserModel = JSON.parse(storageCurrentRole);
      this.setCurrentUserRole(currentRoleObj);
    }

    socketioService.socket.on("connect", () => {
      if (this.currentUserRole) {
        this.setCurrentStep(1);
      } else {
        makeToast("加载错误", "当前用户信息为空，请选择用户信息后再进入", "danger");
      }
    });
  },

  beforeDestroy() {
    socketioService.disconnect();
  },

  methods: {
    ...mapMutations({
      setCurrentUserRole: "chatroom/setCurrentUserRole",
      setCurrentStep: "chatroom/setCurrentStep",
    }),
  },
});
</script>

<style lang="less" scoped>
.chatroom-content {
  @apply w-full h-full;

  display: flex;
  flex-direction: row;
  background-color: black;
  overflow: hidden;
}
</style>
