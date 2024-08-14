// server/handlers/boss/finaleBoss.handler.js
export default class FinaleBoss {
    constructor() {
        this.hp = 99999; // ??? 미지수
        this.armor = 0; // ??? 미지수
        this.speed = 1; // ??? 미지수
    }

    // 이 보스는 스킬이 없습니다.
    noSkills() {
        return `The Finale Boss has no skills but must be defeated within 30 seconds`;
    }
}

