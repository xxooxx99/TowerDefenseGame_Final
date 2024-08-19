import EventEmitter from 'events';
import { PacketType } from '../../constants.js';

export default class TimeRifter extends EventEmitter {
    constructor() {
        super();  // EventEmitter 생성자 호출
        this.hp = 700;
        this.defense = 10;
        this.speed = 3;
        this.skills = ['rewindHealth', 'accelerateTime', 'timeWave'];
        this.currentSkill = '';
        this.bgm = 'timeRifterBGM.mp3';  // 보스 전용 BGM
        this.rememberedHp = this.hp;  // 체력 되돌리기 스킬용 변수
    }

    useSkill(io, towers) {
        const randomSkill = this.getRandomSkill();
        this.currentSkill = randomSkill;

        // 스킬 효과음을 클라이언트에 전송
        io.emit('playSkillSound', { sound: 'bossskill.mp3' });
        io.emit(PacketType.S2C_BOSS_SKILL, { skill: randomSkill });

        switch (randomSkill) {
            case 'rewindHealth':
                this.rewindHealth(socket);
                break;
            case 'accelerateTime':
                this.accelerateTime(socket);
                break;
            case 'timeWave':
                this.timeWave(socket, towers);
                break;
        }

        // 스킬 사용 후 이벤트 발생
        this.emit('skillUsed', { skill: randomSkill, bossHp: this.hp });
    }

    rewindHealth(socket) {
        // 체력을 저장하고 5초 후 되돌림
        this.rememberedHp = this.hp;
        console.log(`Boss will rewind health to ${this.rememberedHp} in 5 seconds.`);

        setTimeout(() => {
            this.hp = this.rememberedHp;
            console.log(`Boss health rewound to ${this.hp}.`);

            // 체력 정보 클라이언트에 전송
            socket.emit('updateBossHp', { hp: this.hp });

            // 체력 회복 후 이벤트 발생
            this.emit('healthRewinded', { hp: this.hp });
        }, 5000);
    }

    accelerateTime(socket) {
        const originalSpeed = this.speed;
        this.speed += this.speed * 0.2;
        console.log(`Boss accelerates speed by 20%. Current speed: ${this.speed}`);

        // 클라이언트에 보스 속도 정보 전송
        socket.emit('updateBossSpeed', { speed: this.speed });

        // 3초 후 속도를 원래대로 복원
        setTimeout(() => {
            this.speed = originalSpeed;
            console.log(`Boss speed restored to ${this.speed}.`);

            // 복원된 속도 클라이언트에 전송
            socket.emit('updateBossSpeed', { speed: this.speed });

            // 속도 복원 후 이벤트 발생
            this.emit('speedRestored', { speed: this.speed });
        }, 3000);
    }

    timeWave(socket, towers) {
        console.log('Boss reduces all towers\' attack speed by 50% for 5 seconds.');

        // 타워들의 공격 속도를 50% 감소
        for (let towerType in towers) {
            for (let towerId in towers[towerType]) {
                towers[towerType][towerId].forEach(tower => {
                    tower.attackSpeed *= 0.5;  // 공격 속도 감소
                });
            }
        }

        // 클라이언트에 타워 공격 속도 감소 정보 전송
        socket.emit('timeWaveEffect', { effect: 'attackSpeedReduced' });

        // 5초 후 타워들의 공격 속도 복원
        setTimeout(() => {
            for (let towerType in towers) {
                for (let towerId in towers[towerType]) {
                    towers[towerType][towerId].forEach(tower => {
                        tower.attackSpeed *= 2;  // 공격 속도 복원
                    });
                }
            }

            // 클라이언트에 타워 공격 속도 복원 정보 전송
            socket.emit('timeWaveEffectEnd', { effect: 'attackSpeedRestored' });
            console.log('Tower attack speeds restored to normal.');

            // 공격 속도 복원 후 이벤트 발생
            this.emit('attackSpeedRestored');
        }, 5000);
    }

    getRandomSkill() {
        const randomIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randomIndex];
    }
}
