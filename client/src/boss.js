import { BossSkills } from './bossSkills.js'; // bossSkills.js에서 보스 스킬 로직을 불러옴

class Boss {
  constructor(
    socket,
    path,
    hp,
    defense,
    speed,
    skills,
    towers,
    bgm = null,
    skillSounds = null,
    imagePath = null,
  ) {
    this.hp = hp;
    this.maxHp = hp;
    this.defense = defense;
    this.speed = speed;
    this.skills = skills;
    this.socket = socket;
    this.towers = towers;
    this.bgm = bgm;
    this.skillSounds = skillSounds;
    this.bossSkills = new BossSkills(this, this.towers, this.socket);
    this.monsterIndex = null;

    // path가 undefined일 경우 에러 처리 및 경고 메시지 추가
    if (!path || !Array.isArray(path) || path.length === 0) {
      throw new Error('보스의 이동 경로가 필요합니다. 전달된 경로:', path);
    }

    this.path = path;
    this.currentPathIndex = 0;
    this.x = this.path[0].x;
    this.y = this.path[0].y;
    this.width = 100;
    this.height = 100;

    // 이미지 경로가 제대로 전달되었는지 확인
    if (imagePath) {
      this.image = new Image();
      this.image.src = imagePath;
    } else {
      console.error('Error: imagePath is not defined.');
    }

    // UI 요소 미리 참조
    this.hpElement = document.getElementById(`${this.constructor.name}-hp`);
    this.skillElement = document.getElementById('boss-skill');
  }

  startSkills() {
    setInterval(() => {
      const randomSkill = this.skills[Math.floor(Math.random() * this.skills.length)];
      this.bossSkills.useSkill(randomSkill); // 랜덤 스킬 사용
    }, 10000); // 10초마다 스킬 사용
  }

