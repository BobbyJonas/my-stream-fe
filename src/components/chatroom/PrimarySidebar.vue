<template>
  <div class="primary-sidebar-container">
    <div class="chat-record">
      <h1 class="title px-10"><span>app-template2345</span></h1>
    </div>
    <div class="chat-send">
      <b-form-textarea
        v-model="sendContentValue"
        :class="['send-content-input', { 'send-content-input--active': sendContentInputEnabled }]"
        size="sm"
        placeholder="请输入聊天内容"
        rows="3"
        max-rows="8"
      />
      <b-button variant="primary" class="send-button" size="sm" @click="onSendTextClick()">
        发送
      </b-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Component, Prop, Vue } from "vue-property-decorator";
import { onBeforeMount, onMounted, onUnmounted, ref, reactive } from "@nuxtjs/composition-api";
import socketioService from "~/assets/services/socket-io";

const sendContentValue = ref<string>("");
const sendContentInputEnabled = ref<boolean>(false);

const onSendTextClick = (op?: string) => {
  console.log(sendContentValue.value);
  socketioService.socket.emit("chat-message", sendContentValue.value);
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
    .send-content-input {
      color: white;
      border: 1px solid rgb(whitesmoke 0.15);
      background-color: rgb(gray 0.25);

      &::placeholder {
        color: @text-color-light;
      }

      &::-webkit-scrollbar {
        width: 9px;
        height: 9px;
        cursor: pointer;
      }

      &::-webkit-scrollbar-thumb {
        background: gray;
        cursor: pointer;
        border-radius: 4px;

        &:hover {
          background: @text-color-light;
        }
      }

      &::-webkit-scrollbar-track {
        background: rgb(gray 0.5);
      }
    }

    .send-button {
      width: 100%;
      margin-top: 0.9rem;
    }
  }
}
</style>
