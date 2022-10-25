<template>
  <div class="default-page">
    <nav class="header">
      <h1 class="logo-wrapper">
        <a href="/" class="goto-home">
          <img class="logo" src="~/static/logo.svg" alt="MyStream Logo" />
          <span class="text">MyStream</span>
          <span style="display: none">主页</span>
        </a>
      </h1>
    </nav>
    <Nuxt />
  </div>
</template>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

@header-height: 36px;

.default-page {
  @apply w-screen h-screen;

  position: relative;
  display: flex;
  flex-direction: column;
  font-size: @font-size-base;
  color: @text-color-base;

  .header {
    position: sticky;
    flex-shrink: 0;
    top: 0;
    height: @header-height;
    border-bottom: 1px solid @border-color-base;
    background-color: white;

    .logo-wrapper {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 12px 1px;

      .goto-home {
        display: flex;
        align-items: center;
        white-space: nowrap;
        text-decoration: none;

        .logo {
          height: 25px;
        }

        .text {
          margin-left: 4px;
          padding-bottom: 1px;
          font-size: @font-size-lg;
          font-weight: 100;
        }
      }
    }
  }
}
</style>
