import { PacketType } from '../constants.js';
import { prisma } from '../utils/prisma/index.js';
import { getPlayData } from '../models/playData.model.js';

// 수락 대기열
let accept_queue = [];

// 클라로부터 packet 16 : C2S_MATCH_ACCEPT 를 받을 경우
async function handlerMatchAcceptRequest(socket, data) {
  accept_queue.forEach((room) => {
    if (room.user1.id === data.userId) {
      room.user1.accept = true;
    }
    if (room.user2.id === data.userId) {
      room.user2.accept = true;
    }
  });
  checkAcceptStatus();
}

// 클라로부터 packet 17 : C2S_MATCH_DENIED 를 받을 경우
async function handlerMatchDeniedRequest(socket, data) {
  let denied_index = -1;
  for (let count = 0; count < accept_queue.length; count++) {
    if (
      accept_queue[count].user1.userId === data.userId ||
      accept_queue[count].user2.userId === data.userId
    ) {
      denied_index = count;
    }
  }
  if (denied_index !== -1) {
    accept_queue.splice(start_index, 1);
  }
}

// 모든 방에 대해서 체크 후 모두 수락한 경우가 있으면 게임을 시작하도록 클라에게 신호
async function checkAcceptStatus() {
  let start_index = -1;
  for (let count = 0; count < accept_queue.length; count++) {
    if (accept_queue[count].user1.accept && accept_queue[count].user2.accept) {
      accept_queue[count].user1.socket.emit('event', {
        PacketType: 18,
      });
      accept_queue[count].user2.socket.emit('event', {
        PacketType: 18,
      });
      start_index = count;
    }
  }
  if (start_index !== -1) {
    accept_queue.splice(start_index, 1);
  }
}

// 수락 대기열에 추가
async function addAccept_queue(index, userid1, userid2) {
  let room = {
    index: index,
    user1: {
      id: userid1.userId,
      accept: false,
      socket: userid1.socket,
    },
    user2: {
      id: userid2.userId,
      accept: false,
      socket: userid2.socket,
    },
  };
  accept_queue.push(room);
}

export { addAccept_queue, handlerMatchAcceptRequest, handlerMatchDeniedRequest };
