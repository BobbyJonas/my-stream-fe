import { Plugin } from "@nuxt/types";
import { initializeAxios } from "~/assets/utils/store-api";

const accessor: Plugin = ({ $axios }) => {
  initializeAxios($axios);
};

export default accessor;
