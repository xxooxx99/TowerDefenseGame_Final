import { Base } from './base.js';
import { Monster } from './monster.js';
import { CLIENT_VERSION, INITIAL_TOWER_NUMBER, PacketType, TOWER_TYPE } from '../constants.js';
import {
  towerImageAllowInit,
  towerImageInit,
  placeInitialTowers,
  towerAttackToSocket,
  towerSaleToSocket,
  towerUpgradeToSocket,
  towerCreateToSocket,
  towerUpgrades,
  towerSales,
  towerRequest,
  growthTowerChecker,
  myTowerDrawAndAttack,
  opponentTowerDrawAndAttack,
  towerAllow,
  audioOfTowerNotAllow,
  //chat,
} from './tower/towerController.js';

if (!localStorage.getItem('token')) {
  alert('로그인이 필요합니다.');
  location.href = '/login';
}

const userId = localStorage.getItem('userId');
if (!userId) {
  alert('유저 아이디가 필요합니다.');
  location.href = '/login';
}

// 매칭 데이터
let serverSocket;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const opponentCanvas = document.getElementById('opponentCanvas');
const opponentCtx = opponentCanvas.getContext('2d');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressBarMessage = document.getElementById('progressBarMessage');
const progressBar = document.getElementById('progressBar');
const matchAcceptButton = document.getElementById('matchAcceptButton');
const loader = document.getElementsByClassName('loader')[0];

const user_name = document.getElementById('user-name');
const opponentUser_name = document.getElementById('opponentUser-name');
const ownUser_name = document.getElementById('ownUser-name');

const user_info = document.getElementById('user-info');
const opponentUser_winRate = document.getElementById('opponentUser-winRate');
const ownUser_winRate = document.getElementById('ownUser-winRate');

// 설정 데이터
let acceptTime = 20000; // 수락 대기 시간
let matchAcceptInterval; // 인터벌 데이터

// 몬스터 데이터
let monsterPath; // 몬스터 경로
const NUM_OF_MONSTERS = 9; // 몬스터 개수

// 유저 데이터
export let userGold; // 유저 골드

// base 데이터
let base; // 기지 객체
let baseHp = 0; // 기지 체력
let basePosition; // 기지 좌표

let score = 0; // 게임 점수
let highScore = 0; // 기존 최고 점수

// 상대 데이터
let opponentBase; // 상대방 기지 객체
let opponentBaseHp = 0;
let opponentMonsterPath; // 상대방 몬스터 경로
let opponentInitialTowerCoords; // 상대방 초기 타워 좌표
let opponentBasePosition; // 상대방 기지 좌표
export let opponentMonsters = []; // 상대방 몬스터 목록
let opponentTowers = {}; // 상대방 타워 목록

//#region Tower Controller Data
let initialTowerCoords;
export const towerImages = [];
export const towerStroke = [
  'lightgray',
  'skyblue',
  'lightcoral',
  'lightgreen',
  'lightsalmon',
  'lightseagreen',
  'lightgoldenrodyellow',
  'lightcyan',
  'lavender',
];
let towerSale = null;
let towerUpgrade = null;
let towerBuilderId = null;
let towerBuilderType = null;
let posX = 0;
let posY = 0;
export let towersData;
let towers = {};
let towerLock;
towerImageInit();
towerImageAllowInit();
//#endregion

//게임 데이터
let bgm;
let isBossStage = false; // 보스 스테이지 여부를 추적

//Game Init
let isInitGame = false;
// 이미지 로딩 파트
const backgroundImage = new Image();
backgroundImage.src = 'images/bg.webp';
const opponentBackgroundImage = new Image();
opponentBackgroundImage.src = 'images/bg.webp';

const baseImage = new Image();
baseImage.src = 'images/base.png';
const pathImage = new Image();
pathImage.src = 'images/path.png';
const monsterImages = [];
for (let i = 1; i <= NUM_OF_MONSTERS; i++) {
  const img = new Image();
  img.src = `images/monster${i}.png`;
  monsterImages.push(img);
}

export function userGoldControl(value) {
  userGold += value;
}

function initMap() {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // 배경 이미지 그리기
  drawPath(monsterPath, ctx);
  drawPath(opponentMonsterPath, opponentCtx);
  placeInitialTowers(initialTowerCoords, towers); // 초기 타워 배치
  placeInitialTowers(opponentInitialTowerCoords, opponentTowers); // 상대방 초기 타워 배치
  if (!base) placeBase(basePosition, true);
  if (!opponentBase) placeBase(opponentBasePosition, false);
}

function drawPath(path, context) {
  if (!path || path.length === 0) {
    console.error('Path is not defined or empty');
    return;
  }
  const segmentLength = 10; // 몬스터 경로 세그먼트 길이
  const imageWidth = 30; // 몬스터 경로 이미지 너비
  const imageHeight = 30; // 몬스터 경로 이미지 높이
  const gap = 3; // 몬스터 경로 이미지 겹침 방지를 위한 간격
  for (let i = 0; path && i < path.length - 1; i++) {
    const startX = path[i].x;
    const startY = path[i].y;
    const endX = path[i + 1].x;
    const endY = path[i + 1].y;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); // 두 점 사이의 거리를 구함 (유클리드 거리)
    const angle = Math.atan2(deltaY, deltaX); // 두 점 사이의 각도를 tan-1(y/x)로 구해야 함
    for (let j = gap; j < distance - gap; j += segmentLength) {
      const x = startX + Math.cos(angle) * j; // 다음 이미지 x좌표 계산
      const y = startY + Math.sin(angle) * j; // 다음 이미지 y좌표 계산
      drawRotatedImage(pathImage, x, y, imageWidth, imageHeight, angle, context);
    }
  }
}

