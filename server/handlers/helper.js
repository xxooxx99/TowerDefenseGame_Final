import handlerMappings from './handlerMappings.js';

export const handleConnection = (socket) => {
  console.log('클라이언트 연결 완료');
  //socket.emit('connection', { status: 'success', message: '연결 완료' });
};

export const handlerDisconnect = (socket) => {
  console.log(`User disconnected: ${socket.id}`);

  if (socket.userId && activeSessions[socket.userId]) {
    delete activeSessions[socket.userId];
    console.log(`Session for user ${socket.userId} has been invalidated`);
  }

  //
  console.log(`클라이언트 연결 해제`);
};

export const handlerEvent = async (io, socket, data) => {
  const handler = handlerMappings[data.PacketType];
  if (!handler) {
    socket.emit('response', { status: 'fail', message: '잘못된 요청입니다.' });
    return;
  }

  const response = await handler(socket, data.payload);

  socket.emit('response', response);
};
