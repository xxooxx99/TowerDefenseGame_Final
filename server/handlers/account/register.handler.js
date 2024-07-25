import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { messageGet } from '../../models/message.js';
import { messageDelete, messages } from '../../models/message.js';

const salt = await bcrypt.genSalt(parseInt(process.env.SALT));
const router = express.Router();

export const registerHandler = router.post('/register', async (req, res) => {
  const { number, username, password, userPhoneNumber } = req.body;

  try {
    const data = messageGet(userPhoneNumber);

    if (!data) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Failed. Or, authentication time has expired.' });
    }

    if (number !== data.message) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'The authentication number is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        userId: username,
        userPassword: hashedPassword,
        userPhoneNumber: userPhoneNumber,
      },
    });

    const token = jwt.sign({ id: newUser.userId }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ status: 'success', token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    messageDelete(userPhoneNumber);
  }
});
