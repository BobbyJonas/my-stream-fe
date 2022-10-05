import consola from "consola";
import type { RequestHandler, ErrorRequestHandler } from "express";
import { createUserItem, IUser, getUserList } from "../models/user";

export const read: RequestHandler = (req, res) => {
  return getUserList()
    .then(_res => {
      res.send(_res || "");
    })
    .catch(_err => {
      res.status(403).send(_err);
    });
};

export const create: RequestHandler = (req, res) => {
  const postData = req.body;
  return createUserItem(postData)
    .then(_res => {
      res.send(_res);
    })
    .catch(_err => {
      consola.error(_err);
      res.status(403).send(_err);
    });
};
