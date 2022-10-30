<template>
  <div class="chatroom-new">
    <h3 class="main-title">选择一个用户角色以开始</h3>
    <h4 v-if="!ifUserRoleExists" class="no-role-hint">
      <b-icon class="icon-no-role" icon="person-x" />
      <span class="content">当前没有用户角色，请创建一个</span>
    </h4>
    <b-overlay
      :show="loading"
      variant="light"
      blur=""
      rounded="sm"
      :opacity="0.65"
      :style="{ width: '100%' }"
    >
      <div v-if="currentAddUser" class="new-role-container">
        <aside class="avatar-container"></aside>
        <div class="new-role-form">
          <h4 class="form-title">填写角色信息</h4>
          <b-form @submit="onSubmitUserInfo" @reset="onResetUserInfo">
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
              <b-button
                variant="outline-secondary"
                @click="
                  () => {
                    onResetUserInfo();
                    currentAddUser = false;
                  }
                "
              >
                <b-icon class="btn-icon" icon="arrow-left" />
                <span>返回</span>
              </b-button>
              <b-button type="submit" class="btn-add" variant="outline-primary">
                <b-icon class="btn-icon" icon="person-plus" />
                <span>添加</span>
              </b-button>
            </div>
          </b-form>
        </div>
      </div>
      <div v-else class="role-list">
        <h4 class="list-title">当前用户角色</h4>
        <ul class="list-wrapper">
          <li
            v-for="(item, index) in userRoleList"
            :key="index"
            role="button"
            :tabindex="0"
            :class="['card-item', { 'card-item--active': selectRoleIndex === index }]"
            @keypress.enter="onRoleCardClick(index)"
            @click="onRoleCardClick(index)"
          >
            <div class="card-avatar"></div>
            <p class="card-name">{{ item.nickname }}</p>
            <div class="card-delete" @click="onDeleteCardClick($event, index)">
              <b-icon class="btn-icon" icon="trash" />
            </div>
          </li>
          <li
            class="card-item card-add"
            role="button"
            :tabindex="0"
            @keypress.enter="onAddCardClick()"
            @click="onAddCardClick()"
          >
            <b-icon class="icon-plus" icon="plus-circle" />
          </li>
        </ul>
        <b-button
          pill
          size="lg"
          variant="primary"
          :disabled="selectRoleIndex < 0"
          class="btn-add-chatroom"
          @click="onCreateChatroom"
        >
          <b-icon class="btn-icon" icon="chat-left" />
          <span>创建聊天室</span>
        </b-button>
      </div>
    </b-overlay>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from "vue";
import { mapMutations, mapState } from "vuex";
import { v4 as uuidv4 } from "uuid";

import type { IUserModel } from "~/api/modules/mongodb/models/user";
import ChatroomStore from "~/store/chatroom";
import type { Properties } from "~/assets/utils/common";

export interface IChatroomNewState {
  ifUserRoleExists: boolean;
  userInfoForm: Partial<IUserModel>;
  userRoleList: Array<IUserModel>;
  loading: boolean;
  currentAddUser: boolean;
  selectRoleIndex: number;
}

