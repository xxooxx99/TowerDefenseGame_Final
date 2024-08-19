import EventEmitter from 'events';
import { PacketType } from '../../constants.js';

export default class DoomsdayBoss extends EventEmitter {
    constructor() {
        super();  // EventEmitter 생성자 호출
        this.hp = 1200;
        this.maxHp = 1200;
        this.defense = 40;
        this.speed = 1.5;
        this.skills = ['placeMark', 'cryOfDoom', 'absorbDamage'];
        this.currentSkill = '';
        this.bgm = 'doomsdayBossBGM.mp3';
        this.cryOfDoomStack = 0;
    }

    useSkill(io, towers, base) {
        const randomSkill = this.getRandomSkill();
        this.currentSkill = randomSkill;

        io.emit('playSkillSound', { sound: 'bossskill.mp3' });
        io.emit(PacketType.S2C_BOSS_SKILL, { skill: randomSkill });

        switch (randomSkill) {
            case 'placeMark':
                this.placeMark(socket, towers);  // 타워가 존재하는지 확인하고 파괴
                break;
            case 'cryOfDoom':
                this.cryOfDoom(socket, base);
                break;
            case 'absorbDamage':
                this.absorbDamage(socket);
                break;
        }
    }

    placeMark(socket, towers) {
        const randomX = Math.floor(Math.random() * 800);
        const randomY = Math.floor(Math.random() * 600);

        console.log('Boss places a mark at a random location.');

        socket.emit('placeMark', {
            x: randomX,
            y: randomY,
            image: 'attack.png',
        });

        setTimeout(() => {
            const destroyedTower = this.checkAndDestroyTower(randomX, randomY, towers);
            if (destroyedTower) {
                console.log(`Tower at (${randomX}, ${randomY}) destroyed by placeMark skill.`);
                socket.emit('towerDestroyed', { x: randomX, y: randomY });
            } else {
                console.log(`No tower found at (${randomX}, ${randomY}).`);
            }
        }, 5000);
    }

    checkAndDestroyTower(x, y, towers) {
        for (let towerType in towers) {
            for (let towerId in towers[towerType]) {
                for (let i = 0; i < towers[towerType][towerId].length; i++) {
                    const tower = towers[towerType][towerId][i];
                    if (this.isWithinRange(tower, x, y)) {
                        towers[towerType][towerId].splice(i, 1);  // 타워 제거
                        return tower;
                    }
                }
            }
        }
        return null;
    }

    isWithinRange(tower, x, y) {
        const tolerance = 20;  // 좌표 비교에 사용할 허용 범위
        return Math.abs(tower.posX - x) < tolerance && Math.abs(tower.posY - y) < tolerance;
    }

    cryOfDoom(socket, base) {
        this.cryOfDoomStack += 1;
        console.log(`Cry of Doom used. Stack: ${this.cryOfDoomStack}`);

        if (this.cryOfDoomStack >= 2) {
            this.cryOfDoomStack = 0;
            base.hp -= 1;
            console.log('Base HP reduced by 1 due to Cry of Doom skill.');
            socket.emit('updateBaseHp', { hp: base.hp });

            if (base.hp <= 0) {
                console.log('Base has been destroyed.');
                socket.emit('gameOver', { isWin: false });
            }
        }
    }

    absorbDamage(socket) {
        const initialHp = this.hp;
        console.log('Boss starts absorbing damage for 5 seconds.');

        setTimeout(() => {
            const damageAbsorbed = initialHp - this.hp;
            this.hp = Math.min(this.maxHp, this.hp + damageAbsorbed * 0.5);
            console.log(`Boss absorbed ${damageAbsorbed * 0.5} HP and healed to ${this.hp}.`);
            socket.emit('updateBossHp', { hp: this.hp });
        }, 5000);
    }

    takeDamage(damage) {
        this.hp -= damage;
        console.log(`Boss took ${damage} damage. Remaining HP: ${this.hp}`);

        if (this.hp <= 0) {
            this.die();  // 보스가 사망했을 때 die 메서드 호출
        }
    }

    die() {
        console.log('DoomsdayBoss has been defeated.');
        this.emit('die');  // 'die' 이벤트 발생
    }

    getRandomSkill() {
        const randomIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randomIndex];
    }
}
