import EventEmitter from 'events';
import { PacketType } from '../../constants.js';

export default class TowerControlBoss extends EventEmitter {
    constructor(socket) {
        super();  
        this.hp = 700;
        this.defense = 0;
        this.speed = 5;
        this.skills = ['ignoreTowerDamage', 'changeTowerType', 'downgradeTower'];
        this.currentSkill = '';
        this.bgm = 'towerControlBossBGM.mp3';
        this.ignoredTowerId = null;
        this.socket = socket;
    }

    useSkill(io, towers) {
        const randomSkill = this.getRandomSkill();
        this.currentSkill = randomSkill;

        io.emit('playSkillSound', { sound: 'bossskill.mp3' });
        io.emit(PacketType.S2C_BOSS_SKILL, { skill: randomSkill });

        switch (randomSkill) {
            case 'ignoreTowerDamage':
                this.ignoreTowerDamage(towers);
                break;
            case 'changeTowerType':
                this.changeTowerType(towers);
                break;
            case 'downgradeTower':
                this.downgradeTower(towers);
                break;
        }

        this.emit('skillUsed', { skill: randomSkill });
    }

    ignoreTowerDamage(towers) {
        const randomTower = this.getRandomTower(towers);
        if (randomTower) {
            this.ignoredTowerId = randomTower.towerId;
            console.log(`Boss ignores damage from tower ID: ${this.ignoredTowerId} for 10 seconds.`);
            this.socket.emit('ignoreTowerDamage', { towerId: this.ignoredTowerId });

            setTimeout(() => {
                console.log(`Boss stops ignoring damage from tower ID: ${this.ignoredTowerId}.`);
                this.ignoredTowerId = null;
                this.emit('ignoreEnd', { towerId: this.ignoredTowerId });
            }, 10000);
        }
    }

    changeTowerType(towers) {
        const randomTower = this.getRandomTower(towers);
        if (randomTower) {
            const newType = this.getRandomTowerType();
            randomTower.type = newType;
            console.log(`Boss changes tower ID: ${randomTower.towerId} to type: ${newType}.`);
            this.socket.emit('changeTowerType', { towerId: randomTower.towerId, newType: newType });
            this.emit('towerTypeChanged', { towerId: randomTower.towerId, newType: newType });
        }
    }

    downgradeTower(towers) {
        const randomTower = this.getRandomTower(towers);
        if (randomTower && randomTower.level > 1) {
            randomTower.level -= 1;
            console.log(`Boss downgrades tower ID: ${randomTower.towerId} to level: ${randomTower.level}.`);
            this.socket.emit('downgradeTower', { towerId: randomTower.towerId, newLevel: randomTower.level });
            this.emit('towerDowngraded', { towerId: randomTower.towerId, newLevel: randomTower.level });
        } else {
            console.log('No eligible tower to downgrade.');
        }
    }

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

    getRandomTowerType() {
        const towerTypes = ['Archer', 'Mage', 'Cannon'];
        return towerTypes[Math.floor(Math.random() * towerTypes.length)];
    }

    getRandomSkill() {
        const randomIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randomIndex];
    }
}
