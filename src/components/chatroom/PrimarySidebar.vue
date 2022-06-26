<template>
  <div class="primary-sidebar-container">
    <b-form-textarea
      v-model="sendTextValue"
      size="sm"
      placeholder="请输入聊天内容"
      rows="3"
      max-rows="8"
    />
    <b-button size="sm" @click="onSendTextClick('1')">发送</b-button>
    <h1 class="title px-10"><span>vue-nuxt-template2345</span></h1>
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
} from "@nuxtjs/composition-api";
import socketioService from "~/assets/services/socket-io";

const sendTextValue = ref<string>("");

const onSendTextClick = (extra?: string) => {
  // const p: number = extra + 1;
  socketioService.socket.emit("chat-message", sendTextValue.value);
};
</script>

<style lang="less" scoped>
.primary-sidebar-container {
  @apply px-10;

  .title {
    @apply px-11;

    span {
      font-size: 60px;
    }
  }
}
</style>