type State = IChatroomNewState;

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
      userRoleList: [],
      loading: false,
      currentAddUser: false,
      selectRoleIndex: -1,
    } as State;
  },

  computed: {
    ...mapState("chatroom", ["initReady", "currentUserRole"] as Array<
      Properties<typeof ChatroomStore>
    >),
  },

  beforeMount() {
    const storageUserRole: string = window.localStorage["user-role"];
    if (storageUserRole) this.userRoleList = JSON.parse(storageUserRole as string) || [];

    const storageCurrentRole: string = window.localStorage["current-role"];
    if (storageCurrentRole) {
      const currentRoleObj: IUserModel = JSON.parse(storageCurrentRole);
      this.setCurrentUserRole(currentRoleObj);
      this.selectRoleIndex = this.userRoleList?.findIndex(item => item._id === currentRoleObj._id);
    }
    this.ifUserRoleExists = !!storageUserRole;
    if (!this.ifUserRoleExists) {
      this.currentAddUser = true;
      return;
    }
    if (!storageCurrentRole && this.selectRoleIndex < 0) {
      this.selectRoleIndex = 0;
    }
  },

  methods: {
    ...mapMutations({
      setCurrentUserRole: "chatroom/setCurrentUserRole",
    }),

    onRoleCardClick(index: number) {
      if (index >= 0) {
        this.selectRoleIndex = index;
        window.localStorage["current-role"] = JSON.stringify(
          this.userRoleList[this.selectRoleIndex]
        );
        this.setCurrentUserRole(this.userRoleList[this.selectRoleIndex]);
      } else {
        this.selectRoleIndex = -1;
        delete window.localStorage["current-role"];
        this.setCurrentUserRole(undefined);
      }
    },

    onAddCardClick() {
      this.onResetUserInfo();
      this.currentAddUser = true;
    },

    onDeleteCardClick(e: MouseEvent, index: number) {
      e.stopPropagation();

      if (this.loading) return;
      const userRole = this.userRoleList[index];
      if (!userRole._id) return;
      this.loading = true;
      this.$axios
        .delete(`/db/user/${userRole._id}`)
        .then(res => {
          console.log(userRole);
          console.log(res);

          this.$delete(this.userRoleList, index);
          if (this.userRoleList?.length > 0) {
            window.localStorage["user-role"] = JSON.stringify(this.userRoleList);
          } else {
            delete window.localStorage["user-role"];
          }
          while (!this.userRoleList[index] && index >= 0) index--;
          this.$nextTick(() => {
            this.onRoleCardClick(index - 1);
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },

    onSubmitUserInfo(event: FormDataEvent) {
      if (this.loading) return;
      this.loading = true;
      event.preventDefault();

      this.$axios
        .post("/db/user", { ...this.userInfoForm, signUpTime: Date.now() } as IUserModel)
        .then(res => {
          const { status, data } = res;
          if (status === 200) {
            (this as any)?.$bvToast?.toast(`用户 ${this.userInfoForm.nickname} 已成功添加`, {
              title: "添加成功",
              variant: "success",
              solid: true,
            });
            this.onResetUserInfo();
            this.userRoleList.push(data as IUserModel);
            window.localStorage["user-role"] = JSON.stringify(this.userRoleList);
            this.ifUserRoleExists = true;
            this.currentAddUser = false;
            this.$nextTick(() => {
              this.onRoleCardClick(this.userRoleList.length - 1);
            });
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },

    onResetUserInfo(event?: FormDataEvent) {
      event?.preventDefault();
      this.userInfoForm.email = "";
      this.userInfoForm.nickname = "";
    },

    onCreateChatroom() {
      if (this.userRoleList[this.selectRoleIndex]) {
        this.loading = true;
        const roomId = uuidv4();
        this.$router.push(`/chatroom/${roomId}`);
      }
    },
  },
});
</script>

<style lang="less" scoped>
@import "@/assets/styles/mixin.less";

@header-height: 36px;
@card-height: 160px;
@card-width: 128px;

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

  .btn-icon {
    margin-right: 0.2em;
    vertical-align: -0.2em;
  }

  .main-title {
    margin-bottom: 20px;
    text-align: center;
  }

  .no-role-hint {
    margin-bottom: 24px;
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
    justify-content: center;
    align-items: flex-start;
    padding: 12px 0;
    transition: all 0.3s;

    .avatar-container {
      display: block;
      width: 128px;
      height: 128px;
      margin-right: 42px;
      background-color: rgb(black 0.05);
      border-radius: @border-radius-infinite;
    }

    .new-role-form {
      width: 40vw;
      max-width: 480px;
      margin-right: 12px;

      .form-title {
        margin-bottom: 12px;
      }

      .form-operation {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
    }
  }

  .role-list {
    text-align: center;
    width: 100%;
    overflow: hidden;
    transition: all 0.3s;

    .list-title {
      margin-bottom: 64px;
      font-weight: normal;
    }

    .list-wrapper {
      padding: 30px 12px;
      overflow: auto;
      white-space: nowrap;

      .card-item {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: @card-height;
        width: @card-width;
        padding: 14px 0;
        margin: 0 10px;
        border-radius: 5px;
        vertical-align: top;
        cursor: pointer;
        transition: all 0.3s;

        .card-avatar {
          display: inline-block;
          height: 72px;
          width: 72px;
          border-radius: @border-radius-infinite;
          background-color: rgba(black, 0.5);
        }

        .card-delete {
          position: absolute;
          left: 0;
          bottom: 100%;
          width: 100%;
          height: 28px;
          color: @text-color-light;
          font-size: @font-size-lg;
          line-height: 26px;
          text-align: center;
          border-radius: 5px 5px 0 0;
          background-color: rgba(@color-error, 0.05);
          border: 1px solid transparent;
          border-bottom: none;
          opacity: 0;
          transition: all 0.3s;

          &:hover {
            background-color: rgba(@color-error, 0.12);
          }
        }

        &:hover {
          background-color: rgba(black, 0.05);
          border-radius: 0 0 5px 5px;

          .card-delete {
            opacity: 1;
          }
        }

        &:active {
          background-color: rgba(black, 0.08);
        }

        &--active {
          font-weight: bolder;
          background-color: rgba(black, 0.08);
          box-shadow: 0 0 0 1px rgba(black, 0.1) inset;

          &:hover .card-delete {
            border-color: rgba(grey, 0.2);
          }
        }
      }

      .card-add {
        justify-content: center;
        margin: 0;
        background: none !important;

        .icon-plus {
          font-size: 64px;
          color: rgba(black, 0.1);
        }

        &:hover {
          .icon-plus {
            color: rgba(black, 0.2);
          }
        }

        &:active {
          .icon-plus {
            color: rgba(black, 0.3);
          }
        }
      }
    }

    .btn-add-chatroom {
      margin: 40px 0 10px;
      padding: 8px 20px;
    }
  }
}
</style>
