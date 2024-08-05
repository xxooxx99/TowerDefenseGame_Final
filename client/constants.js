export const CLIENT_VERSION = ['1.0.0', '1.0.1', '1.1.0'];
export const INITIAL_TOWER_NUMBER = 3;

export const PacketType = {
  C2S_MATCH_REQUEST: 13,
  S2C_MATCH_FOUND_NOTIFICATION: 14,
  S2C_MATCH_ACCEPT_REQUEST: 15,
  C2S_MATCH_ACCEPT: 16,
  C2S_MATCH_DENIED: 17,
  S2C_MATCH_START: 18,
  S2C_USER_GOLD_INIT: 25,
  C2S_TOWER_CREATE: 55,
  C2S_SPAWN_MONSTER: 21,
  S2C_ENEMY_SPAWN_MONSTER: 22,
  C2S_DIE_MONSTER: 23,
  S2C_ENEMY_DIE_MONSTER: 24,
  S2C_GAMESYNC: 99,
};

export const TOWER_TYPE = [
  'baseTower',
  'speedTower',
  'attackSupportTower',
  'powerSupportTower',
  'strongTower',
  'splashTower',
  'multiShotTower',
  'poisonTower',
  'growthTower',
];
