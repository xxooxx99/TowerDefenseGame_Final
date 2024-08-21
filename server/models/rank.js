import cron from 'node-cron';
import { prisma } from '../utils/prisma/index.js';

export let userTop10;

const getRank = async () => {
  const usersRankDatas = await prisma.userInfo.findMany({
    orderBy: {
      highScore: 'desc', // 점수 기준으로 내림차순 정렬
    },
    take: 10,
  });
  userTop10 = usersRankDatas;
};

export const initRank = async () => {
  getRank();

  cron.schedule('* * * * *', async function () {
    getRank();
  });
};
