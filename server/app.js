import express from 'express';
import { createServer } from 'http';
import initSocket from './init/socket.js';
import cookieParser from 'cookie-parser';
import { registerHandler } from './handler/account/register.handler.js';
import { loginHandler } from './handler/account/login.handler.js';
import { config } from 'dotenv';

const app = express(); // express 모듈을 사용해 express 인스턴스 생성 -> 이로 인해 express 문법 사용이 가능
const server = createServer(app); // 인스턴스를 넣어주므로써 express 어플로 들어오는 요청을 처리할 수 있게 된다.
const PORT = 5555 || config.server.port; //예시

const io = initSocket(server); // 웹소켓

app.use(cookieParser()); //쿠키 파서 미들웨어 추가 -> 클라이언트가 보낸 쿠키 내용 접근 가능
app.use(express.json()); //json 형식의 요청을 객체로 파싱해 더욱 쉽게 다루기 가능
app.use(express.urlencoded({ extended: false })); // URL-encoded 형식의 본문을 파싱 false값은 데이터가 단순한 객체 형태로 저장됨.
app.use('/', [registerHandler, loginHandler]); // /라는 경로를 통해 들어온 데이터는 해당 배열의 핸들러가 순차적으로 진행.

server.listen(PORT, async () => {
  console.log(`서버가 실행되었습니다: PORT: ${PORT}`);
});
