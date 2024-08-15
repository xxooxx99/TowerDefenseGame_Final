import { Monster } from './monster.js';

export class Boss extends Monster {
  constructor(path, bossImage, level, socket, bgm, skillSounds) {
    super(path, [bossImage], level, null);
    this.width = 100; // 보스 이미지 가로 길이
    this.height = 100; // 보스 이미지 세로 길이
    this.speed = 0.1; // 보스의 이동 속도
    this.socket = socket; // 서버와의 통신을 위한 소켓 연결
    this.bgm = bgm; // 배경음악 파일 경로
    this.skillSounds = skillSounds; // 스킬 효과음 파일 경로 객체
    this.skills = Object.keys(skillSounds);
    this.bgmAudio = null; // BGM Audio 객체를 저장
    this.isAbsorbingDamage = false; // 피해 흡수 상태 추적
    this.isBossAlive = true; // 보스가 살아있는지 여부 추적
  }

  init(level) {
    if (!this.socket) {
      console.error('Socket is undefined in Boss init method');
      return;
    }
    this.maxHp = 1000 + 1000 * level; // 보스의 최대 HP
    this.hp = this.maxHp;
    this.attackPower = 50 + 5 * level; // 보스의 공격력

    // 배경음악 재생
    this.playBGM();

    // 서버로부터 보스 상태 및 스킬 이벤트 수신
    this.socket.on('bossSpawn', (data) => {
      this.hp = data.hp;
      this.updateUI();
    });

    this.socket.on('bossSkill', (data) => {
      this.handleBossSkill(data.skill);
    });

    this.socket.on('updateBossHp', (data) => {
      this.hp = data.hp;
      this.updateUI();
    });
  }

  playBGM() {
    this.bgmAudio = new Audio(this.bgm);
    this.bgmAudio.loop = true; // BGM이 반복 재생되도록 설정
    this.bgmAudio.volume = 0.1; // 볼륨 낮추기
    this.bgmAudio.play();
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  handleBossSkill(skill) {
    console.log(`Boss used skill: ${skill}`);

    // 스킬에 따른 효과음 재생 (단일 효과음으로 처리)
    if (this.skillSounds['skillSound']) {
      const skillAudio = new Audio(this.skillSounds['skillSound']);
      skillAudio.play();
    }

    // 스킬 효과 처리
    switch (skill) {
      case 'healSkill':
        this.healSkill();
        break;
      case 'spawnClone':
        this.spawnClone();
        break;
      case 'reduceDamage':
        this.reduceDamage();
        break;
      case 'placeMark':
        this.placeMark();
        break;
      case 'absorbDamage':
        this.absorbDamage();
        break;
      case 'timeWave':
        this.timeWave();
        break;
      case 'rewindHealth':
        this.rewindHealth();
        break;
      case 'accelerateTime':
        this.accelerateTime();
        break;
      case 'bossRoar':
        this.bossRoar();
        break;
      default:
        console.log('Unknown skill.');
    }
    this.updateUI(); // 스킬 사용 후 UI 업데이트
  }

  healSkill() {
    this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.1);
    console.log('Boss healed 10% of max HP.');
  }

  spawnClone() {
    // 복제 보스 생성 로직
    const clone = new Boss(
      this.path,
      this.images[0],
      this.level,
      this.socket,
      this.bgm,
      this.skillSounds,
    );
    clone.hp = this.hp * 0.5; // 복제 보스는 원래 보스의 50% HP로 생성
    clone.init(this.level);
    monsters.push(clone);
    console.log('Boss spawned a clone with 50% of current HP.');
  }

  reduceDamage() {
    this.damageReduction = 0.5; // 받는 피해를 50% 감소
    setTimeout(() => {
      this.damageReduction = 1.0; // 5초 후 원래 상태로 복구
    }, 5000);
    console.log('Boss reduces incoming damage by 50% for 5 seconds.');
  }

  absorbDamage() {
    const initialHp = this.hp;
    setTimeout(() => {
      const absorbedDamage = initialHp - this.hp;
      this.hp += absorbedDamage * 0.5; // 흡수된 피해의 50%를 체력으로 회복
      this.updateUI();
      console.log(`Boss absorbed ${absorbedDamage * 0.5} damage as health.`);
    }, 5000);
  }

  placeMark() {
    // 필드에 표식을 남기고 5초 후 표식이 있는 위치의 타워를 파괴하는 로직
    const markPosition = this.getRandomPosition();
    console.log('Placing mark on the field at position:', markPosition);

    setTimeout(() => {
      // 해당 좌표의 타워를 파괴하는 로직 추가
      const tower = this.getTowerAtPosition(markPosition);
      if (tower) {
        this.destroyTower(tower);
        console.log('Mark exploded, destroying tower at:', markPosition);
      }
    }, 5000);
  }

  getTowerAtPosition(position) {
    // 주어진 좌표에 있는 타워를 반환하는 로직
    return towers.find((tower) => tower.isAtPosition(position));
  }

  destroyTower(tower) {
    // 타워를 파괴하는 로직
    const index = towers.indexOf(tower);
    if (index > -1) {
      towers.splice(index, 1);
      console.log('Tower destroyed:', tower);
    }
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
  constructor(path, bossImage, level, socket, bgm, skillSounds) {
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
  constructor(path, bossImage, level, socket, bgm, skillSounds) {
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
  constructor(path, bossImage, level, socket, bgm, skillSounds) {
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
  constructor(path, bossImage, level, socket, bgm, skillSounds) {
    super(path, bossImage, level, socket, bgm, skillSounds);
    this.maxHp = 700;
    this.defense = 10;
    this.speed = 3;
  }

  useSkill() {
    super.useSkill(); // 부모 클래스의 useSkill 호출
  }
}
