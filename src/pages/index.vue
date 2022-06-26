<template>
  <div>这里是首页</div>
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

export default {
  components: {},

  setup() {
    interface IState {
      test: string;
    }

    const state = reactive<IState>({
      test: "首页状态",
    });

    const addTest = () => {
      state.test = "首页状态 - 2";
    };

    onBeforeMount(() => {});

    onUnmounted(() => {});

    return { ...toRefs(state), addTest };
  },
};
</script>

<style lang="less" scoped></style>
