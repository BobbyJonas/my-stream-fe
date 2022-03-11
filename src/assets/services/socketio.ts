import { io, Socket } from "socket.io-client";

class SocketioService {
  socket!: Socket;
  constructor() {}

  setupSocketConnection() {
    const port = process.env.SOCKETIO_PORT || 4001;
    this.socket = io(`http://localhost:${port}`);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketioService();
