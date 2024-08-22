const monsters = {};

export const createMonsters = (uuid) => {
  monsters[uuid] = [];
};

export const getMonsters = (uuid) => {
  return monsters[uuid];
};

export const setMonster = (uuid, hp, monsterIndex, monsterLevel) => {
  if (monsters[uuid] === undefined) {
    createMonsters(uuid);
  }

  monsters[uuid].push({ monsterIndex, hp, monsterLevel });
  return monsterIndex;
};

export const setDamagedMonsterHp = (uuid, damage, monsterIndex) => {
  const attackedMonster = monsters[uuid].find((monster) => {
    return monster.monsterIndex === monsterIndex;
  });

  if (attackedMonster) attackedMonster.hp -= damage + (attackedMonster.poison || 0);

  return attackedMonster;
};

export const setPoisonMonster = (uuid, damage, stack, monsterIndex, poisonDamage) => {
  const attackedMonster = monsters[uuid].find((monster) => {
    return monster.monsterIndex === monsterIndex;
  });

  if (!attackedMonster.poison) attackedMonster.poison = stack;
  else attackedMonster.poison += stack;

  attackedMonster.hp -= damage + attackedMonster.poison * poisonDamage;
  return attackedMonster;
};

export const clearMonsters = (uuid) => {
  return (monsters[uuid] = []);
};

export const removeMonster = (uuid, monsterId) => {
  if (!monsters[uuid]) {
    return { status: 'fail', message: 'Monsters not found' };
  }

  const index = monsters[uuid].findIndex((monster) => monster.id === monsterId);
  if (index === -1) {
    return { status: 'fail', message: 'Monster not found' };
  }

  monsters[uuid].splice(index, 1);
  return { status: 'success', message: 'Monster removed' };
};

export const monsterSpawnPoint = (uuid) => {
  return (monsters[uuid] = { x, y });
};
