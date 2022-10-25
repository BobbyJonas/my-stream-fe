import { Middleware } from "@nuxt/types";

const ChatroomAuth: Middleware = context => {
  const { route, req, res, redirect } = context;

  // redirect("/");
};

export default ChatroomAuth;
