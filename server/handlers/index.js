import { handleConnection, handlerDisconnect, handlerEvent } from './helper.js';
import { PacketType } from '../constants.js';
import { handleMatchRequest } from './match/matchMakingHandler.js';

import {
  handlerMatchAcceptRequest,
  handlerMatchDeniedRequest,
} from '../handlers/match/matchAcceptHandler.js';
import { handleDieMonster, handleSpawnMonster } from '../handlers/monster/monster.handler.js';
import { towerAddOnHandler, towerAttackHandler } from '../handlers/towers/tower.handler.js';
import { handleMonsterBaseAttack } from '../handlers/game/gameHandler.js';

const connectHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);
    socket.emit('connection', { status: 'success', message: '연결 완료' });

    handleConnection(socket);
    socket.on('event', (packet) => {
      socket.userId = packet.userId;

      switch (packet.packetType) {
        case PacketType.C2S_MATCH_REQUEST:
          handleMatchRequest(socket, packet);
          break;
        case PacketType.C2S_MATCH_ACCEPT:
          handlerMatchAcceptRequest(socket, packet);
          break;
        case PacketType.C2S_TOWER_BUY:
          towerAddOnHandler(socket, packet.userId, packet.payload);
          break;
        case PacketType.C2S_TOWER_ATTACK:
          towerAttackHandler(socket, packet.userId, packet.payload);
          break;
        case PacketType.C2S_MATCH_DENIED:
          handlerMatchDeniedRequest(socket, packet);
          break;
        case PacketType.C2S_SPAWN_MONSTER:
          handleSpawnMonster(socket, packet.userId, packet.payload);
          break;
        case PacketType.C2S_DIE_MONSTER:
          handleDieMonster(socket, packet.userId, packet.payload);
          break;
        case PacketType.C2S_MONSTER_ATTACK_BASE:
          handleMonsterBaseAttack(socket, packet.userId, packet.payload);
          break;
        default:
          handlerEvent(io, socket, packet);
        //console.log(`Unknown packet type: ${packet.packetType}`);
      }
    });

    socket.on('disconnect', (socket) => {
      handlerDisconnect(socket);
    });
  });
};

export default connectHandler;
