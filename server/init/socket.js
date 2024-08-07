import { Server as SocketIO } from 'socket.io';
import { activeSessions } from '../app.js';
import { PacketType } from '../constants.js';
import { handleMatchRequest } from '../handlers/match/matchMakingHandler.js';
import {
  handlerMatchAcceptRequest,
  handlerMatchDeniedRequest,
} from '../handlers/match/matchAcceptHandler.js';
import connectHandler from '../handlers/index.js';
import { handleDieMonster, handleSpawnMonster } from '../handlers/monster/monster.handler.js';
import { towerAddOnHandler, towerAttackHandler } from '../handlers/towers/tower.handler.js';
import { handleMonsterBaseAttack, handleBaseAttackMonster } from '../handlers/game/gameHandler.js';
import { baseAttackMonster } from '../models/baseUpgrade.js';

const initSocket = (server) => {
  const io = new SocketIO();
  io.attach(server);
  connectHandler(io);

  return;

  io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);
    socket.emit('connection', { status: 'success', message: '연결 완료' });

    socket.on('event', (packet) => {
      console.log(
        `Received packet: ${JSON.stringify(`패킷 타입 : ${packet.packetType} 유저 아이디 : ${packet.userId}`)}`,
      );

      if (!packet.userId) {
        console.error('Received packet without userId:', packet);
        return;
      }

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
        case PacketType.C2S_BASE_ATTACK_MONSTER:
          handleBaseAttackMonster(socket, packet.userId, packet.payload);
          break;
        case PacketType.S2C_TOWER_CREATE:
          towerAddHandler(socket, packet.userId, packet.payload);
          break;
        case PacketType.C2S_TOWER_UPGRADE:
          towerUpgrade(socket, packet.userId, packet.payload);
          break;
        case PacketType.C2S_BASE_ATTACK:
          baseAttackMonster(socket, uuid, payload);
          break;
        case PacketType.S2C_UPDATE_MONSTER_HP:
          updateMonstersHp(packet.payload);
          break;
        default:
          console.log(`Unknown packet type: ${packet.packetType}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      if (socket.userId && activeSessions[socket.userId]) {
        delete activeSessions[socket.userId];
        console.log(`Session for user ${socket.userId} has been invalidated`);
      }
    });
  });
};

export default initSocket;
