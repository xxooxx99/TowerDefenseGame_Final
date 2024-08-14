// server/handlers/boss/timeRifter.handler.js
export default class TimeRifter {
    constructor() {
        this.hp = 700;
        this.armor = 10;
        this.speed = 3;
        this.skills = [
            this.rewindHealth.bind(this),
            this.accelerateTime.bind(this),
            this.timeWave.bind(this),
        ];
    }

    // 체력 회복 스킬
    rewindHealth() {
        this.rememberedHp = this.hp;
        setTimeout(() => {
            this.hp = this.rememberedHp;
        }, 5000);
        return `Boss will rewind health to ${this.rememberedHp} in 5 seconds`;
    }

    // 시간 가속 스킬
    accelerateTime() {
        this.speed += this.speed * 0.20;
        return `Boss accelerates its speed by 20% for 3 seconds`;
    }

    // 시간 파동 스킬
    timeWave() {
        return `Boss reduces all towers' attack speed by 50%`;
    }

    // 스킬 실행
    useSkill() {
        const skill = this.skills[Math.floor(Math.random() * this.skills.length)];
        return skill();
    }
}

