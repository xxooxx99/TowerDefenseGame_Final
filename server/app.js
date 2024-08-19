import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcrypt';
import { prisma } from './utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import initSocket from './init/socket.js';
import { registerHandler } from './handlers/account/register.handler.js';
import { loginHandler } from './handlers/account/login.handler.js';
import { messageSendHandler } from './handlers/account/messageAuth.handler.js';
import { handleBaseAttackMonster } from './handlers/game/gameHandler.js';
import { config } from 'dotenv';
import { loadGameAssets } from './init/assets.js';
import { db_data_add } from './db.js';
import { handleSpawnBoss } from './handlers/boss/bosshandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // express 모듈을 사용해 express 인스턴스 생성 -> 이로 인해 express 문법 사용이 가능
const server = createServer(app); // 인스턴스를 넣어주므로써 express 어플로 들어오는 요청을 처리할 수 있게 된다.

const io = initSocket(server); // 웹소켓

export const activeSessions = {};

const corsOptions = {
  origin: '*',
  allowedHeaders: ['Content-type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/api', [messageSendHandler, registerHandler, loginHandler]); // /라는 경로를 통해 들어온 데이터는 해당 배열의 핸들러가 순차적으로 진행.

app.post('/api/base-attack-monster', handleBaseAttackMonster);

app.get('/api', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../client') });
});

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    io.emit('chat message', data);
    console.log(`Received chat message from ${data.userId}: ${data.message} from app.js`);
  });

  socket.on('spawnBoss', (data) => {
    handleSpawnBoss(io, socket, data.bossType);  // 보스 소환을 모든 클라이언트에게 브로드캐스트
});
});

loadGameAssets();

server.listen(process.env.PORT, async () => {
  const address = server.address();
  const host = address.address === '::' ? 'localhost' : address.address;
  const port = address.port;
  console.log(`Server가 http://${host}:${port} 에서 열렸습니다.`);

  // db가 로컬이기에 능력에 관한 데이터가 없으므로
  // 능력에 관한 데이터를 수기로 입력해주는 함수
  db_data_add();
});
