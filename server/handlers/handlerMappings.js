//핸들러 추가
import { towerAddHandler, towerUpgrade } from './tower/tower.handler.js';
import { handleMatchRequest } from './match/matchMakingHandler.js';
import {
  handlerMatchAcceptRequest,
  handlerMatchDeniedRequest,
} from './match/matchAcceptHandler.js';

const handlerMappings = {
  55: towerAddHandler,
  56: towerUpgrade,
  // 13: handleMatchRequest,
  // 16: handlerMatchAcceptRequest,
  // 17: handlerMatchDeniedRequest,
};

export default handlerMappings;
