<template>
  <div class="empty-container">
    <div class="empty-content">
      <b-icon class="empty-icon" icon="archive" />
      <p class="empty-label">{{ message }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { PropType } from "@nuxtjs/composition-api";

export interface IEmptyState {}

type State = IEmptyState;

export default Vue.extend({
  components: {} as Record<string, Component>,

  props: {
    message: {
      required: false,
      type: String,
      default: "没有内容",
    },
  },

  data() {
    return {} as State;
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.empty-container {
  @apply w-full h-full;

  display: flex;
  justify-content: center;
  align-items: center;

  .empty-content {
    text-align: center;
    font-size: @font-size-sm;
    color: grey;

    .empty-icon {
      margin-bottom: 8px;
      font-size: @font-size-h1;
    }

    .empty-label {
      color: lightgray;
    }
  }
}
</style>