function drawRotatedImage(image, x, y, width, height, angle, context) {
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(angle);
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}

function towerSaleCheck() {
  if (towerBuilderId || towerBuilderType || towerUpgrade) return;
  if (towerSale) {
    towerSale = null;
    saleTowerButton.style.backgroundColor = 'white';
  } else {
    towerSale = 'ok';
    saleTowerButton.style.backgroundColor = 'red';
  }
}

function towerUpgradeCheck() {
  if (towerBuilderId || towerBuilderType || towerSale) return;
  if (towerUpgrade) {
    towerUpgrade = null;
    upgradeTowerButton.style.backgroundColor = 'white';
  } else {
    towerUpgrade = 'ok';
    upgradeTowerButton.style.backgroundColor = 'red';
  }
}

//건물 건설 활성화 및 비활성화 버튼
function towerBuilderCheck(towerType, button) {
  if (towerUpgrade || towerSale) return;
  if (!towerBuilderId) {
    towerBuilderId = towerType;
    towerBuilderType = TOWER_TYPE[towerBuilderId / 100];
    button.style.backgroundColor = 'red';
    cursorImage.src = `./images/tower${towerType}.png`;
  } else if (towerBuilderId === towerType) {
    button.style.backgroundColor = 'white';
    towerBuilderId = null;
    towerBuilderType = null;
    cursorImage.src = `./images/cursor.png`;
  } else console.log('build를 취소해주세요!');
}

function placeBase(position, isPlayer) {
  if (isPlayer) {
    if (!base) {
      base = new Base(position.x, position.y, baseHp);
      base.draw(ctx, baseImage);
    }
  } else {
    if (!opponentBase) {
      opponentBase = new Base(position.x, position.y, baseHp);
      opponentBase.draw(opponentCtx, baseImage, true);
    }
  }
}

let monsterLevel = 1;
const maxStages = 15;
let monsters = [];
let monsterIndex = 0;
let monsterSpawnCount = 0;
let bossSpawnCount = 0;
let monsterintervalId = null;
const monsterSpawnInterval = 1000;
let monstersToSpawn = 5; // 라운드당 몬스터 소환 수
let bossToSpawn = 1;
let bossMessageNumber = 0;

function spawnMonster() {
  /* if (bossSpawned && currentBossStage === monsterLevel) {
    console.log('Boss already spawnd for this level');
    return;
  } */

  if (
    (bossSpawnCount < bossToSpawn && monsterLevel === 3) ||
    (bossSpawnCount < bossToSpawn && monsterLevel === 6) ||
    (bossSpawnCount < bossToSpawn && monsterLevel === 9) ||
    (bossSpawnCount < bossToSpawn && monsterLevel === 12) ||
    (bossSpawnCount < bossToSpawn && monsterLevel === 15)
  ) {
    // 보스 스테이지 진입 시 기존 BGM을 멈추고 보스 BGM 실행
    if (!isBossStage) {
      if (bgm) bgm.pause(); // 기존 BGM 정지

      isBossStage = true;
    }
    const monster = new Monster(monsterPath, monsterImages, monsterLevel);
    monster.setMonsterIndex(monsterIndex);
    monsters.push(monster);

    // 보스일 경우 스킬과 BGM 설정
    setBossAttributes(monster, monsterLevel);

    sendEvent(PacketType.C2S_SPAWN_MONSTER, {
      hp: monster.getMaxHp(),
      monsterIndex,
      monsterLevel,
    });
    monsterIndex++;
    bossSpawnCount++;
    bossMessageNumber++;

    if (monsterLevel !== 15) chat(`System: ${bossMessageNumber}번째 보스가 출현합니다.`);
    else chat(`System: 최종 보스가 출현합니다.`);
  } else if (monsterSpawnCount < monstersToSpawn) {
    const monster = new Monster(monsterPath, monsterImages, monsterLevel);
    monster.setMonsterIndex(monsterIndex);
    monsters.push(monster);

    sendEvent(PacketType.C2S_SPAWN_MONSTER, { hp: monster.getMaxHp(), monsterIndex, monsterLevel });
    monsterIndex++;
    monsterSpawnCount++;
  }

  if (monsterSpawnCount >= monstersToSpawn) {
    monsterSpawnCount = 0;
    clearInterval(monsterintervalId);
    console.log('라운드 몬스터 최대 소환');
  }
  if (bossSpawnCount >= bossToSpawn) {
    bossSpawnCount = 0;
    clearInterval(monsterintervalId);
    console.log('보스 라운드 최대 소환');
  }
}

let currentBossBGM = null; // 전역 변수로 보스 BGM을 관리
let bossSkillIntervals = {}; // 보스 스킬의 setInterval을 개별적으로 관리

// BGM 재생 메서드 수정
function playBossBGM(bgmPath) {
  // 현재 재생 중인 보스 BGM이 있으면 중지
  if (currentBossBGM && !currentBossBGM.paused) {
    currentBossBGM.pause();
    currentBossBGM.currentTime = 0;
  }

  // 새로운 BGM 객체 생성
  currentBossBGM = new Audio(bgmPath);
  currentBossBGM.volume = 0.1;

  // 음악이 거의 끝날 때 루프 시키기
  currentBossBGM.addEventListener('timeupdate', () => {
    const buffer = 0.1; // 0.1초 여유 시간
    if (currentBossBGM.duration - currentBossBGM.currentTime <= buffer) {
      currentBossBGM.currentTime = 0; // 딜레이 없이 즉시 다시 시작
      currentBossBGM.play();
    }
  });

  // 첫 재생
  currentBossBGM.play();
}

