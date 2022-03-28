import http from "http";
import { Server } from "socket.io";
import chalk from "chalk";

import { Module } from "@nuxt/types";

interface ISocketModuleOptions {}

const socketModule: Module<ISocketModuleOptions> = function (moduleOptions) {
  const { nuxt } = this;

  nuxt.hook("render:before", () => {
    const host = process.env.HOST;
    const port = process.env.PORT_SOCKET || 4001;

    const server = http.createServer(this.nuxt.renderer.app);
    const io = new Server(server, {
      cors: {
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    nuxt.hook("listen", () => {
      server.listen(port || 4001);
      const messageLines = [`Socket.io Port: ${chalk.underline.gray(port)}`];
      if (nuxt.options.cli.badgeMessages?.length) messageLines.unshift("");
      nuxt.options.cli.badgeMessages.push(...messageLines);
    });

    nuxt.hook("close", () => {
      server.close();
    });

    // Add socket.io events
    io.on("connection", (socket) => {
      console.log(`Socket ID: ${socket.id} connected`);

      socket.on("disconnect", () => {
        console.log(`Socket ID: ${socket.id} disconnect`);
      });

      socket.on("post-tweets", (tweets) => {
        socket.broadcast.emit("new-tweets", tweets);
      });
    });
  });
};

export default socketModule;
