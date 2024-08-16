import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { messageGet } from '../../models/message.model.js';
import { messageDelete, messages } from '../../models/message.model.js';

const salt = await bcrypt.genSalt(parseInt(process.env.SALT));
const router = express.Router();

export const registerHandler = router.post('/register', async (req, res) => {
  const { number, userId, password, userPhoneNumber } = req.body;

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
        userId: userId,
        userPassword: hashedPassword,
        userPhoneNumber: userPhoneNumber,
        UserInfo: {
          create: { highScore: 0, win: 0, lose: 0, money: 0 },
        },
      },
    });

    const newUserAbility = await prisma.UserAbilityList.create({
      data: {
        userId: userId,
        equipAbilityId: 1,
        userAbilityInfo: {
          create: [
            {
              abilityId: 1,
              currentUpgrade: 1,
            },
            {
              abilityId: 2,
              currentUpgrade: 0,
            },
          ],
        },
      },
      include: {
        userAbilityInfo: true,
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
