import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import { Server } from "socket.io";
import chalk from "chalk";
import consola from "consola";

import type { Module } from "@nuxt/types";

import {
  createConnectionItem as addDbConnectionRecord,
  IConnectionModel,
  removeConnectionItem as removeDbConnectionRecord,
} from "../mongodb/models/connection";

import { createSocketHandler } from "./handler";

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
        origin: "*",
        methods: ["GET", "POST"],
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
      createSocketHandler(socket, io);
      addDbConnectionRecord({ socketId: socket.id, time: Date.now() }).then(() => {
        console.log(`${chalk.bgBlue(" Socket.io ")} ${socket.id} connected`);
      });

      socket.on("disconnect", () => {
        removeDbConnectionRecord({ socketId: socket.id })
          .then((res: IConnectionModel) => {
            console.log("leave:", res.roomId);
            if (res.roomId) io.in(res.roomId).emit("__leave", { from: socket.id });
            console.log(`${chalk.bgBlue(" Socket.io ")} ${socket.id} deleted`);
          })
          .catch(err => {
            consola.error(err);
          });
      });
    });
  });
};

export default socketModule;
