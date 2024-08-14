// server/handlers/boss/towerControlBoss.handler.js
export default class TowerControlBoss {
    constructor() {
        this.hp = 700;
        this.armor = 0;
        this.speed = 5;
        this.skills = [
            this.ignoreTowerDamage.bind(this),
            this.changeTowerType.bind(this),
            this.downgradeTower.bind(this),
        ];
    }

    // 타워 무시 스킬
    ignoreTowerDamage() {
        return `Boss ignores damage from a random tower for 10 seconds`;
    }

    // 타워 유형 변경 스킬
    changeTowerType() {
        return `Boss changes the type of a random tower`;
    }

    // 타워 레벨 감소 스킬
    downgradeTower() {
        return `Boss downgrades a random tower by one level`;
    }

    // 스킬 실행
    useSkill() {
        const skill = this.skills[Math.floor(Math.random() * this.skills.length)];
        return skill();
    }
}
