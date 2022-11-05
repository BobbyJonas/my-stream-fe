<template>
  <b-overlay
    :show="isLoading"
    class="widget-container-overlay"
    variant="light"
    :opacity="0.65"
    blur=""
    spinner-variant="primary"
    spinner-type="grow"
    spinner-small
  >
    <div class="widget-container">
      <dl class="member-container">
        <dt class="member-header">
          <h4 class="title">用户</h4>
          <b-button
            v-b-tooltip.hover.left.v-secondary.noninteractive
            title="刷新列表"
            class="refresh-btn"
            @click="
              () => {
                if (isLoading) return;
                memberList = [];
                addMember();
              }
            "
          >
            <b-icon class="btn-icon" icon="arrow-repeat"></b-icon>
          </b-button>
        </dt>
        <dd
          v-for="item in memberList"
          :key="item.socketId"
          :class="['member', { 'member--offline': !item.online }]"
        >
          <span class="name">{{ item.nickname }}</span>
          <span v-if="item.socketId === currentSocketId" class="current">(此用户)</span>
          <span class="time">{{ item.online ? date2Text(item.time) : "下线" }}</span>
        </dd>
      </dl>
    </div>
  </b-overlay>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import moment from "moment";
import "moment/locale/zh-cn";
import qs from "qs";

import { mapState } from "vuex";

import type { AxiosResponse } from "axios";
import socketioService from "~/assets/services/socket-io-client";
import type { IConnectionModel } from "~/api/modules/mongodb/models/connection";
import type { IUserModel } from "~/api/modules/mongodb/models/user";

import { Properties } from "~/assets/utils/common";
import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";

type IConnectionPopulateModel = Omit<IConnectionModel, "userId"> & { userId: IUserModel };
type IMemberItem = IUserModel & { time: number; socketId: string; online: boolean };

export interface IMemberState {
  isLoading: boolean;
  memberMap: Record<string, boolean>;
  memberList: Array<IMemberItem>;
  currentSocketId: string;
}

type State = IMemberState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  data() {
    return {
      isLoading: false,
      memberMap: {},
      memberList: [],
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
            this.addMember(socketioService.socket.id);
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
    this.$bus.$emit("connection/addWidgetNum", "Member");
  },

  beforeDestroy() {
    this.$bus.$emit("connection/removeWidgetNum", "Member");
  },

  methods: {
    createDataChannel(pcInstance: RTCPeerConnection, receiveSocketId: string, next: () => void) {
      this.addMember(receiveSocketId);
      next();
    },

    removeDataChannel({ from }: { from: string }): void {
      this.removeMember(from);
    },

    addMember(receiveSocketId?: string): void {
      this.isLoading = true;
      if (receiveSocketId) this.$set(this.memberMap, receiveSocketId, true);
      this.$axios
        .get(
          `/db/connection${
            receiveSocketId
              ? qs.stringify({ socketId: receiveSocketId }, { addQueryPrefix: true })
              : ""
          }`
        )
        .then((res: AxiosResponse<IConnectionPopulateModel[]>) => {
          const dataList = res.data || [];
          const socketIdMap: Record<string, boolean> = {};
          const userIdMap: Record<string, Array<number>> = {};

          this.memberList.forEach((item, index) => {
            socketIdMap[item.socketId] = true;
            if (!item.online) {
              if (!userIdMap[item._id]) userIdMap[item._id] = [];
              userIdMap[item._id].push(index);
            }
          });

          dataList.forEach(data => {
            const findIndex = userIdMap[data.userId._id]?.[0] ?? -1;
            if (findIndex >= 0) {
              userIdMap[data.userId._id].shift();
              this.$set(this.memberList, findIndex, {
                ...this.memberList[findIndex],
                socketId: data.socketId,
                time: data.time,
                online: true,
              });
            } else if (!socketIdMap[data.socketId]) {
              socketIdMap[data.socketId] = true;
              this.memberList.push({
                ...data.userId,
                time: data.time,
                socketId: data.socketId,
                online: true,
              });
            }
          });

          const currentUser: Array<IMemberItem> = [];
          const onlineList: Array<IMemberItem> = [];
          const offlineList: Array<IMemberItem> = [];
          this.memberList.forEach(item => {
            if (item.socketId === socketioService.socket?.id) {
              currentUser.push(item);
              return;
            }
            if (item.online) onlineList.push(item);
            else offlineList.push(item);
          });
          this.$set(this, "memberList", [...currentUser, ...onlineList, ...offlineList]);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    removeMember(receiveSocketId: string): void {
      this.$delete(this.memberMap, receiveSocketId);
      const findIndex = this.memberList.findIndex(item => item.socketId === receiveSocketId);
      if (findIndex >= 0) {
        this.$set(this.memberList, findIndex, {
          ...this.memberList[findIndex],
          online: false,
        });
      }
    },

    date2Text(value: Date | number): string {
      return moment(value).fromNow();
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

  .member-container {
    @apply px-6 py-4;

    font-size: @font-size-sm;

    .member-header {
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

    .member {
      margin-bottom: 6px;

      &::before {
        content: "";
        display: inline-block;
        width: 4px;
        height: 4px;
        margin-right: 8px;
        border-radius: @border-radius-infinite;
        background-color: @color-success;
        vertical-align: 3px;
      }

      &--offline::before {
        background-color: gray;
      }

      .current {
        margin-left: 2px;
        color: darkgray;
      }

      .time {
        float: right;
        color: gray;
      }
    }
  }
}
</style>
