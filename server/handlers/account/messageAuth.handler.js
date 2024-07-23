import express from 'express';
import coolsms from 'coolsms-node-sdk';
import { prisma } from '../../utils/prisma/index.js';
import { messageSet, messageDelete } from '../../session/messageSession/message.js';

const router = express.Router();

const sms = coolsms.default;
const messageService = new sms(process.env.MESSAGE_API_KEY, process.env.MESSAGE_API_SECRET_KEY);
const Caller = process.env.CALLER;
const regPhone = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]){4}$/;

export const messageSendHandler = router.post('/messageAuth', async (req, res) => {
  const { userPhoneNumber, username } = req.body;

  try {
    const isExistingUserId = await prisma.user.findFirst({
      where: {
        OR: [{ userId: username }, { userPhoneNumber: userPhoneNumber }],
      },
    });

    if (isExistingUserId) {
      return res.status(400).json({ status: 'fail', message: 'User already exists' });
    }

    if (!regPhone.test(userPhoneNumber)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid password' });
    }

    const randomInt = Math.trunc(Math.random() * 1000000);
    console.log(`메세지로 보낼 랜덤 수:${randomInt}`);

    messageService
      .sendOne({
        to: userPhoneNumber,
        from: Caller,
        text: `해당 번호로 인증해주세요: ${randomInt}`,
      })
      .then((res) => {
        console.log(res);
        messageSet(userPhoneNumber, randomInt.toString());
        setTimeout(() => {
          messageDelete(userPhoneNumber);
        }, 180000);
      });

    // messageSet(userPhoneNumber, randomInt.toString()); 테스트시 해당 코드 활성화하고 위의 messageService 부분은 주석처리!!

    return res.status(201).json({ status: 'success' });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});
