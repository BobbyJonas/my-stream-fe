<template>
  <div>
    <h1>blog-test</h1>
    <a href="#">12312321</a>
    {{ articleList }}
    <div class="blog-content">
      <div
        v-for="(articleItem, articleIndex) in articleList"
        :key="articleIndex"
      >
        <p>
          {{ articleItem.title }}
        </p>
        <p>
          {{ articleItem.desc }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  components: {},

  async asyncData({ $axios }) {
    $axios.defaults.timeout = 3000;
    const res = await $axios.$get("/api/test");
    return { articleList: res };
  },
  data() {
    return {};
  },
};
</script>
