import { BossSkills } from './bossSkills.js';  // bossSkills.js에서 보스 스킬 로직을 불러옴

class Boss {
    constructor(socket, path, hp, defense, speed, skills, towers, bgm = null, skillSounds = null, imagePath = null) {
        this.hp = hp;
        this.maxHp = hp;
        this.defense = defense;
        this.speed = speed;
        this.skills = skills;
        this.socket = socket;
        this.towers = towers;
        this.bgm = bgm;
        this.skillSounds = skillSounds;
        // this.bossSkills = new BossSkills(this, this.towers, this.socket);  // 보스 스킬 관련 주석 처리
        this.monsterIndex = null;

        // path가 undefined일 경우 에러 처리 및 경고 메시지 추가
        if (!path || !Array.isArray(path) || path.length === 0) {
            throw new Error('보스의 이동 경로가 필요합니다. 전달된 경로:', path);
        }

        this.path = path;
        this.currentPathIndex = 0;
        this.x = this.path[0].x;
        this.y = this.path[0].y;
        this.width = 100;
        this.height = 100;

        // 이미지 경로가 제대로 전달되었는지 확인
        if (imagePath) {
            this.image = new Image();
            this.image.src = imagePath;
        } else {
            console.error("Error: imagePath is not defined.");
        }

        // UI 요소 미리 참조
        this.hpElement = document.getElementById(`${this.constructor.name}-hp`);
        this.skillElement = document.getElementById('boss-skill');
    }

    // startSkills() {
    //     setInterval(() => {
    //         const randomSkill = this.skills[Math.floor(Math.random() * this.skills.length)];
    //         this.bossSkills.useSkill(randomSkill);  // 스킬 사용 관련 주석 처리
    //     }, 10000);  // 10초마다 스킬 사용
    // }

    draw(ctx) {
        if (!this.image) return;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    move() {
        if (this.currentPathIndex < this.path.length - 1) {
            const target = this.path[this.currentPathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.x = target.x;
                this.y = target.y;
                this.currentPathIndex++;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }

    init() {
        // this.socket.on('bossSkill', (data) => {  // 스킬 이벤트 수신 관련 주석 처리
        //     console.log(`Boss is using skill: ${data.skill}`);
        //     this.bossSkills.useSkill(data.skill);
        // });

        this.socket.on('updateBossHp', (data) => {
            this.hp = data.hp;
            this.updateUI();
        });

        this.socket.on('towerDestroyed', (data) => {
            console.log(`Tower at (${data.x}, ${data.y}) destroyed.`);
        });

        this.socket.on('placeMark', (data) => {
            console.log(`Mark placed at (${data.x}, ${data.y}) with image: ${data.image}`);
        });

        this.playBGM();
    }

    playBGM() {
        if (this.bgm) {
            this.bgmAudio = new Audio(this.bgm);
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.1;
            this.bgmAudio.preload = 'auto';
            this.bgmAudio.play();
        }
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }

    updateUI(skill = null) {
        if (this.hpElement) {
            this.hpElement.textContent = `HP: ${this.hp}`;
        }

        if (this.skillElement && skill) {
            this.skillElement.textContent = `Current Skill: ${skill}`;
        }
    }

    onDie() {
        this.isBossAlive = false;
        this.stopBGM();
    }
}

// MightyBoss, TowerControlBoss, DoomsdayBoss 등 개별 보스 클래스를 Boss 클래스에 상속
class MightyBoss extends Boss {
    constructor(path, socket, towers, bgm, skillSounds) {
        console.log('Received path in MightyBoss:', path); 
        super(socket, path, 2000, 50, 0.6, ['healSkill', 'spawnClone', 'reduceDamage'], towers, bgm, skillSounds, './images/MightyBoss.png');
    }
    move() {
        super.move();
    }
}

class TowerControlBoss extends Boss {
    constructor(socket, towers, bgm, skillSounds) {
        super(socket, 1500, 30, 1.5, ['ignoreTowerDamage', 'changeTowerType', 'downgradeTower'], towers, bgm, skillSounds, './images/TowerControlBoss.png');
    }

    move() {
        // TowerControlBoss의 특화된 이동 로직을 추가
        super.move();
    }
}

class TimeRifter extends Boss {
    constructor(socket, towers, bgm, skillSounds) {
        super(socket, 1000, 20, 2.0, ['rewindHealth', 'accelerateTime', 'timeWave'], towers, bgm, skillSounds, './images/TimeRifter.png');
    }

    move() {
        // TimeRifter의 특화된 이동 로직을 추가
        super.move();
    }
}

class DoomsdayBoss extends Boss {
    constructor(socket, towers, bgm, skillSounds) {
        super(socket, 3000, 60, 0.8, ['placeMark', 'cryOfDoom', 'absorbDamage'], towers, bgm, skillSounds, './images/DoomsdayBoss.png');
    }

    move() {
        // DoomsdayBoss의 특화된 이동 로직을 추가
        super.move();
    }
}

class FinaleBoss extends Boss {
    constructor(socket, bgm) {
        super(socket, 99999999, 0, 1, [], null, bgm, './images/Finaleboss.png');
        this.playerDamage = {};
    }

    move() {
        // FinaleBoss의 특화된 이동 로직을 추가
        super.move();
    }

    init() {
        super.init();

        this.socket.on('updateDamage', (data) => {
            this.playerDamage[data.playerId] = data.damage;
            this.updateDamageUI();
        });

        this.socket.on('gameOver', (data) => {
            if (data.loser === this.socket.id) {
                alert('You lost! You dealt the least damage to the FinaleBoss.');
            } else {
                alert('You won! Your opponent dealt less damage to the FinaleBoss.');
            }
            this.stopBGM();
        });
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

    trackDamage(playerId, damage) {
        if (!this.playerDamage[playerId]) {
            this.playerDamage[playerId] = 0;
        }
        this.playerDamage[playerId] += damage;
        this.updateDamageUI();
    }

    startFinale(socket, players) {
        let timeLeft = 60;
        const timerElement = document.getElementById('timer');

        const intervalId = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = `Time left: ${timeLeft} seconds`;
            }
            if (timeLeft <= 0) {
                clearInterval(intervalId);
            }
        }, 1000);

        setTimeout(() => {
            let losingPlayer = null;
            let minDamage = Infinity;

            for (const playerId in this.playerDamage) {
                if (this.playerDamage[playerId] < minDamage) {
                    minDamage = this.playerDamage[playerId];
                    losingPlayer = playerId;
                }
            }

            console.log(`Player ${losingPlayer} dealt the least damage.`);
            socket.emit('gameOver', { loser: losingPlayer });
        }, 60000);
    }
}

export { Boss, MightyBoss, TowerControlBoss, DoomsdayBoss, TimeRifter, FinaleBoss };
