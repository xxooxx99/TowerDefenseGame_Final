export const CLIENT_VERSION = ['1.0.0', '1.0.1', '1.1.0'];
export const RESOLUTION_HEIGHT = 680;
export const RESOLUTION_WIDTH = 1500;
export const INITIAL_TOWER_NUMBER = 3;

export const PacketType = {
  S2C_GAME_INIT_DATA: 0,
  C2S_TOWER_BUY: 5,
  C2S_TOWER_ATTACK: 6,
  S2C_ENEMY_TOWER_SPAWN: 7,
  S2C_ENEMY_TOWER_ATTACK: 8,
  C2S_MATCH_REQUEST: 13,
  S2C_MATCH_FOUND_NOTIFICATION: 14,
  S2C_MATCH_ACCEPT_REQUEST: 15,
  C2S_MATCH_ACCEPT: 16,
  C2S_MATCH_DENIED: 17,
  C2S_SPAWN_MONSTER: 21,
  S2C_ENEMY_SPAWN_MONSTER: 22,
  C2S_DIE_MONSTER: 23,
  S2C_ENEMY_DIE_MONSTER: 24,
  S2C_TOWER_CREATE: 55,
  C2S_TOWER_UPGRADE: 56,
  C2S_MONSTER_ATTACK_BASE: 40,
  S2C_UPDATE_BASE_HP: 41,
  S2C_GAMESYNC: 99,
  S2C_MATCH_START: 18,
  C2S_SPAWN_MONSTER: 21,
  S2C_ENEMY_SPAWN_MONSTER: 22,
  C2S_DIE_MONSTER: 23,
  S2C_ENEMY_DIE_MONSTER: 24,
  S2C_TOWER_CREATE: 55,
  C2S_TOWER_UPGRADE: 56,
  C2S_MONSTER_ATTACK_BASE: 40,
  S2C_UPDATE_BASE_HP: 41,
  BASE_ATTACK_POWER: 60,
  BASE_UPGRADE_COST: 61,
  S2C_UPDATE_MONSTER_HP: 62,
  S2C_GAMESYNC: 99,
  C2S_LOAD_ABILITY_REQUEST: 100,
  S2C_SEND_ABILITY_INFO: 101,
};
