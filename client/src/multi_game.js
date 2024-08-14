import { Base } from './base.js';
import { Monster } from './monster.js';
import {
  AttackSupportTower,
  growthTower,
  poisonTower,
  SpeedSupportTower,
  SplashTower,
  Tower,
} from './tower.js';
import { Boss } from './boss.js'; // 보스 클래스 추가
import { CLIENT_VERSION, INITIAL_TOWER_NUMBER, PacketType, TOWER_TYPE } from '../constants.js';

if (!localStorage.getItem('token')) {
  alert('로그인이 필요합니다.');
  location.href = '/login';
}

const userId = localStorage.getItem('userId');
if (!userId) {
  alert('유저 아이디가 필요합니다.');
  location.href = '/login';
}

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

// 게임 데이터
let towerUpgrade = null;
let towerBuilderId = null;
let towerBuilderType = null;
let posX = 0;
let posY = 0;

let intervalId = null;
// 게임 데이터
export let towersData; // 타워 데이터
let monsterintervalId = null;
/* let killCount = 0; */
let monsterSpawnCount = 0; // 몬스터 스폰 수 초기화
// 게임 데이터
let towerCost = 100; // 타워 구입 비용
let monsterSpawnInterval = 2000; // 몬스터 생성 주기
let towerIndex = 1;
let monsterIndex = 1;
// 설정 데이터
let acceptTime = 10000; // 수락 대기 시간

// 인터벌 데이터
let matchAcceptInterval;
// 유저 데이터
let userGold; // 유저 골드
let base; // 기지 객체
let baseHp = 0; // 기지 체력
let monsterLevel = 0; // 몬스터 레벨
let monsterPath; // 몬스터 경로
let initialTowerCoords; // 초기 타워 좌표
let basePosition; // 기지 좌표
let monsters = []; // 유저 몬스터 목록
let towers = {}; // 유저 타워 목록
let score = 0; // 게임 점수
let highScore = 0; // 기존 최고 점수
// 상대 데이터
let opponentBase; // 상대방 기지 객체
let opponentBaseHp = 0;
let opponentMonsterPath; // 상대방 몬스터 경로
let opponentInitialTowerCoords; // 상대방 초기 타워 좌표
let opponentBasePosition; // 상대방 기지 좌표
let opponentMonsters = []; // 상대방 몬스터 목록
let opponentTowers = {}; // 상대방 타워 목록
let isInitGame = false;
const NUM_OF_MONSTERS = 4; // 몬스터 개수
// 이미지 로딩 파트
const backgroundImage = new Image();
backgroundImage.src = 'images/bg.webp';
const opponentBackgroundImage = new Image();
opponentBackgroundImage.src = 'images/bg.webp';
export const towerImages = [];
for (let i = 0; i < 9; i++) {
  for (let k = 0; k <= 2; k++) {
    const image = new Image();
    image.src = `images/tower${100 * (i + 1) + k}.png`;
    towerImages.push(image);
  }
}

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

let bgm;