// // 두 번째 BGM 파일이 있을 경우 미리 로드하고 준비
// if (loopBgmPath) {
//   const nextBGM = new Audio(loopBgmPath);
//   nextBGM.volume = 0.1;
//   nextBGM.loop = true;

//   // 첫 번째 BGM이 끝나기 직전에 두 번째 BGM을 준비 상태로 만들기
//   currentBossBGM.addEventListener('timeupdate', () => {
//     // 첫 번째 BGM이 거의 끝날 때 (예: 0.6초 남았을 때)
//     if (currentBossBGM.duration - currentBossBGM.currentTime <= 0.6) {
//       currentBossBGM.pause();
//       currentBossBGM = nextBGM; // 두 번째 BGM으로 전환
//       currentBossBGM.play(); // 두 번째 BGM 재생
//     }
//   });
// } else {
//   currentBossBGM.loop = true;
// 최종보스 UI 업데이트
export function updateFinalBossDamageUI(elapsedTime, remainingDamage, requiredDamage) {
  const damageElement = document.getElementById('final-boss-damage');

  if (damageElement) {
    damageElement.innerHTML = `가한 데미지: ${remainingDamage} / 요구 데미지: ${requiredDamage}`;
  } else {
    console.log('Damage element not found');
  }
}

// Final 보스 등장 시 UI를 생성하는 함수
function showFinalBossDamageUI() {
  const damageElement = document.createElement('div');
  damageElement.id = 'final-boss-damage';
  damageElement.style.position = 'absolute';
  damageElement.style.top = '50%'; // 화면 중앙보다 살짝 아래쪽으로 위치 조정
  damageElement.style.left = '50%';
  damageElement.style.transform = 'translate(-50%, -50%)'; // 좌우 중앙 정렬 유지
  damageElement.style.color = 'red';
  damageElement.style.fontSize = '40px'; // 크기 조정
  damageElement.style.fontWeight = 'bold';
  damageElement.innerHTML = '가한 데미지: 0 / 요구 데미지: 1000'; // 초기 값 설정
  document.body.appendChild(damageElement);
}

let isSkillActive = false; // 스킬이 이미 활성화된 상태를 추적

function setBossAttributes(boss, level) {
  switch (level) {
    case 3:
      playBossBGM('sounds/boss01_bgm.mp3');
      break;
    case 6:
      playBossBGM('sounds/boss02_bgm.mp3');
      boss.setSkill(() => {
        boss.heal(0.3); // 최대 체력의 30% 회복
        console.log(`Boss 2 체력 회복 스킬 발동! 현재 체력: ${boss.hp}/${boss.maxHp}`);
        boss.playSkillSound('sounds/boss2.mp3');
      });
      boss.setSkillCooldown(5000); //  쿨타임
      break;
    case 9:
      playBossBGM('sounds/boss03_bgm.mp3');

      boss.setSkill(() => {
        // 스킬 사용 시 속도 증가만 효과음 재생
        if (!boss.isSpeedBoosted) {
          boss.boostSpeed(); // 이동 속도 증가/감소 반복 시작
          boss.playSkillSound('sounds/boss3.mp3'); // 속도 증가 시 효과음 재생
          console.log('Boss 3 광란의 보스 등장!');
        }
      });

      boss.setSkillCooldown(2000); // 2초마다 스킬 발동
      break;
    case 12:
      playBossBGM('sounds/boss4_bgm.mp3');
      boss.setSkill(() => {
        boss.howl(); // Howl 스킬 호출 (baseHp 직접 수정 없음)
        console.log('Boss 4 Howl 스킬 발동!');
        boss.playSkillSound('sounds/boss4.mp3');

        // 2스택 도달 시 보스가 base를 공격한 것처럼 처리
        if (boss.boss4HowlCount === 0) {
          // 스택 초기화가 된 시점에서 기지 공격
          sendEvent(PacketType.C2S_MONSTER_ATTACK_BASE, { damage: boss.Damage() });
        }
      });
      boss.setSkillCooldown(8000); // 8초 쿨타임
      break;
    case 15:
      playBossBGM('sounds/final_bgm.wav');
      boss.previousHp = boss.hp;
      boss.remainingDamage = 0;
      boss.requiredDamage = 1000;
      boss.lastHowlTime = Date.now();

      if (!isSkillActive) {
        isSkillActive = true;

        const skillIntervalId = setInterval(() => {
          const now = Date.now();
          const elapsedTime = (now - boss.lastHowlTime) / 1000;

          if (elapsedTime >= 5) {
            // 5초 경과 시 스킬 발동
            if (boss.remainingDamage < boss.requiredDamage) {
              // 요구 데미지를 충족하지 못했으므로 기지 체력 감소
              sendEvent(PacketType.C2S_MONSTER_ATTACK_BASE, { damage: boss.Damage() });
              chat('최종 보스에게 요구된 데미지를 입히지 못했습니다. 기지 체력이 감소합니다.');
            }

            // 타이머와 데미지 초기화
            boss.remainingDamage = 0; // 누적 데미지 리셋
            boss.requiredDamage += 500; // 요구 데미지 증가
            boss.lastHowlTime = now; // 타이머 리셋

            // UI 업데이트
            updateFinalBossDamageUI(0, boss.remainingDamage, boss.requiredDamage);

            // 사운드는 타이머와 무관하게 비동기적으로 재생
            playFinalBossSkillSound(); // 사운드 재생
          }
        }, 5000); // 정확히 5초마다 스킬 체크

        showFinalBossDamageUI();

        const intervalId = setInterval(() => {
          const damageDealt = boss.previousHp - boss.hp;
          if (damageDealt > 0) {
            boss.remainingDamage += damageDealt;
            boss.previousHp = boss.hp;
          }

          const now = Date.now();
          const elapsedTime = (now - boss.lastHowlTime) / 1000;

          // UI 업데이트: 남은 시간과 요구 데미지 업데이트
          updateFinalBossDamageUI(elapsedTime, boss.remainingDamage, boss.requiredDamage);

          if (boss.hp <= 0) {
            clearInterval(intervalId);
            clearInterval(skillIntervalId);
            isSkillActive = false;
          }
        }, 100); // 100ms마다 데미지 확인 및 UI 업데이트

        // 보스 사망 시 UI 제거 및 interval 종료
        boss.onDie = () => {
          hideFinalBossDamageUI();
          clearInterval(intervalId);
          clearInterval(skillIntervalId);
          isSkillActive = false;
          sendEvent(PacketType.C2S_GAME_OVER, { isWin: true });
          window.location.href = 'resultWindow.html';
        };
      }
      break;
  }

  // Final Boss 스킬 사운드를 비동기적으로 재생
  function playFinalBossSkillSound() {
    // 사운드를 비동기적으로 재생
    const skillSound = new Audio('sounds/finalboss.mp3');
    skillSound.volume = 0.1;
    skillSound.play().catch((error) => {
      console.error('Error playing skill sound:', error);
    });
  }

  // Final 보스가 사라질 때 UI를 제거하는 함수
  function hideFinalBossDamageUI() {
    const damageElement = document.getElementById('final-boss-damage');
    if (damageElement) {
      document.body.removeChild(damageElement);
    }
  }
  if (boss.skillCooldown) {
    // 보스의 스킬 주기 설정
    bossSkillIntervals[boss.getMonsterIndex()] = setInterval(() => {
      if (boss.hp <= 0) {
        console.log(`Boss ${boss.getMonsterIndex()} is dead, stopping its skill.`);
        clearInterval(bossSkillIntervals[boss.getMonsterIndex()]); // 죽은 보스의 스킬만 멈춤
      } else {
        boss.useSkill(baseHp, opponentBaseHp); // 보스 스킬 발동
      }
    }, boss.skillCooldown);
  }
}

