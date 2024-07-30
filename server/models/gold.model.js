let usersGold = {};

export const userGoldInit = (userId) => {
  usersGold[userId] = 1000;
};

export const userGoldSubtract = (userId, value) => {
  if (userGold[userId] >= value) {
    userGold[userId] = userGold[userId] - value;
    return true;
  }

  return false;
};

export const userGoldAdd = (userId, value) => {
  usersGold[userId] = usersGold[userId] + value;
};
