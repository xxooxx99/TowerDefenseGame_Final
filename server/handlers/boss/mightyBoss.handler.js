// server/handlers/boss/mightyBoss.handler.js
export default class MightyBoss {
    constructor() {
        this.hp = 1000;
        this.armor = 30;
        this.speed = 5;
        this.skills = [
            this.healSkill.bind(this),
            this.spawnClone.bind(this),
            this.reduceDamage.bind(this),
        ];
    }

    // 체력 회복 스킬
    healSkill() {
        const healAmount = this.hp * 0.10;
        this.hp += healAmount;
        return `Boss heals for ${healAmount}`;
    }

    // 분신 소환 스킬
    spawnClone() {
        const cloneHp = this.hp * 0.30;
        return `Boss spawns a clone with ${cloneHp} HP`;
    }

    // 피해 감소 스킬
    reduceDamage() {
        return `Boss takes 50% reduced damage for 5 seconds`;
    }

    // 스킬 실행
    useSkill() {
        const skill = this.skills[Math.floor(Math.random() * this.skills.length)];
        return skill();
    }
}
