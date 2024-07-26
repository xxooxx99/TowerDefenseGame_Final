import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma/index.js';
import { activeSessions } from '../../app.js';
import fetch from 'node-fetch';

const router = express.Router();
const sessionTimeout = 60 * 60 * 1000; // 1시간

router.post('/login', async (req, res) => {
  const { userId, password, recaptchaToken } = req.body;

  console.log('Received login request:', { userId, password, recaptchaToken });

  try {
    if (!recaptchaToken) {
      return res.status(400).json({ status: 'fail', message: 'reCAPTCHA token is missing' });
    }

    // reCAPTCHA 토큰 검증
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    const response = await fetch(verificationUrl, { method: 'POST' });
    const data = await response.json();

    console.log('CAPTCHA verification response:', data);

    if (!data.success) {
      return res.status(400).json({ status: 'fail', message: 'Invalid CAPTCHA' });
    }

    // 사용자 인증
    const user = await prisma.user.findUnique({
      where: { userId: userId },
    });

    console.log('User found in database:', user);

    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.userPassword);

    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ status: 'fail', message: 'Invalid password' });
    }

    if (activeSessions[user.userId]) {
      console.log('User already logged in:', user.userId);
      return res.status(400).json({ status: 'fail', message: 'User already logged in' });
    }

    const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    activeSessions[user.userId] = token;

    setTimeout(() => {
      delete activeSessions[user.userId];
    }, sessionTimeout);

    console.log('User logged in successfully:', { userId: user.userId, token });
    res.status(200).json({ token });
  } catch (e) {
    console.error('Error during login process:', e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  const { userId } = req.body;
  delete activeSessions[userId];
  console.log('User logged out successfully:', userId);
  res.status(200).json({ message: 'Logout successful' });
});

export { router as loginHandler };
