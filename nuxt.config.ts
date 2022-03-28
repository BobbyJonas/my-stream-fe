import * as dotenv from "dotenv";
dotenv.config();

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
    "@/assets/styles/normalize.css",
    "@/assets/styles/global.less",
    "ant-design-vue/dist/antd.css",
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    // "@nuxtjs/eslint-module",
    "@nuxtjs/stylelint-module",
    "@nuxtjs/tailwindcss",
    "@nuxt/typescript-build",
    "@nuxtjs/composition-api/module",
    ["@nuxtjs/dotenv", { path: "./" }],
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: ["@nuxtjs/axios", "./src/assets/modules/socket-io"],

  // Server Middleware
  serverMiddleware: {
    "/api": "~/api",
  },
  // For deployment you might want to edit host and port
  server: {
    host: process.env.HOST,
    port: process.env.PORT_APP,
  },

  globalName: "app",
  globals: {
    id: "app",
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    publicPath: "/app/",
    transpile: ["ant-design-vue"],
  },

  // Stylelint Configuration: https://stylelint.io/user-guide/usage/node-api/#options
  stylelint: {
    configFile: ".stylelintrc",
  },

  // Tailwind CSS Configuration: https://tailwindcss.nuxtjs.org/options
  tailwindcss: {
    config: {
      purge: [
        "./src/components/**/*.{js,ts,vue}",
        "./src/layouts/**/*.vue",
        "./src/pages/**/*.vue",
        "./src/plugins/**/*.{js,ts}",
        "./nuxt.config.{js,ts}",
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    },
  },
};
