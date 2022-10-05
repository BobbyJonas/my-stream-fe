import axios, { AxiosError } from "axios";
import { getCurrentInstance } from "@nuxtjs/composition-api";
import { Plugin } from "@nuxt/types";
import { statusCodeMap } from "./dataUtils";

const axiosPlugin: Plugin = context => {
  const { $axios, app } = context;

  $axios.onRequest(config => {
    // config.params = config.params || {};
    // config.params.lang = app.i18n.locale;
  });

  $axios.onError(error => {
    const { response } = error;
    if (response) {
      // 请求已发出，且服务器响应了状态码 (状态码非 2xx)
      const statusCode = response?.status;
      switch (statusCode) {
        case 302:
        case 401:
        case 403:
        default: {
          const err = response?.data || response || "";
          const content = typeof err === "object" ? JSON.stringify(err) : String(err);
          (window.$nuxt as any)?.$bvToast?.toast(content, {
            title: `请求错误 ${statusCode || ""}`,
            variant: "danger",
            solid: true,
          });
          return Promise.reject(error.response);
        }
      }
    } else {
      // 1.请求已经成功发起，但没有收到响应 (此时可通过 error.request 处理)
      // 2.请求发出失败 (断网或超时)
      if (error.code === "ECONNABORTED") {
        return Promise.reject(new Error("请求超时，请稍后重试"));
      }
      if (error.code === "ERR_BAD_RESPONSE") {
        (window.$nuxt as any)?.$bvToast?.toast("网关错误，请联系管理员", {
          title: "请求错误",
          variant: "danger",
          solid: true,
        });
      }
      return Promise.reject(error);
    }
  });
};

export default axiosPlugin;
