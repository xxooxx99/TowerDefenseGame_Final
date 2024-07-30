import { userGoldInit } from '../../models/gold.model.js';
import { PacketType } from '../../constants.js';

export const userGoldInitHandler = (socket, data) => {
  console.log(data);
  const { userId } = data;
  userGoldInit(userId);

  const packet = {
    PacketType: PacketType.S2C_USER_GOLD_INIT,
    value: 1000,
  };

  socket.emit('userGoldInit', packet);

  return { status: 'success', message: '유저 골드 초기화!' };
};
