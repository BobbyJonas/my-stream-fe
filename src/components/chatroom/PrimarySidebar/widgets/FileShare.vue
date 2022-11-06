<template>
  <div class="widget-container">
    <div v-if="!uploadComplete || !downloadComplete" :style="{ padding: '1rem 1.5rem' }">
      <b-progress
        v-if="!uploadComplete"
        :value="uploadOffset"
        :max="currentUploadInfo ? currentUploadInfo.size : Infinity"
        show-progress
        animated
      />
      <b-progress
        v-if="!downloadComplete"
        :value="downloadOffset"
        :max="currentDownloadInfo ? currentDownloadInfo.size : Infinity"
        show-progress
        animated
      />
    </div>
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
      <dd v-if="fileShareList && fileShareList.length > 0" class="file-list">
        <div v-for="item in fileShareList" :key="item.id" class="list-item">
          <h5 class="author">{{ item.user && item.user.nickname ? item.user.nickname : "" }}</h5>
          <a
            class="file"
            href="javascript: void(0)"
            role="button"
            :tabindex="0"
            @click="!item.invalid && onApplyDownload(item)"
          >
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
      <Empty v-else icon="folder2-open" message="没有来自成员的共享文件" />
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
      <dd class="file-list">
        <div v-if="currentUploadInfo" class="list-item">
          <a class="file" href="javascript: void(0)" role="button" :tabindex="0">
            <img
              class="icon"
              :src="`/icon/file/${getFileNameExt(currentUploadInfo.name)}.svg`"
              alt="ext-icon"
            />
            <div class="info">
              <p class="name">{{ currentUploadInfo.name }}</p>
              <span :style="{ display: 'none' }"> - </span>
              <p>{{ size2Text(currentUploadInfo.size) }}</p>
            </div>
          </a>
          <p class="date">{{ date2Text(currentUploadInfo.shelveTime) }}</p>
        </div>
        <Empty v-else icon="file-earmark-break" message="你没有设置共享文件" />
      </dd>
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
import Empty from "@/components/common/Empty.vue";

import { makeToast, Properties } from "~/assets/utils/common";
import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";
import type { IUserModel } from "~/api/modules/mongodb/models/user";

export interface FileDescription {
  id: string;
  lastModified: number;
  name: string;
  size: number;
  from: string;
}

export type FileShareListItem = FileDescription & {
  user?: Partial<IUserModel>;
  shelveTime: number;
  invalid?: boolean;
};

// 向现有成员，展示文件信息
export interface ISendMsgShelve {
  type: "shelve";
  content: FileShareListItem;
  from: string;
}

// 告知成员，现有文件取消展示
export interface ISendMsgUnshelve {
  type: "unshelve";
  content: {
    id: string;
  };
  from: string;
}

// 申请文件下载
export interface ISendMsgApply {
  type: "apply";
  content: {
    id: string;
  };
  from: string;
}

// 拒绝文件下载
export interface ISendMsgDeny {
  type: "deny";
  content: {
    id: string;
  };
  from: string;
}

export type ISendMsgType = ISendMsgShelve | ISendMsgUnshelve | ISendMsgApply | ISendMsgDeny;

export interface IFileShareState {
  currentSocketId: string;

  fileToUpload: File | null;
  currentUploadFile: File | null;
  currentUploadInfo: FileShareListItem | null;
  uploadOffset: number;
  uploadComplete: boolean;

  currentDownloadInfo: FileDescription | null;
  currentDownloadBuffer: BlobPart[];
  downloadOffset: number;
  downloadComplete: boolean;

  dataChannelMap: Record<string, RTCDataChannel | null>;
  onChannelConnectedMap: Record<string, (e: RTCDataChannelEvent) => void>;

  fileShareList: Array<FileShareListItem>;
}

type State = IFileShareState;

