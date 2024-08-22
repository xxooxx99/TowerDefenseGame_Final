import { PacketType } from '../../constants.js';
import { getGameByUserId, getPlayData } from '../../models/playData.model.js';
import { sendGameSync } from './gameSyncHandler.js';

const bases = {};
const monsters = [];

function handleMonsterBaseAttack(socket, uuid, payload) {
  const playerData = getPlayData(uuid);
  if (!playerData) {
    console.error(`Player data not found for UUID: ${uuid}`);
    return;
  }

  const newBaseHp = playerData.getBaseHp() - payload.damage;
  playerData.setBaseHp(newBaseHp);
  sendGameSync(socket, uuid, PacketType.S2C_UPDATE_BASE_HP, {
    playerBaseHp: playerData.getBaseHp(),
  });

  if (newBaseHp <= 0) {
    const game = getGameByUserId(uuid);
    if (game) {
      const opponentUuid = game.player1.userId === uuid ? game.player2.userId : game.player1.userId;
      const opponentScore = getPlayData(opponentUuid)?.getScore();

      if (opponentScore === undefined) {
        console.error(`Opponent score not found for UUID: ${opponentUuid}`);
        return;
      }
    } else {
      console.log(`No game found for UUID: ${uuid}`);
    }
  }
}

// export const baseAttackMonster = (baseUuid, monsterIndices) => {
//   const base = getBase(baseUuid);
//   if (!base) {
//     throw new Error(`Base not found: ${baseUuid}`);
//   }

//   if (!Array.isArray(monsterIndices)) {
//     throw new Error('Invalid monster indices');
//   }

//   return monsterIndices.map(monsterId => {
//     const monster = monsters.find(m => m.id === monsterId);
//     if (monster) {
//       const damage = base.attackPower;
//       monster.hp -= damage;
//       return { id: monster.id, hp: monster.hp };
//     } else {
//       throw new Error(`Monster not found: ${monsterId}`);
//     }
//   });
// };


function handleBaseAttackMonster(req, res) {
  console.log('Received Base Attack Request:', req.body);

  // 유효성 검사
  if (!req.body || !req.body.baseUuid || !req.body.monsterIndices) {
    console.error('Invalid payload:', req.body);
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  const { baseUuid, monsterIndices } = req.body;  // req.body에서 직접 데이터 추출

  // try {
  //   // 몬스터 업데이트 로직 처리
  //   // const updatedMonsters = baseAttackMonster(baseUuid, monsterIndices);

  //   // 클라이언트로 응답 반환
  //   return res.json({ success: true, updatedMonsters });
  // } catch (error) {
  //   console.error('Error in baseAttackMonster:', error);
  //   return res.status(500).json({ success: false, error: 'Server error' });
  // }
}

export { handleMonsterBaseAttack, handleBaseAttackMonster };
