<template>
  <div class="primary-sidebar-container">
    <div class="chat-record">
      <h1 class="title px-10"><span>app-template2345</span></h1>
    </div>
    <div class="chat-send">
      <b-form-textarea
        v-model="sendTextValue"
        class="send-content-input"
        size="sm"
        placeholder="请输入聊天内容"
        rows="3"
        max-rows="8"
      />
      <b-button class="send-button" size="sm" @click="onSendTextClick('1')"> 发送 </b-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Component, Prop, Vue } from "vue-property-decorator";
import { onBeforeMount, onMounted, onUnmounted, ref, reactive } from "@nuxtjs/composition-api";
import socketioService from "~/assets/services/socket-io";

const sendTextValue = ref<string>("");

const onSendTextClick = (extra?: string) => {
  // const p: number = extra + 1;
  socketioService.socket.emit("chat-message", sendTextValue.value);
};
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.primary-sidebar-container {
  @apply px-10 py-7;

  display: flex;
  flex-direction: column;
  width: 320px;
  color: @text-color-lighter;
  background-color: rgb(white 0.25);

  .chat-record {
    flex: 1;
    height: 0;

    .title {
      @apply py-11;

      span {
        font-size: 60px;
      }
    }
  }

  .chat-send {
    .send-button {
      width: 100%;
      margin-top: 0.9rem;
    }
  }
}
</style>
