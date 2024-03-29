<template>
  <div class="chatroom-wrapper">
    <ChatroomContent v-if="available" />
    <div v-else class="chatroom-unavailable-content">
      <div class="content-icon">
        <b-icon icon="file-break"></b-icon>
      </div>
      <div class="content-main">
        <h3 class="title">聊天已退出</h3>
        <b-button variant="outline-primary" size="lg" @click="onGlobalEnterRoom">重新进入</b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import _ from "lodash";

import { mapMutations, mapState } from "vuex";

import ChatroomContent from "~/components/chatroom/index.vue";

import ChatroomStore from "~/store/chatroom";
import type { IUserModel } from "~/api/modules/mongodb/models/user";

import { makeToast, Properties } from "~/assets/utils/common";

export interface IChatroomPageState {
  available: boolean;
}
type State = IChatroomPageState;

export default Vue.extend({
  components: {
    ChatroomContent,
  } as Record<string, Component>,

  layout: "app",
  middleware: "chatroom-auth",

  data() {
    return {
      available: true,
    } as State;
  },

  created() {
    this.$bus.$on("global/exit", this.onGlobalExitRoom);
  },

  beforeMount() {
    window.__MY_STREAM__ = _.defaultsDeep(
      { $store: this?.$store, $bus: this?.$bus },
      window.__MY_STREAM__ || {}
    );

    this.setCurrentRoomId(this.$route.params?.id);

    const storageCurrentRole: string = window.localStorage["current-role"];
    if (storageCurrentRole) {
      const currentRoleObj: IUserModel = JSON.parse(storageCurrentRole);
      this.setCurrentUserRole(currentRoleObj);
    }
  },

  beforeDestroy() {
    this.setCurrentRoomId(undefined);

    this.$bus.$off("global/exit");
  },

  methods: {
    ...(mapMutations({
      setCurrentUserRole: "chatroom/setCurrentUserRole",
      setCurrentRoomId: "chatroom/setCurrentRoomId",
    }) as {
      [x in Properties<typeof ChatroomStore>]: ChatroomStore[x];
    }),

    onGlobalExitRoom(): void {
      this.available = false;
    },

    onGlobalEnterRoom(): void {
      this.available = true;
    },
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.chatroom-wrapper {
  @apply w-full h-full;

  .chatroom-unavailable-content {
    @apply w-full h-full;

    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 12px;
    background-color: #f1f7ff;

    .content-icon {
      margin-right: 24px;
      font-size: 78px;
      color: rgba(black, 0.3);
    }

    .content-main {
      .title {
        margin-bottom: 16px;
        font-size: @font-size-h2;
        font-weight: 600;
      }
    }
  }
}
</style>
