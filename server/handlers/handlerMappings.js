//핸들러 추가
import { towerAddHandler } from './tower/tower.handler.js';
import { userGoldInitHandler } from './gold/gold.handler.js';
import { handleMatchRequest } from './match/matchMakingHandler.js';
import {
  handlerMatchAcceptRequest,
  handlerMatchDeniedRequest,
} from './match/matchAcceptHandler.js';

const handlerMappings = {
  25: userGoldInitHandler, //임시 코드
  55: towerAddHandler,
  // 13: handleMatchRequest,
  // 16: handlerMatchAcceptRequest,
  // 17: handlerMatchDeniedRequest,
};

export default handlerMappings;
