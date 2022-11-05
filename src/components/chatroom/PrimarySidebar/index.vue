<template>
  <b-overlay
    :show="widgetLoading"
    class="primary-sidebar-container-overlay"
    variant="light"
    :opacity="0.65"
    blur=""
    spinner-variant="primary"
    spinner-type="grow"
    spinner-small
  >
    <div class="primary-sidebar-container">
      <VueResizable
        v-show="!widgetLoading"
        class="sidebar-widget-container"
        :width="tabKey ? width : 0"
        :min-width="180"
        :active="tabKey ? ['l'] : []"
        :disable-attributes="['l', 't', 'h']"
        @resize:move="resizeHandler"
      >
        <component
          :is="componentMap[item.name]"
          v-for="item in sidebarWidgetList"
          v-show="tabKey === item.name"
          :key="item.name"
        />
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
  </b-overlay>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState } from "vuex";

import VueResizable from "vue-resizable";

import { BuiltinSidebarWidgetList, ISidebarWidgetItem } from "./utils";

import ChatroomStore from "~/store/chatroom";
import ConnectionStore, { CONNECTION_INIT_STATUS } from "~/store/connection";
import { makeToast, Properties } from "~/assets/utils/common";

export interface IPrimarySidebarState {
  width: number;
  tabKey: string | false;
  componentMap: Record<string, Component>;

  initPromise: Promise<void> | null;
  initResolve: (() => void) | null;
  widgetLoading: boolean;
}

type State = IPrimarySidebarState;

export default Vue.extend({
  components: {
    VueResizable,
  } as Record<string, Component>,

  data() {
    return {
      width: 320,
      tabKey: false,
      componentMap: {},
      initPromise: null,
      initResolve: null,
      widgetLoading: true,
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["currentRoomId", "currentUserRole"] as Array<
      Properties<typeof ChatroomStore>
    >),
    ...mapState("connection", ["currentStep"] as Array<Properties<typeof ConnectionStore>>),

    sidebarWidgetList: () => BuiltinSidebarWidgetList.filter(item => item.enabled),
  },

  watch: {
    currentStep(currentValue) {
      switch (currentValue) {
        case CONNECTION_INIT_STATUS.INIT_SIDEBAR: {
          this.initPromise?.then(() => {
            this.widgetLoading = false;
            this.tabKey = this.sidebarWidgetList[0].name;
            this.setCurrentStep(CONNECTION_INIT_STATUS.INIT_SOCKET);
          });
          break;
        }
        default:
          break;
      }
    },
  },

  created() {
    this.initPromise = new Promise(resolve => {
      let widgetCompletedNum = 0;
      const internalResolve = () => {
        widgetCompletedNum++;
        if (widgetCompletedNum >= this.sidebarWidgetList.length) resolve();
      };
      this.initResolve = internalResolve;
    });

    this.sidebarWidgetList?.forEach(item => {
      this.$set(this.componentMap, item.name, () => import(`./widgets/${item.name}`));
    });

    this.$bus.$on(
      "connection/addWidgetNum",
      this.initResolve ||
        (() => {
          makeToast("发生错误", "组件加载发生错误", "danger");
        })
    );
  },

  methods: {
    ...mapMutations({
      setCurrentStep: "connection/setCurrentStep",
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

    onWidgetListButtonClick(value: ISidebarWidgetItem) {
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

.primary-sidebar-container-overlay {
  @apply h-full;
}

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
