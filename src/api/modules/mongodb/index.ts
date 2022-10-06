import chalk from "chalk";
import consola from "consola";
import type { Module } from "@nuxt/types";
import mongoose from "./database";

interface IMongodbModuleOptions {}

const mongodbModule: Module<IMongodbModuleOptions> = function (moduleOptions) {
  const { nuxt } = this;

  nuxt.hook("render:before", () => {
    const host = process.env.HOST;
    const port = process.env.PORT_MONGODB || 80;

    nuxt.hook("listen", () => {
      mongoose
        .connect(`mongodb://${host}:${port}/my-stream-database`)
        .then(() => {
          consola.success(`Mongodb successfully connected`);
        })
        .catch(e => {
          consola.error(`Fatal: Mongodb connection failed`);
          if (e) consola.error(e);
        });
      const messageLines = [`MongoDB Port: ${chalk.underline.gray(String(port))}`];
      if (nuxt.options.cli.badgeMessages?.length) messageLines.unshift("");
      nuxt.options.cli.badgeMessages.push(...messageLines);
    });

    nuxt.hook("close", () => {
      consola.info("mongoose connection closed");
      mongoose.connection.close();
    });
  });
};

export default mongodbModule;
