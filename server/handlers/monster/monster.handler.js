import { PacketType } from '../../constants.js';
import { getMonsters, removeMonster, setMonster } from '../../models/monster.model.js';
import { getPlayData } from '../../models/playData.model.js';
import { sendGameSync } from '../game/gameSyncHandler.js';

// 몬스터 사망
function handleDieMonster(socket, userId, payload) {
  const monsters = getMonsters(userId);
  if (!monsters) {
    return { status: 'fail', message: 'Monsters not found' };
  }

  const playerData = getPlayData(userId);
  playerData.addScore(100 + payload.monsterLevel * 50);

  removeMonster(userId, payload.monsterIndex);
  sendGameSync(socket, userId, PacketType.S2C_ENEMY_DIE_MONSTER, {
    destroyedMonsterIndex: payload.monsterIndex,
  });
  return { status: 'success', message: 'Monster is dead' };
}

// 몬스터 생성
function handleSpawnMonster(socket, userId, payload) {
  const monsterIndex = setMonster(userId, payload.hp, payload.monsterIndex, payload.monsterLevel);
  const mainMonsters = getMonsters(userId);

  sendGameSync(socket, userId, PacketType.S2C_ENEMY_SPAWN_MONSTER, { mainMonsters });
  console.log('몬스터 생성', JSON.stringify(`Create Monster: ${monsterIndex}`));
  return { status: 'success', message: 'Monster created' };
}

export { handleSpawnMonster, handleDieMonster };