function startSpawning() {
  if (monsterintervalId !== null) {
    clearInterval(monsterintervalId);
  }

  monsterintervalId = setInterval(spawnMonster, monsterSpawnInterval);
}

function spawnOpponentMonster(value) {
  const newMonster = new Monster(
    opponentMonsterPath,
    monsterImages,
    value[value.length - 1].monsterLevel,
  );
  // newMonster.setMonsterIndex(value[value.length - 1].monsterIndex);
  opponentMonsters.push(newMonster);
}
function destroyOpponentMonster(index) {
  const destroyedMonsterIndex = opponentMonsters.findIndex((monster) => {
    return monster.getMonsterIndex() === index;
  });
  opponentMonsters.splice(destroyedMonsterIndex, 1);
}

function gameSync(data) {
  score = data.score;
  userGold = data.gold;
  baseHp = data.baseHp;
  base.updateHp(baseHp);
  if (baseHp <= 0) {
    loseGame();
  }

  if (data.attackedMonster === undefined) {
    return;
  }

  const attackedMonster = monsters.find((monster) => {
    return monster.getMonsterIndex() === data.attackedMonster.monsterIndex;
  });

  if (attackedMonster) {
    const hp = attackedMonster.setHp(data.attackedMonster.hp);
  } else {
    console.error('Monster not found', data.attackedMonster.monsterIndex);
  }
}

let killCount = 0;
let bosskillCount = 0;
let bossSpawned = false;

