<template>
  <div class="primary-sidebar-container">
    <TextChatbox ref="textChatboxRef" :pc-instance-map="pcInstanceMap" />
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
} from "@nuxtjs/composition-api";

import { defineProps } from "@vue/runtime-dom";
import TextChatbox from "./widgets/TextChatbox.vue";

const textChatboxRef = ref<InstanceType<typeof TextChatbox> | null>(null);

defineProps<{
  pcInstanceMap: Record<string, RTCPeerConnection | null>;
}>();

const addLocalChannelToPeer = (pcInstance: RTCPeerConnection, receiveSocketId: string) => {
  textChatboxRef.value?.createDataChannel(pcInstance, receiveSocketId);
};

const removeLocalChannelFromPeer = (args: { from: string }) => {
  textChatboxRef.value?.removeDataChannel(args);
};

defineExpose({
  addLocalChannelToPeer,
  removeLocalChannelFromPeer,
});

onMounted(() => {});
</script>

<style lang="less" scoped>
.primary-sidebar-container {
  @apply h-full;

  width: 320px;
  display: flex;
}
</style>
