import { Monster } from './monster.js';  // Monster 클래스 import
const monsterPath = '/images/';  // 보스 이미지가 저장된 디렉토리 경로
let monsters = []; 

// Boss 클래스 정의
class Boss extends Monster {
    constructor(path, bossImage, level, socket = null, bgm = null, skillSounds = null) {
        super(path, [bossImage], level, socket); // socket과 bgm이 선택적으로 추가됨
        this.width = 100; // 보스의 너비
        this.height = 100; // 보스의 높이
        this.speed = 0.1; // 보스의 속도
        this.hp = 1000 + 1000 * level; // 보스 HP 계산
        this.maxHp = this.hp; // 최대 HP 설정
        this.attackPower = 50 + 5 * level; // 보스의 공격력
        this.bgm = bgm; // 배경음악 파일 경로
        this.skillSounds = skillSounds; // 스킬 효과음 객체
    }

    init(level) {
        if (!this.socket) {
            return;
        }
        this.maxHp = 1000 + 1000 * level; // 보스의 최대 HP
        this.hp = this.maxHp;
        this.attackPower = 50 + 5 * level; // 보스의 공격력

        // 서버로부터 보스 상태 및 스킬 이벤트 수신
        this.socket.on('bossSpawn', (data) => {
            console.log(`Boss spawned with HP: ${data.hp}`);
            this.hp = data.hp;
            this.updateUI();  // 보스의 HP UI를 업데이트하는 코드
        });

        this.socket.on('bossSkill', (data) => {
            this.handleBossSkill(data.skill);
        });

        this.socket.on('updateBossHp', (data) => {
            this.hp = data.hp;
            this.updateUI();
        });

        this.playBGM();  // BGM 재생
    }

    playBGM() {
        this.bgmAudio = new Audio(this.bgm);
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.1;
        this.bgmAudio.play();
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }

    handleBossSkill(skill) {
        // 스킬에 따른 효과음 재생
        if (this.skillSounds[skill]) {
            const skillAudio = new Audio(this.skillSounds[skill]);
            skillAudio.play();
        }
        this.updateUI(skill); // 스킬 사용 후 UI 업데이트
    }

    updateUI(skill = null) {
        const hpElement = document.getElementById(`${this.constructor.name}-hp`);
        if (hpElement) {
            hpElement.textContent = this.hp;
        }

        const skillElement = document.getElementById('boss-skill');
        if (skillElement && skill) {
            skillElement.textContent = `Current Skill: ${skill}`;
        }
    }

    onDie() {
        this.isBossAlive = false;
        this.stopBGM();
    }
}

// 각 보스 클래스 정의
class MightyBoss extends Boss {
    constructor(path, bossImage, level, socket, bgm, skillSounds) {
        super(path, bossImage, level, socket, bgm, skillSounds);
        this.maxHp = 2000;
        this.defense = 50;
        this.speed = 1.2;
    }
}

class TowerControlBoss extends Boss {
    constructor(path, bossImage, level, socket, bgm, skillSounds) {
        super(path, bossImage, level, socket, bgm, skillSounds);
        this.maxHp = 1500;
        this.defense = 30;
        this.speed = 1.5;
    }
}

class DoomsdayBoss extends Boss {
    constructor(path, bossImage, level, socket, bgm, skillSounds) {
        super(path, bossImage, level, socket, bgm, skillSounds);
        this.maxHp = 3000;
        this.defense = 60;
        this.speed = 0.8;
    }
}

class TimeRifter extends Boss {
    constructor(path, bossImage, level, socket, bgm, skillSounds) {
        super(path, bossImage, level, socket, bgm, skillSounds);
        this.maxHp = 1000;
        this.defense = 20;
        this.speed = 2.0;
    }
}

// FinaleBoss 클래스 정의
class FinaleBoss extends Boss {
    constructor(path, bossImage, level, socket, bgm) {
        super(path, bossImage, level, socket, bgm, {}); // 스킬이 없으므로 빈 객체 전달
        this.playerDamage = 0;  // 플레이어가 보스에게 가한 데미지 추적
        this.enemyDamage = 0;  // 상대방이 보스에게 가한 데미지 추적
    }

