import type { Server, Socket } from "socket.io";
import type { IConnectionModel } from "../mongodb/models/connection";

export interface ISocketRTCConnectionMessage {
  roomId: string;
  data: string;
  from: string;
}

function createSocketHandler(socket: Socket, io: Server): void {
  socket.on("chat-message", args => {
    console.log("chat-message: ", args);
    io.emit("new-message", args);
  });

  socket.on("__join", (args: IConnectionModel) => {
    socket.join(args.roomId);
  });

  socket.on("__candidate", (args: ISocketRTCConnectionMessage) => {
    const { roomId } = args;
    socket.broadcast.to(roomId).emit("__candidate", args);
  });

  socket.on("__offer", (args: ISocketRTCConnectionMessage) => {
    const { roomId } = args;
    socket.broadcast.to(roomId).emit("__offer", args);
  });

  socket.on("__answer", (args: { to: string } & ISocketRTCConnectionMessage) => {
    const { to } = args;
    io.to(to).emit("__answer", args);
  });
}

export { createSocketHandler };
