<template>
  <div class="chatroom-content">
    <MainContent></MainContent>
    <PrimarySidebar></PrimarySidebar>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";

import socketioService from "~/assets/services/socket-io-client";

import MainContent from "~/components/chatroom/MainContent.vue";
import PrimarySidebar from "~/components/chatroom/PrimarySidebar/index.vue";

export interface IChatroomPageState {}

export default Vue.extend({
  components: {
    MainContent,
    PrimarySidebar,
  } as Record<string, Component>,

  layout: "app",
  middleware: "chatroom-auth",

  data() {
    return {
      messageList: [],
    } as IChatroomPageState;
  },

  beforeMount() {
    socketioService.setupSocketConnection();
  },
  beforeDestroy() {
    socketioService.disconnect();
  },

  methods: {},
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
