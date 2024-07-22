let matchQ = [];
let CLIENTS = {};

function handleMatchRequest(socket, data) {
  const { userId } = data;
  console.log(`매치 요청을 보낸 유저 ID: ${userId}`);

  matchQ.push({ socket, userId });
  console.log(`현재 대기열 상태: ${matchQ.map((user) => user.userId).join()}`);

  if (matchQ.length >= 2) {
    const player1 = matchQ.shift();
    const player2 = matchQ.shift();
    CLIENTS[player1.userId] = player1.socket;
    CLIENTS[player2.userId] = player2.socket;

    console.log(`매칭 성공: ${player1.userId} vs ${player2.userId}`);
  }
}
