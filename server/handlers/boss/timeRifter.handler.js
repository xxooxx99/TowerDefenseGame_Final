import EventEmitter from 'events';
import { PacketType } from '../../constants.js';

export default class TimeRifter extends EventEmitter {
    constructor(socket) {
        super();  
        this.hp = 700;
        this.defense = 10;
        this.speed = 3;
        this.skills = ['rewindHealth', 'accelerateTime', 'timeWave'];
        this.currentSkill = '';
        this.bgm = 'timeRifterBGM.mp3';  
        this.rememberedHp = this.hp;
        this.socket = socket;
    }

    useSkill(io, towers) {
        const randomSkill = this.getRandomSkill();
        this.currentSkill = randomSkill;

        io.emit('playSkillSound', { sound: 'bossskill.mp3' });
        io.emit(PacketType.S2C_BOSS_SKILL, { skill: randomSkill });

        switch (randomSkill) {
            case 'rewindHealth':
                this.rewindHealth();
                break;
            case 'accelerateTime':
                this.accelerateTime();
                break;
            case 'timeWave':
                this.timeWave(towers);
                break;
        }

        this.emit('skillUsed', { skill: randomSkill, bossHp: this.hp });
    }

    rewindHealth() {
        this.rememberedHp = this.hp;
        console.log(`Boss will rewind health to ${this.rememberedHp} in 5 seconds.`);

        setTimeout(() => {
            this.hp = this.rememberedHp;
            console.log(`Boss health rewound to ${this.hp}.`);
            this.socket.emit('updateBossHp', { hp: this.hp });
        }, 5000);
    }

    accelerateTime() {
        const originalSpeed = this.speed;
        this.speed += this.speed * 0.2;
        console.log(`Boss accelerates speed by 20%. Current speed: ${this.speed}`);
        this.socket.emit('updateBossSpeed', { speed: this.speed });

        setTimeout(() => {
            this.speed = originalSpeed;
            console.log(`Boss speed restored to ${this.speed}.`);
            this.socket.emit('updateBossSpeed', { speed: this.speed });
        }, 3000);
    }

    timeWave(towers) {
        console.log('Boss reduces all towers\' attack speed by 50% for 5 seconds.');

        for (let towerType in towers) {
            for (let towerId in towers[towerType]) {
                towers[towerType][towerId].forEach(tower => {
                    tower.attackSpeed *= 0.5;
                });
            }
        }

        this.socket.emit('timeWaveEffect', { effect: 'attackSpeedReduced' });

        setTimeout(() => {
            for (let towerType in towers) {
                for (let towerId in towers[towerType]) {
                    towers[towerType][towerId].forEach(tower => {
                        tower.attackSpeed *= 2;
                    });
                }
            }
            this.socket.emit('timeWaveEffectEnd', { effect: 'attackSpeedRestored' });
            console.log('Tower attack speeds restored to normal.');
        }, 5000);
    }

    getRandomSkill() {
        const randomIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randomIndex];
    }
}
