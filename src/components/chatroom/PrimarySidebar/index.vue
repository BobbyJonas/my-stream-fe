<template>
  <div class="primary-sidebar-container">
    <TextChatbox />
  </div>
</template>

<script lang="ts" setup>
import { Component, Prop, Vue } from "vue-property-decorator";
import { onBeforeMount, onMounted, onUnmounted, ref, reactive } from "@nuxtjs/composition-api";

import TextChatbox from "./widgets/TextChatbox.vue";

import socketioService from "~/assets/services/socket-io-client";

onMounted(() => {});
</script>

<style lang="less" scoped>
.primary-sidebar-container {
  @apply h-full;

  width: 320px;
  display: flex;
}
</style>
