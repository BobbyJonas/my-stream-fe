import http from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`Socket ID: ${socket.id} connected`);

  socket.on("disconnect", () => {
    console.log(`Socket ID: ${socket.id} disconnect`);
  });

  socket.on("post-tweets", (tweets) => {
    socket.broadcast.emit("new-tweets", tweets);
  });
});

const port = process.env.SOCKETIO_PORT || 4001;
console.info(`Socket.io Server: ${port}`);

server.listen(port);
