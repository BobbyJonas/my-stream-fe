<template>
  <b-overlay
    :show="!funcInitReady"
    variant="light"
    :opacity="0.65"
    blur=""
    spinner-variant="primary"
    spinner-type="grow"
    spinner-small
    :style="{ width: '100%' }"
  >
    <div class="sidebar-widget-container">
      <div ref="chat-record-wrapper" class="chat-record-wrapper">
        <ul class="chat-message">
          <li v-for="(item, index) in chatList" :key="index" class="message-item">
            <div class="head">
              <span class="author">{{ item.userNickname }}</span>
              <span class="time">{{ date2Text(item.timeSent) }}</span>
            </div>
            <p class="content">{{ item.msgContent || "" }}</p>
          </li>
        </ul>
      </div>
      <div class="chat-send-wrapper">
        <b-form-textarea
          v-model="sendContentValue"
          :class="['send-content-input', { 'send-content-input--active': sendContentInputEnabled }]"
          size="sm"
          placeholder="请输入聊天内容"
          rows="3"
          max-rows="8"
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
import { ref, PropType, Ref } from "@nuxtjs/composition-api";

import moment from "moment";

import ChatroomStore, { CHATROOM_INIT_STATUS } from "~/store/chatroom";
import type { IMessageModel } from "~/api/modules/mongodb/models/message";

import { makeToast, Properties } from "~/assets/utils/common";

export interface ITextChatboxState {
  chatList: Array<IMessageModel>;
  funcInitReady: boolean;
  sendContentValue: string;
  sendContentInputEnabled: boolean;

  dataChannel: Ref<RTCDataChannel | null>;
  channelReady: boolean;
}

type State = ITextChatboxState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  props: {
    pcInstance: {
      required: true,
      type: Object as PropType<Ref<RTCPeerConnection | null>>,
    },
  },

  data() {
    return {
      chatList: [],
      funcInitReady: false,
      sendContentValue: "",
      sendContentInputEnabled: false,

      dataChannel: ref(null),
      channelReady: false,
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentStep", "currentRoomId", "currentUserRole"] as Array<
      Properties<typeof ChatroomStore>
    >),
  },

  watch: {
    currentStep(currentValue) {
      switch (currentValue) {
        case CHATROOM_INIT_STATUS.RTC_CONNECTION: {
          this.addCurrentStepProcess();
          this.createDataChannel();
          this.removeCurrentStepProcess();
          setTimeout(() => {
            if (this.currentStepProcess === 0) this.setCurrentStep(CHATROOM_INIT_STATUS.DONE);
          }, 0);
          break;
        }
        case CHATROOM_INIT_STATUS.DONE:
        default:
          break;
      }
    },
  },

  beforeMount() {
    if (this.currentStep === CHATROOM_INIT_STATUS.DONE) {
      this.createDataChannel();
    }
  },

  beforeDestroy() {
    this.dataChannel.value?.close();
  },

  methods: {
    ...mapMutations({
      setCurrentStep: "chatroom/setCurrentStep",
      addCurrentStepProcess: "chatroom/addCurrentStepProcess",
      removeCurrentStepProcess: "chatroom/removeCurrentStepProcess",
    }),

    createDataChannel() {
      const pcInstance: RTCPeerConnection = this.pcInstance?.value || ({} as any);
      if (!this.dataChannel.value) {
        this.dataChannel = ref(
          pcInstance.createDataChannel?.("chatbox-message", {
            protocol: "json",
            maxRetransmits: 5,
          }) ?? null
        );
        const dataChannel: RTCDataChannel = this.dataChannel.value || ({} as any);
        dataChannel.onopen = this.onChannelStatusChange;
        dataChannel.onclose = this.onChannelStatusChange;
        dataChannel.onmessage = this.onRemoteMessage;
      }
      pcInstance.ondatachannel = this.onRemoteChannelConnected;
      this.funcInitReady = true;
    },

    onRemoteChannelConnected(e: RTCDataChannelEvent): void {
      this.dataChannel = ref(e.channel);
      const dataChannel: RTCDataChannel = this.dataChannel.value || ({} as any);
      dataChannel.onopen = this.onChannelStatusChange;
      dataChannel.onclose = this.onChannelStatusChange;
      dataChannel.onmessage = this.onRemoteMessage;

      this.funcInitReady = true;
    },

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

    onSendTextClick(): void {
      if (
        !(this.dataChannel?.value?.readyState === "open") ||
        !(this.sendContentValue.length > 0)
      ) {
        if (this.sendContentValue.length > 0)
          makeToast("发生错误", "DataChannel is not ready", "warning");
        return;
      }

      const currentMessage: IMessageModel = {
        roomId: this.currentRoomId,
        timeSent: new Date(),
        msgType: "text",
        msgContent: this.sendContentValue,
        read: false,
        userId: this.currentUserRole._id,
        userNickname: this.currentUserRole.nickname,
      };

      this.dataChannel.value?.send(JSON.stringify(currentMessage));
      this.sendContentValue = "";
    },

    date2Text(value: Date) {
      return moment(value).format("HH:mm:ss");
    },
  },
});
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
