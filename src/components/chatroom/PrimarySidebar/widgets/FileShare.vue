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
      <dd class="file-list">
        <div v-for="item in fileShareList" :key="item.id" class="list-item">
          <h5 class="author">{{ item.user && item.user.nickname ? item.user.nickname : "" }}</h5>
          <a class="file" href="#" role="button" :tabindex="0">
            <img class="icon" :src="`/icon/file/${getFileNameExt(item.name)}.svg`" alt="ext-icon" />
            <div class="info">
              <p class="name">{{ item.name }}</p>
              <span :style="{ display: 'none' }"> - </span>
              <p>{{ size2Text(item.size) }}</p>
            </div>
          </a>
          <p class="date">{{ date2Text(item.shelveTime) }}</p>
        </div>
      </dd>
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
      <div class="upload-area">
        <b-form-file
          v-model="fileToUpload"
          class="upload-control"
          placeholder="选择文件或拖动文件到此处..."
          drop-placeholder="释放该文件..."
          browse-text="浏览文件"
        />
        <b-button
          size="sm"
          :disabled="!Boolean(fileToUpload)"
          variant="primary"
          class="upload-btn"
          @click="onUploadBtnClick"
        >
          <b-icon class="btn-icon" icon="cloud-arrow-up" />
          <span>上传</span>
        </b-button>
      </div>
    </dl>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import moment from "moment";
import { mapState } from "vuex";
import { v4 as uuidv4 } from "uuid";

import socketioService from "~/assets/services/socket-io-client";

import { makeToast, Properties } from "~/assets/utils/common";
import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";
import type { IUserModel } from "~/api/modules/mongodb/models/user";

export interface FileDescription {
  id: string;
  lastModified: number;
  name: string;
  size: number;
}

export type FileShareListItem = FileDescription & {
  user?: Partial<IUserModel>;
  shelveTime: number;
};
// 向现有成员，展示文件信息
export interface ISendMsgShelve {
  type: "shelve";
  content: FileShareListItem;
}

// 告知成员，现有文件取消展示
export interface ISendMsgUnshelve {
  type: "unshelve";
  content: {
    id: string;
  };
}

// 申请文件下载
export interface ISendMsgApply {
  type: "apply";
  content: {
    id: string;
  };
}

export type ISendMsgType = ISendMsgShelve | ISendMsgUnshelve | ISendMsgApply;

export interface IFileShareState {
  currentSocketId: string;

  fileToUpload: File | null;
  currentUpload: File | null;
  currentUploadInfo: FileDescription | null;
  currentDownload: FileDescription | null;
  currentDownloadBuffer: BlobPart[];

  bufferSize: number;

  dataChannelMap: Record<string, RTCDataChannel | null>;
  onChannelConnectedMap: Record<string, (e: RTCDataChannelEvent) => void>;

  fileShareList: Array<FileShareListItem>;
}

