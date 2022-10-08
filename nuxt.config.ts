import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const sslEnabled = !!process.env.SSL;

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
  css: ["@/assets/styles/normalize.css", "@/assets/styles/global.less"],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ["@/assets/utils/axios"],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    // "@nuxtjs/eslint-module",
    // "@nuxtjs/stylelint-module",
    "@nuxtjs/tailwindcss",
    "@nuxt/postcss8",
    "@nuxtjs/composition-api/module",
    "@nuxt/typescript-build",
    ["@nuxtjs/dotenv", { path: "./", filename: `.env.${env}` }],
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    "@nuxtjs/axios",
    "./src/api/modules/socket-io/index",
    "./src/api/modules/mongodb/index",
    "bootstrap-vue/nuxt",
  ],

  // Server Middleware
  serverMiddleware: {
    "/api": "~/api",
  },
  // For deployment you might want to edit host and port
  server: {
    host: process.env.HOST,
    port: process.env.PORT_APP,
    ...(sslEnabled
      ? {
          https: {
            key: fs.readFileSync(path.resolve(__dirname, "config/cert/localhost-key.pem")),
            cert: fs.readFileSync(path.resolve(__dirname, "config/cert/localhost-cert.pem")),
          },
        }
      : {}),
  },

  globalName: "app",
  globals: {
    id: "app",
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    publicPath: "/app/",
    babel: {
      compact: true,
    },
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

  bootstrapVue: {
    icons: true,
  },

  // https://axios.nuxtjs.org/options
  axios: {
    baseURL: "/api",
    timeout: 20000,
  },

  typescript: {
    // fork-ts-checker-webpack-plugin Configuration
    // https://typescript.nuxtjs.org/guide/lint/#runtime-lint
    // https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#options
    typeCheck: {
      // typescript: {
      //   extensions: {
      //     vue: {
      //       enabled: true,
      //       compiler: "@vue/compiler-sfc",
      //     },
      //   },
      // },

      // ignore `no default export` warning when using setup syntax
      issue: { exclude: [{ code: "TS1192" }] },
    },
  },

  capi: {
    disableMigrationWarning: true,
  },

  telemetry: false,
};