function initMap() {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // 배경 이미지 그리기
  drawPath(monsterPath, ctx);
  drawPath(opponentMonsterPath, opponentCtx);
  placeInitialTowers(initialTowerCoords, towers); // 초기 타워 배치
  placeInitialTowers(opponentInitialTowerCoords, opponentTowers); // 상대방 초기 타워 배치
  if (!base) placeBase(basePosition, true);
  if (!opponentBase) placeBase(opponentBasePosition, false);
  towerIndex += INITIAL_TOWER_NUMBER;
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
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); // 피타고라스 정리로 두 점 사이의 거리를 구함 (유클리드 거리)
    const angle = Math.atan2(deltaY, deltaX); // 두 점 사이의 각도를 tan-1(y/x)로 구해야 함 (자세한 것은 역삼각함수 참고): 삼각함수는 변의 비율! 역삼각함수는 각도를 구하는 것!
    for (let j = gap; j < distance - gap; j += segmentLength) {
      const x = startX + Math.cos(angle) * j; // 다음 이미지 x좌표 계산(각도의 코사인 값은 x축 방향의 단위 벡터 * j를 곱하여 경로를 따라 이동한 x축 좌표를 구함)
      const y = startY + Math.sin(angle) * j; // 다음 이미지 y좌표 계산(각도의 사인 값은 y축 방향의 단위 벡터 * j를 곱하여 경로를 따라 이동한 y축 좌표를 구함)
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

function placeInitialTowers(initialTowerCoords, initialTowers) {
  for (let towerData in towersData) {
    initialTowers[towerData] = {};
    for (let i = 0; i < towersData[towerData].length; i++) {
      const id = towersData[towerData][i].id;
      initialTowers[towerData][id] = [];
    }
  }

  for (let towerCoords in initialTowerCoords) {
    if (towerCoords !== 'length') {
      const towerType = initialTowerCoords[towerCoords];
      for (let towerId in towerType) {
        towerType[towerId].forEach((towerData) => {
          const tower = new Tower(
            towerCoords,
            towerId,
            towerData.number,
            towerData.posX,
            towerData.posY,
          );

          initialTowers[towerCoords][towerId].push(tower);
        });
      }
    }
  }
}

function towerUpgradeCheck() {
  if (towerBuilderId || towerBuilderType) return;
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
  if (towerUpgrade) return;
  if (!towerBuilderId) {
    towerBuilderId = towerType;
    towerBuilderType = TOWER_TYPE[towerBuilderId / 100];
    button.style.backgroundColor = 'red';
  } else if (towerBuilderId === towerType) {
    button.style.backgroundColor = 'white';
    towerBuilderId = null;
    towerBuilderType = null;
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
// function placeNewOpponentTower(value) {
//   const newTowerCoords = value[value.length - 1];
//   const newTower = new Tower(newTowerCoords.tower.X, newTowerCoords.tower.Y);
//   newTower.setTowerIndex(newTowerCoords.towerIndex);
//   opponentTowers.push(newTower);
// }

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

function spawnMonster() {
  const monster = new Monster(monsterPath, monsterImages, monsterLevel);
  monster.setMonsterIndex(monsterIndex);
  monster.onDie = onMonsterDie; // 몬스터가 죽을 때 호출되는 콜백 설정
  monsters.push(monster);
  sendEvent(PacketType.C2S_SPAWN_MONSTER, { hp: monster.getMaxHp(), monsterIndex, monsterLevel });
  monsterIndex++;
  monsterSpawnCount++;

  if (monsterSpawnCount >= 20) {
    clearInterval(monsterintervalId);
    monsterLevel++;
    monsterSpawnCount = 0;
    setTimeout(() => {
      startSpawning();
    }, 5000);
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

function gameSync(data) {
  score = data.score;
  userGold = data.gold;
  baseHp = data.baseHp;
  base.updateHp(baseHp);

  let myTower;
  const towerType = data.towerType || null;
  const towerId = data.towerType || null;
  const towerNumber = data.towerType || null;

  if (data.attackedMonster === undefined) {
    return;
  }

  if (towerType && towerId && towerNumber) {
    for (let tower of towers[towerType][towerId]) {
      if (tower.towerNumber == towerNumber) myTower = tower;
    }
    if (data.attackedMonster.hp <= 0 && towerType == TOWER_TYPE[8]) myTower.killCount--;
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
      /* killCount++;

      if (killCount === 2) {
        monsterLevel++;
        killCount = 0;
        startSpawning();
      } */
    }
  }

  monsters.forEach((monster) => {
    monster.move();
    monster.draw(ctx, true);
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
  // if (!payload) {
  //   console.log('Received payload:', payload);
  //   return;
  // }
  if (isInitGame) {
    return;
  }

  // userGold = payload.userGold;
  // baseHp = payload.baseHp;
  // monsterPath = payload.monsterPath;
  // initialTowerCoords = payload.initialTowerCoords;
  // basePosition = payload.basePosition;
  // opponentMonsterPath = payload.opponentMonsterPath;
  // opponentInitialTowerCoords = payload.opponentInitialTowerCoords;
  // opponentBasePosition = payload.opponentBasePosition;
  // opponentBaseHp = payload.opponentBaseHp;
  // opponentBase = new Base(opponentBasePosition.x, opponentBasePosition.y, baseHp);
  // opponentBase.draw(opponentCtx, baseImage, true);
  // opponentBaseHp = payload.baseHp;

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
      canvas.style.display = 'block';
      opponentCanvas.style.display = 'block';
      showGameElements(); // 게임 시작 시 요소 표시
      // TODO. 유저 및 상대방 유저 데이터 초기화
    }
  }, 500);
}

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
  });

  serverSocket.on('response', (data) => {
    console.log(data.message);
  });

  serverSocket.on('error', (data) => {
    alert(data.message);
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
    // if (!isInitGame) {
    //   initGame(payload);
    // }
  });

  serverSocket.on('userTowerUpgrade', (data) => {
    const { towerType, towerId, towerCost, towerData } = data;
    console.log(`받은 업그레이드 데이터:${towerId}`);
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
      case TOWER_TYPE[8]:
        tower = new growthTower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
        break;
      default:
        tower = new Tower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
        break;
    }

    if (userId !== data.userId) {
      opponentTowers[TOWER_TYPE[towerId / 100 - 1]][towerId].push(tower);
    } else {
      towers[TOWER_TYPE[towerId / 100 - 1]][towerId].push(tower);
      userGold -= towerCost;
    }
  });
  // 항복하기 버튼 생성 및 설정
  const surrenderButton = document.createElement('button');
  surrenderButton.textContent = '항복하기';
  surrenderButton.style.position = 'absolute';
  surrenderButton.style.top = '100px'; // 기존 UI 요소 아래 위치하도록 설정
  surrenderButton.style.right = '10px';
  surrenderButton.style.padding = '10px 20px';
  surrenderButton.style.fontSize = '16px';
  surrenderButton.style.cursor = 'pointer';
  document.body.appendChild(surrenderButton);

  // 항복하기 버튼 클릭 시 게임 종료 및 패배 처리
  surrenderButton.addEventListener('click', () => {
    endGame(false); // 플레이어가 항복한 경우 패배 처리
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
    bgm.pause();
    const { isWin } = data;
    const winSound = new Audio('sounds/win.wav');
    const loseSound = new Audio('sounds/lose.wav');
    winSound.volume = 0.3;
    loseSound.volume = 0.3;
    if (isWin) {
      winSound.play().then(() => {
        alert('당신이 게임에서 승리했습니다!');
        // TODO. 게임 종료 이벤트 전송
        location.reload();
      });
    } else {
      loseSound.play().then(() => {
        alert('아쉽지만 대결에서 패배하셨습니다! 다음 대결에서는 꼭 이기세요!');
        // TODO. 게임 종료 이벤트 전송
        location.reload();
      });
    }
  });
  serverSocket.on('gameSync', (packet) => {
    switch (packet.packetType) {
      case PacketType.S2C_ENEMY_TOWER_SPAWN:
        placeNewOpponentTower(packet.data.opponentTowers);
        break;
      case PacketType.C2S_TOWER_ATTACK:
        opponentTowerAttack(packet.data.attackedOpponentMonster);
        break;
      // case PacketType.S2C_ENEMY_TOWER_ATTACK:
      //   opponentTowerAttack(packet.data.attackedOpponentMonster, packet.data.attackedOpponentTower);
      //   break;
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

function updateMonstersHp(updatedMonsters) {
  updatedMonsters.forEach((updatedMonster) => {
    const monster = monsters.find((m) => m.getMonsterIndex() === updatedMonster.id);
    if (monster) {
      console.log(`Updating monster HP: ${updatedMonster.id} to ${updatedMonster.hp}`); // 업데이트 로그 출력
      monster.setHp(updatedMonster.hp);
    }
  });
}

const attackMonstersButton = document.createElement('button');
attackMonstersButton.textContent = 'Base Attack';
attackMonstersButton.style.position = 'absolute';
attackMonstersButton.style.top = '10px';
attackMonstersButton.style.left = '10px';
attackMonstersButton.style.padding = '10px 20px';
attackMonstersButton.style.fontSize = '8px';
attackMonstersButton.style.cursor = 'pointer';
document.body.appendChild(attackMonstersButton);

attackMonstersButton.addEventListener('click', () => {
  const monsterIndices = monsters.map((monster) => monster.getMonsterIndex());
  const baseUuid = localStorage.getItem('userId'); // Base UUID를 설정합니다.
  console.log('Monster Indices:', monsterIndices); // 디버그 로그 추가
  console.log('Base UUID:', baseUuid); // 디버그 로그 추가
  base.monsters = monsters; // Base 객체에 필드 몬스터 목록을 설정합니다.
  base.attackMonsters({ baseUuid, monsterIndices });
});

const towersBox = window.document.getElementById('towers');
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

for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', (event) => {
    towerBuilderCheck((i + 1) * 100, buttons[i]);
    event.stopPropagation();
  });
  //towersBox.appendChild(buttons[i]);
}

