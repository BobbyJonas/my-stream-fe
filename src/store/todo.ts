import { Module, VuexModule, Mutation, Action } from "vuex-module-decorators";
import { $axios } from "~/assets/utils/store-api";

export type ITodoState = {
  id?: number;
  title: string;
  description: string;
  done: boolean;
};

@Module({
  name: "todo",
  stateFactory: true,
  namespaced: true,
})
export default class Todo extends VuexModule {
  public todos: ITodoState[] = [];

  public get getTodos() {
    return this.todos;
  }

  public get getTodo() {
    return (id: number) => this.todos.find(todo => todo.id === id);
  }

  public get getTodoCount() {
    return this.todos.length;
  }

  @Mutation
  private add(todo: ITodoState) {
    this.todos.push(todo);
  }

  @Mutation
  private remove(id: number) {
    this.todos = this.todos.filter(todo => todo.id !== id);
  }

  @Mutation set(todos: ITodoState[]) {
    this.todos = todos;
  }

  @Action
  public async fetchTodos() {
    const { data } = await $axios.get<ITodoState[]>("/api/todos");
    this.set(data);
  }

  @Action
  public async createTodo(payload: ITodoState) {
    const { data } = await $axios.post<ITodoState>("/api/todo", payload);
    this.add(data);
  }

  @Action
  async deleteTodo(id: number) {
    await $axios.delete(`/api/todo/${id}`);
    this.remove(id);
  }
}
