export class BossSkills {
    constructor(boss, towers, socket) {
        this.boss = boss;
        this.towers = towers;
        this.socket = socket;
    }

    useSkill(skill) {
        switch (skill) {
            // MightyBoss Skills
            case 'healSkill':
                this.healSkill();
                break;
            case 'spawnClone':
                this.spawnClone();
                break;
            case 'reduceDamage':
                this.reduceDamage();
                break;
            // DoomsdayBoss Skills
            case 'placeMark':
                this.placeMark();
                break;
            case 'cryOfDoom':
                this.cryOfDoom();
                break;
            case 'absorbDamage':
                this.absorbDamage();
                break;
            // TimeRifter Skills
            case 'rewindHealth':
                this.rewindHealth();
                break;
            case 'accelerateTime':
                this.accelerateTime();
                break;
            case 'timeWave':
                this.timeWave();
                break;
            // TowerControlBoss Skills
            case 'ignoreTowerDamage':
                this.ignoreTowerDamage();
                break;
            case 'changeTowerType':
                this.changeTowerType();
                break;
            case 'downgradeTower':
                this.downgradeTower();
                break;
            default:
                console.log('Unknown skill:', skill);
        }
    }

    // MightyBoss Skills
    healSkill() {
        this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + this.boss.maxHp * 0.1);
        console.log('Boss healed 10% of max HP.');
        this.updateBossHp();
    }

    spawnClone() {
        console.log('Boss spawned a clone with 50% HP.');
        const cloneHp = this.boss.hp * 0.5;
        const clone = { hp: cloneHp, defense: this.boss.defense, speed: this.boss.speed };
        console.log('Clone details:', clone);
    }

    reduceDamage() {
        console.log('Boss reduces damage by 50% for 5 seconds.');
        this.boss.defense *= 0.5;
        setTimeout(() => {
            this.boss.defense *= 2;
            console.log('Boss defense restored.');
        }, 5000);
    }

    // DoomsdayBoss Skills
    placeMark() {
        const randomX = Math.floor(Math.random() * 800);
        const randomY = Math.floor(Math.random() * 600);

        console.log('Boss placed a mark at a random location:', randomX, randomY);

        // 클라이언트 측 마킹된 타워 표시
        this.socket.emit('placeMark', {
            x: randomX,
            y: randomY,
            image: 'attack.png',
        });

        setTimeout(() => {
            const destroyedTower = this.checkAndDestroyTower(randomX, randomY);
            if (destroyedTower) {
                console.log(`Tower at (${randomX}, ${randomY}) destroyed by placeMark skill.`);
                this.socket.emit('towerDestroyed', { x: randomX, y: randomY });
            } else {
                console.log(`No tower found at (${randomX}, ${randomY}).`);
            }
        }, 5000);
    }

    checkAndDestroyTower(x, y) {
        for (let towerType in this.towers) {
            for (let towerId in this.towers[towerType]) {
                for (let i = 0; i < this.towers[towerType][towerId].length; i++) {
                    const tower = this.towers[towerType][towerId][i];
                    if (this.isWithinRange(tower, x, y)) {
                        this.towers[towerType][towerId].splice(i, 1);  // 타워 제거
                        return tower;
                    }
                }
            }
        }
        return null;
    }

    isWithinRange(tower, x, y) {
        const tolerance = 20;  // 타워 좌표와 비교할 허용 범위
        return Math.abs(tower.posX - x) < tolerance && Math.abs(tower.posY - y) < tolerance;
    }

    cryOfDoom() {
        this.boss.cryOfDoomStack = this.boss.cryOfDoomStack + 1 || 1;
        console.log(`Cry of Doom used. Stack: ${this.boss.cryOfDoomStack}`);
        if (this.boss.cryOfDoomStack >= 2) {
            this.boss.cryOfDoomStack = 0;
            this.boss.baseHp -= 1; 
            console.log('Base HP reduced by 1 due to Cry of Doom skill.');
        }
    }

    absorbDamage() {
        const initialHp = this.boss.hp;
        console.log('Boss starts absorbing damage for 5 seconds.');
        setTimeout(() => {
            const damageAbsorbed = initialHp - this.boss.hp;
            this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + damageAbsorbed * 0.5);
            console.log(`Boss absorbed ${damageAbsorbed * 0.5} HP and healed to ${this.boss.hp}.`);
            this.updateBossHp();
        }, 5000);
    }

    // TimeRifter Skills
    rewindHealth() {
        const rememberedHp = this.boss.hp;
        console.log(`Boss will rewind health to ${rememberedHp} in 5 seconds.`);
        setTimeout(() => {
            this.boss.hp = rememberedHp;
            console.log(`Boss health rewound to ${this.boss.hp}.`);
            this.updateBossHp();
        }, 5000);
    }

    accelerateTime() {
        const originalSpeed = this.boss.speed;
        this.boss.speed += this.boss.speed * 0.2;
        console.log(`Boss speed increased by 20%. Current speed: ${this.boss.speed}`);
        setTimeout(() => {
            this.boss.speed = originalSpeed;
            console.log(`Boss speed restored to ${this.boss.speed}.`);
        }, 3000);
    }

    timeWave() {
        console.log('Boss reduces all towers\' attack speed by 50% for 5 seconds.');
        for (let towerType in this.towers) {
            for (let towerId in this.towers[towerType]) {
                this.towers[towerType][towerId].forEach(tower => {
                    tower.attackSpeed *= 0.5;
                });
            }
        }
        setTimeout(() => {
            for (let towerType in this.towers) {
                for (let towerId in this.towers[towerType]) {
                    this.towers[towerType][towerId].forEach(tower => {
                        tower.attackSpeed *= 2;
                    });
                }
            }
            console.log('Tower attack speeds restored to normal.');
        }, 5000);
    }

    // TowerControlBoss Skills
    ignoreTowerDamage() {
        const randomTower = this.getRandomTower();
        if (randomTower) {
            this.boss.ignoredTowerId = randomTower.towerId;
            console.log(`Boss ignores damage from tower ID: ${this.boss.ignoredTowerId} for 10 seconds.`);
            setTimeout(() => {
                console.log(`Boss stops ignoring damage from tower ID: ${this.boss.ignoredTowerId}.`);
                this.boss.ignoredTowerId = null;
            }, 10000);
        }
    }

    changeTowerType() {
        const randomTower = this.getRandomTower();
        if (randomTower) {
            const newType = this.getRandomTowerType();
            randomTower.type = newType;
            console.log(`Boss changes tower ID: ${randomTower.towerId} to type: ${newType}.`);
        }
    }

    downgradeTower() {
        const randomTower = this.getRandomTower();
        if (randomTower && randomTower.level > 1) {
            randomTower.level -= 1;
            console.log(`Boss downgrades tower ID: ${randomTower.towerId} to level: ${randomTower.level}.`);
        } else {
            console.log('No eligible tower to downgrade.');
        }
    }

    getRandomTower() {
        const allTowers = [];
        for (let towerType in this.towers) {
            for (let towerId in this.towers[towerType]) {
                allTowers.push(...this.towers[towerType][towerId]);
            }
        }
        if (allTowers.length > 0) {
            return allTowers[Math.floor(Math.random() * allTowers.length)];
        }
        return null;
    }

    getRandomTowerType() {
        const towerTypes = ['Archer', 'Mage', 'Cannon'];
        return towerTypes[Math.floor(Math.random() * towerTypes.length)];
    }

    updateBossHp() {
        console.log(`Boss HP updated: ${this.boss.hp}`);
    }
}
