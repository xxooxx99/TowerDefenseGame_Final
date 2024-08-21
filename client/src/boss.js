import { Monster } from './monster.js';
import { BossSkills } from './bossSkills.js'; 
import SKILL_SOUNDS from './BossSkillSound.js';

class Boss extends Monster {
    constructor(socket, path, monsterImages, level, hp, defense, speed, skills, towers, bgm, skillSounds, imagePath) { // imagePath 추가
        super(path, monsterImages, level, hp); 

        this.x = path[0].x;
        this.y = path[0].y;
        
        // 보스의 크기를 설정 (원하는 크기로 설정)
        this.width = 80;
        this.height = 80;
        console.log(`Boss spawned at x: ${this.x}, y: ${this.y}`);
        
        this.defense = defense;
        this.speed = speed;
        this.skills = skills;
        this.socket = socket;
        this.towers = towers;
        this.bgm = bgm;
        this.skillSounds = skillSounds || SKILL_SOUNDS.defaultSkillSound;
        this.imagePath = imagePath; // imagePath 설정
        this.imageLoaded = false; // 이미지 로드 상태를 추적하는 변수

        this.loadImage(this.imagePath); 

        this.bossSkills = new BossSkills(this, this.towers, this.socket);
        this.bgmAudio = new Audio(this.bgm);
        this.skillAudio = new Audio();

        // 추가 UI 요소
        this.hpElement = document.getElementById(`${this.constructor.name}-hp`);
        this.skillElement = document.getElementById('boss-skill');
    }

    loadImage(imagePath) {
        this.image = new Image();
        this.image.onload = () => {
            console.log(`${this.constructor.name} image loaded successfully.`);
            this.imageLoaded = true; // 이미지가 로드된 후 true로 설정
        };
        this.image.onerror = () => {
            console.error(`Failed to load ${this.constructor.name} image.`);
        };
        this.image.src = imagePath;
    }

    draw(ctx) {
        // if (!this.imageLoaded) {
        //     return; // 이미지가 로드되지 않았으면 그리기를 건너뜁니다.
        // }
        console.log(`Drawing boss at x: ${this.x}, y: ${this.y}, width: ${this.width}, height: ${this.height}`);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    move() {
        super.move(); // 부모 클래스의 move 메서드를 호출하여 보스를 이동시킵니다.
    }

    updateUI() {
        if (this.hpElement) {
            this.hpElement.textContent = `HP: ${this.hp}`;
        }

        if (this.skillElement) {
            this.skillElement.textContent = `Active Skill: ${this.skills.join(', ')}`;
        }
    }

    playBGM() {
        // BGM 오디오 객체와 경로가 모두 유효한지 확인
        if (this.bgmAudio && typeof this.bgm === 'string') {  
            this.bgmAudio.src = this.bgm;  // this.bgm이 문자열 경로여야 함
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.1;
            
            this.bgmAudio.play().catch(err => {
                console.error(`Failed to play BGM: ${err}`);
            });
        } else {
            console.error('BGM audio file not found or invalid path.');
        }
    }

    stopBGM() {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
    }

    playSkillSound(skill) {
        if (this.skillSounds && this.skillSounds[skill]) {
            this.skillAudio.src = this.skillSounds[skill];
            this.skillAudio.play();
        } else {
            console.warn(`No skill sound found for skill: ${skill}`);
        }
    }

    useSkill(skill) {
        this.playSkillSound(skill); 
        this.bossSkills.useSkill(skill); 
    }

    BossDie() {
        this.isBossAlive = false;
        this.stopBGM(); 
        if (typeof this.onDie === 'function') {
            console.log('Boss Monster is dead. Triggering onDie callback.');
            this.onDie(this);
        }
    }
}

// 각 보스 클래스는 Boss 클래스를 상속받아 개별적인 특성을 추가합니다.
class MightyBoss extends Boss {
    constructor(socket, path, towers, skillSounds) {
        const monsterImages = ['images/MightyBoss.png']; 
        const bgm = '/sounds/Boss_bgm.mp3';  // 올바른 경로 설정
        super(socket, path, monsterImages, 1, 2000, 50, 0.6, ['healSkill', 'spawnClone', 'reduceDamage'], towers, bgm, skillSounds, monsterImages[0]);  // 경로 전달
    }
}

class TowerControlBoss extends Boss {
    constructor(socket, path, towers, bgm, skillSounds) {
        const monsterImages = ['images/TowerControlBoss.png'];
        super(socket, path, monsterImages, 1, 1500, 30, 1.5, ['ignoreTowerDamage', 'changeTowerType', 'downgradeTower'], towers, bgm, skillSounds, monsterImages[0]);
    }
}

class TimeRifter extends Boss {
    constructor(socket, path, towers, bgm, skillSounds) {
        const monsterImages = ['images/TimeRifter.png'];
        super(socket, path, monsterImages, 1, 1000, 20, 2.0, ['rewindHealth', 'accelerateTime', 'timeWave'], towers, bgm, skillSounds, monsterImages[0]);
    }
}

class DoomsdayBoss extends Boss {
    constructor(socket, path, towers, bgm, skillSounds) {
        const monsterImages = ['images/DoomsdayBoss.png'];
        super(socket, path, monsterImages, 1, 3000, 60, 0.8, ['placeMark', 'cryOfDoom', 'absorbDamage'], towers, bgm, skillSounds, monsterImages[0]);
    }
}

class FinaleBoss extends Boss {
    constructor(socket, path, towers, bgm, skillSounds) {
        const monsterImages = ['images/Finaleboss.png'];
        super(socket, path, monsterImages, 1, 99999999, 0, 1, [], towers, bgm, skillSounds, monsterImages[0]);
        this.playerDamage = {}; 
    }

    updateDamageUI() {
        const playerDamageElement = document.getElementById('player-damage');
        const enemyDamageElement = document.getElementById('enemy-damage');

        if (playerDamageElement) {
            playerDamageElement.textContent = `Your Damage: ${this.playerDamage[this.socket.id] || 0}`;
        }
        if (enemyDamageElement) {
            enemyDamageElement.textContent = `Enemy Damage: ${this.playerDamage.enemyId || 0}`;
        }
    }
}

export { Boss, MightyBoss, TowerControlBoss, DoomsdayBoss, TimeRifter, FinaleBoss };
