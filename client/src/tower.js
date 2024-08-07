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
            this.cooldown = 0; // 타워 공격 쿨타임
            this.beamDuration = 0; // 타워 광선 지속 시간
            this.target = []; // 타워 광선의 목표
            this.towerNumber = towerNumber;
            this.hits = towerIdData.hits || 1;
            this.criticalPercent = towerIdData.criticalPercent || 10;
            this.criticalDamage = towerIdData.criticalDamage || 1.2;
            this.splashRange = towerIdData.splashRange;
            this.addDamage = towerIdData.addDamage || 0;
            this.addSpeed = towerIdData.addSpeed || 0;
            this.bufRange = towerIdData.bufRange;
            this.image = new Image();
            this.killCount = towerIdData.killCount || null;
            this.satisfied = towerIdData.satisfied || undefined;

            this.towerId = towerIdData.id;
            this.towerType = towerType;
            this.attackPower = 60;
            this.range = towerIdData.range;
            this.attackCycle = towerIdData.attackCycle;
            this.imageNum = Math.trunc(towerId / 100) - 1 + (towerId % 100); // 나중에 중간에 7 곱해야함
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

  attack(monsters, towers) {
    if (this.cooldown <= 0) {
      if (this.target.length !== 0) this.target = [];

      let attackCount = this.hits;
      const critical = this.criticalPercent >= Math.floor(Math.random() * 101) ? true : false;

      let extraPower = 0;
      let extraSpeed = 0;

      const attackAssistTowers = towers.attackSupportTower;
      for (let attack in attackAssistTowers) {
        for (let i = attackAssistTowers[attack].length - 1; i >= 0; i--) {
          const bufTower = attackAssistTowers[attack][i];
          const distance = Math.sqrt(
            Math.pow(this.x - bufTower.x, 2) + Math.pow(this.y - bufTower.y, 2),
          );

          if (bufTower.bufRange > distance) extraPower = bufTower.addDamage;
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

          if (bufTower.bufRange > distance) extraSpeed = bufTower.addSpeed;
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
          if (critical) monster.hp -= (this.attackPower + extraPower) * 1.2;
          else monster.hp -= this.attackPower + extraPower;
          attackCount--;
          this.beamDuration = 30; // 광선 지속 시간 (0.5초)
          this.target.push(monster); // 광선의 목표 설정

          //스플래쉬 데미지는 크리티컬이 터지지 않게끔 설정
          if (this.splashRange) {
            for (let nighMonster of monsters) {
              const nighDistance = Math.sqrt(
                Math.pow(monster.x - nighMonster.x, 2) + Math.pow(monster.y - nighMonster.y, 2),
              );

              if (this.splashRange >= nighDistance) nighMonster.hp -= this.attackPower + extraPower; // 이펙트 추가해야함
            }
          }

          if (this.killCount != null || monster.hp <= 0) {
            this.killCount--;
          }
        }
        if (attackCount != this.hits) {
          this.cooldown = this.attackCycle - extraSpeed;
        } // 쿨타임, 만약 때렸다면 실행
      }
    }
  }

  updateCooldown() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }
}
