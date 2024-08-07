import { PacketType } from '../../constants.js';
import { getMonsters, setDamagedMonsterHp } from '../../models/monster.model.js';
import { getPlayData } from '../../models/playData.model.js';
import { getTowers, setTower } from '../../models/tower.model.js';
import { sendGameSync } from '../game/gameSyncHandler.js';

export const towerAddOnHandler = (socket, userId, payload) => {
  const { x, y, level, towerIndex, towerCost } = payload;

  setTower(userId, x, y, level, towerIndex);
  const mainTowers = getTowers(userId);

  const playerData = getPlayData(userId);
  playerData.spendGold(towerCost);

  sendGameSync(socket, userId, PacketType.S2C_ENEMY_TOWER_SPAWN, { mainTowers });

  return {
    status: 'success',
    message: `Tower Update: ${payload.x}, ${payload.y}`,
  };
};

export const towerAttackHandler = (socket, userId, payload) => {
  const { damage, monsterIndex, towerIndex } = payload;

  const attackedMonsters = getMonsters(userId);
  const attackedTowers = getTowers(userId);

  const attackedMonster = attackedMonsters.find((monster) => monster.monsterIndex === monsterIndex);

  const attackedTower = attackedTowers.find((tower) => tower.towerIndex === towerIndex);
  setDamagedMonsterHp(userId, damage, monsterIndex);

  sendGameSync(socket, userId, PacketType.S2C_ENEMY_TOWER_ATTACK, {
    attackedMonster,
    attackedTower,
  });
};
