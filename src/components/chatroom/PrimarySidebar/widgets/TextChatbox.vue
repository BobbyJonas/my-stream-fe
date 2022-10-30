<template>
  <b-overlay
    :show="!funcInitReady"
    class="widget-container-overlay"
    variant="light"
    :opacity="0.65"
    blur=""
    spinner-variant="primary"
    spinner-type="grow"
    spinner-small
  >
    <div class="widget-container">
      <div ref="chat-record-wrapper" class="chat-record-wrapper">
        <ul v-if="chatList && chatList.length > 0" class="chat-message">
          <li v-for="(item, index) in chatList" :key="index" class="message-item">
            <div class="head">
              <span class="author">{{ item.userNickname }}</span>
              <span class="time">{{ date2Text(item.timeSent) }}</span>
            </div>
            <p class="content">{{ item.msgContent || "" }}</p>
          </li>
        </ul>
        <Empty v-else :message="'历史聊天内容为空'" />
      </div>
      <div class="chat-send-wrapper">
        <b-form-textarea
          v-model="sendContentValue"
          :class="['send-content-input', { 'send-content-input--active': sendContentInputEnabled }]"
          size="sm"
          placeholder="请输入聊天内容"
          rows="3"
          max-rows="8"
          @keydown="onTextAreaKeyDown"
          @focus="
            () => {
              sendContentInputEnabled = true;
            }
          "
          @blur="
            () => {
              sendContentInputEnabled = false;
            }
          "
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
  </b-overlay>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState } from "vuex";

import moment from "moment";

import ChatroomStore from "~/store/chatroom";
import ConnectionStore from "~/store/connection";
import type { IMessageModel } from "~/api/modules/mongodb/models/message";

import Empty from "@/components/common/Empty.vue";

import { makeToast, Properties } from "~/assets/utils/common";

export interface ITextChatboxState {
  chatList: Array<IMessageModel>;
  funcInitReady: boolean;
  sendContentValue: string;
  sendContentInputEnabled: boolean;

  dataChannelMap: Record<string, RTCDataChannel | null>;
}

type State = ITextChatboxState;

export default Vue.extend({
  components: {
    Empty,
  } as Record<string, Component>,

  data() {
    return {
      chatList: [],
      funcInitReady: true,
      sendContentValue: "",
      sendContentInputEnabled: false,

      dataChannelMap: {},
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentRoomId", "currentUserRole"] as Array<
      Properties<typeof ChatroomStore>
    >),
    ...mapState("connection", ["currentStep"] as Array<Properties<typeof ConnectionStore>>),
  },

  created() {
    this.$bus.$on("global/createChannel", this.createDataChannel);
    this.$bus.$on("global/removeChannel", this.removeDataChannel);
    this.$bus.$emit("connection/addWidgetNum");
  },

  beforeDestroy() {
    this.$bus.$emit("connection/removeWidgetNum");
  },

  methods: {
    ...mapMutations({
      setCurrentStep: "connection/setCurrentStep",
      addCurrentStepProcess: "connection/addCurrentStepProcess",
      removeCurrentStepProcess: "connection/removeCurrentStepProcess",
    }),

    createDataChannel(pcInstance: RTCPeerConnection, receiveSocketId: string, next: () => void) {
      const currentDataChannel = this.dataChannelMap?.[receiveSocketId];
      if (currentDataChannel) currentDataChannel?.close();

      const newDataChannel = pcInstance.createDataChannel?.("chatbox-message", {
        protocol: "json",
        maxRetransmits: 5,
      });
      newDataChannel.onopen = this.onChannelStatusChange;
      newDataChannel.onclose = this.onChannelStatusChange;
      newDataChannel.onmessage = this.onRemoteMessage;
      this.$set(this.dataChannelMap, receiveSocketId, newDataChannel);

      pcInstance.ondatachannel = (e: RTCDataChannelEvent) => {
        this.onRemoteChannelConnected(e, receiveSocketId);
      };
      next();
    },

    removeDataChannel({ from }: { from: string }): void {
      this.dataChannelMap[from]?.close();
      this.$delete(this.dataChannelMap, from);
    },

    onRemoteChannelConnected(e: RTCDataChannelEvent, receiveSocketId: string): void {
      const remoteDataChannel = e.channel;
      remoteDataChannel.onopen = this.onChannelStatusChange;
      remoteDataChannel.onclose = this.onChannelStatusChange;
      remoteDataChannel.onmessage = this.onRemoteMessage;
      this.$set(this.dataChannelMap, receiveSocketId, remoteDataChannel);
    },

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onChannelStatusChange(event: Event): void {},

    onRemoteMessage(e: MessageEvent): void {
      // 滚到底部
      const chatListContainer = this.$refs["chat-record-wrapper"] as HTMLDivElement;
      const ifBottom =
        chatListContainer.scrollHeight -
          chatListContainer.scrollTop -
          chatListContainer.offsetHeight <
        5;

      this.chatList.push(JSON.parse(e.data) as IMessageModel);

      this.$nextTick(() => {
        if (ifBottom) {
          chatListContainer.scrollTo(
            chatListContainer.scrollLeft,
            chatListContainer.scrollHeight - chatListContainer.offsetHeight
          );
        }
      });
    },

    onTextAreaKeyDown(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        this.onSendTextClick();
      }
    },

    onSendTextClick(): void {
      const sendContent = (this.sendContentValue || "").replace(/^\s+|\s+$/g, "");
      if (!(sendContent.length > 0) || !(Object.keys(this.dataChannelMap).length > 0)) {
        if (!(sendContent.length > 0)) {
          makeToast("发送失败", "输入内容不得为空", "warning");
        } else {
          makeToast("发送消息错误", "当前没有连线用户", "danger");
        }
        return;
      }

      const currentMessage: Partial<IMessageModel> = {
        roomId: this.currentRoomId,
        timeSent: new Date(),
        msgType: "text",
        msgContent: sendContent,
        read: false,
        userId: this.currentUserRole._id,
        userNickname: this.currentUserRole.nickname,
      };

      const sendValue = JSON.stringify(currentMessage);
      this.onRemoteMessage({ data: sendValue } as any);
      Object.keys(this.dataChannelMap).forEach(socketId => {
        const dataChannel = this.dataChannelMap[socketId];
        if (dataChannel?.readyState === "open") {
          dataChannel.send(sendValue);
        }
      });
      this.sendContentValue = "";
    },

    date2Text(value: Date): string {
      return moment(value).format("HH:mm:ss");
    },
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.widget-container-overlay {
  @apply w-full h-full;
}

.widget-container {
  @apply w-full h-full;

  display: flex;
  flex-direction: column;
  color: @text-color-lighter;
  background-color: rgb(white 0.25);
  overflow: hidden;

  .chat-record-wrapper {
    @apply px-5 py-4;

    flex: 1;
    height: 0;
    overflow: hidden auto;
    overflow-y: overlay;

    .chat-message {
      font-size: @font-size-sm;

      .message-item {
        margin-bottom: 8px;
        word-break: break-all;

        .head {
          margin-bottom: 1px;
          color: @text-color-light;

          .author {
            margin-right: 8px;
          }
        }

        .content {
          line-height: 1.25;
          white-space: pre-line;
        }
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
