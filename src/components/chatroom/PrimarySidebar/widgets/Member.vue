<template>
  <div class="widget-container">
    <dl class="member-container">
      <dt class="title">用户</dt>
      <dd class="member">
        {{ currentUserRole ? currentUserRole.nickname : "" }}
        <span class="current">(此用户)</span>
      </dd>
      <dd
        v-for="(item, index) in memberList"
        :key="item.socketId"
        :class="['member', { 'member--offline': !item.online }]"
      >
        {{ item.nickname }}
      </dd>
    </dl>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import moment from "moment";
import qs from "qs";

import { mapActions, mapMutations, mapState } from "vuex";

import type { AxiosResponse } from "axios";
import type { IConnectionModel } from "~/api/modules/mongodb/models/connection";
import type { IUserModel } from "~/api/modules/mongodb/models/user";

import ChatroomStore from "~/store/chatroom";
import { makeToast, Properties } from "~/assets/utils/common";

type IConnectionPopulateModel = Omit<IConnectionModel, "userId"> & { userId: IUserModel };

export interface IMemberState {
  memberMap: Record<string, boolean>;
  memberList: Array<IUserModel & { socketId: string; online: boolean }>;
}

type State = IMemberState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  data() {
    return {
      memberMap: {},
      memberList: [],
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentUserRole", "currentRoomId"] as Array<
      Properties<typeof ChatroomStore>
    >),
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
    createDataChannel(pcInstance: RTCPeerConnection, receiveSocketId: string, next: () => void) {
      this.addMember(receiveSocketId);
      next();
    },

    removeDataChannel({ from }: { from: string }): void {
      this.removeMember(from);
    },

    addMember(receiveSocketId: string): void {
      this.$set(this.memberMap, receiveSocketId, true);
      this.$axios
        .get(
          `/db/connection${qs.stringify({ socketId: receiveSocketId }, { addQueryPrefix: true })}`
        )
        .then((res: AxiosResponse<IConnectionPopulateModel[]>) => {
          const [data] = res.data || [];
          const findIndex = this.memberList.findIndex(
            item => item._id === data.userId._id && !item.online
          );
          if (findIndex >= 0) {
            this.$set(this.memberList, findIndex, {
              ...this.memberList[findIndex],
              socketId: receiveSocketId,
              online: true,
            });
          } else {
            this.memberList.push({ ...data.userId, socketId: receiveSocketId, online: true });
          }
          console.log(this.memberList);
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
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.widget-container {
  @apply w-full h-full;

  display: flex;
  flex-direction: column;
  color: @text-color-lighter;
  background-color: rgb(white 0.25);
  overflow: hidden;

  .member-container {
    @apply px-5 py-4;

    font-size: @font-size-sm;

    .title {
      margin-bottom: 8px;
    }

    .member {
      margin-bottom: 4px;

      &::before {
        content: "";
        display: inline-block;
        width: 4px;
        height: 4px;
        margin-right: 4px;
        border-radius: @border-radius-infinite;
        background-color: @color-success;
        vertical-align: 3px;
      }

      &--offline::before {
        background-color: gray;
      }
    }
  }
}
</style>