function gameLoop() {
  //프레임단위로 무한루프
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // 배경 이미지 먼저그리기
  drawPath(monsterPath, ctx); // 경로 다시 그리기
  ctx.font = '25px Times New Roman';
  ctx.fillStyle = 'skyblue';
  ctx.fillText(`최고 기록: ${highScore}`, 100, 50); // 최고 기록 표시
  ctx.fillStyle = 'white';
  ctx.fillText(`점수: ${score}`, 100, 100); // 현재 스코어 표시
  ctx.fillStyle = 'yellow';
  ctx.fillText(`골드: ${userGold}`, 100, 150); // 골드 표시
  ctx.fillStyle = 'black';
  ctx.fillText(`현재 레벨: ${monsterLevel}`, 100, 200); // 최고 기록 표시

  // 타워 그리기 및 몬스터 공격 처리
  myTowerDrawAndAttack(userId, towers, monsters, ctx);
  growthTowerChecker(userId, towers);

  // 기지 계속 그리기
  base.draw(ctx, baseImage, monsters);

  for (let i = monsters.length - 1; i >= 0; i--) {
    const monster = monsters[i];
    if (monster.hp > 0) {
      const Attacked = monster.move();
      monster.draw(ctx, false);
      if (Attacked) {
        const attackedSound = new Audio('sounds/attacked.wav');
        attackedSound.volume = 0.3;
        attackedSound.play();
        monsters.splice(i, 1);
        sendEvent(PacketType.C2S_DIE_MONSTER, {
          monsterIndex: monster.getMonsterIndex(),
          score,
          monsterLevel: monster.level,
        });
        sendEvent(PacketType.C2S_MONSTER_ATTACK_BASE, { damage: monster.Damage() });

        killCount++;

        if (
          monsterLevel === 3 ||
          monsterLevel === 6 ||
          monsterLevel === 9 ||
          monsterLevel === 12 ||
          monsterLevel === 15
        ) {
          if (killCount === bossToSpawn) {
            monsterLevel++;
            killCount = 0;
            console.log('bossLevelUp');

            clearInterval(monsterintervalId);

            setTimeout(() => {
              startSpawning();
            }, 3000);
          }
        } else {
          if (killCount === monstersToSpawn) {
            monsterLevel++;
            killCount = 0;
            console.log('monsterLevelUp');

            clearInterval(monsterintervalId);

            setTimeout(() => {
              startSpawning();
            }, 3000);
          }
        }
      }
    } else {
      monsters.splice(i, 1);
      sendEvent(PacketType.C2S_DIE_MONSTER, {
        monsterIndex: monster.getMonsterIndex(),
        score,
        monsterLevel: monster.level,
      });
      sendEvent(PacketType.C2S_KILL_MONSTER_EVENT, {
        userId: localStorage.getItem('userId'),
      });
      killCount++;
      console.log(`killCount: ${killCount}`);

      if (
        monsterLevel === 3 ||
        monsterLevel === 6 ||
        monsterLevel === 9 ||
        monsterLevel === 12 ||
        monsterLevel === 15
      ) {
        if (killCount === bossToSpawn) {
          monsterLevel++;
          killCount = 0;
          console.log('bossLevelUp');

          clearInterval(monsterintervalId);

          setTimeout(() => {
            startSpawning();
          }, 3000);
        }
      } else {
        if (killCount === monstersToSpawn) {
          monsterLevel += 14;
          killCount = 0;
          console.log('monsterLevelUp');

          clearInterval(monsterintervalId);

          setTimeout(() => {
            startSpawning();
          }, 3000);
        }
      }
    }
  }

  monsters.forEach((monster) => {
    monster.move();
    monster.draw(ctx, true);
    if (monster.isBoss) {
      monster.useSkill(); // 보스만 스킬 사용
    }
  });

  // 상대방 게임 화면 업데이트
  opponentCtx.drawImage(opponentBackgroundImage, 0, 0, opponentCanvas.width, opponentCanvas.height);
  drawPath(opponentMonsterPath, opponentCtx); // 상대방 경로 다시 그리기

  opponentTowerDrawAndAttack(opponentTowers, opponentMonsters, opponentCtx);

  opponentMonsters.forEach((monster) => {
    monster.move();
    monster.opponentdraw(opponentCtx, true);
  });

  if (opponentBase) {
    opponentBase.draw(opponentCtx, baseImage, true);
  }
  requestAnimationFrame(gameLoop);
}

function opponentBaseAttacked(value) {
  opponentBaseHp = value;
  opponentBase.updateHp(opponentBaseHp);
  if (opponentBaseHp <= 0) {
    console.log('상대방 기지가 파괴되었습니다.');
  }
}

function initGame() {
  if (isInitGame) {
    return;
  }

  bgm = new Audio('sounds/bgm.mp3'); //!!!!!!!!!!!!!!!!!!바꿔야됨
  bgm.loop = true;
  bgm.volume = 0.2;
  bgm.play();
  initMap(); // 맵 초기화 (배경, 몬스터 경로 그리기)
  setTimeout(() => {
    startSpawning();
  }, 10000);

  gameLoop(); // 게임 루프 최초 실행
  isInitGame = true;
}

function matchFind(ownUserData, opponentUserData) {
  if (!ownUserData || !opponentUserData) {
    console.error('User data is missing:', { ownUserData, opponentUserData });
    return;
  }

  if (!ownUserData.userId || !opponentUserData.userId) {
    console.error('User ID is missing:', {
      ownUserId: ownUserData.userId,
      opponentUserId: opponentUserData.userId,
    });
    return;
  }

  if (
    !progressBarMessage ||
    !matchAcceptButton ||
    !user_info ||
    !opponentUser_name ||
    !opponentUser_winRate ||
    !ownUser_winRate ||
    !progressBar ||
    !loader ||
    !towersBox ||
    !canvas ||
    !opponentCanvas
  ) {
    console.error('UI elements are missing.');
    return;
  }

  progressBarMessage.textContent = '게임을 찾았습니다.';
  matchAcceptButton.style.display = 'block';

  // 자신과 상대방의 정보를 출력하는 구문
  user_info.style.display = 'block';

  opponentUser_name.textContent = opponentUserData.userId;

  let message = '상대방의 승률 : ' + calWinRate(opponentUserData) + '%';
  opponentUser_winRate.textContent = message;
  message = '나의 승률 : ' + calWinRate(ownUserData) + '%';
  ownUser_winRate.textContent = message;

  let progressValue = 0;
  progressBar.value = 0;
  progressBar.style.display = 'block';
  loader.style.display = 'none';

  clearInterval(matchAcceptInterval); // 중복 타이머 방지
  matchAcceptInterval = setInterval(() => {
    progressValue += 10;
    progressBar.value = progressValue;

    // 일정 시간이 지나면 자동으로 거절을 하도록 한다
    if (progressValue >= 100) {
      clearInterval(matchAcceptInterval);
      progressBarContainer.style.display = 'none';
      progressBar.style.display = 'none';
      matchAcceptButton.disabled = false;

      serverSocket.emit('event', {
        packetType: 17,
        userId: localStorage.getItem('userId'),
      });
      location.reload();
    }
  }, acceptTime / 10);

  // 수락 버튼에 서버 소켓으로 보내는 함수 출력
  matchAcceptButton.addEventListener('click', () => {
    matchAcceptButton.disabled = true;
    serverSocket.emit('event', {
      packetType: PacketType.C2S_MATCH_ACCEPT,
      userId: localStorage.getItem('userId'),
    });
  });
}

