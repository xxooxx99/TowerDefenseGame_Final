import { PacketType } from '../../constants.js';
import { getMonsters, removeMonster, setMonster } from '../../models/monster.model.js';
import { getPlayData } from '../../models/playData.model.js';
import { sendGameSync } from '../game/gameSyncHandler.js';

// 각 스테이지의 몬스터 수 설정
const stageMonsterCounts = {
  1: 5,  // 일반 라운드
  2: 5,  // 일반 라운드
  3: 0,   // 보스 라운드 - MightyBoss
  4: 5,  // 일반 라운드
  5: 5,  // 일반 라운드
  6: 0,   // 보스 라운드 - TowerControlBoss
  7: 5,  // 일반 라운드
  8: 5,  // 일반 라운드
  9: 0,   // 보스 라운드 - TimeRifter
  10: 5, // 일반 라운드
  11: 5, // 일반 라운드
  12: 0,  // 보스 라운드 - Doomsday
  13: 5, // 일반 라운드
  14: 5, // 일반 라운드
  15: 0   // 보스 라운드 - FinaleBoss
};

let currentStage = 1;
let monstersRemainingInStage = stageMonsterCounts[currentStage];

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

  // 남은 몬스터 수 감소
  monstersRemainingInStage--;

  // 남은 몬스터 수가 0이면 스테이지를 넘김
  if (monstersRemainingInStage <= 0) {
    socket.emit('system', `system) ${currentStage}라운드 종료. 잠시 후 ${currentStage + 1}라운드가 시작됩니다.`);

    setTimeout(() => {
      currentStage++;
      if (stageMonsterCounts[currentStage]) {
        monstersRemainingInStage = stageMonsterCounts[currentStage];
      } else {
        socket.emit('system', '모든 라운드 완료! 게임 종료.');
        return;
      }

      // 특정 스테이지에서 보스 출현 로직
      if (currentStage === 3) {
        socket.emit('system', 'system) 3라운드 보스, MightyBoss가 출현하였습니다!');
        // triggerMightyBoss();
      } else if (currentStage === 6) {
        socket.emit('system', 'system) 6라운드 보스, TowerControlBoss가 출현하였습니다!');
        // triggerTowerControlBoss();
      } else if (currentStage === 9) {
        socket.emit('system', 'system) 9라운드 보스, TimeRifter가 출현하였습니다!');
        // triggerTimeRifter();
      } else if (currentStage === 12) {
        socket.emit('system', 'system) 12라운드 보스, Doomsday가 출현하였습니다!');
        // triggerDoomsday();
      } else if (currentStage === 15) {
        socket.emit('system', 'system) 15라운드 보스, FinaleBoss가 출현하였습니다!');
        // triggerFinaleBoss();
      } else {
        socket.emit('system', `system) ${currentStage}라운드 시작`);
      }

    }, 5000); // 5초 대기 후 다음 스테이지 시작
  }

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
