<template>
  <div class="main-content-container"></div>
</template>

<script lang="ts" setup>
import { Component, Prop, Vue } from "vue-property-decorator";
import {
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  reactive,
  defineComponent,
} from "@nuxtjs/composition-api";
import socketioService from "~/assets/services/socket-io";
</script>

<style lang="less" scoped>
.primary-content-container {
  @apply px-10;
}
</style>
