// server/handlers/boss/doomsdayBoss.handler.js
export default class DoomsdayBoss {
    constructor() {
      this.hp = 1200;
      this.armor = 40;
      this.speed = 1.5;
        this.skills = [
            this.placeMark.bind(this),
            this.swapFields.bind(this),
            this.absorbDamage.bind(this),
        ];
    }

    // 폭발 표식 설정 스킬
    placeMark() {
        return `Boss places a mark that will explode after 5 seconds`;
    }

    // 필드 교체 스킬
    swapFields() {
        return `Boss swaps your field with the opponent's field`;
    }

    // 피해 흡수 스킬
    absorbDamage() {
        return `Boss absorbs damage and heals for the amount taken during the next 5 seconds`;
    }

    // 스킬 실행
    useSkill() {
        const skill = this.skills[Math.floor(Math.random() * this.skills.length)];
        return skill();
    }
}