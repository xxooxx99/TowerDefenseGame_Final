// server/handlers/boss/bosshandlers.js
import MightyBoss from './mightyBoss.handler.js';
import TowerControlBoss from './towerControlBoss.handler.js';
import DoomsdayBoss from './doomsdayBoss.handler.js';
import TimeRifter from './timeRifter.handler.js';
import FinaleBoss from './finaleBoss.handler.js';

export const handleSpawnBoss = (socket, bossType) => {
  let boss;
  switch (bossType) {
    case 'MightyBoss':
      boss = new MightyBoss();
      break;
    case 'TowerControlBoss':
      boss = new TowerControlBoss();
      break;
    case 'DoomsdayBoss':
      boss = new DoomsdayBoss();
      break;
    case 'TimeRifter':
      boss = new TimeRifter();
      break;
    case 'FinaleBoss':
      boss = new FinaleBoss();
      break;
    default:
      console.log(`Unknown boss type: ${bossType}`);
      return;
  }

  // 클라이언트에게 보스 생성 정보 전송
  socket.emit('bossSpawn', {
    bossType: bossType,
    hp: boss.hp,
    armor: boss.armor,
    speed: boss.speed,
  });

  // 주기적으로 보스 스킬 사용 이벤트 전송
  setInterval(() => {
    const skill = boss.useSkill();
    socket.emit('bossSkill', {
      bossType: bossType,
      skill: skill,
    });
  }, 10000); // 10초마다 스킬 사용
};
