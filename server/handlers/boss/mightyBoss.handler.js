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
        console.log('보스가 최대 체력의 10%를 회복하였습니다.');

        // 클라이언트에 보스 체력 정보 전송
        this.socket.emit('updateBossHp', { hp: this.hp });

        // 스킬 사용 후 이벤트 발생
        this.emit('skillUsed', { skill: 'healSkill', hp: this.hp });
    }

    spawnClone() {
        const cloneHp = this.hp * 0.5;
        console.log(`보스가 클론을 소환하였습니다.`);

        const clone = new MightyBoss(this.socket);
        clone.hp = cloneHp;

        // 클론 정보 클라이언트에 전송
        this.socket.emit('bossSpawn', {
            bossType: 'Clone',
            hp: clone.hp,
            defense: clone.defense,
            speed: clone.speed,
        });

        // 스킬 사용 후 이벤트 발생
        this.emit('skillUsed', { skill: 'spawnClone', cloneHp: clone.hp });
    }

    reduceDamage() {
        this.defense *= 0.5;
        console.log('보스가 5초동안 받는 피해를 50%로 감소시킵니다.');

        // 클라이언트에 방어력 감소 정보 전송
        this.socket.emit('updateBossDefense', { defense: this.defense });

        // 스킬 사용 후 이벤트 발생
        this.emit('skillUsed', { skill: 'reduceDamage', defense: this.defense });

        setTimeout(() => {
            this.defense *= 2;
            console.log('보스의 방어력 스킬의 지속시간이 종료되었습니다.');

            // 클라이언트에 방어력 복원 정보 전송
            socket.emit('updateBossDefense', { defense: this.defense });

            // 방어력 복원 후 이벤트 발생
            this.socket.emit('skillRestored', { defense: this.defense });
        }, 5000);
    }

    getRandomSkill() {
        const randomIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randomIndex];
    }
}
