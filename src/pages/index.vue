<template>
  <div>
    <Button>111</Button>
    <h1 class="title"><span>vue-nuxt-template2345</span></h1>
    <a href="#" @click="foo1(1, '2')">12342234322312321</a>
  </div>
</template>

<script lang="ts">
import { Button } from "ant-design-vue";
export default {
  components: {
    Button,
  },
  head: {
    title: "MyStream",
    meta: [
      { hid: "keywords", name: "keywords", content: "自定义视频直播" },
      {
        name: "description",
        content: "人人可构建的插件式扩展视频直播平台",
      },
    ],
  },
  methods: {
    handleClick(): void {
      this.foo1(1, 2);
    },
    foo1(a: number, b: number): void {
      let a1 = 1;
      a1 = 2;
      console.log(111);
    },
  },
};
</script>

<style lang="less" scoped>
.title {
  @apply px-11;

  span {
    font-size: 60px;
  }
}
</style>
