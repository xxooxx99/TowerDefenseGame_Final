import { PacketType } from '../constants.js';

const result_window = document.getElementById('result_window');
const win_word = document.getElementById('win_word');

const high_score_record = document.getElementById('high_score_record');
const score_record = document.getElementById('score_record');

const serverSocket = io('http://localhost:8080', {
  auth: {
    token: localStorage.getItem('token'),
  },
});

function loadGameInfo(data, isHighScore) {
  result_window.style.display = 'block';

  if (data.isWin) {
    // 최근 전적이 이겼다면
    win_word.textContent = '승리';
    win_word.style.color = 'green';
  } else {
    // 최근 전적이 졌다면
    win_word.textContent = '패배';
    win_word.style.color = 'red';
  }

  score_record.textContent = '점수 : ' + data.score;

  if (isHighScore) {
    high_score_record.style.visibility = 'visible';
  } else {
    high_score_record.style.visibility = 'hidden';
  }
}

function failedLoadGameInfo() {
  alert('게임 정보를 불러오는데 실패했습니다. 메인화면으로 돌아갑니다.');
  window.location.href = 'index.html';
}

serverSocket.on('event', (packet) => {
  switch (packet.packetType) {
    case PacketType.S2C_FAILED_LOAD_RECENT_GAME:
      failedLoadGameInfo();
      break;
    case PacketType.S2C_LOAD_RECENT_GAME_INFO:
      loadGameInfo(packet.payload, packet.isHighScore);
      break;
    default:
      alert('잘못된 패킷을 보냈습니다.');
  }
});

serverSocket.emit('event', {
  packetType: PacketType.C2S_RECENT_GAME_LOAD,
  userId: localStorage.getItem('userId'),
});
