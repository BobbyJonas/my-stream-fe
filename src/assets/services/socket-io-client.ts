import { io, Socket } from "socket.io-client";

class SocketioService {
  socket!: Socket;
  constructor() {}

  setupSocketConnection() {
    const { protocol, hostname } = window.location;
    const port = process.env.PORT_SOCKET;
    this.socket = io(`${protocol}//${hostname}:${port}`);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketioService();
