import { AttackSupportTower, poisonTower, SpeedSupportTower, SplashTower, Tower } from '../tower.js';
import { towerImages, userGoldControl,towersData } from '../multi_game.js';

export const towerImageInit = () => {
    for (let i = 0; i < 9; i++) {
        for (let k = 0; k <= 2; k++) {
          const image = new Image();
          image.src = `../images/tower${100 * (i + 1) + k}.png`;
          towerImages.push(image);
        }
      }
}

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

export function towerAttackToSocket (userId, data, monsters, opponentMonsters, towers) {
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

export function towerSaleToSocket (userId, data, towers, opponentTowers) {
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
          break;
        }
      }
    }
}