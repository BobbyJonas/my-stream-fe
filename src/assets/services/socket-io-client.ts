import { io, Socket } from "socket.io-client";

class SocketioService {
  socket!: Socket;
  constructor() {}

  setupSocketConnection() {
    const port = process.env.PORT_SOCKET;
    this.socket = io(`https://localhost:${port}`);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketioService();
