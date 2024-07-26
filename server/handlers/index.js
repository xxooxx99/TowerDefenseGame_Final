import { handleConnection, handlerDisconnect, handlerEvent } from './helper.js';

const connectHandler = (io) => {
  io.on('connection', (socket) => {
    handleConnection(socket);

    socket.on('event', (data) => {
      handlerEvent(io, socket, data);
    });

    socket.on('disconnect', (socket) => {
      handlerDisconnect(socket);
    });
  });
};

export default connectHandler;
