import EventEmitter from 'events';
import { PacketType } from '../../constants.js';

export default class MightyBoss extends EventEmitter {
    constructor(socket) {
        super();
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.defense = 30;
        this.speed = 5;
        this.skills = ['healSkill', 'spawnClone', 'reduceDamage'];
        this.currentSkill = '';
        this.bgm = 'mightyBossBGM.mp3';
        this.socket = socket;
    }

    useSkill(io) {
        const randomSkill = this.getRandomSkill();
        this.currentSkill = randomSkill;

        io.emit('playSkillSound', { sound: 'bossskill.mp3' });
        io.emit(PacketType.S2C_BOSS_SKILL, { skill: randomSkill });

        switch (randomSkill) {
            case 'healSkill':
                this.healSkill();
                break;
            case 'spawnClone':
                this.spawnClone();
                break;
            case 'reduceDamage':
                this.reduceDamage();
                break;
        }
    }

    healSkill() {
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.1);
        console.log('Boss healed 10% of max HP.');
        this.socket.emit('updateBossHp', { hp: this.hp });
        this.emit('skillUsed', { skill: 'healSkill', hp: this.hp });
    }

    spawnClone() {
        const cloneHp = this.hp * 0.5;
        console.log('Boss spawned a clone.');

        const clone = new MightyBoss(this.socket);
        clone.hp = cloneHp;

        this.socket.emit('bossSpawn', {
            bossType: 'Clone',
            hp: clone.hp,
            defense: clone.defense,
            speed: clone.speed,
        });

        this.emit('skillUsed', { skill: 'spawnClone', cloneHp: clone.hp });
    }

    reduceDamage() {
        this.defense *= 0.5;
        console.log('Boss reduces incoming damage by 50% for 5 seconds.');
        this.socket.emit('updateBossDefense', { defense: this.defense });
        this.emit('skillUsed', { skill: 'reduceDamage', defense: this.defense });

        setTimeout(() => {
            this.defense *= 2;
            console.log('Boss defense restored.');
            this.socket.emit('updateBossDefense', { defense: this.defense });
        }, 5000);
    }

    getRandomSkill() {
        const randomIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randomIndex];
    }
}