    init(level) {
        super.init(level);

        // 서버로부터 데미지 업데이트 이벤트 수신
        this.socket.on('updateDamage', (data) => {
            this.playerDamage = data.playerDamage;
            this.enemyDamage = data.enemyDamage;
            this.updateDamageUI();
        });

        // 서버로부터 게임 종료 신호 수신
        this.socket.on('gameOver', (data) => {
            if (data.loser === this.socket.id) {
                alert('You lost! You dealt the least damage to the FinaleBoss.');
            } else {
                alert('You won! Your opponent dealt less damage to the FinaleBoss.');
            }
            this.stopBGM();  // 게임이 끝나면 BGM 정지
        });
    }

    updateDamageUI() {
        const playerDamageElement = document.getElementById('player-damage');
        const enemyDamageElement = document.getElementById('enemy-damage');

        if (playerDamageElement) {
            playerDamageElement.textContent = `Your Damage: ${this.playerDamage}`;
        }
        if (enemyDamageElement) {
            enemyDamageElement.textContent = `Enemy Damage: ${this.enemyDamage}`;
        }
    }
}

// UI 클래스 정의
class BossUI {
    constructor(socket) {
        this.socket = socket;
        this.bgmAudio = null;
        this.init();
    }

    init() {
        this.socket.on('bossStatus', (data) => {
            this.updateUI(data.hp, data.currentSkill);
        });

        this.socket.on('playSkillSound', (data) => {
            const skillAudio = new Audio(data.sound);
            skillAudio.play();
        });

        this.socket.on('playBossBGM', (data) => {
            this.playBGM(data.bgm);
        });
    }

    playBGM(bgm) {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }

        this.bgmAudio = new Audio(bgm);
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.1;
        this.bgmAudio.play();
    }

    updateUI(hp, skill) {
        const hpElement = document.getElementById('boss-hp');
        if (hpElement) {
            hpElement.textContent = `HP: ${hp}`;
        }
        const skillElement = document.getElementById('boss-skill');
        if (skillElement) {
            skillElement.textContent = `Current Skill: ${skill}`;
        }
    }
}

const serverSocket = io();  // 서버와의 WebSocket 연결을 설정

// 서버에서 보스 소환 이벤트를 처리하는 부분
serverSocket.on('bossSpawned', (bossData) => {
    console.log('Boss spawned event received:', bossData);  // 이벤트 수신 로그 추가

    let bossImage = new Image();
    switch (bossData.bossType) {
        case 'MightyBoss':
            bossImage.src = `${monsterPath}MightyBoss.png`;
            break;
        case 'TowerControlBoss':
            bossImage.src = '/images/TowerControlBoss.png';
            break;
        case 'TimeRifter':
            bossImage.src = 'images/TimeRifter.png';
            break;
        case 'DoomsdayBoss':
            bossImage.src = 'images/DoomsdayBoss.png';
            break;
        case 'FinaleBoss':
            bossImage.src = 'images/FinaleBoss.png';
            break;
        default:
            console.error('Invalid boss type:', bossData.bossType);  // 잘못된 보스 타입 로그 추가
            return;
    }

    bossImage.onload = () => {
        const boss = new Boss(monsterPath, bossImage, bossData.level, serverSocket, bossData.bgm, bossData.skillSounds);
        monsters.push(boss);
        console.log(`Boss spawned with HP: ${bossData.hp}`);  // 보스 렌더링 완료 로그
    };

    bossImage.onerror = () => {
        console.error(`Failed to load boss image for ${bossData.bossType}`);  // 이미지 로드 실패 로그
    };
});

// 모든 클래스 내보내기
export { Boss, MightyBoss, TowerControlBoss, DoomsdayBoss, TimeRifter, FinaleBoss, BossUI };
