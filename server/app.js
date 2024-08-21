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

const app = express(); 
const server = createServer(app); 
const io = initSocket(server); 

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
app.use('/api', [messageSendHandler, registerHandler, loginHandler]);

app.post('/api/base-attack-monster', handleBaseAttackMonster);

app.get('/api', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../client') });
});

let towers = {};  // 타워 객체
let base = {};    // 기지 객체

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // 스테이지 업데이트 이벤트 처리
  socket.on('stageUpdate', (data) => {
    console.log(`Stage Update received from client ${socket.id}: Stage ${data.stage}`);
    bossHandlers.handleStageUpdate(socket, data.stage, io, towers, base);
  });

  // 클라이언트에서 보스 생성 요청 처리
  socket.on('requestBossSpawn', (data) => {
    const { bossType, stage } = data;
    console.log(`Boss spawn requested by client ${socket.id} for stage ${stage}`);

    bossHandlers.handleSpawnBoss(socket, stage, io, towers, base)
      .then(() => {
        io.emit('opponentBossSpawned', { bossType, stage, userId: socket.id }); // 모든 클라이언트에게 보스 생성 동기화
        console.log(`Boss ${bossType} spawned successfully at stage ${stage} for client ${socket.id}`);
      })
      .catch((err) => {
        console.error(`Error spawning ${bossType} at stage ${stage}:`, err);
        socket.emit('bossSpawned', { success: false, message: 'Failed to spawn boss' });
      });
  });

  // 보스 생성 ACK 처리
  socket.on('bossSpawnAck', (data) => {
    const { stage } = data;
    console.log(`Boss spawn ACK received from client ${socket.id} for stage ${stage}`);
  });
});

io.sockets.setMaxListeners(100); 

loadGameAssets();

server.listen(process.env.PORT, async () => {
  const address = server.address();
  const host = address.address === '::' ? 'localhost' : address.address;
  const port = address.port;
  console.log(`Server is running at http://${host}:${port}`);

  db_data_add();
});
