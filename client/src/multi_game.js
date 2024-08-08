import { Base } from './base.js';
import { Monster } from './monster.js';
import { Tower } from './tower.js';
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
let monsterSpawnInterval = 1000; // 몬스터 생성 주기

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
  for (let k = 0; k <= 1; k++) {
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
function placeNewOpponentTower(value) {
  const newTowerCoords = value[value.length - 1];
  const newTower = new Tower(newTowerCoords.tower.X, newTowerCoords.tower.Y);
  newTower.setTowerIndex(newTowerCoords.towerIndex);
  opponentTowers.push(newTower);
}

function opponentTowerAttack(monsterValue, towerValue) {
  const attackedTower = opponentTowers.find((tower) => {
    return tower.getTowerIndex() === towerValue.towerIndex;
  });
  const attackedMonster = opponentMonsters.find((monster) => {
    return monster.getMonsterIndex() === monsterValue.monsterIndex;
  });
  attackedMonster.setHp(monsterValue.hp);
  attackedTower.attack(attackedMonster);
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
  monsters.push(monster);
  sendEvent(PacketType.C2S_SPAWN_MONSTER, { hp: monster.getMaxHp(), monsterIndex, monsterLevel });
  monsterIndex++;
  monsterSpawnCount++;

  if (monsterSpawnCount >= 1) {
    monsterLevel++;
    monsterSpawnCount = 0;
    startSpawning();
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

  if (data.attackedMonster === undefined) {
    return;
  }

  const attackedMonster = monsters.find((monster) => {
    return monster.getMonsterIndex() === data.attackedMonster.monsterIndex;
  });

  if (attackedMonster) {
    attackedMonster.setHp(data.attackedMonster.hp);
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
        tower.updateCooldown();
        tower.attack(monsters, towers);
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
        console.log('타워업');
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

function matchFind() {
  progressBarMessage.textContent = '게임을 찾았습니다.';
  matchAcceptButton.style.display = 'block';
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
      packetType: 16,
      userId: localStorage.getItem('userId'),
    });
  });
}

function matchStart() {
  clearInterval(matchAcceptInterval);
  progressBarMessage.textContent = '게임이 5초 뒤에 시작됩니다.';
  matchAcceptButton.style.display = 'none';
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
      for (let i = 0; i < buttons.length; i++) buttons[i].style.display = 'block';
      upgradeTowerButton.style.display = 'block';
      canvas.style.display = 'block';
      opponentCanvas.style.display = 'block';
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
      matchFind();
    }
    if (data.PacketType === 18) {
      console.log('매치 스타트');
      matchStart();
    }
    // if (!isInitGame) {
    //   initGame(payload);
    // }
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
      userGold -= towerCost;
    }
  });

  serverSocket.on('userTowerCreate', (data) => {
    const { towerId, towerCost, number, posX, posY } = data;
    console.log(towerId);

    if (userId !== data.userId) {
      const tower = new Tower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
      opponentTowers[TOWER_TYPE[towerId / 100 - 1]][towerId].push(tower);
    } else {
      const tower = new Tower(TOWER_TYPE[towerId / 100 - 1], towerId, number, posX, posY);
      towers[TOWER_TYPE[towerId / 100 - 1]][towerId].push(tower);
      userGold -= towerCost;
    }
  });

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
      case PacketType.S2C_ENEMY_TOWER_ATTACK:
        opponentTowerAttack(packet.data.attackedOpponentMonster, packet.data.attackedOpponentTower);
        break;
      case PacketType.S2C_ENEMY_SPAWN_MONSTER:
        spawnOpponentMonster(packet.data.opponentMonsters);
        break;
      case PacketType.S2C_ENEMY_DIE_MONSTER:
        destroyOpponentMonster(packet.data.destroyedOpponentMonsterIndex);
        break;
      case PacketType.C2S_UPDATE_BASE_HP:
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

const buyTowerButton1 = document.createElement('button');
buyTowerButton1.textContent = '기본 타워';
const buyTowerButton2 = document.createElement('button');
buyTowerButton2.textContent = '공속 타워';
const buyTowerButton3 = document.createElement('button');
buyTowerButton3.textContent = '공속 지원 타워';
const buyTowerButton4 = document.createElement('button');
buyTowerButton4.textContent = '공격력 지원 타워';
const buyTowerButton5 = document.createElement('button');
buyTowerButton5.textContent = '치명타 타워';
const buyTowerButton6 = document.createElement('button');
buyTowerButton6.textContent = '스플래쉬 타워';
const buyTowerButton7 = document.createElement('button');
buyTowerButton7.textContent = '멀티샷 타워';
const buyTowerButton8 = document.createElement('button');
buyTowerButton8.textContent = '맹독 타워';
const buyTowerButton9 = document.createElement('button');
buyTowerButton9.textContent = '성장 타워';

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
attackMonstersButton.style.fontSize = '16px';
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

for (let i = 0; i < buttons.length; i++) {
  buttons[i].style.position = 'absolute';
  buttons[i].style.backgroundColor = 'white';
  buttons[i].style.top = ((i + 1) * 100).toString() + 'px'; // 100씩 증가
  buttons[i].style.right = '60px'; //고정해야함
  buttons[i].style.padding = '20px 40px';
  buttons[i].style.fontSize = '20px';
  buttons[i].style.cursor = 'pointer';
  buttons[i].style.display = 'none';
  buttons[i].addEventListener('click', (event) => {
    towerBuilderCheck((i + 1) * 100, buttons[i]); //일단 테스트
    event.stopPropagation();
  });
  document.body.appendChild(buttons[i]);
}

const upgradeTowerButton = document.createElement('button');
upgradeTowerButton.textContent = '타워 강화';
upgradeTowerButton.style.position = 'absolute';
upgradeTowerButton.style.backgroundColor = 'white';
upgradeTowerButton.style.top = '1000px';
upgradeTowerButton.style.right = '60px';
upgradeTowerButton.style.padding = '20px 40px';
upgradeTowerButton.style.fontSize = '20px';
upgradeTowerButton.style.cursor = 'pointer';
upgradeTowerButton.style.display = 'none';
upgradeTowerButton.addEventListener('click', (event) => {
  towerUpgradeCheck();
  event.stopPropagation();
});
document.body.appendChild(upgradeTowerButton);

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

function sendEvent(handlerId, payload) {
  // const decycledPayload = decycle(payload);
  serverSocket.emit('event', {
    userId,
    clientVersion: CLIENT_VERSION,
    packetType: handlerId,
    payload, //: decycledPayload,
  });
}
