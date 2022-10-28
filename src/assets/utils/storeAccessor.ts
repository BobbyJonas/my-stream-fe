/* eslint-disable import/no-mutable-exports */
import type { Store } from "vuex";
import { getModule, config } from "vuex-module-decorators";

import Todo from "~/store/todo";
import Chatroom from "~/store/chatroom";
config.rawError = true;

let TodoStore: Todo;
let ChatroomStore: Chatroom;

function initializeStores(store: Store<any>): void {
  TodoStore = getModule(Todo, store);
  ChatroomStore = getModule(Chatroom, store);
}

export { initializeStores, TodoStore, ChatroomStore };
