import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  // Prisma를 이용해 데이터베이스를 접근할 때, SQL을 출력해줍니다.
  log: ['warn', 'error'],
//'query', 'info', 
  // 에러 메시지를 평문이 아닌, 개발자가 읽기 쉬운 형태로 출력해줍니다.
  errorFormat: 'pretty',
}); // PrismaClient 인스턴스를 생성합니다.

/* // UserInfo 수정용 (활성화 시키고 서버 on)
async function updateWin() {
  try {
    const updatedUserInfo = await prisma.userInfo.update({
      where: {
        userId: '555',
      },
      data: {
        win: 1,
        lose: 1,
      },
    });
    console.log('Updated UserInfo:', updatedUserInfo);
  } catch (error) {
    console.error('Error updating UserInfo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWin(); */