export default Vue.extend({
  components: {
    Empty,
  } as Record<string, Component>,

  data() {
    return {
      currentSocketId: "",

      fileToUpload: null,
      currentUploadFile: null,
      currentUploadInfo: null,
      uploadOffset: 0,

      uploadComplete: true,

      currentDownloadInfo: null,
      currentDownloadBuffer: [],
      downloadOffset: 0,
      downloadComplete: true,

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

      const newDataChannel = pcInstance.createDataChannel?.("FileShare");
      newDataChannel.binaryType = "arraybuffer";

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
      if (!this.downloadComplete && from === this.currentDownloadInfo?.from) {
        makeToast("下载发生错误", "远程用户已下线", "danger");
        this.downloadComplete = true;
        this.currentDownloadInfo = null;
      }
      if (!this.uploadComplete && from === this.currentUploadInfo?.from) {
        makeToast("上传发生错误", "远程用户已下线", "danger");
        this.uploadComplete = true;
        this.currentUploadInfo = null;
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    onChannelStatusChange(event: Event): void {},

    onChannelConnected(e: RTCDataChannelEvent, receiveSocketId: string): void {
      const remoteDataChannel = e.channel;
      if (remoteDataChannel && remoteDataChannel.label === "FileShare") {
        remoteDataChannel.binaryType = "arraybuffer";

        remoteDataChannel.onopen = this.onChannelStatusChange;
        remoteDataChannel.onclose = this.onChannelStatusChange;
        remoteDataChannel.onmessage = this.onRemoteMessage;
        this.$set(this.dataChannelMap, receiveSocketId, remoteDataChannel);
      }
    },

    onRemoteMessage(e: MessageEvent): void {
      if (typeof e.data === "string") {
        const data: ISendMsgType = JSON.parse(e.data);

        switch (data.type) {
          case "shelve": {
            this.fileShareList.push({
              ...data.content,
              shelveTime: data.content.shelveTime,
              user: { nickname: this.currentUserRole.nickname },
            });
            break;
          }
          case "unshelve": {
            if (!this.downloadComplete && data.from === this.currentDownloadInfo?.from) {
              this.currentDownloadInfo = null;
              this.currentDownloadBuffer = [];
              makeToast("下载错误", "文件下载发生连续性错误", "danger");
            }
            const fileIndex = this.fileShareList?.findIndex(item => item.id === data.content.id);
            if (fileIndex >= 0) {
              this.$set(this.fileShareList, fileIndex, {
                ...this.fileShareList[fileIndex],
                invalid: true,
              });
            }
            break;
          }
          case "apply": {
            if (!this.downloadComplete || !this.uploadComplete) {
              makeToast("警告", "当前存在文件传输任务，已自动拒绝用户申请文件传输", "warning");
              this.sendMessage(
                JSON.stringify({
                  type: "deny",
                  content: { id: data.content.id },
                  from: this.currentSocketId,
                } as ISendMsgDeny),
                data.from
              );
              break;
            }
            if (data.content.id === this.currentUploadInfo?.id) {
              this.uploadComplete = false;
              this.uploadOffset = 0;
              this.startUpload(data.from);
            } else {
              // 请求文件 id 不存在
              this.sendMessage(
                JSON.stringify({
                  type: "deny",
                  content: { id: data.content.id },
                  from: this.currentSocketId,
                } as ISendMsgDeny),
                data.from
              );
            }
            break;
          }
          case "deny": {
            this.currentDownloadBuffer = [];
            this.downloadOffset = 0;
            this.downloadComplete = true;
            makeToast("错误", "用户拒绝下载请求", "warning");
            break;
          }
          default:
            break;
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (!this.currentDownloadInfo || this.downloadComplete) {
          makeToast("下载错误", "文件下载发生连续性错误", "danger");
        } else {
          this.startDownload(e.data);
        }
      }
    },

    sendMessage(data: ArrayBuffer | string, to?: string) {
      if (!to) {
        Object.keys(this.dataChannelMap).forEach(socketId => {
          const dataChannel = this.dataChannelMap[socketId];
          if (dataChannel?.readyState === "open") {
            dataChannel.send(data as any);
          }
        });
      } else {
        const dataChannel = this.dataChannelMap[to];
        if (dataChannel?.readyState === "open") {
          dataChannel.send(data as any);
        }
      }
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

    /** 按钮点击 */

    onUploadBtnClick(): void {
      if (this.fileToUpload) {
        this.currentUploadFile = this.fileToUpload;
        this.currentUploadInfo = {
          lastModified: this.currentUploadFile.lastModified,
          name: this.currentUploadFile.name,
          id: uuidv4(),
          size: this.currentUploadFile.size,
          from: this.currentSocketId,
          shelveTime: Date.now(),
        };
        this.fileToUpload = null;
        this.sendMessage(
          JSON.stringify({
            type: "shelve",
            content: this.currentUploadInfo,
            from: this.currentSocketId,
          } as ISendMsgShelve)
        );
      }
    },

    onApplyDownload(item: FileShareListItem): void {
      if (!this.downloadComplete || !this.uploadComplete) {
        makeToast("警告", "请先等待当前传输任务完成之后再进行下载", "warning");
        return;
      }
      this.sendMessage(
        JSON.stringify({
          type: "apply",
          content: { id: item.id },
          from: this.currentSocketId,
        } as ISendMsgApply),
        item.from
      );
      this.currentDownloadInfo = { ...item };
      this.currentDownloadBuffer = [];
      this.downloadOffset = 0;
      this.downloadComplete = false;
    },

    /** 上传进程 */

    onUploadFailed(): void {},

    startUpload(to: string): void {
      const file = this.currentUploadFile;
      const pcInstance = window.__MY_STREAM__.$pcInstanceMap[to];
      const dataChannel = this.dataChannelMap[to];

      if (!file || !(dataChannel?.readyState === "open")) {
        makeToast("发生错误", "文件或接口不存在", "danger");
        return;
      }

      const fileReader = new FileReader();
      const bufferSize = pcInstance?.sctp?.maxMessageSize || 65535;
      dataChannel.bufferedAmountLowThreshold = bufferSize / 2;

      this.uploadOffset = 0;

      const nextSlice = (currentOffset: number) => {
        const slice = file.slice(this.uploadOffset, currentOffset + bufferSize);
        fileReader.readAsArrayBuffer(slice);
      };

      fileReader.onload = e => {
        if (this.uploadComplete) return;
        const buffer = e.target!.result as ArrayBuffer;

        try {
          this.sendMessage(buffer, to);
        } catch {
          this.onUploadFailed();
          return;
        }
        this.uploadOffset += buffer.byteLength;

        if (this.uploadOffset >= file.size) {
          this.uploadComplete = true;
          makeToast("传输完成", `文件 ${this.currentUploadInfo?.name || ""} 已传输完成`, "success");
        } else if (dataChannel.bufferedAmount < bufferSize / 2) {
          nextSlice(this.uploadOffset);
        }
      };

      dataChannel.onbufferedamountlow = () => nextSlice(this.uploadOffset);

      nextSlice(0);
    },

    /** 下载进程 */

    onDownloadFailed(): void {},

    startDownload(data: ArrayBuffer): void {
      this.currentDownloadBuffer.push(data);
      this.downloadOffset += data.byteLength;

      if (!this.currentDownloadInfo?.size) {
        this.downloadComplete = true;
        this.currentDownloadInfo = null;
        return;
      }

      if (this.downloadOffset >= this.currentDownloadInfo.size) {
        makeToast("下载完成", `文件 ${this.currentDownloadInfo.name} 已成功下载`, "success");
        this.downloadComplete = true;
        const blob = new Blob(this.currentDownloadBuffer);
        const blobUrl = URL.createObjectURL(blob);

        const element = document.createElement("a");
        element.setAttribute("href", blobUrl);
        element.setAttribute("download", this.currentDownloadInfo.name);

        element.style.display = "none";
        element.click();

        this.currentDownloadInfo = null;
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
