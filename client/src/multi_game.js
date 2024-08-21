import { Base } from './base.js';
import { Monster } from './monster.js';
import { AttackSupportTower, poisonTower, SpeedSupportTower, SplashTower, Tower } from './tower.js';
import {Boss, MightyBoss, TowerControlBoss, DoomsdayBoss, TimeRifter, FinaleBoss } from './boss.js'; // 각 보스 클래스가 정의된 파일
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
let towerSale = null;
let towerUpgrade = null;
let towerBuilderId = null;
let towerBuilderType = null;
let posX = 0;
let posY = 0;

let intervalId = null;
// 게임 데이터
export let towersData; // 타워 데이터
/* let killCount = 0; */
// 게임 데이터
let towerCost = 100; // 타워 구입 비용
let towerIndex = 1;
// 설정 데이터
let acceptTime = 1000000; // 수락 대기 시간

// 인터벌 데이터
let matchAcceptInterval;
// 유저 데이터
let userGold; // 유저 골드
let base; // 기지 객체
let baseHp = 0; // 기지 체력

let monsterPath; // 몬스터 경로
let initialTowerCoords; // 초기 타워 좌표
let basePosition; // 기지 좌표
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

let monsterLevel = 1;
const maxStages = 15;
let monsters = [];
let monsterIndex = 0;
let monsterSpawnCount = 0;
let monsterintervalId = null;
const monsterSpawnInterval = 1000;
let monstersToSpawn = 5; // 라운드당 몬스터 소환 수

// 몬스터가 죽었을 때 호출되는 콜백 함수
function onMonsterDie(monster) {
  // 몬스터 배열에서 사망한 몬스터를 제거
  monsters = monsters.filter((m) => m !== monster);
  console.log(`Monster died. Remaining monsters: ${monsters.length}`);

  // 보스가 죽었을 때의 처리
  if (monster instanceof Boss) {
    bossDefeated = true;
    console.log(`Boss defeated at stage ${monsterLevel}. Moving to next stage.`);
    startNextStage(); // 보스가 죽으면 다음 스테이지로 이동
    return; // 보스가 죽었으므로 나머지 로직은 실행되지 않음
  }

  // 일반 몬스터가 모두 제거되었을 때 처리
  if (monsters.length === 0 && monsterSpawnCount >= monstersToSpawn) {
    console.log('All monsters cleared for this level.');
    clearInterval(monsterintervalId); // 일반 몬스터 소환 중단

    serverSocket.emit('chat message', {
      userId: 'System',
      message: `Level ${monsterLevel} Clear!`,
    });

    startNextStage();
    monsterLevel++;
    monsterSpawnCount = 0;

    if (monsterLevel < maxStages) {
      setTimeout(() => {
        console.log(`Starting Level ${monsterLevel}`);
        startSpawning();
        serverSocket.emit('chat message', {
          userId: 'System',
          message: `Level ${monsterLevel} Start!`,
        });
      }, 5000);
    } else {
      console.log('All stages completed!');
    }
  }
}

function spawnMonster() {
  // 보스 소환 라운드인지 확인
  if ([3, 6, 9, 12, 15].includes(monsterLevel) && !bossSpawned) {
    const bossType = getBossTypeForLevel(monsterLevel);
    if (bossType) {
      const boss = getBossInstance(bossType, monsterPath, null, towers, bgm, {}); // 서버 소켓을 null로 설정
      if (boss) {
        boss.init(); // 보스 초기화
        monsters.push(boss); // 보스를 몬스터 배열에 추가
        boss.onDie = onMonsterDie; // 보스 사망 콜백 설정
        boss.draw(ctx); // 캔버스에 보스 그리기
        console.log(`${bossType} spawned and ready!`);
        
        bossSpawned = true; // 보스 소환 상태 기록
        currentBossStage = monsterLevel;
        clearInterval(monsterintervalId); // 일반 몬스터 소환을 중단
        return; // 보스가 소환된 후 더 이상 몬스터를 소환하지 않음
      }
    }
  }

  // 보스가 아닌 경우, 일반 몬스터 소환
  if (!bossSpawned && monsterSpawnCount < monstersToSpawn) {
    const monster = new Monster(monsterPath, monsterImages, monsterLevel);
    monster.setMonsterIndex(monsterIndex);
    monster.onDie = onMonsterDie;
    monsters.push(monster);

    sendEvent(PacketType.C2S_SPAWN_MONSTER, { hp: monster.getMaxHp(), monsterIndex, monsterLevel });
    monsterIndex++;
    monsterSpawnCount++;
  }

  console.log(`몬스터 소환, 총 소환된 몬스터: ${monsterSpawnCount}`);

  // 소환할 몬스터의 수를 모두 소환한 경우 인터벌 중단
  if (monsterSpawnCount >= monstersToSpawn) {
    clearInterval(monsterintervalId);
    console.log('라운드 몬스터 최대 소환');
  }
}


