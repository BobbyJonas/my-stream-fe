import consola from "consola";
import type { RequestHandler, ErrorRequestHandler } from "express";
import { createUserItem, getUserList, IUserModel, removeUserItem } from "../models/user";

export const read: RequestHandler = (req, res) => {
  const data = req.params;
  return getUserList(data || {})
    .then(_res => {
      res.send(_res || "");
    })
    .catch(_err => {
      consola.error(_err);
      res.status(403).send(_err);
    });
};

export const create: RequestHandler = (req, res) => {
  const data = req.body;
  return createUserItem(data)
    .then(_res => {
      res.send(_res);
    })
    .catch(_err => {
      consola.error(_err);
      res.status(403).send(_err);
    });
};

export const del: RequestHandler = (req, res) => {
  const data = req.params;
  return removeUserItem(data || {})
    .then((_res: IUserModel) => {
      res.send(_res);
    })
    .catch(_err => {
      consola.error(_err);
      res.status(403).send(_err);
    });
};
