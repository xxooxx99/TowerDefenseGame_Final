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
            this.target = null; // 타워 광선의 목표
            this.towerNumber = towerNumber;
            this.image = new Image();

            this.towerId = towerIdData.id;
            this.towerType = towerType;
            this.attackPower = towerIdData.power;
            this.range = towerIdData.range;
            this.attackCycle = towerIdData.attackCycle;
            this.imageNum = Math.trunc(towerId / 100) - 1 + (towerId % 100); // 나중에 중간에 7 곱해야함
            console.log(this.imageNum, this.towerId);
          }
        }
      }
    }
  }

  draw(ctx) {
    ctx.drawImage(towerImages[this.imageNum], this.x, this.y, this.width, this.height);
    if (this.beamDuration > 0 && this.target) {
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
      ctx.lineTo(this.target.x + this.target.width / 2, this.target.y + this.target.height / 2);
      ctx.strokeStyle = 'skyblue';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.closePath();
      this.beamDuration--;
    }
  }

  attack(monster) {
    // 타워가 타워 사정거리 내에 있는 몬스터를 공격하는 메소드이며 사정거리에 닿는지 여부는 game.js에서 확인합니다.
    if (this.cooldown <= 0) {
      monster.hp -= this.attackPower;
      this.cooldown = this.attackCycle; // 3초 쿨타임 (초당 60프레임)
      this.beamDuration = 30; // 광선 지속 시간 (0.5초)
      this.target = monster; // 광선의 목표 설정
    }
  }

  updateCooldown() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }
}
