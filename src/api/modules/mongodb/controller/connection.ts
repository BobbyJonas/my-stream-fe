import consola from "consola";
import type { RequestHandler, ErrorRequestHandler } from "express";
import { getConnectionList } from "../models/connection";

export const read: RequestHandler = (req, res) => {
  const data = req.query;
  return getConnectionList(data || {})
    .then(_res => {
      res.send(_res || "");
    })
    .catch(_err => {
      consola.error(_err);
      res.status(403).send(_err);
    });
};
