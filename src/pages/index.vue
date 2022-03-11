<template>
  <div>
    <Button>111</Button>
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
} from "@nuxtjs/composition-api";

import { Button } from "ant-design-vue";
import socketioService from "@/assets/services/socketio";

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
