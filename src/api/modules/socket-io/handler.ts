import type { Server, Socket } from "socket.io";
import {
  getConnectionList as getDbConnectionRecord,
  IConnectionModel,
} from "../mongodb/models/connection";

export interface ISocketRTCConnectionMessage {
  roomId: string;
  data: string;
  from: string;
}

function createSocketHandler(socket: Socket, io: Server): void {
  socket.on("__join", (args: IConnectionModel) => {
    socket.join(args.roomId);
    getDbConnectionRecord({ roomId: args.roomId }).then(res => {
      io.in(args.roomId).emit("__join", res);
    });
  });

  socket.on("__candidate", (args: ISocketRTCConnectionMessage) => {
    const { roomId } = args;
    socket.broadcast.to(roomId).emit("__candidate", args);
  });

  socket.on("__offer", (args: { to?: string } & ISocketRTCConnectionMessage) => {
    const { roomId, to: receiverId } = args;
    if (receiverId) {
      io.to(receiverId).emit("__offer", args);
    } else {
      socket.broadcast.to(roomId).emit("__offer", args);
    }
  });

  socket.on("__answer", (args: { to: string } & ISocketRTCConnectionMessage) => {
    const { to } = args;
    io.to(to).emit("__answer", args);
  });
}

export { createSocketHandler };
