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
import * as bossHandlers from './handlers/boss/bosshandlers.js';

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

let clientBossSpawned = {}; // 클라이언트별 보스 소환 상태 관리
let towers = {};  // towers 객체 초기화
let base = {};    // base 객체 초기화

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('stageUpdate', (data) => {
    console.log('Stage Update received from client: ', data.stage);
    bossHandlers.handleStageUpdate(socket, data.stage, io, towers, base);
});
  
  socket.on('spawnBoss', (data) => {
    const { bossType, stage } = data;
    console.log(`Boss spawn requested by client ${socket.id}`);
    

    bossHandlers.handleSpawnBoss(socket, stage, io, towers, base)
    .then(() => {
      socket.emit('bossSpawned', { success: true, bossType, stage });
      console.log(`${bossType} spawned successfully at stage ${stage}`);


      // 클라이언트로부터 ACK를 기다림
      socket.once('bossSpawnAck', (ackData) => {
        if (ackData && ackData.stage === stage) {
          console.log(`Boss spawn ACK received from client ${socket.id} for stage ${stage}`);
        } else {
          console.error(`Boss spawn ACK failed or invalid for client ${socket.id}`);
        }
      });

    })
    .catch((err) => {
      console.error(`Error spawning ${bossType} at stage ${stage}:`, err);
      socket.emit('bossSpawned', { success: false, message: 'Failed to spawn boss' });
    });
  });
});

io.sockets.setMaxListeners(100); // 최대 리스너 개수를 30개로 설정

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
