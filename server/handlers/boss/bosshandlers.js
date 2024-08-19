import MightyBoss from './mightyBoss.handler.js';
import TowerControlBoss from './towerControlBoss.handler.js';
import DoomsdayBoss from './doomsdayBoss.handler.js';
import TimeRifter from './timeRifter.handler.js';
import FinaleBoss from './finaleBoss.handler.js';

let bossSpawned = false;  // 보스 소환 상태 관리
let bossSkillInterval = null;  // 보스 스킬 사용 인터벌

function handleSpawnBoss(io, socket, stage, towers, base) {
  console.log("Boss spawn request received for stage:", stage);

  // Check if a boss is already spawned
  if (bossSpawned) {
      console.error(`Invalid boss spawn request: A boss is already spawned for stage ${stage}`);
      io.emit('bossSpawned', {
          success: false,
          message: 'A boss is already spawned'
      });
      return;  // Stop further execution
  }

  // Determine the boss type based on the stage
  const bossType = determineBossType(stage);
  if (!bossType) {
      console.error(`Invalid boss spawn request: No boss type found for stage ${stage}`);
      io.emit('bossSpawned', {
          success: false,
          message: `No boss type found for stage ${stage}`
      });
      return;  // Stop further execution
  }

  // Spawn the boss
  const boss = spawnBoss(bossType, socket);
  if (boss) {
      bossSpawned = true;  // Mark the boss as spawned
      io.emit('bossSpawned', {
          success: true,
          bossType: bossType,
          hp: boss.hp
      });
      console.log(`Boss spawned: ${bossType} with HP: ${boss.hp}`);

      // Set up the boss to periodically use skills
      bossSkillInterval = setInterval(() => {
          boss.useSkill(io, towers, base);  
      }, 5000);

      // Set up an event listener for the boss's death
      boss.on('die', () => {
          clearBossSkillInterval();  // Stop the boss skill interval
          io.emit('bossDied', { bossType: bossType });
          bossSpawned = false;  // Mark the boss as not spawned
          console.log(`${bossType} has died.`);
      });
  } else {
      io.emit('bossSpawned', {
          success: false,
          message: 'Failed to spawn boss'
      });
      console.error("Failed to spawn boss for stage:", stage);
  }
}

// Determines which boss should spawn based on the stage number
function determineBossType(stage) {
  switch(stage) {
    case 3:
      return 'MightyBoss';
    case 6:
      return 'TowerControlBoss';
    case 9:
      return 'DoomsdayBoss';
    case 12:
      return 'TimeRifter';
    case 15:
      return 'FinaleBoss';
    default:
      return null;  // Return null if the stage is invalid
  }
}

// Creates and returns a new boss instance based on the boss type
function spawnBoss(bossType, socket) {
  switch (bossType) {
      case 'MightyBoss':
          return new MightyBoss(socket);
      case 'TowerControlBoss':
          return new TowerControlBoss(socket);
      case 'DoomsdayBoss':
          return new DoomsdayBoss(socket);
      case 'TimeRifter':
          return new TimeRifter(socket);
      case 'FinaleBoss':
          return new FinaleBoss(socket);
      default:
          return null;  // Return null if the boss type is invalid
  }
}

// Clears the boss skill interval when the boss dies or when needed
function clearBossSkillInterval() {
  if (bossSkillInterval) {
      clearInterval(bossSkillInterval);
      bossSkillInterval = null;
  }
}

export { handleSpawnBoss, clearBossSkillInterval };
