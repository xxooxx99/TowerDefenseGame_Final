const user_id = document.getElementById('user_id');
const user_money = document.getElementById('user_money');

const current_ability_icon = document.getElementById('current_ability_icon');
const ability_container = document.getElementById('ability_container');

const selectAB_icon = document.getElementById('selected_ability_icon');
const selectAB_name = document.getElementById('selected_ability_name');
const selectAB_explain = document.getElementById('selected_ability_explanation');

const selectAB_upgrade = {
  selectAB_upgrade_1: document.getElementById('upgrade_explain_1'),
  selectAB_upgrade_2: document.getElementById('upgrade_explain_2'),
  selectAB_upgrade_3: document.getElementById('upgrade_explain_3'),
  selectAB_upgrade_4: document.getElementById('upgrade_explain_4'),
  selectAB_upgrade_5: document.getElementById('upgrade_explain_5'),
};

const upgrade_button = document.getElementById('upgrade_button');
const equip_button = document.getElementById('equip_button');

let userAbilityList;
let abilityList;
let userData;

let selected_ability_user_data;

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

  userAbilityList.userAbilityInfo.forEach((element) => {
    if (element.abilityId === ability_data.id) {
      selected_ability_user_data = element;
    }
  });

  if (!selected_ability_user_data) {
    console.log('데이터가 없습니다.');
    return;
  }

  for (let index = 1; index <= 5; index++) {
    if (selected_ability_user_data.currentUpgrade < index) {
      // 유저의 업그레이드 수치가 표시할 index보다 낮다면 회색+중앙선
      selectAB_upgrade[`selectAB_upgrade_${index}`].style.textDecorationLine = 'line-through';
      selectAB_upgrade[`selectAB_upgrade_${index}`].style.color = 'gray';
    } else {
      selectAB_upgrade[`selectAB_upgrade_${index}`].style.textDecorationLine = 'none';
      selectAB_upgrade[`selectAB_upgrade_${index}`].style.color = 'black';
    }
  }

  selectAB_upgrade.selectAB_upgrade_1.textContent = ability_data.upgrade_1;
  selectAB_upgrade.selectAB_upgrade_2.textContent = ability_data.upgrade_2;
  selectAB_upgrade.selectAB_upgrade_3.textContent = ability_data.upgrade_3;
  selectAB_upgrade.selectAB_upgrade_4.textContent = ability_data.upgrade_4;
  selectAB_upgrade.selectAB_upgrade_5.textContent = ability_data.upgrade_5;

  // 업그레이드 수치가 5와 같거나 크다면 업그레이드 버튼 비활성화
  if (selected_ability_user_data.currentUpgrade >= 5) {
    upgrade_button.disabled = true;
    upgrade_button.textContent = '업그레이드가 최대치에 도달했습니다.';
  } else {
    // 아니라면 활성화
    upgrade_button.disabled = false;
    upgrade_button.textContent =
      '업그레이드 : ' +
      ability_data[`costTo_${selected_ability_user_data.currentUpgrade + 1}`] +
      '골드';
  }

  if (selected_ability_user_data.currentUpgrade <= 0) {
    equip_button.disabled = true;
  } else {
    equip_button.disabled = false;
  }
}

async function ability_List_Show() {
  let currentAbility;
  abilityList.forEach((element) => {
    if (userAbilityList.equipAbilityId === element.id) {
      currentAbility = element;
    }
  });

  current_ability_icon.src = currentAbility.icon;

  for (let count = 1; count <= userAbilityList.userAbilityInfo.length; count++) {
    let button = document.createElement('button');
    button.className = 'ability_container_button';

    let img = new Image(110, 110);
    img.src = abilityList[count - 1].icon;

    button.addEventListener('click', () => {
      serverSocket.emit('event', {
        packetType: 100,
        abilityId: count,
        userId: localStorage.getItem('userId'),
      });
    });

    ability_container.appendChild(button);
    button.appendChild(img);
  }
  user_money.textContent = '소지 골드 : ' + userData.money;
}

serverSocket.on('event', (data, payload) => {
  if (data.packetType === 101) {
    showAbility_info(data.ability_info);
  } else if (data.packetType === 103) {
    userAbilityList = data.userAbilityList;
    abilityList = data.abilityList;
    userData = data.userInfo;
    ability_List_Show();
  } else if (data.packetType === 105) {
    alert('업그레이드가 정상적으로 처리되었습니다.');
    window.location.href = 'ability.html';
  } else if (data.packetType === 106) {
    alert('소지 골드가 부족하여 업그레이드가 불가능합니다.');
  } else if (data.packetType === 501) {
    // 능력 장착 성공
    alert('장착에 성공하였습니다.');
    window.location.href = 'ability.html';
  } else if (data.packetType === 502) {
    // 능력 장착 실패
    alert('이미 장착중인 능력입니다.');
  }
});

upgrade_button.addEventListener('click', async () => {
  serverSocket.emit('event', {
    packetType: 104,
    userId: localStorage.getItem('userId'),
    abilityId: selected_ability_user_data.abilityId,
    abilityLevel: selected_ability_user_data.currentUpgrade,
    hashId: selected_ability_user_data.hashId,
  });
});

equip_button.addEventListener('click', () => {
  serverSocket.emit('event', {
    packetType: 500,
    userId: localStorage.getItem('userId'),
    abilityId: selected_ability_user_data.abilityId,
  });
});

serverSocket.emit('event', {
  packetType: 102,
  userId: localStorage.getItem('userId'),
});
