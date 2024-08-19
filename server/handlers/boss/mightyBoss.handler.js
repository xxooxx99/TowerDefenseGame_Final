export default class MightyBoss {
    constructor() {
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.defense = 30;
        this.speed = 5;
        this.skills = ['healSkill', 'spawnClone', 'reduceDamage'];
        this.currentSkill = '';
        this.bgm = 'mightyBossBGM.mp3';
    }

    useSkill(socket) {
        const randomSkill = this.getRandomSkill();
        this.currentSkill = randomSkill;

        socket.emit('playSkillSound', { sound: 'bossskill.mp3' });

        switch (randomSkill) {
            case 'healSkill':
                this.healSkill(socket);
                break;
            case 'spawnClone':
                this.spawnClone(socket);
                break;
            case 'reduceDamage':
                this.reduceDamage(socket);
                break;
        }
    }

    healSkill(socket) {
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.1);
        console.log('Boss healed 10% of max HP.');

        // 클라이언트에 보스 체력 정보 전송
        socket.emit('updateBossHp', { hp: this.hp });
    }

    spawnClone(socket) {
        const cloneHp = this.hp * 0.5;
        console.log(`Boss spawned a clone with ${cloneHp} HP.`);

        const clone = new MightyBoss();
        clone.hp = cloneHp;

        // 클론 정보 클라이언트에 전송
        socket.emit('bossSpawn', {
            bossType: 'Clone',
            hp: clone.hp,
            defense: clone.defense,
            speed: clone.speed,
        });
    }

    reduceDamage(socket) {
        this.defense *= 0.5;
        console.log('Boss reduces incoming damage by 50% for 5 seconds.');

        // 클라이언트에 방어력 감소 정보 전송
        socket.emit('updateBossDefense', { defense: this.defense });

        setTimeout(() => {
            this.defense *= 2;
            console.log('Boss defense restored to normal.');

            // 클라이언트에 방어력 복원 정보 전송
            socket.emit('updateBossDefense', { defense: this.defense });
        }, 5000);
    }

    getRandomSkill() {
        const randomIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randomIndex];
    }
}