upgradeTowerButton.addEventListener('click', (event) => {
  towerUpgradeCheck();
  event.stopPropagation();
});

const mousePos = (event) => {
  posX = event.offsetX;
  posY = event.offsetY;
  console.log(posX, posY);
  if (towerBuilderId) towerRequest();
  if (towerUpgrade) {
    towerUpgrades();
  }
};
const gameCanvas = document.getElementById('gameCanvas');
gameCanvas.addEventListener('click', mousePos);

// function decycle(obj, stack = []) {
//   if (!obj || typeof obj !== 'object') {
//     return obj;
//   }
//   if (stack.includes(obj)) {
//     return null;
//   }
//   const newStack = stack.concat([obj]);
//   if (Array.isArray(obj)) {
//     return obj.map((item) => decycle(item, newStack));
//   }
//   return Object.keys(obj).reduce((acc, key) => {
//     acc[key] = decycle(obj[key], newStack);
//     return acc;
//   }, {});
// }

//보스 출현 로직

let monsterDeathCount = 10; // 몬스터가 죽을 때까지의 카운트
const bossImage = new Image();
bossImage.src = 'images/TowerControlBoss.png';
let bossSpawned = false; // 보스가 출현한 상태를 관리

//보스 출현 메시지 추가
const bossAttemptElement = document.createElement('div');
bossAttemptElement.style.position = 'absolute';
bossAttemptElement.style.top = '50px';
bossAttemptElement.style.left = '10px';
bossAttemptElement.style.padding = '10px 20px';
bossAttemptElement.style.fontSize = '30px';
bossAttemptElement.style.color = 'red';
document.body.appendChild(bossAttemptElement);
updateBossAttempt();