  draw(ctx) {
    if (!this.image) return;
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  move() {
    if (this.currentPathIndex < this.path.length - 1) {
      const target = this.path[this.currentPathIndex + 1];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.speed) {
        this.x = target.x;
        this.y = target.y;
        this.currentPathIndex++;
      } else {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    }
  }

  init() {
    this.socket.on('bossSkill', (data) => {
      console.log(`Boss is using skill: ${data.skill}`);
      this.bossSkills.useSkill(data.skill);
    });

    this.socket.on('updateBossHp', (data) => {
      this.hp = data.hp;
      this.updateUI();
    });

    this.socket.on('towerDestroyed', (data) => {
      console.log(`Tower at (${data.x}, ${data.y}) destroyed.`);
    });

    this.socket.on('placeMark', (data) => {
      console.log(`Mark placed at (${data.x}, ${data.y}) with image: ${data.image}`);
    });

    this.playBGM();
  }

  playBGM() {
    if (this.bgm) {
      this.bgmAudio = new Audio(this.bgm);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.1;
      this.bgmAudio.preload = 'auto';
      this.bgmAudio.play();
    }
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  updateUI(skill = null) {
    if (this.hpElement) {
      this.hpElement.textContent = `HP: ${this.hp}`;
    }

    if (this.skillElement && skill) {
      this.skillElement.textContent = `Current Skill: ${skill}`;
    }
  }

  onDie() {
    this.isBossAlive = false;
    this.stopBGM();
  }
}

// MightyBoss, TowerControlBoss, DoomsdayBoss 등 개별 보스 클래스를 Boss 클래스에 상속
class MightyBoss extends Boss {
  constructor(path, socket, towers, bgm, skillSounds) {
    console.log('Received path in MightyBoss:', path);
    super(
      socket,
      path,
      2000,
      50,
      0.6,
      ['healSkill', 'spawnClone', 'reduceDamage'],
      towers,
      bgm,
      skillSounds,
      './images/MightyBoss.png',
    );
  }
  move() {
    super.move();
  }
}

class TowerControlBoss extends Boss {
  constructor(socket, towers, bgm, skillSounds) {
    super(
      socket,
      1500,
      30,
      1.5,
      ['ignoreTowerDamage', 'changeTowerType', 'downgradeTower'],
      towers,
      bgm,
      skillSounds,
      './images/TowerControlBoss.png',
    );
  }

  move() {
    // TowerControlBoss의 특화된 이동 로직을 추가
    super.move();
  }
}

class TimeRifter extends Boss {
  constructor(socket, towers, bgm, skillSounds) {
    super(
      socket,
      1000,
      20,
      2.0,
      ['rewindHealth', 'accelerateTime', 'timeWave'],
      towers,
      bgm,
      skillSounds,
      './images/TimeRifter.png',
    );
  }

  move() {
    // TimeRifter의 특화된 이동 로직을 추가
    super.move();
  }
}

class DoomsdayBoss extends Boss {
  constructor(socket, towers, bgm, skillSounds) {
    super(
      socket,
      3000,
      60,
      0.8,
      ['placeMark', 'cryOfDoom', 'absorbDamage'],
      towers,
      bgm,
      skillSounds,
      './images/DoomsdayBoss.png',
    );
  }

  timeWave() {
    // 모든 타워의 공격속도를 5초 동안 50% 감소시키는 로직
    towers.forEach((tower) => {
      tower.attackSpeed *= 0.5;
    });

    setTimeout(() => {
      towers.forEach((tower) => {
        tower.attackSpeed *= 2; // 원래 속도로 복구
      });
    }, 5000);

    console.log('Casting time wave to slow down all towers by 50% for 5 seconds.');
  }

  rewindHealth() {
    const rewindTime = 5000; // 5초 전으로 되돌림
    const oldHp = this.hp;
    setTimeout(() => {
      this.hp = oldHp; // HP를 5초 전으로 되돌림
      this.updateUI();
      console.log('Health rewound to:', oldHp);
    }, rewindTime);
  }

  accelerateTime() {
    const originalSpeed = this.speed;
    this.speed *= 1.2;
    this.defense -= this.defense * 0.1; // 받는 피해 증가
    setTimeout(() => {
      this.speed = originalSpeed;
    }, 3000);
    console.log('Boss accelerates time, increasing speed by 20% but taking more damage.');
  }

  bossRoar() {
    if (!this.roarCount) {
      this.roarCount = 0;
    }
    this.roarCount += 1;

    if (this.roarCount === 2) {
      this.decreaseBaseHealth();
    }
  }

  decreaseBaseHealth() {
    // Base의 체력을 감소시키는 로직 추가
    console.log('Decreasing base health by one.');
    // 실제로 base health를 감소시키는 로직을 여기에 구현해야 함
  }

  updateUI() {
    const hpElement = document.getElementById(`${this.constructor.name}-hp`);
    if (hpElement) {
      hpElement.textContent = this.hp;
    }
  }

  getRandomSkill() {
    const randomIndex = Math.floor(Math.random() * this.skills.length);
    return this.skills[randomIndex];
  }

  getRandomPosition() {
    return {
      x: Math.floor(Math.random() * 800), // 임의의 x 좌표 (필드 크기에 따라 조정 필요)
      y: Math.floor(Math.random() * 600), // 임의의 y 좌표 (필드 크기에 따라 조정 필요)
    };
  }

  onDie() {
    this.isBossAlive = false; // 보스 상태를 죽음으로 변경
    this.stopBGM();
    console.log('Boss has died, stopping BGM.');
  }
}

// 각 보스 클래스 정의
export class MightyBoss extends Boss {
  constructor(path, level, socket, bgm, skillSounds) {
    const bossImage = 'images/mightyBoss.png'; // MightyBoss의 이미지 경로
    super(path, bossImage, level, socket, bgm, skillSounds);
    this.maxHp = 1000;
    this.defense = 30;
    this.speed = 0;
  }

  useSkill() {
    super.useSkill(); // 부모 클래스의 useSkill 호출
  }
}

export class TowerControlBoss extends Boss {
  constructor(path, level, socket, bgm, skillSounds) {
    const bossImage = 'images/towerControlBoss.png'; // TowerControlBoss의 이미지 경로
    super(path, bossImage, level, socket, bgm, skillSounds);
    this.maxHp = 700;
    this.defense = 0;
    this.speed = 5;
  }

  useSkill() {
    super.useSkill(); // 부모 클래스의 useSkill 호출
  }
}

export class DoomsdayBoss extends Boss {
  constructor(path, level, socket, bgm, skillSounds) {
    const bossImage = 'images/doomsdayBoss.png'; // DoomsdayBoss의 이미지 경로
    super(path, bossImage, level, socket, bgm, skillSounds);
    this.maxHp = 500;
    this.defense = 10;
    this.speed = 10;
  }

  useSkill() {
    super.useSkill(); // 부모 클래스의 useSkill 호출
  }
}

export class TimeRifter extends Boss {
  constructor(path, level, socket, bgm, skillSounds) {
    const bossImage = 'images/timeRifter.png'; // TimeRifter의 이미지 경로
    super(path, bossImage, level, socket, bgm, skillSounds);
    this.maxHp = 700;
    this.defense = 10;
    this.speed = 3;
  }

  useSkill() {
    super.useSkill(); // 부모 클래스의 useSkill 호출
  }
}
