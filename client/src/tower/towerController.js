import { towerImages, userGoldControl, towersData, sendEvent } from '../multi_game.js';
import { audioOfTowerAddAndUpgrade, audioOfTowerSale, audioOfTowerAllow } from '../multi_game.js';
import { PacketType, TOWER_TYPE } from '../../constants.js';
import {
  AttackSupportTower,
  poisonTower,
  SpeedSupportTower,
  SplashTower,
  Tower,
} from '../tower.js';

//이미지 초기화
const BTI = document.getElementById('baseTowerImage');
const STI = document.getElementById('speedTowerImage');
const SSTI = document.getElementById('speedSupportTowerImage');
const ASTI = document.getElementById('attackSupportTowerImage');
const SGTI = document.getElementById('strongTowerImage');
const SPTI = document.getElementById('splashTowerImage');
const MSTI = document.getElementById('multiShotTowerImage');
const PTI = document.getElementById('poisonTowerImage');
const GTI = document.getElementById('growthTowerImage');

const Images = [BTI, STI, SSTI, ASTI, SGTI, SPTI, MSTI, PTI, GTI];

// 초기화
export const towerImageAllowInit = () => {
  STI.style.filter = 'grayscale(100%)';
  SSTI.style.filter = 'grayscale(100%)';
  ASTI.style.filter = 'grayscale(100%)';
  STI.style.filter = 'grayscale(100%)';
  SPTI.style.filter = 'grayscale(100%)';
  MSTI.style.filter = 'grayscale(100%)';
  PTI.style.filter = 'grayscale(100%)';
  GTI.style.filter = 'grayscale(100%)';
};

export const towerImageInit = () => {
  for (let i = 0; i < 9; i++) {
    for (let k = 0; k <= 2; k++) {
      const image = new Image();
      image.src = `../images/tower${100 * (i + 1) + k}.png`;
      towerImages.push(image);
    }
  }
};

export function placeInitialTowers(initialTowerCoords, initialTowers) {
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

// 수신
export function towerAttackToSocket(userId, data, monsters, opponentMonsters, towers) {
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

    if (killCount != 0 && Math.trunc(towerId / 100) == 9) {
      console.log(`killCount: ${killCount}`);
      for (let tower of towers[towerType][towerId]) {
        if (tower.towerNumber == towerNumber) {
          tower.killCount -= killCount;
          break;
        }
      }
    }
  }
}

export function towerSaleToSocket(userId, data, towers, opponentTowers) {
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
        userGoldControl(saledGold);
        audioOfTowerSale.currentTime = 0;
        audioOfTowerSale.play();
        break;
      }
    }
  }
}

export function towerUpgradeToSocket(userId, data, towers, opponentTowers) {
  const { towerType, towerId, towerCost, towerData } = data;
  if (userId !== data.userId) {
    const arr = opponentTowers[towerType][towerId - 1];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].towerNumber == towerData.number) {
        arr.splice(i, 1);
        break;
      }
    }

    const tower = selectCreateTower(towerId, towerData.number, towerData.posX, towerData.posY);
    opponentTowers[towerType][towerId].push(tower);
  } else {
    const arr = towers[towerType][towerId - 1];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].towerNumber == towerData.number) {
        arr.splice(i, 1);
        break;
      }
    }

    const tower = selectCreateTower(towerId, towerData.number, towerData.posX, towerData.posY);
    towers[towerType][towerId].push(tower);
    audioOfTowerAddAndUpgrade.currentTime = 0;
    audioOfTowerAddAndUpgrade.play();
    userGoldControl(-towerCost);
  }
}

