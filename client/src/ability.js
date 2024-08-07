const user_id = document.getElementById('user_id');

const ability_1_button = document.getElementById('ability_1');

const selectAB_icon = document.getElementById('selected_ability_icon');
const selectAB_name = document.getElementById('selected_ability_name');
const selectAB_explain = document.getElementById('selected_ability_explanation');

const selectAB_upgrade_1 = document.getElementById('upgrade_explain_1');
const selectAB_upgrade_2 = document.getElementById('upgrade_explain_2');
const selectAB_upgrade_3 = document.getElementById('upgrade_explain_3');
const selectAB_upgrade_4 = document.getElementById('upgrade_explain_4');
const selectAB_upgrade_5 = document.getElementById('upgrade_explain_5');

const upgrade_button = document.getElementById('upgrade_button');

const serverSocket = io('http://localhost:8080', {
  auth: {
    token: localStorage.getItem('token'),
  },
});

//   ../images/ability/ability_money.png

user_id.textContent = '계정 : ' + localStorage.getItem('userId');

async function showAbility_info(ability_data) {
  selectAB_icon.src = ability_data.icon;
  selectAB_name.textContent = ability_data.name;
  selectAB_explain.textContent = ability_data.explain;

  selectAB_upgrade_1.textContent = ability_data.upgrade_1;
  selectAB_upgrade_2.textContent = ability_data.upgrade_2;
  selectAB_upgrade_2.style.textDecorationLine = 'line-through';
  selectAB_upgrade_2.style.color = 'gray';
  selectAB_upgrade_3.textContent = ability_data.upgrade_3;
  selectAB_upgrade_3.style.textDecorationLine = 'line-through';
  selectAB_upgrade_3.style.color = 'gray';
  selectAB_upgrade_4.textContent = ability_data.upgrade_4;
  selectAB_upgrade_4.style.textDecorationLine = 'line-through';
  selectAB_upgrade_4.style.color = 'gray';
  selectAB_upgrade_5.textContent = ability_data.upgrade_5;
  selectAB_upgrade_5.style.textDecorationLine = 'line-through';
  selectAB_upgrade_5.style.color = 'gray';

  upgrade_button.disabled = false;
  upgrade_button.textContent = '업그레이드 : ' + ability_data.costTo_2 + '골드';
}

serverSocket.on('event', (data, payload) => {
  if (data.packetType === 101) {
    showAbility_info(data.ability_info);
  }
});

ability_1_button.addEventListener('click', () => {
  serverSocket.emit('event', {
    packetType: 100,
    abilityId: 1,
    userId: localStorage.getItem('userId'),
  });
});

upgrade_button.addEventListener('click', () => {
  alert('현재 소지 골드가 부족합니다.');
});
