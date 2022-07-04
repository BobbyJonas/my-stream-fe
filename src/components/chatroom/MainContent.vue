<template>
  <div class="primary-content-container">1</div>
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
  flex: 1;
  width: 0;
  height: 100%;
}
</style>
