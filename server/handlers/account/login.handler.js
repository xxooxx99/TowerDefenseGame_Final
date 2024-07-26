import express from 'express';
import { Prisma } from '@prisma/client';
import { activeSessions } from '../../app.js';

const router = express.Router();

export const loginHandler = router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: username,
      },
    });

    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.userPassword);

    if (!isPasswordValid) {
      return res.status(400).json({ status: 'fail', message: 'Invalid password' });
    }
    // 중복 로그인 방지
    if (activeSessions[user.userId]) {
      return res.status(400).json({ status: 'fail', message: 'User already logged in' });
    }

    const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    activeSessions[user.userId] = token;

    res.status(200).json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});
