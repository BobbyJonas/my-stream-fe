<template>
  <div class="chatroom-content">
    <MainContent></MainContent>
    <PrimarySidebar></PrimarySidebar>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import {
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  reactive,
  defineComponent,
  toRefs,
} from "@nuxtjs/composition-api";

import socketioService from "~/assets/services/socket-io";

import MainContent from "~/components/chatroom/MainContent.vue";
import PrimarySidebar from "~/components/chatroom/PrimarySidebar.vue";

export default {
  components: {
    PrimarySidebar,
    MainContent,
  },
  layout: "app",
  setup() {
    interface IState {
      test: string;
    }

    const state = reactive<IState>({
      test: "1",
    });

    const addTest = () => {
      state.test += "1";
    };

    onBeforeMount(() => {
      socketioService.setupSocketConnection();
    });

    onUnmounted(() => {
      socketioService.disconnect();
    });

    return { ...toRefs(state), addTest };
  },
};
</script>

<style lang="less" scoped></style>
