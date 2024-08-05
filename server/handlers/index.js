import { handleConnection, handlerDisconnect, handlerEvent } from './helper.js';
import { PacketType } from '../constants.js';
import { handleMatchRequest } from './match/matchMakingHandler.js';
import { handlerMatchAcceptRequest } from './match/matchAcceptHandler.js';
import { handlerMatchDeniedRequest } from './match/matchAcceptHandler.js';

const connectHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);
    socket.emit('connection', { status: 'success', message: '연결 완료' });

    handleConnection(socket);
    socket.on('event', (data) => {
      socket.userId = data.userId;
      console.log('2');

      switch (data.packetType) {
        case PacketType.C2S_MATCH_REQUEST:
          handleMatchRequest(socket, data);
          break;
        case PacketType.C2S_MATCH_ACCEPT:
          handlerMatchAcceptRequest(socket, data);
          break;
        case PacketType.C2S_MATCH_DENIED:
          handlerMatchDeniedRequest(socket, data);
          break;
        default:
          handlerEvent(io, socket, data);
        //console.log(`Unknown packet type: ${packet.packetType}`);
      }
    });

    socket.on('disconnect', (socket) => {
      handlerDisconnect(socket);
    });
  });
};

export default connectHandler;
