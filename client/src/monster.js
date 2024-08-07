export class Monster {
  constructor(path, monsterImages, level, monsterNumber) {
    if (!path || path.length <= 0) {
      throw new Error('몬스터가 이동할 경로가 필요합니다.');
    }


    this.path = path;
    this.monsterImages = monsterImages;
    this.level = level;
    this.monsterNumber = monsterNumber;
    this.type = this.getMonsterTypeByLevel(level);
    this.currentIndex = 0;
    this.x = path[0].x;
    this.y = path[0].y;
    this.width = 40;
    this.height = 40;
    this.image = this.getImageForLevel(level);

    this.init(level);
  }

  getMonsterTypeByLevel(level) {
    if (level !== 0 && level % 2 === 0 && level % 10 !== 0) {
      return 'fast';
    } else if (level !== 0 && level % 3 === 0 && level % 10 !== 0) {
      return 'tank';
    } else if (level !== 0 && level % 5 === 0) {
      return 'healing';
    } else {
      return 'normal';
    }
  }

  init(level) {
    switch (this.type) {
      case 'fast':
        this.maxHp = 50 + 5 * level;
        this.speed = 5;
        this.attackPower = 5 + 1 * level;
        break;
      case 'tank':
        this.maxHp = 200 + 50 * level;
        this.speed = 1;
        this.attackPower = 15 + 2 * level;
        break;
      case 'healing':
        this.maxHp = 100 + 10 * level;
        this.speed = 2;
        this.attackPower = 10 + 1 * level;
        this.healingInterval = 100;
        this.healingAmount = 1 * level;
        this.startHealing();
        break;
      /* (더미)
      case 'speedBoost':
        this.maxHp = 100 + 10 * level;
        this.speed = 2;
        this.attackPower = 10 + 1 * level;
        this.speedBoost = 1.5;
        break;
      case 'defenseBoost':
        this.maxHp = 100 + 10 * level;
        this.speed = 2;
        this.attackPower = 10 + 1 * level;
        this.defenseBoost = 1.5;
        break; */
      default:
        this.maxHp = 100 + 10 * level;
        this.speed = 2;
        this.attackPower = 10 + 1 * level;
    }

    this.hp = this.maxHp;
  }

  startHealing() {
    if (this.type === 'healing') {
      this.healingTimer = setInterval(() => {
        if (this.hp < this.maxHp) {
          this.hp = Math.min(this.hp + this.healingAmount, this.maxHp);
        }
      }, this.healingInterval);
    }
  }

  getImageForLevel(level) {
    if (!Array.isArray(this.monsterImages) || this.monsterImages.length === 0) {
      console.error('몬스터 이미지 배열이 정의되어 있지 않거나 비어 있습니다.');
      return null;
    }

    let imageIndex = 0;

    if (level !== 0 && level % 2 === 0 && level % 10 !== 0) {
      imageIndex = 1;
    } else if (level !== 0 && level % 3 === 0 && level % 10 !== 0) {
      imageIndex = 2;
    } else if (level !== 0 && level % 5 === 0) {
      imageIndex = 3;
    } else {
      imageIndex = 0;
    }

    return this.monsterImages[imageIndex] || this.monsterImages[0];

  }

  move() {
    if (this.currentIndex < this.path.length - 1) {
      const nextPoint = this.path[this.currentIndex + 1];
      const deltaX = nextPoint.x - this.x;
      const deltaY = nextPoint.y - this.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < this.speed) {
        this.currentIndex++;
        if (this.currentIndex % 4 === 0) {
        }
      } else {
        this.x += (deltaX / distance) * this.speed;
        this.y += (deltaY / distance) * this.speed;
      }
      return false;
    } else {
      this.hp = 0;
      return true;
    }
  }

  getMonsterIndex() {
    return this.monsterIndex;
  }

  setMonsterIndex(index) {
    this.monsterIndex = index;
  }

  getMaxHp() {
    return this.maxHp;
  }

  Damage() {
    return this.attackPower;
  }

  setHp(value) {
    this.hp = value;
  }

  getHp() {
    this.hp = value;
  }

  draw(ctx) {
    if (this.image) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);

      ctx.save(); // 현재 상태 저장
      // ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.restore(); // 상태 복원

      // 몬스터 상태 표시
      ctx.font = '12px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(`(레벨 ${this.level}) ${this.hp}/${this.maxHp}`, this.x, this.y - 5);
    } else {
      console.error('몬스터 이미지를 찾을 수 없습니다.');
    }
  }
}
