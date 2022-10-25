export type Properties<T extends { new (...args: any[]): any }> = keyof InstanceType<T>;

export const makeToast = (
  title?: string,
  content?: string,
  variant?: "default" | "primary" | "secondary" | "danger" | "warning" | "success" | "info"
) => {
  (window.$nuxt as any)?.$bvToast?.toast(content, {
    title: title ?? "提示",
    variant: variant || "default",
    solid: true,
  });
};
