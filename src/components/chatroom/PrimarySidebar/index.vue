<template>
  <div class="primary-sidebar-container">
    <TextChatbox :pc-instance="pcInstance" />
  </div>
</template>

<script lang="ts" setup>
import { Component, Prop, Vue } from "vue-property-decorator";
import {
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  reactive,
  PropType,
  Ref,
} from "@nuxtjs/composition-api";

import { defineProps } from "@vue/runtime-dom";
import TextChatbox from "./widgets/TextChatbox.vue";

import socketioService from "~/assets/services/socket-io-client";

defineProps<{
  pcInstance: Ref<RTCPeerConnection | null>;
}>();

onMounted(() => {});
</script>

<style lang="less" scoped>
.primary-sidebar-container {
  @apply h-full;

  width: 320px;
  display: flex;
}
</style>
