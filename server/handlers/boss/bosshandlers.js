import { PacketType } from '../../constants.js'; 
import MightyBoss from './mightyBoss.handler.js';
import TowerControlBoss from './towerControlBoss.handler.js';
import DoomsdayBoss from './doomsdayBoss.handler.js';
import TimeRifter from './timeRifter.handler.js';
import FinaleBoss from './finaleBoss.handler.js';

let clientStages = {}; 
let clientBossSpawned = {}; 
let activeBosses = {}; // 현재 활성화된 보스 관리

// 클라이언트가 스테이지 변경을 서버에 보고할 때 처리하는 함수
function handleStageUpdate(socket, stage, io, towers, base) {
    const userId = socket.id;

    // 클라이언트의 현재 스테이지 업데이트
    clientStages[userId] = stage;
    console.log(`Stage Update received from client: ${stage} (user: ${userId})`);
    
    // 보스가 소환되어야 할 스테이지인지 확인
    if ([3, 6, 9, 12, 15].includes(stage) && !clientBossSpawned[userId]) {
        handleSpawnBoss(socket, stage, io, towers, base); 
    } else if (![3, 6, 9, 12, 15].includes(stage)) {
        // 보스가 소환되지 않는 스테이지라면 보스 상태 초기화
        resetBossState(userId);
    }
}

// 보스 소환 처리
function handleSpawnBoss(socket, stage, io, towers, base) {
    return new Promise((resolve, reject) => {
        const userId = socket.id;
        console.log(`Server: Boss spawn request received for user ${userId}, stage: ${stage}`);

        // 이미 보스가 소환되었다면 중단
        if (clientBossSpawned[userId]) {
            console.log(`Boss already spawned for user ${userId} at stage ${stage}`);
            return resolve(); // Promise를 성공적으로 종료
        }

        // 보스 타입 결정
        const bossType = determineBossType(stage);

        if (!bossType) {
            socket.emit('bossSpawned', {
                success: false,
                message: `Server: No boss type found for stage ${stage}`
            });
            return reject(new Error(`No boss type found for stage ${stage}`)); // Promise를 실패로 종료
        }

        clientBossSpawned[userId] = true;

        // 새로운 보스 인스턴스 생성
        const boss = createBossInstance(bossType, socket);

        if (boss) {
            activeBosses[userId] = boss; // 활성화된 보스 관리
            socket.emit('bossSpawned', {
                success: true,
                bossType: bossType,
                stage: stage
            });
            console.log(`Server: Boss type ${bossType} spawned for user ${userId} at stage ${stage}`);

            resolve(); // 작업 성공 시 Promise를 성공적으로 종료
        } else {
            console.error(`Failed to create boss instance for user ${userId} at stage ${stage}`);
            socket.emit('bossSpawned', {
                success: false,
                message: 'Failed to spawn boss due to server error.'
            });
            reject(new Error(`Failed to create boss instance for user ${userId}`)); // 작업 실패 시 Promise를 실패로 종료
        }
    });
}

// 클라이언트로부터 보스 스킬 사용 요청을 처리하고 상대방에게 전달
function handleBossSkill(socket, io, skillData) {
    const userId = socket.id;
    const { skill, bossType, stage } = skillData;
    console.log(`Server: Boss skill ${skill} used by client ${userId} for stage ${stage}`);

    // 현재 활성화된 보스에 대해 스킬 사용 요청을 상대 클라이언트에게 전달
    if (activeBosses[userId]) {
        io.emit('opponentBossSkillUsed', {
            bossType,
            skill,
            stage,
            userId
        });
    }
}

// 스테이지에 따라 보스 타입 결정
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

// 보스 인스턴스 생성 함수
function createBossInstance(bossType, socket) {
    switch(bossType) {
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
            throw new Error(`Unknown boss type: ${bossType}`);
    }
}

// 보스 상태 리셋 함수 (보스가 소환된 상태를 초기화)
function resetBossState(userId) {
    if (clientBossSpawned[userId]) {
        console.log(`Resetting boss state for user ${userId}`);
        delete clientBossSpawned[userId];
        if (activeBosses[userId]) {
            activeBosses[userId].stopSkills(); // 보스 스킬 중단
            delete activeBosses[userId];
        }
    }
}

// 보스가 처치된 경우 호출하는 함수 (선택 사항)
function handleBossDefeated(socket) {
    const userId = socket.id;

    // 보스가 처치되었다면 상태 초기화
    resetBossState(userId);
    console.log(`Boss defeated for user ${userId}`);
    socket.emit('bossDefeated', {
        success: true,
        message: 'Boss has been defeated.'
    });
}

export { handleStageUpdate, handleSpawnBoss, handleBossSkill, handleBossDefeated, resetBossState };