function startSpawning() {
  // 기존 인터벌을 중복해서 실행하지 않도록 방지
  if (monsterintervalId !== null) {
    clearInterval(monsterintervalId);
  }
  
  // 보스가 소환되지 않은 경우에만 몬스터를 소환
  if (!bossSpawned) {
    monsterSpawnCount = 0; // 소환된 몬스터 수 초기화
    monsterintervalId = setInterval(spawnMonster, monsterSpawnInterval);
    console.log('몬스터 소환 시작');
  } else {
    console.log('보스가 이미 소환된 상태이므로 몬스터 소환을 중단합니다.');
  }
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
let isGameLoopRunning = false;

function gameLoop() {
  if (isGameLoopRunning) {
    return; // 이미 실행 중이면 중단
  }
  isGameLoopRunning = true;

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

      // 보스 라운드인지 확인
      if ([3, 6, 9, 12, 15].includes(monsterLevel)) {
        // 보스 라운드에서는 일반 몬스터가 소환되지 않으므로 killCount와 monstersToSpawn를 비교하지 않음
        if (bossDefeated) {
          console.log(`Boss defeated at stage ${monsterLevel}. Moving to next stage.`);
          startNextStage();  // 보스가 처치되면 다음 스테이지로 이동
        }
      } else {
        // 일반 몬스터 라운드에서 killCount가 monstersToSpawn에 도달했는지 확인
        if (killCount === monstersToSpawn) {
          killCount = 0;
          console.log(`Monster Level: ${monsterLevel}, Kill Count Reset: ${killCount}`);
  
          // 다음 스테이지로 이동
          startNextStage();
          if (!bossSpawned) {
            console.log(`No boss spawned yet, starting spawning for stage ${monsterLevel}`);
            startSpawning();  // 보스가 없을 때만 몬스터 소환
          } else {
            console.log(`Boss already spawned for stage ${monsterLevel}`);
          }
        }
    }
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
  
  // 게임 루프가 한 번 끝났음을 표시
  isGameLoopRunning = false;

  // 다음 프레임 실행
  requestAnimationFrame(gameLoop);
}
function getBossTypeForLevel(level) {
  switch (level) {
    case 3:
      return 'MightyBoss';
    case 6:
      return 'TowerControlBoss';
    case 9:
      return 'TimeRifter';
    case 12:
      return 'DoomsdayBoss';
    case 15:
      return 'FinaleBoss';
    default:
      return null; // 기본값 추가
  }
}
// 보스 소환 여부를 체크하는 함수
let isBossRequestSent = false; // 이미 보스 소환 요청을 보냈는지 여부를 추적하는 플래그
let bossSpawned = false; // 보스가 출현한 상태를 관리
let currentBossStage = 0; // 현재 보스가 소환된 스테이지
let bossDefeated = false; // 보스 처치 여부

// 스테이지 진입 시 보스 생성 확인
function checkForBossSpawn() {
  console.log(`Checking for boss spawn at level: ${monsterLevel}`);

  // 이미 보스가 소환된 경우나 해당 스테이지에서 처리된 경우, 추가 소환 방지
  if (bossSpawned || currentBossStage === monsterLevel) {
      console.log(`Boss already spawned or stage already processed. bossSpawned: ${bossSpawned}, currentBossStage: ${currentBossStage}`);
      return;
  }

  if ([3, 6, 9, 12, 15].includes(monsterLevel)) {
      const bossType = getBossTypeForLevel(monsterLevel);
      if (bossType) {
          console.log(`Attempting to spawn boss of type: ${bossType} for level ${monsterLevel}`);

          const boss = getBossInstance(bossType, monsterPath, null, towers, bgm, {}); // 서버 소켓을 null로 설정
          if (boss) {
              boss.init(); // 보스 초기화
              monsters.push(boss); // 보스를 몬스터 배열에 추가
              boss.onDie = onMonsterDie; // 보스 사망 콜백 설정
              boss.draw(ctx); // 캔버스에 보스 그리기
              bossSpawned = true;
              currentBossStage = monsterLevel;
              console.log(`${bossType} spawned and ready!`);
              clearInterval(monsterintervalId); // 보스가 소환된 이후, 일반 몬스터 소환 중단
          } else {
              console.error('Failed to create boss instance');
          }
      } else {
          console.log(`No boss type found for level: ${monsterLevel}`);
      }
  } else {
      console.log(`No boss spawn required for this level: ${monsterLevel}, starting regular spawning.`);
      startSpawning(); // 보스가 없는 스테이지에서 일반 몬스터 소환
  }
}

// 서버로 보스 생성 요청
function spawnBoss(bossType) {
  console.log(`Sending boss spawn request to server for ${bossType}`); // 디버깅 로그 추가
  // serverSocket.emit('requestBossSpawn', { bossType, stage: monsterLevel });
  console.log(`Boss spawn request sent successfully for ${bossType} at level ${monsterLevel}`); // 디버깅 로그 추가
}

function getBossInstance(bossType, path, socket, towers, bgm, skillSounds) {
  console.log(`Creating boss instance for type: ${bossType}`); // 디버깅 로그 추가
  
  switch (bossType) {
    case 'MightyBoss':
      console.log('Creating MightyBoss'); // 디버깅 로그 추가
      return new MightyBoss(socket, path, towers, bgm, skillSounds);
    case 'TowerControlBoss':
      console.log('Creating TowerControlBoss'); // 디버깅 로그 추가
      return new TowerControlBoss(socket, path, towers, bgm, skillSounds);
    case 'DoomsdayBoss':
      console.log('Creating DoomsdayBoss'); // 디버깅 로그 추가
      return new DoomsdayBoss(socket, path, towers, bgm, skillSounds);
    case 'TimeRifter':
      console.log('Creating TimeRifter'); // 디버깅 로그 추가
      return new TimeRifter(socket, path, towers, bgm, skillSounds);
    case 'FinaleBoss':
      console.log('Creating FinaleBoss'); // 디버깅 로그 추가
      return new FinaleBoss(socket, path, towers, bgm, skillSounds);
    default:
      console.error(`Unknown boss type: ${bossType}`); // 디버깅 로그 추가
      return null;
  }
}

// 상대방 보스 인스턴스 가져오기 (상대 클라이언트)
function getOpponentBossInstance(bossType) {
}

function opponentBaseAttacked(value) {
  opponentBaseHp = value;
  opponentBase.updateHp(opponentBaseHp);
}
function initGame() {
  console.log('Initializing game...');

  // 초기 스테이지 설정 (0이 아닌 값으로 설정)
  monsterLevel = 1;  // 예시로 스테이지 1로 설정
  bossSpawned = false;
  currentBossStage = 0;

  bgm = new Audio('sounds/bgm.mp3');
  bgm.loop = true;
  bgm.volume = 0.2;
  bgm.play();

  initMap();  // 맵 초기화

  // 게임 시작 시 몬스터 스폰 시작
  setTimeout(() => {
    startSpawning();
  }, 10000);

  gameLoop();  // 게임 루프 시작
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

// 서버로부터 보스가 성공적으로 소환되었는지 확인
// serverSocket.on('bossSpawned', (data) => {
//   const { bossType, success, stage } = data;
//   if (!success) {
//       console.error(`Failed to spawn boss: ${data.message || "Unknown error"}`);
//       return;
//   }

//   console.log(`Client: Boss ${bossType} spawned successfully at stage ${stage}`);

//   // skillSounds가 제대로 초기화되었는지 확인
//   let skillSounds = null;
//   if (typeof SKILL_SOUNDS !== 'undefined' && SKILL_SOUNDS[bossType]) {
//       skillSounds = SKILL_SOUNDS[bossType];
//   } else {
//       skillSounds = {}; // 기본값으로 빈 객체를 설정하여 오류 방지
//       console.warn(`No skill sounds found for ${bossType}, using default empty object.`);
//   }

//   // bossInstance 생성
//   const boss = getBossInstance(bossType, monsterPath, serverSocket, towers, bgm, skillSounds);

//   if (boss) {
//       boss.init(); // 보스 초기화
//       monsters.push(boss); // 보스를 몬스터 배열에 추가
//       boss.onDie = onMonsterDie; // 보스 사망 콜백 설정
//       boss.draw(ctx); // 캔버스에 보스 그리기
//       console.log(`${bossType} spawned and ready!`);

//       bossSpawned = true; // 보스가 성공적으로 소환되었음을 기록
//       currentBossStage = stage; // 현재 보스가 소환된 스테이지 업데이트
//   } else {
//       console.error('Invalid boss type received or failed to create boss instance');
//   }
// });

// // 상대 클라이언트로부터 보스 스킬 사용 동기화
// serverSocket.on('opponentBossSkillUsed', (data) => {
//   const { bossType, skill, stage } = data;
//   console.log(`Opponent Boss Skill Used: ${bossType}, Skill: ${skill}, Stage: ${stage}`);

//   // 상대 클라이언트 보스가 스킬을 사용하도록 처리
//   const opponentBoss = getOpponentBossInstance(bossType);
//   if (opponentBoss) {
//       opponentBoss.useSkill(skill);
//   }
// });

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
    const { towerType, towerId, towerNumber, attackedmonsters, killCount } = data;
    if (userId !== data.userId) {
      for (let attackedMonsterData of attackedmonsters) {
        for (let clientMonster of opponentMonsters) {
          if (attackedMonsterData.monsterIndex == clientMonster.monsterIndex) {
            clientMonster.setHp(attackedMonsterData.hp);
            break;
          }
        }
      }
    } else {
      for (let attackedMonsterData of attackedmonsters) {
        for (let clientMonster of monsters) {
          if (attackedMonsterData.monsterIndex == clientMonster.monsterIndex) {
            clientMonster.setHp(attackedMonsterData.hp);
            break;
          }
        }
      }

      if (killCount != 0) {
        for (let tower of towers[towerType][towerId]) {
          if (tower.towerNumber == towerNumber) {
            tower.killCount -= killCount;
            break;
          }
        }
      }
    }
  });

  serverSocket.on('towerSale', (data) => {
    const { towerType, towerId, towerNumber, saledGold } = data;
    if (userId !== data.userId) {
      const towersList = opponentTowers[towerType][towerId];
      for (let i = 0; i < towersList.length; i++) {
        if (towersList[i].towerNumber == towerNumber) {
          towersList.splice(i, 1);
          break;
        }
      }
    } else {
      const towersList = towers[towerType][towerId];
      for (let i = 0; i < towersList.length; i++) {
        if (towersList[i].towerNumber == towerNumber) {
          towersList.splice(i, 1);
          userGold += saledGold;
          break;
        }
      }
    }
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
    loseGame(); // 플레이어가 항복한 경우 패배 처리
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
  //towersBox.appendChild(buttons[i]);
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

//보스 출현 로직

let monsterDeathCount = 10; // 몬스터가 죽을 때까지의 카운트
const bossImage = new Image();
bossImage.src = 'images/TowerControlBoss.png';

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

function updateStageOnServer(stage) {
  console.log(`Sending stage ${monsterLevel} to server`);

  // 서버에 스테이지 변경 사항을 알림
  serverSocket.emit('stageUpdate', { stage: stage });
  console.log('send stage change to server ...');

  serverSocket.emit('chat message', {
    userId: 'System',
    message: `Moved to Stage ${stage}`,
  });
}

function startNextStage() {
  if (bossSpawned || bossDefeated) {
      console.log(`Boss or stage transition already in progress for level ${monsterLevel}`);
      return;
  }

  monsterLevel++;
  bossSpawned = false;  // 보스 상태 초기화
  bossDefeated = false; // 보스가 사망했다고 명시
  console.log(`Starting next stage: ${monsterLevel}`);

  updateStageOnServer(monsterLevel);

  // 일정 시간 후 다음 스테이지로 이동 준비
  setTimeout(() => {
      if (!bossSpawned) {
          checkForBossSpawn();  // 보스가 필요한지 확인하고, 필요하면 소환
          console.log("Checking if boss needs to be spawned");
      } else {
          console.log("Starting spawning for regular monsters");
          startSpawning();  // 보스가 없을 경우에만 몬스터 소환 시작
      }
  }, 1000); // 1초 딜레이 후 보스 확인 및 몬스터 소환 시작
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