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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../client') });
});

// 회원가입(기본)
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        userId: username,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        userId: username,
        userPassword: hashedPassword,
        userInfo: {
          create: {
            highScore: 0,
            win: 0,
            lose: 0,
          },
        },
      },
    });

    const token = jwt.sign({ id: newUser.userId }, JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(201).json({ token, userId: newUser.userId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 로그인(기본)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: username,
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.userPassword);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    // 중복 로그인 방지
    if (activeSessions[user.userId]) {
      return res.status(400).json({ message: 'User already logged in' });
    }

    const token = jwt.sign({ id: user.userId }, JWT_SECRET, {
      expiresIn: '1h',
    });

    activeSessions[user.userId] = token;

    res.status(200).json({ token, userId: user.userId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

initSocket(server);

server.listen(PORT, async () => {
  const address = server.address();
  const host = address.address === '::' ? 'localhost' : address.address;
  const port = address.port;
  console.log(`Server가 http://${host}:${port} 에서 열렸습니다.`);
});
