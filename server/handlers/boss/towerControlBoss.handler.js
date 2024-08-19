export default class TowerControlBoss {
    constructor() {
        this.hp = 700;
        this.defense = 0;
        this.speed = 5;
        this.skills = ['ignoreTowerDamage', 'changeTowerType', 'downgradeTower'];
        this.currentSkill = '';
        this.bgm = 'towerControlBossBGM.mp3';  // 보스 전용 BGM
        this.ignoredTowerId = null;  // 무시된 타워 ID 저장
    }

    useSkill(socket, towers) {
        const randomSkill = this.getRandomSkill();
        this.currentSkill = randomSkill;

        socket.emit('playSkillSound', { sound: 'bossskill.mp3' });

        switch (randomSkill) {
            case 'ignoreTowerDamage':
                this.ignoreTowerDamage(socket, towers);
                break;
            case 'changeTowerType':
                this.changeTowerType(socket, towers);
                break;
            case 'downgradeTower':
                this.downgradeTower(socket, towers);
                break;
        }
    }

    ignoreTowerDamage(socket, towers) {
        // 랜덤한 타워 선택
        const randomTower = this.getRandomTower(towers);
        if (randomTower) {
            this.ignoredTowerId = randomTower.towerId;
            console.log(`Boss ignores damage from tower ID: ${this.ignoredTowerId} for 10 seconds.`);

            // 클라이언트에 무시된 타워 정보 전송
            socket.emit('ignoreTowerDamage', { towerId: this.ignoredTowerId });

            // 10초 후 무시 해제
            setTimeout(() => {
                console.log(`Boss stops ignoring damage from tower ID: ${this.ignoredTowerId}.`);
                this.ignoredTowerId = null;
            }, 10000);
        }
    }

    changeTowerType(socket, towers) {
        // 랜덤한 타워 선택
        const randomTower = this.getRandomTower(towers);
        if (randomTower) {
            const newType = this.getRandomTowerType();
            randomTower.type = newType;
            console.log(`Boss changes tower ID: ${randomTower.towerId} to type: ${newType}.`);

            // 클라이언트에 타워 유형 변경 정보 전송
            socket.emit('changeTowerType', { towerId: randomTower.towerId, newType: newType });
        }
    }

    downgradeTower(socket, towers) {
        // 랜덤한 타워 선택
        const randomTower = this.getRandomTower(towers);
        if (randomTower && randomTower.level > 1) {
            randomTower.level -= 1;
            console.log(`Boss downgrades tower ID: ${randomTower.towerId} to level: ${randomTower.level}.`);

            // 클라이언트에 타워 레벨 감소 정보 전송
            socket.emit('downgradeTower', { towerId: randomTower.towerId, newLevel: randomTower.level });
        } else {
            console.log('No eligible tower to downgrade.');
        }
    }

    // 랜덤한 타워 선택
    getRandomTower(towers) {
        const allTowers = [];
        for (let towerType in towers) {
            for (let towerId in towers[towerType]) {
                allTowers.push(towers[towerType][towerId]);
            }
        }

        if (allTowers.length > 0) {
            return allTowers[Math.floor(Math.random() * allTowers.length)];
        }
        return null;
    }

    // 랜덤한 타워 유형 반환
    getRandomTowerType() {
        const towerTypes = ['Archer', 'Mage', 'Cannon'];  // 타워 유형 예시
        return towerTypes[Math.floor(Math.random() * towerTypes.length)];
    }

    getRandomSkill() {
        const randomIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randomIndex];
    }
}
