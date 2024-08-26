import { updateFinalBossDamageUI } from "./multi_game.js";
import { sendEvent } from "./multi_game.js";
import { PacketType } from "../constants.js";

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

    this.skillCooldown = 5000; // 스킬 쿨다운 기본값 (필요 시 보스별로 수정)
    this.lastSkillTime = Date.now(); // 마지막 스킬 사용 시간
    this.boss4HowlCount = 0; // boss4의 howl 횟수
    this.lastHowlTime = Date.now(); // 울부짖음 시간
    this.finalBossAccumulatedDamage = 0; // final boss의 누적 데미지
    this.remainingDamage = 0 // final boss의 표시용 누적 데미지
    this.requiredDamage = 1000; // 요구 데미지 초기값

    this.init(level);
    this.setSkillCooldown(); // 각 보스마다 스킬 쿨타임 설정
    this.skill = null;
  }

  // 스킬 쿨타임 설정
  setSkillCooldown() {
    switch (this.type) {
      case 'boss2':
        this.skillCooldown = 5000;
        break;
      case 'boss3':
        this.skillCooldown = 2000;
        break;
      case 'boss4':
        this.skillCooldown = 5000;
        break;
      case 'finalboss':
        this.skillCooldown = 5000;
        break;
      default:
        this.skillCooldown = 5000;
        break;
    }
  }

  // BGM 재생 메서드
  playBGM(bgmPath, loopBgmPath = null) {
    if (this.bgm && !this.bgm.paused) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
    this.bgm = new Audio(bgmPath);
    this.bgm.loop = loopBgmPath === null;
    this.bgm.volume = 0.1;
    this.bgm.play();

    if (loopBgmPath) {
      this.bgm.addEventListener('ended', () => {
        this.bgm.src = loopBgmPath;
        this.bgm.loop = true;
        this.bgm.play();
      });
    }
  }

  // 스킬 효과음 재생 메서드
  playSkillSound(skillSoundPath) {
    const skillSound = new Audio(skillSoundPath);
    skillSound.volume = 0.1;
    skillSound.play();
  }

  // 스킬 설정 메서드
  setSkill(skillFunction) {
    this.skill = skillFunction;
  }

  // 스킬 사용 메서드
  useSkill(baseHp) {
    const now = Date.now();

    if (this.hp <= 0) {
      console.log('보스가 죽었기 때문에 스킬이 발동되지 않습니다.');
      return;
    }

  if (this.type !== 'finalboss' && this.skillCooldown && now - this.lastSkillTime < this.skillCooldown) {
    return;
  }

  if (this.skill) {
    this.skill(baseHp); // 설정된 스킬을 실행
    this.lastSkillTime = now;
  }
}

  heal(percentage) {
    const healAmount = this.maxHp * percentage; // 최대 체력의 일정 비율 회복
    this.hp = Math.min(this.hp + healAmount, this.maxHp); // 체력이 최대 체력을 넘지 않도록 제한
    console.log(`Boss 회복: ${healAmount}. 현재 체력: ${this.hp}/${this.maxHp}`);
  }

boostSpeed() {
  if (!this.isSpeedBoosted) {
    this.speed *= 2;
    this.isSpeedBoosted = true;
    console.log(`Speed boosted to: ${this.speed}`);
    setTimeout(() => {
      this.speed /= 2;
      this.isSpeedBoosted = false;
      console.log(`Speed reduced to: ${this.speed}`);
    }, 2000); // 2초 후 속도 감소
  }
}
  howl() {
    this.boss4HowlCount++; // Howl 스택 증가
    console.log(`Howl 스택: ${this.boss4HowlCount}`);

    // 2스택 도달 시 기지 공격으로 처리하고 스택 초기화
    if (this.boss4HowlCount >= 2) {
        this.boss4HowlCount = 0; // 스택 초기화
        console.log('Boss 4: Howl 스택 2 도달 - 기지 공격!');
    }
}

// finalBossSkill(baseHp) {
//   const now = Date.now();
//   const elapsedTime = (now - this.lastHowlTime) / 1000; // 경과 시간 계산

//   // 5초마다 울부짖음이 발생하도록 수정
//   if (elapsedTime >= 5) {
//       // 요구 데미지를 충족하지 못했으면 기지 체력에 1의 데미지 추가
//       if (this.remainingDamage < this.requiredDamage) {
//           baseHp -= 1;
//           updateBaseHpUI(baseHp); // UI 업데이트 (기지 체력)
//           console.log('보스의 울부짖음으로 기지에 데미지가 가해졌습니다!');
//       }

//       // 다음 울부짖음의 데미지 요구치를 증가시킴
//       this.requiredDamage += 1000;

//       // 타이머를 리셋
//       this.lastHowlTime = now; // 타이머 리셋

//       // UI 업데이트
//       updateFinalBossDamageUI(this.remainingDamage, this.requiredDamage);
//   }
// }

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
        this.maxHp = 3000;
        this.speed = 0.5;
        this.attackPower = 2;
        break;
      case 'boss2':
        this.maxHp = 3000;
        this.speed = 0.5;
        this.attackPower = 2;
        break;
      case 'boss3':
        this.maxHp = 3000;
        this.speed = 0.5;
        this.attackPower = 2;
        break;
      case 'boss4':
        this.maxHp = 3000;
        this.speed = 0.5;
        this.attackPower = 1;
        break;
      case 'finalboss':
        this.maxHp = 100000;
        this.speed = 0.1;
        this.attackPower = 1;
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

      this.die();
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

  //궁극기 때매 있어야 함
  receiveDamage(damage) {
    console.log('Damage received:', damage);
    this.hp -= damage;

    console.log(`Monster HP after damage: ${this.hp}`);

    // 최종 보스의 경우 누적 데미지를 업데이트
    if (this.type === 'finalboss') {
        this.finalBossAccumulatedDamage += damage;  // 받은 데미지만큼 누적 데미지 추가
        updateFinalBossDamageUI(this.finalBossAccumulatedDamage);  // UI 업데이트
    }

    // 체력이 0 이하로 떨어지면 die 메서드를 호출
    if (this.hp <= 0) {
        console.log('Monster HP is 0 or less, calling die method');
        this.die();
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
      const imageWidth = this.image.naturalWidth;
      const imageHeight = this.image.naturalHeight;

      const drawX = this.x - imageWidth / 2;
      const drawY = this.y - imageHeight / 2;

      ctx.drawImage(this.image, drawX, drawY, imageWidth, imageHeight);

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

      const textX = this.x - textWidth / 2;
      const textY = drawY - 10;
      ctx.fillText(text, textX, textY);
    } else {
      console.error('몬스터 이미지를 찾을 수 없습니다.');
    }
  }

  opponentdraw(ctx) {
    if (this.image) {
      const imageWidth = this.image.naturalWidth;
      const imageHeight = this.image.naturalHeight;

      const drawX = this.x - imageWidth / 2;
      const drawY = this.y - imageHeight / 2;

      ctx.drawImage(this.image, drawX, drawY, imageWidth, imageHeight);

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

      // const text = `${monsterName} (레벨 ${this.level}) ${Math.ceil(this.hp)}/${this.maxHp}`;

      /* ctx.font = '12px Arial';
      ctx.fillStyle = 'white';
      const textWidth = ctx.measureText(text).width;

      const textX = this.x - textWidth / 2;
      const textY = drawY - 10;
      ctx.fillText(text, textX, textY); */
    } else {
      console.error('몬스터 이미지를 찾을 수 없습니다.');
    }
  }
}
