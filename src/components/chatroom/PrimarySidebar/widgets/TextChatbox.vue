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
            <div class="left">
              <div class="avatar">
                <img v-if="item.userPhoto" class="img" :src="item.userPhoto || ''" alt="头像" />
                <b-icon v-else icon="person" />
              </div>
            </div>
            <div class="right">
              <div class="head">
                <span class="author">{{ item.userNickname }}</span>
                <span class="time">{{ date2Text(item.timeSent) }}</span>
              </div>
              <p class="content">{{ item.msgContent || "" }}</p>
            </div>
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

import socketioService from "~/assets/services/socket-io-client";

import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";
import type { IMessageModel } from "~/api/modules/mongodb/models/message";

import Empty from "@/components/common/Empty.vue";

import { makeToast, Properties } from "~/assets/utils/common";

export type IMessageDisplayModel = IMessageModel & { userNickname?: string; userPhoto?: string };

export interface ITextChatboxState {
  currentSocketId: string;

  chatList: Array<IMessageDisplayModel>;
  funcInitReady: boolean;
  sendContentValue: string;
  sendContentInputEnabled: boolean;

  dataChannelMap: Record<string, RTCDataChannel | null>;
  onChannelConnectedMap: Record<string, (e: RTCDataChannelEvent) => void>;
}

type State = ITextChatboxState;

export default Vue.extend({
  components: {
    Empty,
  } as Record<string, Component>,

  data() {
    return {
      currentSocketId: "",

      chatList: [],
      funcInitReady: true,
      sendContentValue: "",
      sendContentInputEnabled: false,

      dataChannelMap: {},
      onChannelConnectedMap: {},
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentRoomId", "currentUserRole"] as Array<
      Properties<typeof ChatroomStore>
    >),
    ...mapState("connection", ["currentStep"] as Array<Properties<typeof ConnectionStore>>),
  },

  watch: {
    currentStep(currentValue) {
      switch (currentValue) {
        case CONNECTION_INIT_STATUS.DONE:
          if (socketioService.socket?.id) {
            this.currentSocketId = socketioService.socket.id;
          }
          break;
        default:
          break;
      }
    },
  },

  created() {
    this.$bus.$on("global/createChannel", this.createDataChannel);
    this.$bus.$on("global/removeChannel", this.removeDataChannel);
    this.$bus.$emit("connection/addWidgetNum", "TextChatbox");
  },

  beforeDestroy() {
    this.$bus.$emit("connection/removeWidgetNum", "TextChatbox");
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

      const newDataChannel = pcInstance.createDataChannel?.("TextChatbox", {
        protocol: "json",
        maxRetransmits: 5,
      });
      newDataChannel.onopen = this.onChannelStatusChange;
      newDataChannel.onclose = this.onChannelStatusChange;
      newDataChannel.onmessage = this.onRemoteMessage;
      this.$set(this.dataChannelMap, receiveSocketId, newDataChannel);

      this.onChannelConnectedMap[receiveSocketId] = (e: RTCDataChannelEvent) => {
        this.onChannelConnected(e, receiveSocketId);
      };
      pcInstance.addEventListener("datachannel", this.onChannelConnectedMap[receiveSocketId]);
      next();
    },

    removeDataChannel({ from }: { from: string }): void {
      this.dataChannelMap[from]?.close();
      this.$delete(this.dataChannelMap, from);
      this.$delete(this.onChannelConnectedMap, from);
    },

    onChannelConnected(e: RTCDataChannelEvent, receiveSocketId: string): void {
      const remoteDataChannel = e.channel;
      if (remoteDataChannel && remoteDataChannel.label === "TextChatbox") {
        remoteDataChannel.onopen = this.onChannelStatusChange;
        remoteDataChannel.onclose = this.onChannelStatusChange;
        remoteDataChannel.onmessage = this.onRemoteMessage;
        this.$set(this.dataChannelMap, receiveSocketId, remoteDataChannel);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    onChannelStatusChange(event: Event): void {},

    onRemoteMessage(e: MessageEvent): void {
      // 滚到底部
      const chatListContainer = this.$refs["chat-record-wrapper"] as HTMLDivElement;
      const ifBottom =
        chatListContainer.scrollHeight -
          chatListContainer.scrollTop -
          chatListContainer.offsetHeight <
        5;

      const newChatItem: IMessageDisplayModel = (JSON.parse(e.data) as IMessageModel) || {};
      const fromUser = window.__MY_STREAM__?.memberList?.find(
        memberItem => memberItem.socketId === newChatItem.socketId
      );

      if (fromUser) {
        newChatItem.userNickname = fromUser.nickname;
        newChatItem.userPhoto = fromUser.photo;
      }

      this.chatList.push(newChatItem);
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
        socketId: this.currentSocketId,
        timeSent: new Date(),
        msgType: "text",
        msgContent: sendContent,
        read: false,
      };

      console.log(currentMessage);

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
        display: flex;
        margin-bottom: 12px;
        word-break: break-all;

        .left {
          display: flex;
          align-items: flex-start;
          padding-top: 4px;
          margin-right: 8px;

          .avatar {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            height: 30px;
            width: 30px;
            font-size: @font-size-md;
            border-radius: @border-radius-infinite;
            box-shadow: 0 0 0 1px grey;
            background-color: rgba(black, 0.5);

            .img {
              width: 100%;
              height: 100%;
              border-radius: @border-radius-infinite;
            }
          }
        }

        .right {
          width: 0;
          flex: 1;

          .head {
            margin-bottom: 3px;
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
