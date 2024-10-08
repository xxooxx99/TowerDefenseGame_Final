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
  C2S_TOWER_ATTACK: 57,
  C2S_TOWER_SALE: 58,
  S2C_TOWER_ALLOW: 59,
  C2S_SPAWN_MONSTER: 21,
  S2C_ENEMY_SPAWN_MONSTER: 22,
  C2S_DIE_MONSTER: 23,
  S2C_ENEMY_DIE_MONSTER: 24,
  S2C_USER_GOLD_INIT: 25,
  C2S_MONSTER_ATTACK_BASE: 40,
  S2C_UPDATE_BASE_HP: 41,
  C2S_BASE_ATTACK: 60,
  S2C_UPDATE_MONSTER_HP: 62,
  S2C_GAMESYNC: 99,
  C2S_LOAD_ABILITY_REQUEST: 100,
  S2C_SEND_ABILITY_INFO: 101,
  C2S_ABILITY_LIST_REQUEST: 102,
  S2C_SEND_ABILITY_LIST: 103,
  C2S_UPGRADE_ABILITY_REQUEST: 104,
  S2C_UPGRADE_COMPLETE: 105,
  S2C_UPGRADE_FAILED: 106,
  C2S_KILL_MONSTER_EVENT: 110,
  S2C_GOLD_ABILITY_ACTIVE: 111,
  S2C_SPAWN_ABILITY_ACTIVE: 112,
  C2S_SPAWN_BOSS: 200, // 클라이언트가 보스를 스폰 요청할 때 사용
  S2C_BOSS_SPAWN: 201, // 서버가 보스 스폰을 클라이언트에 알릴 때 사용
  S2C_BOSS_SKILL: 202, // 서버가 보스의 스킬 사용을 클라이언트에 알릴 때 사용
  C2S_GAMEOVER_SIGNAL: 300, // 본인이 게임을 졌다고 신호를 보냄
  C2S_GAMEWIN_SIGNAL: 301, // 본인이 게임을 이겼다고 신호를 보냄
  S2C_GAME_LOSE_SIGNAL: 310, //  너는 게임을 졌다고 신호를 보냄
  S2C_GAME_WIN_SIGNAL: 311, // 너는 게임을 이겼다고 신호를 보냄
  C2S_ABILITY_EQUIP_REQUEST: 500,
  S2C_ABILITY_EQUIP_SUCCESS: 501,
  S2C_ABILITY_EQUIP_FAILED: 502,
  C2S_RECORD_RECENT_GAME: 700, // 최근 게임을 저장하라는 신호
  C2S_RECENT_GAME_LOAD: 701, // 최근 게임의 정보를 보내달라는 신호
  S2C_LOAD_RECENT_GAME_INFO: 702, // 최근 게임의 정보를 보냈다는 신호
  S2C_FAILED_LOAD_RECENT_GAME: 703, // 최근 게임 정보를 불러오지 못했다는 신호
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
