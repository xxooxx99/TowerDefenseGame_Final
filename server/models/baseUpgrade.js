const bases = {};
const monsters = []; // 기존 코드를 따라 몬스터 목록을 추가합니다.

export const createBase = (uuid, health = 100, attackPower = 10, defense = 0) => {
  bases[uuid] = { health, attackPower, defense };
};

export const getBase = (uuid) => {
  return bases[uuid];
};

export const upgradeBaseAttack = (uuid) => {
  if (bases[uuid]) {
    bases[uuid].attackPower += 5;
  }
};

export const upgradeBaseDefense = (uuid) => {
  if (bases[uuid]) {
    bases[uuid].defense += 5;
  }
};

export const attackBase = (attackerUuid, targetUuid) => {
  const attacker = bases[attackerUuid];
  const target = bases[targetUuid];
  if (attacker && target) {
    const damage = Math.max(attacker.attackPower - target.defense, 0);
    target.health -= damage;
    return target.health;
  }
  return null;
};

export const baseAttackMonster = (baseUuid, monsterIndices) => {
  const base = getBase(baseUuid);
  if (!base) {
    throw new Error(`Base not found: ${baseUuid}`);
  }

  if (!Array.isArray(monsterIndices)) {
    throw new Error('Invalid monster indices');
  }

  return monsterIndices.map(monsterId => {
    const monster = monsters.find(m => m.id === monsterId);
    if (monster) {
      const damage = base.attackPower;
      monster.hp -= damage;
      return { id: monster.id, hp: monster.hp };
    } else {
      throw new Error(`Monster not found: ${monsterId}`);
    }
  });
};
