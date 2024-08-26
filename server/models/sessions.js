const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const Sessions = {
    create: async (data) => {
        return await prisma.session.create({ data });
    },
    // 다른 메소드들 추가 가능
};

module.exports = Sessions;
