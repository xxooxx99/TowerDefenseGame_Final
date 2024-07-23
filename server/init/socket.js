import { Server as SocketIO } from 'socket.io';
import { activeSessions } from '../app.js';

const initSocket = (server) => {
  const io = new SocketIO(server);

  io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);

    socket.on('event', (packet) => {
      console.log(
        `Received packet: ${JSON.stringify(`패킷 타입 : ${packet.packetType} 유저 아이디 : ${packet.userId}`)}`,
      );

      socket.userId = packet.userId;

      switch (packet.packetType) {
        /**
        여기에 패킷타입 추가 
        case PacketType.C2S_MATCH_REQUEST:
        handleMatchRequest(socket, packet);
        break;
        */
        default:
          console.log(`Unknown packet type: ${packet.packetType}`);
      }
    });

    socket.in('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      if (socket.userId && activeSessions[socket.userId]) {
        delete activeSessions[socket.userId];
        console.log(`Session for user ${socket.userId} has been invalidated`);
      }
    });
  });
};

export default initSocket;