type State = IFileShareState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  data() {
    return {
      currentSocketId: "",

      fileToUpload: null,
      currentUpload: null,
      currentUploadInfo: null,
      currentDownload: null,
      currentDownloadBuffer: [],

      bufferSize: 65535,
      dataChannelMap: {},
      onChannelConnectedMap: {},

      fileShareList: [],
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
      const currentDataChannel = this.dataChannelMap?.[receiveSocketId];
      if (currentDataChannel) currentDataChannel?.close();

      this.bufferSize = pcInstance.sctp?.maxMessageSize || 65535;
      const newDataChannel = pcInstance.createDataChannel?.("FileShare", {
        maxRetransmits: 5,
      });
      newDataChannel.binaryType = "arraybuffer";
      newDataChannel.bufferedAmountLowThreshold = this.bufferSize / 2;

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

    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    onChannelStatusChange(event: Event): void {},

    onChannelConnected(e: RTCDataChannelEvent, receiveSocketId: string): void {
      const remoteDataChannel = e.channel;
      if (remoteDataChannel && remoteDataChannel.label === "FileShare") {
        remoteDataChannel.binaryType = "arraybuffer";
        remoteDataChannel.bufferedAmountLowThreshold = this.bufferSize / 2;

        remoteDataChannel.onopen = this.onChannelStatusChange;
        remoteDataChannel.onclose = this.onChannelStatusChange;
        remoteDataChannel.onmessage = this.onRemoteMessage;
        this.$set(this.dataChannelMap, receiveSocketId, remoteDataChannel);
      }
    },

    onRemoteMessage(e: MessageEvent): void {
      console.log(e.data);
      if (typeof e.data === "string") {
        if (this.currentDownload) {
          this.currentDownload = null;
          makeToast("下载错误", "文件下载发生连续性错误", "danger");
          return;
        }
        const data: ISendMsgType = JSON.parse(e.data);
        console.log(data.content);

        switch (data.type) {
          case "shelve": {
            this.fileShareList.push({
              ...data.content,
              shelveTime: Date.now(),
              user: { nickname: this.currentUserRole.nickname },
            });
            break;
          }
          case "unshelve": {
            break;
          }
          case "apply": {
            break;
          }
          default:
            break;
        }
      }
    },

    sendMessage(data: ArrayBuffer | string) {
      Object.keys(this.dataChannelMap).forEach(socketId => {
        const dataChannel = this.dataChannelMap[socketId];
        if (dataChannel?.readyState === "open") {
          dataChannel.send(data as any);
        }
      });
    },

    getFileNameExt(filename: string): string {
      const dotIndex = filename.lastIndexOf(".");
      if (dotIndex < 0) return "";
      return filename.substring(dotIndex + 1);
    },

    date2Text(value: any): string {
      return moment(value).format("HH:mm:ss");
    },

    size2Text(value: number): string {
      const units = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
      let index = 0;
      let nextValue = value / 1024;
      while (nextValue > 1) {
        index++;
        value = nextValue;
        nextValue = value / 1024;
      }
      return `${Math.floor(value * 100) / 100} ${units[index]}`;
    },

    onUploadBtnClick(): void {
      if (this.fileToUpload) {
        this.currentUpload = this.fileToUpload;
        this.fileToUpload = null;
        const currentUploadInfo: FileDescription = {
          lastModified: this.currentUpload.lastModified,
          name: this.currentUpload.name,
          id: uuidv4(),
          size: this.currentUpload.size,
        };
        this.sendMessage(
          JSON.stringify({
            type: "shelve",
            content: currentUploadInfo,
          } as ISendMsgShelve)
        );
      }
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

  .file-share-container {
    @apply py-4;

    flex: 1;
    height: 0;
    display: flex;
    flex-direction: column;
    font-size: @font-size-sm;

    .header {
      @apply px-6;

      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

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
      @apply px-6;

      flex: 1;
      margin-bottom: 6px;
      overflow: hidden auto;

      .list-item {
        margin-bottom: 6px;
        list-style: none;
        .clear();

        .author {
          margin-bottom: 6px;
          color: darkgrey;
        }

        .file {
          display: flex;
          align-items: center;
          padding: 9px 12px 10px;
          background-color: rgba(grey, 25%);
          border-radius: 4px;
          transition: background-color 0.3s;

          &:hover {
            background-color: rgba(darkgrey, 25%);
            color: lightgrey;
            text-decoration: none;
          }

          .icon {
            height: 36px;
            margin-right: 12px;
          }
        }

        .date {
          margin-top: 4px;
          color: grey;
          float: right;
        }
      }
    }

    .upload-area {
      @apply px-10;

      display: flex;
      flex-direction: column;

      .upload-control {
        height: 100px;

        ::v-deep {
          .custom-file-input,
          .custom-file-label {
            height: 100%;
            color: @text-color-lighter;
            border: 1px solid rgb(whitesmoke 0.15);
            background-color: rgba(128, 128, 128, 25%);
            cursor: text;
          }

          .custom-file-label {
            &::after {
              top: auto;
              bottom: 0;
              display: flex;
              align-items: center;
              border-radius: 0.2em;
              cursor: pointer;
              background-color: lightgrey;
              transition: background-color 0.3s;
            }

            &:hover::after {
              background-color: rgba(lightgrey, 0.75);
              box-shadow: 0 0 4px 0 grey;
            }
          }
        }
      }

      .upload-btn {
        margin: 12px 0;

        .btn-icon {
          margin-right: 2px;
          font-size: 16px;
          vertical-align: -4px;
        }
      }
    }

    &:first-child {
      border-bottom: 1px solid rgba(@border-color-base, 0.1);
    }
  }
}
</style>