export function towerCreateToSocket(userId, data, towers, opponentTowers) {
  const { towerId, towerCost, number, posX, posY } = data;

  const tower = selectCreateTower(towerId, number, posX, posY);

  if (userId !== data.userId) {
    opponentTowers[TOWER_TYPE[towerId / 100 - 1]][towerId].push(tower);
  } else {
    towers[TOWER_TYPE[towerId / 100 - 1]][towerId].push(tower);
    audioOfTowerAddAndUpgrade.currentTime = 0;
    audioOfTowerAddAndUpgrade.play();
    userGoldControl(-towerCost);
  }
}

export function towerAllow(towerLock, data) {
  towerLock = data.userLock;
  for (let lock = 0; lock < towerLock.length; lock++) {
    if (towerLock[lock]) Images[lock].style.filter = '';
    audioOfTowerAllow.currentTime = 0;
    audioOfTowerAllow.play();
  }

  return towerLock;
}

// 발신
export function towerUpgrades(userId, towers, posX, posY) {
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
      userId: userId,
      towerType: selectTower.towerType,
      towerId: selectTower.towerId,
      towerNumber: selectTower.towerNumber,
    });
  }
}

export function towerSales(userId, towers, posX, posY) {
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
      userId: userId,
      towerType: selectTower.towerType,
      towerId: selectTower.towerId,
      towerNumber: selectTower.towerNumber,
    });
  }
}

export function towerRequest(userId, towerBuilderId, posX, posY) {
  const towerType = TOWER_TYPE[towerBuilderId / 100 - 1];
  sendEvent(PacketType.C2S_TOWER_CREATE, {
    userId,
    towerType,
    towerId: towerBuilderId,
    posX,
    posY,
  });
}

const selectCreateTower = (towerId, number, posX, posY) => {
  let tower;
  const value = Math.trunc(towerId / 100 - 1);
  switch (TOWER_TYPE[value]) {
    case TOWER_TYPE[2]:
      tower = new SpeedSupportTower(TOWER_TYPE[value], towerId, number, posX, posY);
      break;
    case TOWER_TYPE[3]:
      tower = new AttackSupportTower(TOWER_TYPE[value], towerId, number, posX, posY);
      break;
    case TOWER_TYPE[5]:
      tower = new SplashTower(TOWER_TYPE[value], towerId, number, posX, posY);
      break;
    case TOWER_TYPE[7]:
      tower = new poisonTower(TOWER_TYPE[value], towerId, number, posX, posY);
      break;
    default:
      tower = new Tower(TOWER_TYPE[value], towerId, number, posX, posY);
      break;
  }

  return tower;
};

export function growthTowerChecker(userId, towers) {
  const growthTowers = towers[TOWER_TYPE[TOWER_TYPE.length - 1]];
  for (let towerId in growthTowers) {
    for (let i = 0; i < growthTowers[towerId].length; i++) {
      if (growthTowers[towerId][i].killCount <= 0 && growthTowers[towerId][i].satisfied) {
        sendEvent(PacketType.C2S_TOWER_UPGRADE, {
          userId: userId,
          towerType: TOWER_TYPE[TOWER_TYPE.length - 1],
          towerId: towerId,
          towerNumber: growthTowers[towerId][i].towerNumber,
        });
        growthTowers[towerId][i].satisfied = false;
      }
    }
  }
}

export function myTowerDrawAndAttack(userId, towers, monsters, ctx) {
  for (let towerType in towers) {
    for (let towerId in towers[towerType]) {
      for (let i = 0; i < towers[towerType][towerId].length; i++) {
        const tower = towers[towerType][towerId][i];
        tower.draw(ctx);
        tower.updateCooldown();

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
}

export function opponentTowerDrawAndAttack(opponentTowers, opponentMonsters, opponentCtx) {
  for (let towerType in opponentTowers) {
    for (let towerId in opponentTowers[towerType])
      for (let i = 0; i < opponentTowers[towerType][towerId].length; i++) {
        const tower = opponentTowers[towerType][towerId][i];
        tower.draw(opponentCtx);
        tower.attack(opponentMonsters, opponentTowers, false);
        tower.updateCooldown();
      }
  }
}
