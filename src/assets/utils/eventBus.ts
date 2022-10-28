import Vue from "vue";
import { Plugin } from "@nuxt/types";

declare module "vue/types/vue" {
  interface Vue {
    $bus: Vue;
  }
}

declare module "@nuxt/types" {
  interface NuxtAppOptions {
    $bus: Vue;
  }
  interface Context {
    $bus: Vue;
  }
}

declare module "vuex/types/index" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Store<S> {
    $bus: Vue;
  }
}

const eventBus = new Vue();

const eventBusPlugin: Plugin = (_, inject) => {
  inject("bus", eventBus);
};

export default eventBusPlugin;