function updateBossAttempt() {
  if (!bossSpawned) {
    bossAttemptElement.innerText = `Boss Attempt : ${monsterDeathCount}`;
  }
}

hideGameElements();

// Base Attack 버튼 및 Boss Attempt 요소를 숨기는 로직
function hideGameElements() {
  if (attackMonstersButton) {
    attackMonstersButton.style.display = 'none';
  }
  if (bossAttemptElement) {
    bossAttemptElement.style.display = 'none';
  }
}

// 게임 시작 시 호출하여 요소를 표시하는 로직
function showGameElements() {
  if (attackMonstersButton) {
    attackMonstersButton.style.display = 'block';
  }
  if (bossAttemptElement) {
    bossAttemptElement.style.display = 'block';
  }
  isGameStarted = true;
}

// 몬스터가 죽을 때 호출되는 콜백
function onMonsterDie() {
  if (!bossSpawned) {
    monsterDeathCount--;
    updateBossAttempt();
    if (monsterDeathCount <= 0) {
      bossAttemptElement.innerText = 'WARNING : Watch out for the boss';
      spawnBoss();
    }
  }
}

// 보스가 죽을 때 호출되는 콜백
function onBossDie() {
  bossSpawned = false;
  monsterDeathCount = 10;
  updateBossAttempt();
}

