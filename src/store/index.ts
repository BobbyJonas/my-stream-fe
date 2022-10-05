import Vue from "vue";
import Vuex, { Store } from "vuex";

import chatroom from "./chatroom";

Vue.use(Vuex);

const store = () =>
  new Store({
    state: {},
    mutations: {},
    modules: {
      chatroom,
    },
  });

export default store;
