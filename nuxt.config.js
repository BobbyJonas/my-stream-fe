export default {
  ssr: false,
  srcDir: "src",

  // Nuxt target: https://nuxtjs.org/api/configuration-target
  target: "server",

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: process.env.npm_package_name || "",
    htmlAttrs: {
      lang: "zh-CN",
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    "@/assets/css/normalize.css",
    "@/assets/css/global.less",
    "ant-design-vue/dist/antd.css",
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    "@nuxtjs/eslint-module",
    "@nuxt/typescript-build",
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: ["@nuxtjs/axios"],

  // Server Middleware
  serverMiddleware: {
    "/api": "~/api",
  },
  // For deployment you might want to edit host and port
  // server: {
  //  port: 8000, // default: 3000
  //  host: '0.0.0.0' // default: localhost
  // },

  globalName: "app",
  globals: {
    id: "app",
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    publicPath: "/app/",
    transpile: ["ant-design-vue"],
  },
};
