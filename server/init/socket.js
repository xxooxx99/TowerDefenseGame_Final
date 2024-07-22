import { Server as SocketIO } from 'socket.io';
import connectHandler from '../handler/index.js';

const initSocket = (server) => {
  const io = new SocketIO();
  io.attach(server); // Socket.IO 서버와 통합

  connectHandler(io);

  return io;
};

export default initSocket;