function spawnBoss() {
  bossSpawned = true;
  const boss = new Boss(monsterPath, bossImage, monsterLevel);
  boss.setMonsterIndex(monsterIndex);
  boss.onDie = onBossDie; // 보스가 죽을 때 호출되는 콜백 설정
  monsters.push(boss);
  sendEvent(PacketType.C2S_SPAWN_MONSTER, {
    hp: boss.getMaxHp(),
    monsterIndex,
    monsterLevel,
    isBoss: true,
  });
  console.log('Boss spawned');
  monsterIndex++;
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
backButton.style.top = '50px'; // 로그아웃 버튼 아래 위치하도록 설정
backButton.style.right = '10px';
backButton.style.padding = '10px 20px';
backButton.style.fontSize = '16px';
backButton.style.cursor = 'pointer';
document.body.appendChild(backButton);

// 돌아가기 버튼 클릭 시 홈 화면으로 이동
backButton.addEventListener('click', () => {
  location.href = 'http://localhost:8080/index.html'; // 홈 화면 경로로 이동
});

// Boss 생성 버튼 추가
const boss1Button = document.createElement('button');
boss1Button.textContent = 'Boss 1';
boss1Button.style.position = 'absolute';
boss1Button.style.bottom = '100px';
boss1Button.style.left = '10px';
boss1Button.style.padding = '10px 20px';
boss1Button.style.fontSize = '16px';
boss1Button.style.cursor = 'pointer';
document.body.appendChild(boss1Button);

const boss2Button = document.createElement('button');
boss2Button.textContent = 'Boss 2';
boss2Button.style.position = 'absolute';
boss2Button.style.bottom = '150px';
boss2Button.style.left = '10px';
boss2Button.style.padding = '10px 20px';
boss2Button.style.fontSize = '16px';
boss2Button.style.cursor = 'pointer';
document.body.appendChild(boss2Button);

const boss3Button = document.createElement('button');
boss3Button.textContent = 'Boss 3';
boss3Button.style.position = 'absolute';
boss3Button.style.bottom = '200px';
boss3Button.style.left = '10px';
boss3Button.style.padding = '10px 20px';
boss3Button.style.fontSize = '16px';
boss3Button.style.cursor = 'pointer';
document.body.appendChild(boss3Button);

const boss4Button = document.createElement('button');
boss4Button.textContent = 'Boss 4';
boss4Button.style.position = 'absolute';
boss4Button.style.bottom = '250px';
boss4Button.style.left = '10px';
boss4Button.style.padding = '10px 20px';
boss4Button.style.fontSize = '16px';
boss4Button.style.cursor = 'pointer';
document.body.appendChild(boss4Button);

// 스킬 사용 버튼 추가
const useSkillButton = document.createElement('button');
useSkillButton.textContent = 'Use Skill';
useSkillButton.style.position = 'absolute';
useSkillButton.style.bottom = '50px';
useSkillButton.style.left = '10px';
useSkillButton.style.padding = '10px 20px';
useSkillButton.style.fontSize = '16px';
useSkillButton.style.cursor = 'pointer';
document.body.appendChild(useSkillButton);

// 보스 생성 및 스킬 사용 로직
let currentBoss = null;

boss1Button.addEventListener('click', () => {
  spawnSpecificBoss('MightyBoss');
});

boss2Button.addEventListener('click', () => {
  spawnSpecificBoss('TowerControlBoss');
});

boss3Button.addEventListener('click', () => {
  spawnSpecificBoss('DoomsdayBoss');
});

boss4Button.addEventListener('click', () => {
  spawnSpecificBoss('TimeRifter');
});

useSkillButton.addEventListener('click', () => {
  if (currentBoss) {
    currentBoss.handleBossSkill(currentBoss.getRandomSkill());
  }
});

function spawnSpecificBoss(bossType) {
  let bossImage = new Image(); // 이미지 객체로 초기화
  let bossBGM = 'sounds/Boss_bgm.mp3';
  let skillSounds = {};

  switch (bossType) {
    case 'MightyBoss':
      bossImage.src = 'images/MightyBoss.png';
      skillSounds = {
        healSkill: '', // 현재 효과음 없음
        spawnClone: '',
        reduceDamage: '',
      };
      break;
    case 'TowerControlBoss':
      bossImage.src = 'images/TowerControlBoss.png';
      skillSounds = {
        ignoreTowerDamage: '', // 현재 효과음 없음
        changeTowerType: '',
        downgradeTower: '',
      };
      break;
    case 'DoomsdayBoss':
      bossImage.src = 'images/DoomsdayBoss.png';
      skillSounds = {
        placeMark: '', // 현재 효과음 없음
        swapFields: '',
        absorbDamage: '',
      };
      break;
    case 'TimeRifter':
      bossImage.src = 'images/TimeRifter.png';
      skillSounds = {
        rewindHealth: '', // 현재 효과음 없음
        accelerateTime: '',
        timeWave: '',
      };
      break;
  }

  // 이미지 로딩 성공 여부를 확인
  bossImage.onload = () => {
    currentBoss = new Boss(
      monsterPath,
      bossImage,
      monsterLevel,
      serverSocket,
      bossBGM,
      skillSounds,
    );
    currentBoss.init(monsterLevel); // 보스 객체 초기화
    currentBoss.setMonsterIndex(monsterIndex);
    currentBoss.onDie = onBossDie; // 보스가 죽을 때 호출되는 콜백 설정
    monsters.push(currentBoss);
    sendEvent(PacketType.C2S_SPAWN_MONSTER, {
      hp: currentBoss.getMaxHp(),
      monsterIndex,
      monsterLevel,
      isBoss: true,
    });
    console.log(`${bossType} spawned`);
    monsterIndex++;
  };

  // 이미지 로딩 실패 시 에러 처리
  bossImage.onerror = () => {
    console.error(`Failed to load boss image for ${bossType}`);
  };
}

currentBoss = new Boss(monsterPath, bossImage, monsterLevel, serverSocket, bossBGM, skillSounds);
currentBoss.init(monsterLevel); // 보스 객체 초기화
currentBoss.setMonsterIndex(monsterIndex);
currentBoss.onDie = onBossDie; // 보스가 죽을 때 호출되는 콜백 설정
monsters.push(currentBoss);
sendEvent(PacketType.C2S_SPAWN_MONSTER, {
  hp: currentBoss.getMaxHp(),
  monsterIndex,
  monsterLevel,
  isBoss: true,
});
console.log(`${bossType} spawned`);
monsterIndex++;
