import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import { Server } from "socket.io";
import chalk from "chalk";

import type { Module } from "@nuxt/types";

interface ISocketModuleOptions {}

const socketModule: Module<ISocketModuleOptions> = function (moduleOptions) {
  const { nuxt } = this;

  nuxt.hook("render:before", () => {
    const host = process.env.HOST;
    const port = process.env.PORT_SOCKET;
    const sslEnabled = process.env.SSL;

    const server = sslEnabled
      ? https.createServer({
          ...(this.nuxt.renderer.app || {}),
          key: fs.readFileSync(
            path.resolve(__dirname, "../../../../config/cert/localhost-key.pem")
          ),
          cert: fs.readFileSync(
            path.resolve(__dirname, "../../../../config/cert/localhost-cert.pem")
          ),
        })
      : http.createServer(this.nuxt.renderer.app);

    const io = new Server(server, {
      cors: {
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    nuxt.hook("listen", () => {
      server.listen(port);
      const messageLines = [`Socket.io Port: ${chalk.underline.gray(String(port))}`];
      if (nuxt.options.cli.badgeMessages?.length) messageLines.unshift("");
      nuxt.options.cli.badgeMessages.push(...messageLines);
    });

    nuxt.hook("close", () => {
      server.close();
    });

    // Add socket.io events
    io.on("connection", socket => {
      console.log(`Socket ID: ${socket.id} connected`);

      socket.on("chat-message", args => {
        console.log("hahah", args);

        io.emit("new-message", args);
      });

      socket.on("disconnect", () => {
        console.log(`Socket ID: ${socket.id} disconnect`);
      });
    });
  });
};

export default socketModule;
