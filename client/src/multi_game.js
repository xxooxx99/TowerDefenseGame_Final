import { Base } from './base.js';
import { Monster } from './monster.js';
import { AttackSupportTower, poisonTower, SpeedSupportTower, SplashTower, Tower } from './tower.js';
import {
  Boss,
  DoomsdayBoss,
  FinaleBoss,
  MightyBoss,
  TimeRifter,
  TowerControlBoss,
} from './boss.js'; // 보스 클래스 추가
import { CLIENT_VERSION, INITIAL_TOWER_NUMBER, PacketType, TOWER_TYPE } from '../constants.js';
import {
  towerImageInit,
  placeInitialTowers,
  towerAttackToSocket,
  towerSaleToSocket,
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
let acceptTime = 1000000; // 수락 대기 시간
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
// Initial Tower Data at Game Start
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

// Tower Control Button Status
let towerSale = null;
let towerUpgrade = null;
let towerBuilderId = null;
let towerBuilderType = null;

// Live Cursor Pos
let posX = 0;
let posY = 0;

// Static Tower data received from the server
export let towersData;

// Tower data for the current user
let towers = {};

//#endregion
towerImageInit();

//게임 데이터
let bgm;

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

let audioOfTowerAddAndUpgrade = new Audio('sounds/TowerAddAndUpgrade.wav');
audioOfTowerAddAndUpgrade.volume = 0.05;

let audioOfTowerSale = new Audio('sounds/TowerSale.wav');
audioOfTowerSale.volume = 0.8;

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

function towerRequest() {
  const towerType = TOWER_TYPE[towerBuilderId / 100 - 1];
  sendEvent(PacketType.C2S_TOWER_CREATE, {
    userId,
    towerType,
    towerId: towerBuilderId,
    posX,
    posY,
  });
}

function towerUpgrades() {
  let min = Infinity;
  let selectTower = null;
  for (let towerType in towers) {
    for (let towerId in towers[towerType]) {
      for (let i = 0; i < towers[towerType][towerId].length; i++) {
        const tower = towers[towerType][towerId][i];
        const distance = Math.sqrt(Math.pow(posX - tower.x, 2) + Math.pow(posY - tower.y, 2));

        if (min > distance) {
          min = distance;
          selectTower = tower;
        }
      }
    }
  }
  if (selectTower.towerType == TOWER_TYPE[TOWER_TYPE.length - 1]) {
    console.log('성장형 타워는 직접 업그레이드 할 수 없습니다.');
    return;
  }

  if (min < 50) {
    sendEvent(PacketType.C2S_TOWER_UPGRADE, {
      userId,
      towerType: selectTower.towerType,
      towerId: selectTower.towerId,
      towerNumber: selectTower.towerNumber,
    });
  }
}

function towerSales() {
  let min = Infinity;
  let selectTower = null;
  for (let towerType in towers) {
    for (let towerId in towers[towerType]) {
      for (let i = 0; i < towers[towerType][towerId].length; i++) {
        const tower = towers[towerType][towerId][i];
        const distance = Math.sqrt(Math.pow(posX - tower.x, 2) + Math.pow(posY - tower.y, 2));

        if (min > distance) {
          min = distance;
          selectTower = tower;
        }
      }
    }
  }

  if (min < 50) {
    sendEvent(PacketType.C2S_TOWER_SALE, {
      userId,
      towerType: selectTower.towerType,
      towerId: selectTower.towerId,
      towerNumber: selectTower.towerNumber,
    });
  }
}

function opponentTowerAttack(monsterValue) {
  try {
    const attackedMonster = opponentMonsters.find((monster) => {
      return monster.getMonsterIndex() === monsterValue.monsterIndex;
    });
    attackedMonster.setHp(monsterValue.hp);
  } catch (err) {
    console.log('이미 사망한 몬스터입니다.');
  }
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

function spawnMonster() {
  if (bossSpawned && currentBossStage === monsterLevel) {
    console.log('Boss already spawnd for this level');
    return;
  }

  if (monsterSpawnCount < monstersToSpawn) {
    const monster = new Monster(monsterPath, monsterImages, monsterLevel);
    monster.setMonsterIndex(monsterIndex);
    monsters.push(monster);

    sendEvent(PacketType.C2S_SPAWN_MONSTER, { hp: monster.getMaxHp(), monsterIndex, monsterLevel });
    monsterIndex++;
    monsterSpawnCount++;
  }
  if (
    bossSpawnCount < bossSpawnCount ||
    monsterLevel === 3 ||
    monsterLevel === 6 ||
    monsterLevel === 9 ||
    monsterLevel === 12 ||
    monsterLevel === 15
  ) {
    const monster = new Monster(monsterPath, monsterImages, monsterLevel);
    monster.setMonsterIndex(monsterIndex);
    monsters.push(monster);

    sendEvent(PacketType.C2S_SPAWN_MONSTER, { hp: monster.getMaxHp(), monsterIndex, monsterLevel });
    monsterIndex++;
    bossSpawnCount++;
  }

  console.log(`몬스터 소환, 총 소환된 몬스터: ${monsterSpawnCount}`);
  console.log(`보스 몬스터 소환, 청 소환된 보스 몬스터: ${bossSpawnCount}`);

  if (monsterSpawnCount >= monstersToSpawn) {
    monsterSpawnCount = 0;
    clearInterval(monsterintervalId);
    console.log('라운드 몬스터 최대 소환');
  }
  if (bossSpawnCount >= bossToSpawn) {
    bossSpawnCount = 0;
    clearInterval(monsterintervalId);
    console.log('보스 최대 소환');
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
  newMonster.setMonsterIndex(value[value.length - 1].monsterIndex);
  opponentMonsters.push(newMonster);
}
function destroyOpponentMonster(index) {
  const destroyedMonsterIndex = opponentMonsters.findIndex((monster) => {
    return monster.getMonsterIndex() === index;
  });
  opponentMonsters.splice(destroyedMonsterIndex, 1);
}

/* function spawnBoss() {
  bossSpawned = true;
  currentBossStage = monsterLevel;

  const bossClasses = [MightyBoss, TowerControlBoss, DoomsdayBoss, TimeRifter, FinaleBoss];
  const randomBossClass = bossClasses[Math.floor(Math.random() * bossClasses.length)];

  const boss = new randomBossClass(monsterPath, monsterLevel, socket, 'sounds/bossBgm.mp3', {
    skillSound: 'sounds/bossSkill.wav',
  });

  monsters.push(boss);
  sendEvent(PacketType.C2S_SPAWN_MONSTER, {
    hp: boss.getMaxHp(),
    monsterIndex,
    monsterLevel,
    isBoss: true,
  });

  // 보스 등장 메시지
  socket.emit('chat message', {
    userId: 'System',
    message: `WARNING: A ${boss.constructor.name} has appeared at Level ${monsterLevel}!`,
  });

  monsterIndex++;
  console.log('Boss spawned');
} */

/* function onBossDie() {
  bossSpawned = false; // 보스가 죽으면 보스 스폰 상태 해제
  startSpawning(); // 다음 스테이지로 넘어가면서 몬스터 스폰 시작
} */

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
  // 렌더링 시에는 항상 배경 이미지부터 그려야 합니다! 그래야 다른 이미지들이 배경 이미지 위에 그려져요!
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // 배경 이미지 다시 그리기
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

  for (let towerType in towers) {
    for (let towerId in towers[towerType]) {
      for (let i = 0; i < towers[towerType][towerId].length; i++) {
        const tower = towers[towerType][towerId][i];
        tower.draw(ctx);
        tower.updateCooldown(); //쿨타임도
        const data = tower.attack(monsters, towers);
        if (data) {
          sendEvent(PacketType.C2S_TOWER_ATTACK, {
            userId,
            towerType,
            towerId,
            towerNumber: tower.towerNumber,
            monsterIndexs: data.monsters,
            isExistSpeed: data.isExistSpeed,
            isExistPower: data.isExistPower,
            monstersSplash: data.monstersSplash,
            poisonDamage: data.poisonDamage,
            time: data.now,
          });
        }
      }
    }
  }

  const growthTowers = towers[TOWER_TYPE[TOWER_TYPE.length - 1]];
  for (let towerId in growthTowers) {
    for (let i = 0; i < growthTowers[towerId].length; i++) {
      if (growthTowers[towerId][i].killCount <= 0 && growthTowers[towerId][i].satisfied) {
        sendEvent(PacketType.C2S_TOWER_UPGRADE, {
          userId,
          towerType: TOWER_TYPE[TOWER_TYPE.length - 1],
          towerId: towerId,
          towerNumber: growthTowers[towerId][i].towerNumber,
        });
        growthTowers[towerId][i].satisfied = false;
      }
    }
  }

  // 몬스터가 공격을 했을 수 있으므로 기지 다시 그리기
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

          //스테이지 변경시 base attack 공격 초기화
          base.resetAttack();

          // if ([3, 6, 9, 12, 15].includes(monsterLevel) && !bossSpawned) {
          clearInterval(monsterintervalId);
          // spawnBoss();
          // bossSpawned = true;

          setTimeout(() => {
            startSpawning();
          }, 3000);
        }
      } else {
        if (killCount === monstersToSpawn) {
          monsterLevel++;
          killCount = 0;
          console.log('monsterLevelUp');

          //스테이지 변경시 base attack 공격 초기화
          base.resetAttack();

          // if ([3, 6, 9, 12, 15].includes(monsterLevel) && !bossSpawned) {
          clearInterval(monsterintervalId);
          // spawnBoss();
          // bossSpawned = true;

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

  for (let towerType in opponentTowers) {
    for (let towerId in opponentTowers[towerType])
      for (let i = 0; i < opponentTowers[towerType][towerId].length; i++) {
        const tower = opponentTowers[towerType][towerId][i];
        tower.draw(opponentCtx);
        tower.attack(opponentMonsters, towers, false);
        tower.updateCooldown();
      }
  }

  opponentMonsters.forEach((monster) => {
    monster.move();
    monster.draw(opponentCtx, true);
  });

  if (opponentBase) {
    opponentBase.draw(opponentCtx, baseImage, true);
  }
  requestAnimationFrame(gameLoop); // 지속적으로 다음 프레임에 gameLoop 함수 호출할 수 있도록 함
}

function opponentBaseAttacked(value) {
  opponentBaseHp = value;
  opponentBase.updateHp(opponentBaseHp);
}
function initGame() {
  if (isInitGame) {
    return;
  }

  bgm = new Audio('sounds/bgm.mp3');
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
      progressBarContainer.style.display = 'none';
      progressBar.style.display = 'none';
      towersBox.style.display = 'block';
      towersBox.style.justifyContent = 'center';
      towersBox.style.textAlign = 'center';
      cursor.style.display = 'block';
      canvas.style.display = 'block';
      opponentCanvas.style.display = 'block';
      showGameElements(); // 게임 시작 시 요소 표시
      // TODO. 유저 및 상대방 유저 데이터 초기화
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
  serverSocket = io('http://localhost:8080', {
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

  serverSocket.on('bossSpawned', (data) => {
    console.log('Received bossSpawned event:', data);
    console.log('monsterPath:', monsterPath); // 여기서 monsterPath 확인

    if (!data.success) {
      console.error(data.message);
      return;
    }

    const { bossType } = data;

    if (!bossType) {
      console.error('Error: No boss type received from server.');
      return;
    }

    console.log(`Spawning ${bossType}...`);

    let boss;

    // 보스 타입에 따라 보스 생성
    switch (bossType) {
      case 'MightyBoss':
        console.log('Creating MightyBoss with path:', monsterPath);
        boss = new MightyBoss(
          monsterPath,
          serverSocket,
          towers,
          './sounds/Boss_bgm.mp3',
          './sounds/bossskill.mp3',
        );
        break;
      case 'TowerControlBoss':
        boss = new TowerControlBoss(
          monsterPath,
          serverSocket,
          towers,
          './sounds/Boss_bgm.mp3',
          './sounds/bossskill.mp3',
        );
        break;
      case 'DoomsdayBoss':
        boss = new DoomsdayBoss(
          monsterPath,
          serverSocket,
          towers,
          './sounds/Boss_bgm.mp3',
          './sounds/bossskill.mp3',
        );
        break;
      case 'TimeRifter':
        boss = new TimeRifter(
          monsterPath,
          serverSocket,
          towers,
          './sounds/Boss_bgm.mp3',
          './sounds/bossskill.mp3',
        );
        break;
      case 'FinaleBoss':
        boss = new FinaleBoss(
          monsterPath,
          serverSocket,
          './sounds/Boss_bgm.mp3',
          './sounds/bossskill.mp3',
        );
        break;
      default:
        console.error('Invalid boss type:', bossType);
        return;
    }

    // 보스 초기화 및 화면에 그리기
    if (boss) {
      boss.init(); // 보스 초기화 (스킬 및 BGM)
      monsters.push(boss); // 보스를 monsters 배열에 추가
      if (typeof boss.draw === 'function') {
        // draw 메서드가 함수인지 확인
        boss.draw(ctx); // 보스를 화면에 그리기
      } else {
        console.error('Error: boss.draw is not a function');
      }
      boss.startSkills(); // 보스 스킬 사용 시작
      console.log(`${bossType} successfully spawned and is ready.`);
    }
  });

  serverSocket.on('gameInit', (packetType, data) => {
    towersData = data.towersData;
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
      console.log('능력으로 인한 돈 추가');
    }
    if (data.PacketType === 112) {
      console.log('상대방의 능력으로 인한 몬스터 추가');
      spawnMonster();
    }
    // if (!isInitGame) {
    //   initGame(payload);
    // }
  });

  serverSocket.on('towerAttack', (data) => {
    towerAttackToSocket(userId, data, monsters, opponentMonsters, towers);
  });

  serverSocket.on('towerSale', (data) => {
    towerSaleToSocket(userId, data, towers, opponentTowers);
  });

  serverSocket.on('userTowerUpgrade', (data) => {
    const { towerType, towerId, towerCost, towerData } = data;
    if (userId !== data.userId) {
      const arr = opponentTowers[towerType][towerId - 1];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].towerNumber == towerData.number) {
          arr.splice(i, 1);
          break;
        }
      }

      const tower = new Tower(towerType, towerId, towerData.number, towerData.posX, towerData.posY);
      opponentTowers[towerType][towerId].push(tower);
    } else {
      const arr = towers[towerType][towerId - 1];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].towerNumber == towerData.number) {
          arr.splice(i, 1);
          break;
        }
      }

      const tower = new Tower(towerType, towerId, towerData.number, towerData.posX, towerData.posY);
      towers[towerType][towerId].push(tower);
      audioOfTowerAddAndUpgrade.currentTime = 0;
      audioOfTowerAddAndUpgrade.play();
      userGold -= towerCost;
    }
  });

  serverSocket.on('userTowerCreate', (data) => {
    const { towerId, towerCost, number, posX, posY } = data;

    let tower;
    switch (TOWER_TYPE[towerId / 100 - 1]) {
      case TOWER_TYPE[2]:
        tower = new SpeedSupportTower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
        break;
      case TOWER_TYPE[3]:
        tower = new AttackSupportTower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
        break;
      case TOWER_TYPE[5]:
        tower = new SplashTower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
        break;
      case TOWER_TYPE[7]:
        tower = new poisonTower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
        break;
      default:
        tower = new Tower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
        break;
    }

    if (userId !== data.userId) {
      opponentTowers[TOWER_TYPE[towerId / 100 - 1]][towerId].push(tower);
    } else {
      towers[TOWER_TYPE[towerId / 100 - 1]][towerId].push(tower);
      audioOfTowerAddAndUpgrade.currentTime = 0;
      audioOfTowerAddAndUpgrade.play();
      userGold -= towerCost;
    }
  });

  // 게임 종료 로직
  function endGame(isWin) {
    bgm.pause(); // 게임 배경음악 중지
    const winSound = new Audio('sounds/win.wav');
    const loseSound = new Audio('sounds/lose.wav');
    winSound.volume = 0.3;
    loseSound.volume = 0.3;

    if (isWin) {
      winSound.play().then(() => {
        alert('당신이 게임에서 승리했습니다!');
        location.reload(); // 승리 시 페이지 리로드
      });
    } else {
      loseSound.play().then(() => {
        alert('아쉽지만 대결에서 패배하셨습니다! 다음 대결에서는 꼭 이기세요!');
        location.reload(); // 패배 시 페이지 리로드
      });
    }
  }

  // 게임 내에서 base의 hp가 0이 되었을 때 처리
  function checkBaseHp() {
    if (baseHp <= 0) {
      endGame(false); // 플레이어의 기지가 파괴된 경우 패배 처리
    } else if (opponentBaseHp <= 0) {
      endGame(true); // 상대방 기지가 파괴된 경우 승리 처리
    }
  }

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
        alert('당신이 게임에서 승리했습니다!');
        // TODO. 게임 종료 이벤트 전송
        window.location.href = 'resultWindow.html';
      });
    } else {
      loseSound.play().then(() => {
        alert('아쉽지만 대결에서 패배하셨습니다! 다음 대결에서는 꼭 이기세요!');
        // TODO. 게임 종료 이벤트 전송
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

/* let chatInitialized = false;
let lastSentMessage = '';
const messageThrottle = 1000;
let lastSentTime = 0;
let isSendingMessage = false; */

// 채팅 기능 함수
function initializeChat() {
  // if (chatInitialized) return;

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

      /* if (data.userId === 'System') {
        messageElement.classList.add('system-message');
      } */

      messageElement.textContent = `${data.userId}: ${data.message}`;
      chatLog.appendChild(messageElement);
      chatLog.scrollTop = chatLog.scrollHeight;
    } else {
      console.error('채팅 메시지 데이터 형식이 잘못되었습니다.', data);
    }
  });

  const systemMessageElement = document.createElement('div');
  systemMessageElement.textContent = 'System: 5초 후 게임이 시작됩니다.';
  systemMessageElement.style.color = 'yellow';
  chatLog.appendChild(systemMessageElement);
  chatLog.scrollTop = chatLog.scrollHeight;

  // 입력 필드에서 Enter 키를 누르면 메시지를 서버로 전송
  chatInput.addEventListener('keydown', (event) => {
    const userId = localStorage.getItem('userId');
    if (event.key === 'Enter') {
      const message = chatInput.value;
      chatInput.value = ''; // 입력 필드 비우기
      /* isSendingMessage = true; */

      /* const currentTime = Date.now();
      if (message !== lastSentMessage || currentTime - lastSentTime > messageThrottle) {
        lastSentMessage = message;
        lastSentTime = currentTime;
        console.log(`Sending chat message: ${message}`); */
      socket.emit('chat message', { userId: userId, message });
      /* setTimeout(() => (isSendingMessage = false), 500);
      } */
    }
  });

  /* chatInitialized = true; */
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
attackMonstersButton.id = 'attack-monsters-button'; // ID 추가
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
    backButton.style.display = 'block';
  }
  if (surrenderButton) {
    surrenderButton.style.display = 'block';
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

  if (towerBuilderId) towerRequest();
  if (towerUpgrade) towerUpgrades();
  if (towerSale) towerSales();
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

function sendEvent(handlerId, payload) {
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
document.body.appendChild(surrenderButton);

// 항복하기 버튼 클릭 시 게임 종료 및 패배 처리
surrenderButton.addEventListener('click', () => {
  loseGame(); // 플레이어가 항복한 경우 패배 처리
});

// 돌아가기 버튼 클릭 시 홈 화면으로 이동
backButton.addEventListener('click', () => {
  location.href = 'http://localhost:8080/index.html'; // 홈 화면 경로로 이동
});