function calWinRate(userData) {
  if (userData.win + userData.lose === 0) {
    return 0;
  } else {
    return Math.round((userData.win / (userData.win + userData.lose)) * 100);
  }
}
// 전역 변수로 게임 시작 여부를 추적
let isGameStarted = false;

function matchStart() {
  clearInterval(matchAcceptInterval);
  progressBarMessage.textContent = '게임이 5초 뒤에 시작됩니다.';
  matchAcceptButton.style.display = 'none';
  user_info.style.display = 'none';
  let progressValue = 0;
  progressBar.value = 0;
  const progressInterval = setInterval(() => {
    progressValue += 10;
    progressBar.value = progressValue;
    progressBar.style.display = 'block';
    loader.style.display = 'none';
    if (progressValue >= 100) {
      clearInterval(progressInterval);
      serverSocket.on('disconnect', () => {
        loseGame();
      });
      progressBarContainer.style.display = 'none';
      progressBar.style.display = 'none';
      towersBox.style.display = 'block';
      towersBox.style.justifyContent = 'center';
      towersBox.style.textAlign = 'center';
      cursor.style.display = 'block';
      canvas.style.display = 'block';
      opponentCanvas.style.display = 'block';
      showGameElements(); // 게임 시작 시 요소 표시
      logoutButton.style.visibility = 'hidden'; // 로그아웃 버튼 보이지 않게 설정
    }
  }, 500);
}
let currentBossStage = 0; // 현재 보스가 소환된 스테이지

// 이미지 로딩 완료 후 서버와 연결하고 게임 초기화
Promise.all([
  new Promise((resolve) => (opponentBackgroundImage.onload = resolve)),
  new Promise((resolve) => (backgroundImage.onload = resolve)),
  ...towerImages.map((img) => new Promise((resolve) => (img.onload = resolve))),
  new Promise((resolve) => (baseImage.onload = resolve)),
  new Promise((resolve) => (pathImage.onload = resolve)),
  ...monsterImages.map((img) => new Promise((resolve) => (img.onload = resolve))),
]).then(() => {
  serverSocket = io('https://towerdefence.shop', {
    auth: {
      token: localStorage.getItem('token'),
    },
  });

  serverSocket.on('connect_error', (err) => {
    if (err.message === 'Authentication error') {
      alert('잘못된 토큰입니다.');
      location.href = '/login';
    }
  });

  // 대결 신청
  serverSocket.on('connect', () => {
    serverSocket.emit('event', {
      packetType: 13,
      userId: localStorage.getItem('userId'),
    });
    console.log('client checking: ', userId);
  });

  //서버 -> 게임시작
  serverSocket.on('gameInit', (packetType, data) => {
    towersData = data.towersData;
    towerLock = data.Payload.towerLock;
    monsterPath = data.Payload.monsterPath;
    initialTowerCoords = data.Payload.towerInit;
    basePosition = data.Payload.basePos;
    opponentMonsterPath = data.Payload.opponentMonsterPath;
    opponentInitialTowerCoords = data.Payload.opponentTowerInit;
    opponentBasePosition = data.Payload.opponentBasePos;
    userGold = data.Payload.userGold;
    baseHp = data.Payload.baseHp;
    score = data.Payload.score;

    if (!isInitGame) {
      initGame();
    }
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.style.display = 'block';
    initializeChat();
  });

  serverSocket.on('response', (data) => {
    console.log(data.message);
  });

  serverSocket.on('error', (data) => {
    console.error('Server Error:', data.message);
    //alert(data.message);
    window.location.href = 'index.html';
  });

  serverSocket.on('event', (data, payload) => {
    console.log(`서버로부터 이벤트 수신: ${JSON.stringify(data)}`);

    if (data.PacketType === 14) {
      if (data.ownUserData && data.opponentUserData) {
        matchFind(data.ownUserData, data.opponentUserData);
      } else {
        console.error('User data is missing:', data);
      }
    }
    if (data.PacketType === 18) {
      console.log('매치 스타트');
      matchStart();
    }
    if (data.PacketType === 111) {
      const systemMessageElement = document.createElement('div');
      systemMessageElement.textContent = 'System: 증강체의 효과로 추가 골드를 획득합니다.';
      systemMessageElement.style.color = 'yellow';
      chatLog.appendChild(systemMessageElement);
    }
    if (data.PacketType === 112) {
      console.log('상대방의 능력으로 인한 몬스터 추가');
    }
  });

  serverSocket.on('towerAttack', (data) => {
    towerAttackToSocket(userId, data, monsters, opponentMonsters, towers);
  });

  serverSocket.on('towerSale', (data) => {
    towerSaleToSocket(userId, data, towers, opponentTowers);
  });

  serverSocket.on('userTowerUpgrade', (data) => {
    towerUpgradeToSocket(userId, data, towers, opponentTowers);
  });

  serverSocket.on('userTowerCreate', (data) => {
    towerCreateToSocket(userId, data, towers, opponentTowers);
  });

  serverSocket.on('towerAllow', (data) => {
    const newTowerLock = towerAllow(towerLock, data);
    towerLock = newTowerLock;
  });

  serverSocket.on('gameOver', (data) => {
    console.log('신호받음');
    bgm.pause();
    const { isWin } = data;
    const winSound = new Audio('sounds/win.wav');
    const loseSound = new Audio('sounds/lose.wav');
    winSound.volume = 0.2;
    loseSound.volume = 0.2;
    sendEvent(PacketType.C2S_RECORD_RECENT_GAME, {
      isWin: isWin,
      score: score,
    });
    if (isWin) {
      winSound.play().then(() => {
        window.location.href = 'resultWindow.html';
      });
    } else {
      loseSound.play().then(() => {
        window.location.href = 'resultWindow.html';
      });
    }
  });
  serverSocket.on('gameSync', (packet) => {
    switch (packet.packetType) {
      case PacketType.S2C_ENEMY_TOWER_SPAWN:
        placeNewOpponentTower(packet.data.opponentTowers);
        break;
      case PacketType.S2C_ENEMY_SPAWN_MONSTER:
        spawnOpponentMonster(packet.data.opponentMonsters);
        break;
      case PacketType.S2C_ENEMY_DIE_MONSTER:
        destroyOpponentMonster(packet.data.destroyedOpponentMonsterIndex);
        break;
      case PacketType.S2C_UPDATE_BASE_HP:
        opponentBaseAttacked(packet.data.opponentBaseHp);
        break;
      case PacketType.S2C_UPDATE_MONSTER_HP:
        updateMonstersHp(packet.payload);
        break;
      case PacketType.S2C_GAMESYNC:
        gameSync(packet.data);
        break;
    }
  });
});

