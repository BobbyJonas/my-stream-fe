<template>
  <div>
    <Button>111</Button>
    <h1 class="title px-10"><span>vue-nuxt-template2345</span></h1>
    <a href="#" @click="sayHello(1)">12342234322312321</a>
    <blog-index></blog-index>
  </div>
</template>

<script lang="ts" setup>
import { Component, Prop, Vue } from "vue-property-decorator";
import BlogIndex from "./blog/index.vue";

const sayHello = (value: number) => {
  console.log(value);
};

// 非 setup 书写方法
// @Component
// export default class App extends Vue {
//   name = "Simon Zhang";
//   // computed
//   get MyName(): string {
//     return `My name is ${this.name}`;
//   }

//   // methods
//   sayHello(a?: number): void {
//     alert(`Hello ${this.name}`);
//     console.log(12);
//   }

//   mounted() {
//     this.sayHello();
//   }
// }
</script>

<style lang="less" scoped>
.title {
  @apply px-11;

  span {
    font-size: 60px;
  }
}
</style>
