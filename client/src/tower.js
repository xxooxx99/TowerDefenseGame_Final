import { towersData, towerImages } from './multi_game.js';

export class Tower {
  constructor(towerTypes, towerId, towerNumber, x, y) {
    // 생성자 안에서 타워들의 속성을 정의한다고 생각하시면 됩니다!
    for (let towerType in towersData) {
      if (towerType === towerTypes) {
        for (let i = 0; i < towersData[towerType].length; i++) {
          const towerIdData = towersData[towerType][i];
          if (towerIdData.id == towerId) {
            this.x = x; // 타워 이미지 x 좌표
            this.y = y; // 타워 이미지 y 좌표
            this.width = 39; // 타워 이미지 가로 길이 (이미지 파일 길이에 따라 변경 필요하며 세로 길이와 비율을 맞춰주셔야 합니다!)
            this.height = 75; // 타워 이미지 세로 길이
            this.beamDuration = 0; // 타워 광선 지속 시간
            this.target = []; // 타워 광선의 목표
            this.towerNumber = towerNumber;
            this.hits = towerIdData.hits || 1;
            this.criticalPercent = towerIdData.criticalPercent || 10;
            this.criticalDamage = towerIdData.criticalDamage || 1.2;

            this.towerId = towerIdData.id;
            this.towerType = towerType;
            this.attackPower = towerIdData.power;
            this.range = towerIdData.range;
            this.attackCycle = towerIdData.attackCycle;
            this.cooldown = towerIdData.attackCycle; // 타워 공격 쿨타임
            this.imageNum = (Math.trunc(towerId / 100) - 1) * 3 + (towerId % 100); // 나중에 중간에 7 곱해야함
            this.towerIdData = towerIdData;
          }
        }
      }
    }
  }

  draw(ctx) {
    ctx.drawImage(towerImages[this.imageNum], this.x, this.y, this.width, this.height);
    if (this.beamDuration > 0 && this.target.length != 0) {
      for (let i = 0; i < this.target.length; i++) {
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(
          this.target[i].x + this.target[i].width / 2,
          this.target[i].y + this.target[i].height / 2,
        );
        ctx.strokeStyle = 'skyblue';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.closePath();
      }
      this.beamDuration--;
    }
  }

  attack(monsters, towers, my = true) {
    if (this.cooldown <= 0) {
      if (this.target.length !== 0) this.target = [];

      let attackCount = this.hits;

      let extraPower = 0;
      let extraPowerTower = { towerId: null, towerNumber: null };
      let extraSpeed = 0;
      let extraSpeedTower = { towerId: null, towerNumber: null };

      const attackAssistTowers = towers.attackSupportTower;
      for (let attack in attackAssistTowers) {
        for (let i = attackAssistTowers[attack].length - 1; i >= 0; i--) {
          const bufTower = attackAssistTowers[attack][i];
          const distance = Math.sqrt(
            Math.pow(this.x - bufTower.x, 2) + Math.pow(this.y - bufTower.y, 2),
          );

          if (bufTower.bufRange > distance) {
            extraPower = bufTower.addDamage;
            extraPowerTower = { towerId: bufTower.towerId, towerNumber: bufTower.towerNumber };
          }
          if (extraPower) break;
        }
        if (extraPower) break;
      }

      const speedAssistTowers = towers.speedSupportTower;
      for (let speed in speedAssistTowers) {
        for (let i = speedAssistTowers[speed].length - 1; i >= 0; i--) {
          const bufTower = speedAssistTowers[speed][i];
          const distance = Math.sqrt(
            Math.pow(this.x - bufTower.x, 2) + Math.pow(this.y - bufTower.y, 2),
          );

          if (bufTower.bufRange > distance) {
            extraSpeed = bufTower.addSpeed;
            extraSpeedTower = bufTower.towerNumber;
          }
          if (extraSpeed) break;
        }
        if (extraSpeed) break;
      }

      for (let monster of monsters) {
        if (attackCount <= 0) break;

        const distance = Math.sqrt(
          Math.pow(this.x - monster.x, 2) + Math.pow(this.y - monster.y, 2),
        );

        if (distance <= this.range) {
          attackCount--;
          this.beamDuration = 30; // 광선 지속 시간 (0.5초)
          this.target.push(monster); // 광선의 목표 설정
        }

        if (attackCount != this.hits) {
          this.cooldown = this.attackCycle - extraSpeed;
          console.log(this.cooldown, this.attackCycle, extraSpeed);
          const time = new Date().getTime();
          return {
            monsters: this.target,
            isExistSpeed: extraSpeedTower,
            isExistPower: extraPowerTower,
            now: time,
          };
        }
      }
    }
    return false;
  }

