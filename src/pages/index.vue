<template>
  <div>
    <b-alert show> 23</b-alert>
    <b-button>1123 下一步 2</b-button>
    <h1 class="title px-10"><span>vue-nuxt-template2345</span></h1>
    <a href="#" @click="sayHello(1)">12342234322312321</a>
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
} from "@nuxtjs/composition-api";

import socketioService from "~/assets/services/socket-io";

const sayHello = (value: number) => {
  console.log(value);
};

onBeforeMount(() => {
  console.log("beforeMount");
  socketioService.setupSocketConnection();
});

onUnmounted(() => {
  socketioService.disconnect();
  console.log("unmounted");
});
</script>

<style lang="less" scoped>
.title {
  @apply px-11;

  span {
    font-size: 60px;
  }
}
</style>