// 게임을 졌다는 신호를 보내는 함수
function loseGame() {
  sendEvent(PacketType.C2S_GAMEOVER_SIGNAL, {});
}

// 채팅 기능 함수
function initializeChat() {
  const chatLog = document.getElementById('chatLog');
  const chatInput = document.getElementById('chatInput');
  const chatContainer = document.getElementById('chatContainer');

  // 채팅 UI 보이기
  chatContainer.style.display = 'block';

  // Socket.IO 연결 설정
  const socket = io();

  // 서버에서 채팅 메시지를 수신했을 때 UI에 표시
  socket.on('chat message', (data) => {
    if (data && data.userId && data.message) {
      const messageElement = document.createElement('div');

      messageElement.textContent = `${data.userId}: ${data.message}`;
      chatLog.appendChild(messageElement);
      chatLog.scrollTop = chatLog.scrollHeight;
    } else {
      console.error('채팅 메시지 데이터 형식이 잘못되었습니다.', data);
    }
  });

  chat('System: 5초 후 게임이 시작됩니다.');

  // 입력 필드에서 Enter 키를 누르면 메시지를 서버로 전송
  chatInput.addEventListener('keydown', (event) => {
    const userId = localStorage.getItem('userId');
    if (event.key === 'Enter') {
      const message = chatInput.value;
      chatInput.value = ''; // 입력 필드 비우기
      socket.emit('chat message', { userId: userId, message });
    }
  });
}

function updateMonstersHp(updatedMonsters) {
  updatedMonsters.forEach((updatedMonster) => {
    const monster = monsters.find((m) => m.getMonsterIndex() === updatedMonster.id);
    if (monster) {
      console.log(`Updating monster HP: ${updatedMonster.id} to ${updatedMonster.hp}`); // 업데이트 로그 출력
      monster.setHp(updatedMonster.hp);

      // 몬스터 사망 체크
      if (updatedMonster.hp <= 0) {
        console.log(`Monster ${updatedMonster.id} has died.`);
        const index = monsters.findIndex((m) => m.getMonsterIndex() === updatedMonster.id);
        if (index !== -1) {
          monsters.splice(index, 1); // 배열에서 몬스터 제거
          console.log(`Monster ${updatedMonster.id} removed from monsters array.`);
        }
      }
    }
  });
}

// Base Attack 버튼 생성
const attackMonstersButton = document.createElement('button');
attackMonstersButton.id = 'attack-monsters-button';
attackMonstersButton.textContent = '궁극기 공격';
attackMonstersButton.style.position = 'absolute';
attackMonstersButton.style.top = '10px';
attackMonstersButton.style.left = '10px';
attackMonstersButton.style.padding = '10px 20px';
attackMonstersButton.style.fontSize = '25px';
attackMonstersButton.style.cursor = 'pointer';
document.body.appendChild(attackMonstersButton);

// Cooldown 타이머 생성
const cooldownElement = document.createElement('div');
cooldownElement.id = 'cooldown-timer';
cooldownElement.style.position = 'absolute';
cooldownElement.style.top = '50px';
cooldownElement.style.left = '10px';
cooldownElement.style.fontSize = '30px';
cooldownElement.style.color = 'red';
cooldownElement.style.display = 'none'; // 초기에는 숨김
document.body.appendChild(cooldownElement);