  getTowerIndex() {
    return this.towerIndex;
  }

  setTowerIndex(index) {
    this.towerIndex = index;
  }

  getAttackPower() {
    return this.attackPower;
  }

  updateCooldown() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }
}

export class SplashTower extends Tower {
  constructor(towerTypes, towerId, towerNumber, x, y) {
    super(towerTypes, towerId, towerNumber, x, y);
    this.splashRange = this.towerIdData.splashRange;
  }

  attack(monsters, towers, my = true) {
    if (this.cooldown <= 0) {
      if (this.target.length !== 0) this.target = [];

      let attackCount = this.hits;

      let extraPower = 0;
      let extraPowerTower = { towerId: null, towerNumber: null };
      let extraSpeed = 0;
      let extraSpeedTower = { towerId: null, towerNumber: null };

      const attackAssistTowers = towers.attackSupportTower;
      for (let attack in attackAssistTowers) {
        for (let i = attackAssistTowers[attack].length - 1; i >= 0; i--) {
          const bufTower = attackAssistTowers[attack][i];
          const distance = Math.sqrt(
            Math.pow(this.x - bufTower.x, 2) + Math.pow(this.y - bufTower.y, 2),
          );

          if (bufTower.bufRange > distance) {
            extraPower = bufTower.addDamage;
            extraPowerTower = { towerId: bufTower.towerId, towerNumber: bufTower.towerNumber };
          }
          if (extraPower) break;
        }
        if (extraPower) break;
      }

      const speedAssistTowers = towers.speedSupportTower;
      for (let speed in speedAssistTowers) {
        for (let i = speedAssistTowers[speed].length - 1; i >= 0; i--) {
          const bufTower = speedAssistTowers[speed][i];
          const distance = Math.sqrt(
            Math.pow(this.x - bufTower.x, 2) + Math.pow(this.y - bufTower.y, 2),
          );

          if (bufTower.bufRange > distance) {
            extraSpeed = bufTower.addSpeed;
            extraSpeedTower = bufTower.towerNumber;
          }
          if (extraSpeed) break;
        }
        if (extraSpeed) break;
      }

      for (let monster of monsters) {
        if (attackCount <= 0) break;

        const distance = Math.sqrt(
          Math.pow(this.x - monster.x, 2) + Math.pow(this.y - monster.y, 2),
        );

        if (distance <= this.range) {
          attackCount--;
          this.beamDuration = 30; // 광선 지속 시간 (0.5초)
          this.target.push(monster); // 광선의 목표 설정

          for (let nighMonster of monsters) {
            const nighDistance = Math.sqrt(
              Math.pow(monster.x - nighMonster.x, 2) + Math.pow(monster.y - nighMonster.y, 2),
            );
            if (nighDistance <= this.splashRange) {
              this.target.push(nighDistance);
              console.log('스플래쉬 데미지 적중!');
            }
          }
        }

        if (attackCount != this.hits) {
          this.cooldown = this.attackCycle - extraSpeed;
          console.log(this.cooldown);
          const time = new Date().getTime();
          return {
            monsters: this.target,
            isExistSpeed: extraSpeedTower,
            isExistPower: extraPowerTower,
            now: time,
          };
        }
      }
    }
    return false;
  }
}

export class SpeedSupportTower extends Tower {
  constructor(towerTypes, towerId, towerNumber, x, y) {
    super(towerTypes, towerId, towerNumber, x, y);
    this.addSpeed = this.towerIdData.addSpeed;
    this.bufRange = this.towerIdData.bufRange;
  }
}

export class AttackSupportTower extends Tower {
  constructor(towerTypes, towerId, towerNumber, x, y) {
    super(towerTypes, towerId, towerNumber, x, y);
    this.addDamage = this.towerIdData.addDamage;
    this.bufRange = this.towerIdData.bufRange;
  }
}

export class growthTower extends Tower {
  constructor(towerTypes, towerId, towerNumber, x, y) {
    super(towerTypes, towerId, towerNumber, x, y);
    this.killCount = this.towerIdData.killCount || null;
    this.satisfied = this.towerIdData.satisfied || undefined;
  }
}

export class poisonTower extends Tower {
  constructor(towerTypes, towerId, towerNumber, x, y) {
    super(towerTypes, towerId, towerNumber, x, y);
    this.poisonDamage = this.towerIdData.poisonDamage;
  }
}
