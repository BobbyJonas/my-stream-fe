<template>
  <div class="primary-sidebar-container">
    <VueResizable
      class="sidebar-widget-container"
      :width="tabKey ? width : 0"
      :min-width="180"
      :active="tabKey ? ['l'] : []"
      :disable-attributes="['l', 't', 'h']"
      @resize:move="resizeHandler"
    >
      <TextChatbox v-show="tabKey === 'text-chatbox'" ref="textChatboxRef" />
      <Member v-show="tabKey === 'member'" ref="textChatboxRef" />
    </VueResizable>
    <nav class="sidebar-widget-selector">
      <b-button
        v-for="item in sidebarWidgetList"
        :key="item.name"
        v-b-tooltip.hover.left.v-light.noninteractive
        :title="item.label"
        :pressed="item.name === tabKey"
        squared
        variant="outline-secondary"
        class="widget-toggle-btn"
        @click="onWidgetListButtonClick(item)"
      >
        <b-icon class="btn-icon" :icon="item.icon" />
      </b-button>
    </nav>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState } from "vuex";

import VueResizable from "vue-resizable";
import TextChatbox from "./widgets/TextChatbox.vue";
import Member from "./widgets/Member.vue";

import { SidebarWidgetList } from "./utils";

import ChatroomStore from "~/store/chatroom";
import { Properties } from "~/assets/utils/common";

export interface IPrimarySidebarState {
  width: number;
  tabKey: typeof SidebarWidgetList[number]["name"] | false;
}

type State = IPrimarySidebarState;

export default Vue.extend({
  components: {
    VueResizable,
    TextChatbox,
    Member,
  } as Record<string, Component>,

  data() {
    return {
      width: 320,
      tabKey: SidebarWidgetList[0].name,
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentRoomId", "currentUserRole"] as Array<
      Properties<typeof ChatroomStore>
    >),
    sidebarWidgetList: () => SidebarWidgetList,
  },

  methods: {
    ...mapMutations({
      addCurrentStepProcess: "connection/addCurrentStepProcess",
      removeCurrentStepProcess: "connection/removeCurrentStepProcess",
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

    onWidgetListButtonClick(value: typeof SidebarWidgetList[number]) {
      if (this.tabKey === value.name) {
        this.tabKey = false;
        return;
      }
      this.tabKey = value.name;
    },
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

@sidebar-widget-selector-width: 45px;

.primary-sidebar-container {
  @apply h-full;

  display: flex;

  .sidebar-widget-container {
    width: 320px;
    height: 100%;
    border-left: 1px solid rgba(white, 0.3);

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
            box-shadow: 0 0 0 2px @primary;
          }
        }
      }
    }
  }

  .sidebar-widget-selector {
    width: @sidebar-widget-selector-width;
    background-color: #555;

    .widget-toggle-btn {
      position: relative;
      width: @sidebar-widget-selector-width;
      height: @sidebar-widget-selector-width;
      border: none;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 2px;
        background: none;
      }

      &:active::after {
        background-color: @primary;
      }

      &.active::after {
        background-color: white;
      }
    }
  }
}
</style>
