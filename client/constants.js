export const CLIENT_VERSION = ['1.0.0', '1.0.1', '1.1.0'];
export const INITIAL_TOWER_NUMBER = 3;

export const PacketType = {
  C2S_TOWER_BUY: 5,
  C2S_TOWER_ATTACK: 6,
  S2C_ENEMY_TOWER_SPAWN: 7,
  S2C_ENEMY_TOWER_ATTACK: 8,
  C2S_MATCH_REQUEST: 13,
  S2C_MATCH_FOUND_NOTIFICATION: 14,
  S2C_MATCH_ACCEPT_REQUEST: 15,
  C2S_MATCH_ACCEPT: 16,
  C2S_MATCH_DENIED: 17,
  S2C_MATCH_START: 18,
  S2C_USER_GOLD_INIT: 25,
  C2S_TOWER_CREATE: 55,
  C2S_TOWER_UPGRADE: 56,
  C2S_SPAWN_MONSTER: 21,
  S2C_ENEMY_SPAWN_MONSTER: 22,
  C2S_DIE_MONSTER: 23,
  S2C_ENEMY_DIE_MONSTER: 24,
  C2S_MONSTER_ATTACK_BASE: 40,
  S2C_UPDATE_BASE_HP: 41,
  C2S_BASE_ATTACK: 60,
  S2C_UPDATE_MONSTER_HP: 62,
  S2C_GAMESYNC: 99,
  C2S_LOAD_ABILITY_REQUEST: 100,
  S2C_SEND_ABILITY_INFO: 101,
  C2S_KILL_MONSTER: 110,
  S2C_GOLD_ABILITY_ACTIVE: 111,
};

export const TOWER_TYPE = [
  'baseTower',
  'speedTower',
  'speedSupportTower',
  'attackSupportTower',
  'strongTower',
  'splashTower',
  'multiShotTower',
  'poisonTower',
  'growthTower',
];
