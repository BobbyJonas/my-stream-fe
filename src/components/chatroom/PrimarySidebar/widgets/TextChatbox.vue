<template>
  <div class="sidebar-widget-container">
    <div class="chat-record-wrapper">
      <ul>
        <li v-for="(item, index) in chatList" :key="index">
          {{ item.content || "" }}
        </li>
      </ul>
    </div>
    <b-button @click="onConnectDb()">测试 db</b-button>
    <div class="chat-send-wrapper">
      <b-form-textarea
        v-model="sendContentValue"
        :class="['send-content-input', { 'send-content-input--active': sendContentInputEnabled }]"
        size="sm"
        placeholder="请输入聊天内容"
        rows="3"
        max-rows="8"
        @focus="activateContentInput"
        @blur="deactivateContentInput"
      />
      <b-button
        :disabled="!Boolean(sendContentValue)"
        variant="primary"
        class="send-button"
        size="sm"
        @click="onSendTextClick()"
      >
        发送
      </b-button>
    </div>
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
  useRouter,
  getCurrentInstance,
} from "@nuxtjs/composition-api";
import { AxiosInstance } from "axios";
import socketioService from "~/assets/services/socket-io-client";

interface IMessageItem {
  author?: string;
  content?: string;
  dateSent?: string;
}
const router = useRouter();

const chatList = reactive<Array<IMessageItem>>([]);

const sendContentValue = ref<string>("");
const sendContentInputEnabled = ref<boolean>(false);

const onConnectDb = async (): Promise<void> => {
  // const $axios: AxiosInstance = window.$nuxt.$axios;
  // const res = await $axios.get("/db/user");
  // console.log(res);
};

const onSendTextClick = (): void => {
  console.log(sendContentValue.value);

  if (sendContentValue.value?.length > 0) {
    const route = router.currentRoute;
    socketioService.socket.emit("chat-message", {
      roomId: route.params.id,
      content: sendContentValue.value,
    });
  }
  sendContentValue.value = "";
};

const activateContentInput = (): void => {
  sendContentInputEnabled.value = true;
};

const deactivateContentInput = (): void => {
  sendContentInputEnabled.value = false;
};

socketioService.socket?.on("new-message", (args: IMessageItem) => {
  chatList.push(args);
  console.log(args.content);
});

onMounted(() => {});

onUnmounted(() => {});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.sidebar-widget-container {
  @apply w-full h-full;

  display: flex;
  flex-direction: column;
  color: @text-color-lighter;
  background-color: rgb(white 0.25);

  .chat-record-wrapper {
    @apply px-5 py-4;

    flex: 1;
    height: 0;

    .title {
      @apply py-11;

      span {
        font-size: 60px;
      }
    }
  }

  .chat-send-wrapper {
    @apply px-10 pb-8;

    .send-content-input {
      color: white;
      border: 1px solid rgb(whitesmoke 0.15);
      background-color: rgb(gray 0.25);
      transition: background-color 0.3s, box-shadow 0.3s;

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

      &--active {
        background-color: rgb(gray 0.4);
      }
    }

    .send-button {
      width: 100%;
      margin-top: 0.9rem;
    }
  }
}
</style>
