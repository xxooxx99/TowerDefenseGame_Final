//핸들러 추가
import { loginHandler } from './account/login.handler.js';
import { registerHandler } from './account/register.handler.js';

const handlerMappings = {
  0: registerHandler,
  1: loginHandler,
};

export default handlerMappings;
