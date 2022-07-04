<template>
  <div>
    <h1>blog-test</h1>
    {{ articleList }}
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export interface IBlogPageState {
  articleList: string;
}

export default Vue.extend({
  components: {},

  async asyncData(context) {
    const $axios = context.$axios;
    $axios.defaults.timeout = 3000;
    const res = await $axios.$get("/api/test/demo");
    return { articleList: res };
  },

  data() {
    return {} as IBlogPageState;
  },
});
</script>
