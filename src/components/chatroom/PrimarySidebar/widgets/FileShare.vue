<template>
  <div class="widget-container">
    <dl class="file-share-container">
      <dt class="header">
        <h4 class="title">来自成员</h4>
        <b-button
          v-b-tooltip.hover.left.v-secondary.noninteractive
          title="刷新列表"
          class="refresh-btn"
        >
          <b-icon class="btn-icon" icon="arrow-repeat"></b-icon>
        </b-button>
      </dt>
      <dd class="file-list"></dd>
    </dl>
    <dl class="file-share-container">
      <dt class="header">
        <h4 class="title">你的分享</h4>
        <b-button
          v-b-tooltip.hover.left.v-secondary.noninteractive
          title="刷新列表"
          class="refresh-btn"
        >
          <b-icon class="btn-icon" icon="arrow-repeat"></b-icon>
        </b-button>
      </dt>
      <dd class="file-list"></dd>
      <b-form-file
        v-model="file1"
        size="lg"
        class="upload-area"
        :state="Boolean(file1)"
        placeholder="选择文件或拖动文件到此处"
        drop-placeholder="拖动文件到此处..."
      ></b-form-file>
    </dl>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapState } from "vuex";

import socketioService from "~/assets/services/socket-io-client";
import type { IConnectionModel } from "~/api/modules/mongodb/models/connection";
import type { IUserModel } from "~/api/modules/mongodb/models/user";

import { Properties } from "~/assets/utils/common";
import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";

export interface IMemberState {
  file1: any;
  isLoading: boolean;
  currentSocketId: string;
}

type State = IMemberState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  data() {
    return {
      file1: undefined,
      isLoading: false,
      currentSocketId: "",
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentUserRole", "currentRoomId"] as Array<
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
    this.$bus.$emit("connection/addWidgetNum", "FileShare");
  },

  beforeDestroy() {
    this.$bus.$emit("connection/removeWidgetNum", "FileShare");
  },

  methods: {
    createDataChannel(pcInstance: RTCPeerConnection, receiveSocketId: string, next: () => void) {
      next();
    },

    removeDataChannel({ from }: { from: string }): void {},
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.widget-container-overlay {
  @apply w-full h-full;
}

.widget-container {
  @apply w-full h-full py-1;

  display: flex;
  flex-direction: column;
  color: @text-color-lighter;
  background-color: rgb(white 0.25);
  overflow: hidden;

  .file-share-container {
    @apply px-6 py-3;

    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: @font-size-sm;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;

      .title {
        display: inline;
      }

      .refresh-btn {
        padding: 3px 6px;
        transform: translateY(1px);

        .btn-icon {
          vertical-align: -3px;
        }
      }
    }

    .file-list {
      flex: 1;
      margin-bottom: 6px;
    }

    .upload-area {
      ::v-deep {
        .custom-file-label::after {
          content: "浏览文件";
        }
      }
    }

    &:first-child {
      border-bottom: 1px solid rgba(@border-color-base, 0.1);
    }
  }
}
</style>
