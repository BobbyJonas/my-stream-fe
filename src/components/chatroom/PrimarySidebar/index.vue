<template>
  <VueResizable
    class="primary-sidebar-resizable"
    :width="width"
    :active="['l']"
    :disable-attributes="['l', 't', 'h']"
    @resize:move="resizeHandler"
  >
    <div class="primary-sidebar-container">
      <TextChatbox ref="textChatboxRef" />
    </div>
  </VueResizable>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState } from "vuex";

import VueResizable from "vue-resizable";
import TextChatbox from "./widgets/TextChatbox.vue";

import ChatroomStore from "~/store/chatroom";

import { Properties } from "~/assets/utils/common";

export interface IPrimarySidebarState {
  width: number;
}

type State = IPrimarySidebarState;

export default Vue.extend({
  components: {
    VueResizable,
    TextChatbox,
  } as Record<string, Component>,

  data() {
    return {
      width: 360,
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentRoomId", "currentUserRole"] as Array<
      Properties<typeof ChatroomStore>
    >),
  },

  methods: {
    ...mapMutations({
      addCurrentStepProcess: "chatroom/addCurrentStepProcess",
      removeCurrentStepProcess: "chatroom/removeCurrentStepProcess",
    }),

    resizeHandler(data: {
      left: number;
      top: number;
      width: number;
      height: number;
      eventName: string;
    }) {
      this.width = data.width;
    },
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.primary-sidebar-resizable {
  width: 360px;

  ::v-deep {
    .resizable-l {
      cursor: col-resize;

      &::after {
        content: "";
        position: absolute;
        left: 50%;
        height: 100%;
        width: 0;
        transform: translateX(-50%);
        transition: box-shadow 0.3s;
      }

      &:hover {
        &::after {
          box-shadow: 0 0 0 2.5px @primary;
        }
      }
    }
  }
}

.primary-sidebar-container {
  @apply w-full h-full;

  display: flex;
}
</style>
