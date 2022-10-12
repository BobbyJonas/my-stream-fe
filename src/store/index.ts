import { Store } from "vuex";
import { initializeStores } from "~/assets/utils/store-accessor";

const initializer = (store: Store<any>) => initializeStores(store);

export const plugins = [initializer];
export * from "~/assets/utils/store-accessor";
