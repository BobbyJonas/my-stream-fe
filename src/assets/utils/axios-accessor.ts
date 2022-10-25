import { Plugin } from "@nuxt/types";
import { initializeAxios } from "~/assets/utils/store-api";

const accessor: Plugin = context => {
  const { $axios } = context;
  initializeAxios($axios);
};

export default accessor;
