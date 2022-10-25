<template>
  <div class="app-content">
    <Nuxt />
  </div>
</template>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

.app-content {
  @apply w-screen h-screen;

  position: relative;
  display: flex;
  font-size: @font-size-base;
  color: @text-color-base;
  overflow: hidden;
}
</style>