attackMonstersButton.addEventListener('click', () => {
  const monsterIndices = monsters.map((monster) => monster.getMonsterIndex());
  const baseUuid = localStorage.getItem('userId'); // Base UUID를 설정합니다.
  console.log('Monster Indices:', monsterIndices); // 디버그 로그 추가
  console.log('Base UUID:', baseUuid); // 디버그 로그 추가
  base.monsters = monsters; // Base 객체에 필드 몬스터 목록을 설정합니다.
  base.attackMonsters({ baseUuid, monsterIndices });
});

// 게임 시작 시 호출하여 요소를 표시하는 로직
// 베이스공격, 돌아가기, 항복하기 버튼 겜 시작전까지 숨김
function showGameElements() {
  if (attackMonstersButton) {
    attackMonstersButton.style.display = 'block';
  }
  if (backButton) {
    backButton.style.display = 'none';
  }
  if (surrenderButton) {
    surrenderButton.style.visibility = 'visible';
  }
  isGameStarted = true;
}

const towersBox = document.getElementById('towers');
const buyTowerButton1 = document.getElementById('baseTower');
const buyTowerButton2 = document.getElementById('speedTower');
const buyTowerButton3 = document.getElementById('speedSupportTower');
const buyTowerButton4 = document.getElementById('attackSupportTower');
const buyTowerButton5 = document.getElementById('strongTower');
const buyTowerButton6 = document.getElementById('splashTower');
const buyTowerButton7 = document.getElementById('multiShotTower');
const buyTowerButton8 = document.getElementById('poisonTower');
const buyTowerButton9 = document.getElementById('growthTower');
const upgradeTowerButton = document.getElementById('towerUpgrade');
const saleTowerButton = document.getElementById('towerSale');

const buttons = [
  buyTowerButton1,
  buyTowerButton2,
  buyTowerButton3,
  buyTowerButton4,
  buyTowerButton5,
  buyTowerButton6,
  buyTowerButton7,
  buyTowerButton8,
  buyTowerButton9,
];

const cursorImage = document.getElementById('cursorImage');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', (event) => {
    if (!towerLock[i]) {
      chat('해금 조건이 만족되지 않은 타워입니다.');
      audioOfTowerNotAllow.currentTime = 0;
      audioOfTowerNotAllow.play();
      return;
    }

    towerBuilderCheck((i + 1) * 100, buttons[i]);
    event.stopPropagation();
  });
}

upgradeTowerButton.addEventListener('click', (event) => {
  towerUpgradeCheck();
  event.stopPropagation();
});

saleTowerButton.addEventListener('click', (event) => {
  towerSaleCheck();
  event.stopPropagation();
});

const mousePos = (event) => {
  posX = event.offsetX;
  posY = event.offsetY;

  if (towerBuilderId) towerRequest(userId, towerBuilderId, posX, posY);
  if (towerUpgrade) towerUpgrades(userId, towers, posX, posY);
  if (towerSale) towerSales(userId, towers, posX, posY);
};

const gameCanvas = document.getElementById('gameCanvas');
const cursor = document.getElementById('cursor');
gameCanvas.addEventListener('click', mousePos);

gameCanvas.addEventListener('mousemove', (e) => {
  let mouseX = e.clientX;
  let mouseY = e.clientY;

  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
  cursor.style.opacity = 0.8;
});

gameCanvas.addEventListener('mouseout', (e) => {
  cursor.style.opacity = 0;
});

hideGameElements();

// Base Attack 버튼 및 Boss Attempt 요소를 숨기는 로직
function hideGameElements() {
  if (attackMonstersButton) {
    attackMonstersButton.style.display = 'none';
  }
}

export function sendEvent(handlerId, payload) {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    console.error('User ID is missing. Cannot send event.');
    return;
  }

  serverSocket.emit('event', {
    userId,
    clientVersion: CLIENT_VERSION,
    packetType: handlerId,
    payload,
  });
}

// 로그아웃 버튼 변수 초기화
const logoutButton = document.getElementById('logout');

// 돌아가기 버튼 생성 및 설정
const backButton = document.createElement('button');
backButton.textContent = '돌아가기';
backButton.style.position = 'absolute';
backButton.style.top = '100px'; // 로그아웃 버튼 아래 위치하도록 설정
backButton.style.right = '10px';
backButton.style.padding = '10px 20px';
backButton.style.fontSize = '16px';
backButton.style.cursor = 'pointer';
document.body.appendChild(backButton);

// 항복하기 버튼 생성 및 설정
const surrenderButton = document.createElement('button');
surrenderButton.textContent = '항복하기';
surrenderButton.style.position = 'absolute';
surrenderButton.style.top = '150px'; // 기존 UI 요소 아래 위치하도록 설정
surrenderButton.style.right = '10px';
surrenderButton.style.padding = '10px 20px';
surrenderButton.style.fontSize = '16px';
surrenderButton.style.cursor = 'pointer';
surrenderButton.style.visibility = 'hidden';
document.body.appendChild(surrenderButton);

// 항복하기 버튼 클릭 시 게임 종료 및 패배 처리
surrenderButton.addEventListener('click', () => {
  loseGame(); // 플레이어가 항복한 경우 패배 처리
});

// 돌아가기 버튼 클릭 시 홈 화면으로 이동
backButton.addEventListener('click', () => {
  location.href = 'https://towerdefence.shop/index.html'; // 홈 화면 경로로 이동
});

export const chat = (chat) => {
  const systemMessageElement = document.createElement('div');
  systemMessageElement.textContent = `System: ${chat}`;
  systemMessageElement.style.color = 'yellow';
  chatLog.appendChild(systemMessageElement);
};
