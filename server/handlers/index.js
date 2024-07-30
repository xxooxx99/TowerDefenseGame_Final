import { handleConnection, handlerDisconnect, handlerEvent } from './helper.js';
import { PacketType } from '../constants.js';
import { handleMatchRequest } from './match/matchMakingHandler.js';
import { handlerMatchAcceptRequest } from './match/matchAcceptHandler.js';
import { handlerMatchDeniedRequest } from './match/matchAcceptHandler.js';

const connectHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);
    socket.emit('connection', { status: 'success', message: '연결 완료' });
    //socket.userId = packet.userId;
    ///

    handleConnection(socket);

    socket.on('event', (data) => {
      socket.userId = data.userId;

      switch (data.packetType) {
        case PacketType.C2S_MATCH_REQUEST:
          console.log(1);
          handleMatchRequest(socket, data);
          break;
        case PacketType.C2S_MATCH_ACCEPT:
          console.log(2);
          handlerMatchAcceptRequest(socket, data);
          break;
        case PacketType.C2S_MATCH_DENIED:
          console.log(3);
          handlerMatchDeniedRequest(socket, data);
          break;
        default:
        //console.log(`Unknown packet type: ${packet.packetType}`);
      }

      handlerEvent(io, socket, data);
    });

    socket.on('disconnect', (socket) => {
      handlerDisconnect(socket);
    });
  });
};

export default connectHandler;
