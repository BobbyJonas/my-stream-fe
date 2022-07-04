<template>
  <div class="app-content">
    <b-icon class="error-icon" icon="exclamation-triangle" />
    <div class="error-text">
      <h1 class="status">{{ error.statusCode }}</h1>
      <h2 class="desc">{{ mapStatusCodeToLabel(error.statusCode) }}</h2>
      <NuxtLink class="link" to="/">返回首页</NuxtLink>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { PropType } from "@nuxtjs/composition-api";
import { statusCodeMap } from "~/assets/utils/common";

export default Vue.extend({
  props: {
    error: {
      required: true,
      type: Object as PropType<{ statusCode: number; message: string }>,
    },
  },
  methods: {
    mapStatusCodeToLabel(statusCode: number): string {
      return statusCodeMap[statusCode] || "服务器错误";
    },
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.app-content {
  @apply w-screen h-screen;

  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 20px;
  font-size: @font-size-base;
  color: @text-color-base;
  background-color: #f1f7ff;
  overflow: hidden;

  .error-icon {
    margin-right: 1.6rem;
    font-size: 8rem;
    font-weight: 100;
    color: #758296;
  }

  .error-text {
    padding-bottom: 8px;

    .status {
      margin-bottom: 1rem;
      font-size: 3.5rem;
      font-weight: 300;
    }

    .desc {
      margin-bottom: 0.4rem;
    }
  }
}
</style>
