// import MightyBoss from './mightyBoss.handler.js';
// import TowerControlBoss from './towerControlBoss.handler.js';
// import DoomsdayBoss from './doomsdayBoss.handler.js';
// import TimeRifter from './timeRifter.handler.js';
// import FinaleBoss from './finaleBoss.handler.js';

// let bossSpawned = false;  
// let bossSkillInterval = null;  

// function handleSpawnBoss(io, socket, stage, towers, base) {
//   console.log("Boss spawn request received for stage:", stage);

//   if (bossSpawned) {
//       io.emit('bossSpawned', {
//           success: false,
//           message: 'A boss is already spawned'
//       });
//       return;
//   }

//   const bossType = determineBossType(stage);
//   if (!bossType) {
//       io.emit('bossSpawned', {
//           success: false,
//           message: `No boss type found for stage ${stage}`
//       });
//       return;
//   }

//   const boss = spawnBoss(bossType, socket);
//   if (boss) {
//       bossSpawned = true;  
//       io.emit('bossSpawned', {
//           success: true,
//           bossType: bossType,
//           hp: boss.hp
//       });
//       console.log(`Boss spawned: ${bossType} with HP: ${boss.hp}`);

//       bossSkillInterval = setInterval(() => {
//           boss.useSkill(io, towers, base);  
//       }, 5000);

//       boss.on('die', () => {
//           clearBossSkillInterval();  
//           io.emit('bossDied', { bossType: bossType });
//           bossSpawned = false;  
//       });
//   } else {
//       io.emit('bossSpawned', {
//           success: false,
//           message: 'Failed to spawn boss'
//       });
//   }
// }

// function determineBossType(stage) {
//   switch(stage) {
//     case 3:
//       return 'MightyBoss';
//     case 6:
//       return 'TowerControlBoss';
//     case 9:
//       return 'DoomsdayBoss';
//     case 12:
//       return 'TimeRifter';
//     case 15:
//       return 'FinaleBoss';
//     default:
//       return null;
//   }
// }

// function spawnBoss(bossType, socket) {
//   switch (bossType) {
//       case 'MightyBoss':
//           return new MightyBoss(socket);
//       case 'TowerControlBoss':
//           return new TowerControlBoss(socket);
//       case 'DoomsdayBoss':
//           return new DoomsdayBoss(socket);
//       case 'TimeRifter':
//           return new TimeRifter(socket);
//       case 'FinaleBoss':
//           return new FinaleBoss(socket);
//       default:
//           return null;
//   }
// }

// function clearBossSkillInterval() {
//   if (bossSkillInterval) {
//       clearInterval(bossSkillInterval);
//       bossSkillInterval = null;
//   }
// }

// export { handleSpawnBoss, clearBossSkillInterval };


// bosshandlers.js

import { PacketType } from '../../constants.js'; // 패킷 타입 상수 정의

let bossSpawned = false; // 보스 스폰 여부 체크

function handleSpawnBoss(io, socket, stage) {
    console.log("Boss spawn request received for stage:", stage);

    if (bossSpawned) {
        socket.emit('bossSpawned', {
            success: false,
            message: 'A boss is already spawned'
        });
        return;
    }

    const bossType = determineBossType(stage); // 스테이지에 따른 보스 타입 결정

    if (!bossType) {
        socket.emit('bossSpawned', {
            success: false,
            message: `No boss type found for stage ${stage}`
        });
        return;
    }

    bossSpawned = true;
    io.emit('bossSpawned', {
        success: true,
        bossType: bossType // 보스 타입 정보만 클라이언트에 전달
    });
    
    console.log(`Boss ${bossType} spawned on stage: ${stage}`);
}

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
            return null;
    }
}

export { handleSpawnBoss };
