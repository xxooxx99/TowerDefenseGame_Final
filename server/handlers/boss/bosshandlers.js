import MightyBoss from './mightyBoss.handler.js';
import TowerControlBoss from './towerControlBoss.handler.js';
import DoomsdayBoss from './doomsdayBoss.handler.js';
import TimeRifter from './timeRifter.handler.js';
import FinaleBoss from './finaleBoss.handler.js';

let bossSpawned = false;  // 보스 소환 상태 관리
let bossSkillInterval = null;  // 보스 스킬 사용 인터벌

export function handleSpawnBoss(io, socket, bossType) {
    if (bossSpawned) {
        console.log('Boss already spawned.');
        return;
    }

    console.log('Boss spawn request received for:', bossType);

    // 보스를 소환하는 로직
    const boss = spawnBoss(bossType);

    if (!boss) {
        console.error('Failed to spawn boss:', bossType);
        return;
    }

    bossSpawned = true;

    // 클라이언트에게 보스 소환 성공 알림 - 브로드캐스팅
    io.emit('bossSpawned', {
        success: true,
        boss: {
            bossType: bossType,
            hp: boss.hp,
            armor: boss.armor,
            speed: boss.speed,
            bgm: boss.bgm, // 보스 전용 BGM 전송
        }
    });

    // 보스 스킬 사용 주기 설정
    bossSkillInterval = setInterval(() => {
        const skill = boss.useSkill(socket);  // 보스 스킬 사용
        io.emit('bossSkill', {
            bossType: bossType,
            skill: skill,
        });
    }, 10000);

    // 보스 사망 시 인터벌 정지
    boss.on('die', () => {
        clearInterval(bossSkillInterval);
        bossSkillInterval = null;
        bossSpawned = false;
        console.log(`${bossType} has been defeated.`);
    });
}

// 보스를 생성하는 함수
function spawnBoss(bossType) {
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
            console.error('Unknown boss type:', bossType);
            return null;
    }
    return boss;
}
