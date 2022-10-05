<template>
  <div class="chatroom-new">
    <h3 class="main-title">选择一个用户角色以开始</h3>
    <h4 v-if="!ifUserRoleExists" class="no-role-hint">
      <b-icon class="icon-no-role" icon="person-x" /><span class="content"
        >当前没有用户角色，请创建一个</span
      >
    </h4>
    <b-overlay :show="loading" rounded="sm">
      <div class="new-role-container">
        <aside class="avatar-container"></aside>
        <div class="new-role-form">
          <h4 class="form-title">填写角色信息</h4>
          <b-form @submit="onSubmit" @reset="onReset">
            <b-form-group
              id="input-group-1"
              label="电子邮箱: "
              label-for="input-1"
              description="系统不会与其他人分享邮箱地址"
            >
              <b-form-input
                id="input-1"
                v-model="userInfoForm.email"
                type="email"
                placeholder="输入电子邮箱地址"
                required
              />
            </b-form-group>

            <b-form-group id="input-group-2" label="你的昵称: " label-for="input-2">
              <b-form-input
                id="input-2"
                v-model="userInfoForm.nickname"
                placeholder="输入昵称"
                required
              />
            </b-form-group>

            <div class="form-operation">
              <b-button type="reset" variant="outline-secondary">清空表单</b-button>
              <b-button type="submit" class="btn-add" variant="outline-primary">
                <b-icon class="icon-plus" icon="person-plus" />
                <span>添加</span>
              </b-button>
            </div>
          </b-form>
        </div>
      </div>
    </b-overlay>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";

export interface IUserInfoForm {
  email: string;
  nickname: string;
}

export interface IChatroomNewState {
  ifUserRoleExists: boolean;
  userInfoForm: IUserInfoForm;
  userRoleArray: Array<IUserInfoForm>;
  loading: boolean;
}

export default Vue.extend({
  components: {} as Record<string, Component>,

  layout: "default",

  data() {
    return {
      ifUserRoleExists: true,
      userInfoForm: {
        email: "",
        nickname: "",
      },
      userRoleArray: [],
      loading: false,
    } as IChatroomNewState;
  },

  beforeMount() {
    this.ifUserRoleExists = !!window.localStorage["user-role"];
  },

  beforeDestroy() {},

  methods: {
    onSubmit(event: FormDataEvent) {
      if (this.loading) return;
      this.loading = true;
      event.preventDefault();

      this.$axios
        .post("/db/user", { ...this.userInfoForm })
        .then(res => {
          if (res.status === 200) {
            (this as any)?.$bvToast?.toast(`用户 ${this.userInfoForm.nickname} 已成功添加`, {
              title: "添加成功",
              variant: "success",
              solid: true,
            });
            this.userInfoForm.email = "";
            this.userInfoForm.nickname = "";
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },

    onReset(event: FormDataEvent) {
      event.preventDefault();
      this.userInfoForm.email = "";
      this.userInfoForm.nickname = "";
    },
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

@header-height: 36px;

.chatroom-new {
  @apply w-full;

  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 42px 0;
  background-color: #f1f7ff;

  h3 {
    @apply text-4xl font-bold;
  }

  h4 {
    @apply text-2xl font-medium;
  }

  .main-title {
    margin-bottom: 20px;
  }

  .no-role-hint {
    margin-bottom: 16px;
    font-weight: normal;
    text-align: center;
    color: #666;

    .icon-no-role {
      margin-right: 10px;
      font-weight: 100;
      color: #bbb;
      vertical-align: middle;
      @apply text-5xl;
    }
  }

  .new-role-container {
    display: flex;
    align-items: flex-start;
    margin-top: 24px;

    .avatar-container {
      display: block;
      width: 108px;
      height: 108px;
      margin-right: 32px;
      background-color: rgb(black 0.05);
      border-radius: @border-radius-infinite;
    }

    .new-role-form {
      width: 40vw;
      max-width: 380px;
      margin-right: 12px;

      .form-title {
        margin-bottom: 12px;
      }

      .form-operation {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;

        .btn-add {
          .icon-plus {
            margin-right: 2px;
            vertical-align: -3px;
          }
        }
      }
    }
  }
}
</style>
