export class Monster {
  constructor(path, monsterImages, level, monsterNumber) {
    if (!path || path.length <= 0) {
      throw new Error('몬스터가 이동할 경로가 필요합니다.');
    }
    this.lastMoveTime = Date.now();
    this.moveInterval = 1000 / 60;

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
    this.onDie = null; // 몬스터가 죽을 때 호출되는 콜백 추가

    this.init(level);
  }

  getMonsterTypeByLevel(level) {
    if (level === 1) {
      return 'normal';
    } else if (level === 2) {
      return 'fast';
    } else if (level === 3) {
      return 'boss1';
    } else if (level === 4) {
      return 'healing';
    } else if (level === 5) {
      return 'tank';
    } else if (level === 6) {
      return 'boss2';
    } else if (level === 7) {
      return 'fast';
    } else if (level === 8) {
      return 'tank';
    } else if (level === 9) {
      return 'boss3';
    } else if (level === 10) {
      return 'normal';
    } else if (level === 11) {
      return 'fast';
    } else if (level === 12) {
      return 'boss4';
    } else if (level === 13) {
      return 'tnak';
    } else if (level === 14) {
      return 'healing';
    } else if (level === 15) {
      return 'finalboss';
    }
  }

  init(level) {
    switch (this.type) {
      case 'fast':
        this.maxHp = 50 + 5 * level;
        this.speed = 5;
        this.attackPower = 1;
        break;
      case 'tank':
        this.maxHp = 200 + 50 * level;
        this.speed = 1;
        this.attackPower = 1;
        break;
      case 'healing':
        this.maxHp = 100 + 10 * level;
        this.speed = 2;
        this.attackPower = 1;
        this.healingInterval = 100;
        this.healingAmount = 1 * level;
        this.startHealing();
        break;
      case 'boss1':
        this.maxHp = 500;
        this.speed = 1;
        this.attackPower = 2;
        break;
      case 'boss2':
        this.maxHp = 1000;
        this.speed = 1;
        this.attackPower = 2;
        break;
      case 'boss3':
        this.maxHp = 1500;
        this.speed = 1;
        this.attackPower = 2;
        break;
      case 'boss4':
        this.maxHp = 2000;
        this.speed = 1;
        this.attackPower = 2;
        break;
      case 'finalboss':
        this.maxHp = 100000000000;
        this.speed = 1;
        this.attackPower = 3;
        break;
      default:
        this.maxHp = 100 + 10 * level;
        this.speed = 2;
        this.attackPower = 1;
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

    // 0 = normal
    // 1 = fast
    // 2 = tank
    // 3 = healing
    // 4 = boss1
    // 5 = boss2
    // 6 = boss3
    // 7 = boss4
    // 8 = finalboss

    if (level === 1) {
      imageIndex = 0;
    } else if (level === 2) {
      imageIndex = 1;
    } else if (level === 3) {
      imageIndex = 4;
    } else if (level === 4) {
      imageIndex = 3;
    } else if (level === 5) {
      imageIndex = 2;
    } else if (level === 6) {
      imageIndex = 5;
    } else if (level === 7) {
      imageIndex = 1;
    } else if (level === 8) {
      imageIndex = 2;
    } else if (level === 9) {
      imageIndex = 6;
    } else if (level === 10) {
      imageIndex = 0;
    } else if (level === 11) {
      imageIndex = 1;
    } else if (level === 12) {
      imageIndex = 7;
    } else if (level === 13) {
      imageIndex = 2;
    } else if (level === 14) {
      imageIndex = 3;
    } else if (level === 15) {
      imageIndex = 8;
    }

    return this.monsterImages[imageIndex] || this.monsterImages[0];
  }

  move() {
    const now = Date.now();
    const elapsedTime = now - this.lastMoveTime;

    if (elapsedTime < this.moveInterval) {
      return false; // 이동할 시간 아직 아님
    }

    this.lastMoveTime = now; // 마지막 이동 시간 갱신

    if (this.currentIndex < this.path.length - 1) {
      const nextPoint = this.path[this.currentIndex + 1];
      const deltaX = nextPoint.x - this.x;
      const deltaY = nextPoint.y - this.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < this.speed) {
        this.currentIndex++;
        if (this.currentIndex % 4 === 0) {
          // 추가 로직 필요시
        }
      } else {
        const moveDistance = this.speed * (elapsedTime / this.moveInterval);
        this.x += (deltaX / distance) * moveDistance;
        this.y += (deltaY / distance) * moveDistance;
      }
      return false;
    } else {
      this.hp = 0;
      console.log('Monster reached the ned of path and is marked as dead');
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
    return this.hp;
  }

  getHp() {
    return this.hp;
  }

  receiveDamage(damage) {
    this.hp -= damage;
    console.log(`Monster HP after damage: ${this.hp}`);
    if (this.hp <= 0) {
      console.log('Monster HP is 0 or less, calling die method');
      this.die(); // hp가 0 이하로 떨어지면 die 메서드 호출
    }
  }

  die() {
    console.log(`Monster ${this.monsterIndex} died`);
    if (typeof this.onDie === 'function') {
      console.log('Monster is dead. Triggering onDie callback.');
      this.onDie(this); // 몬스터가 죽을 때 콜백 호출
    }
  }

  draw(ctx) {
    if (this.image) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);

      ctx.save(); // 현재 상태 저장
      ctx.restore(); // 상태 복원
      let monsterName = '';

      switch (this.type) {
        case 'fast':
          monsterName = '재빠른 늑대';
          break;
        case 'tank':
          monsterName = '튼실한 오크';
          break;
        case 'healing':
          monsterName = '힐하는 해골';
          break;
        case 'boss1':
          monsterName = 'boss1';
          break;
        case 'boss2':
          monsterName = 'boss2';
          break;
        case 'boss3':
          monsterName = 'boss3';
          break;
        case 'boss4':
          monsterName = 'boss4';
          break;
        case 'finalboss':
          monsterName = 'finalboss';
          break;
        default:
          monsterName = '슬라임';
          break;
      }

      const text = `${monsterName} (레벨 ${this.level}) ${Math.ceil(this.hp)}/${this.maxHp}`;

      ctx.font = '12px Arial';
      ctx.fillStyle = 'white';
      const textWidth = ctx.measureText(text).width;

      const textX = this.x + this.width / 2 - textWidth / 2;
      const textY = this.y - 5;
      ctx.fillText(text, textX, textY);
    } else {
      console.error('몬스터 이미지를 찾을 수 없습니다.');
    }
  }
}
