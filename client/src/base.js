export class Base {
  constructor(x, y, maxHp) {
    this.x = x;
    this.y = y;
    this.width = 85;
    this.height = 112;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.attackPower = 1000;
    this.beamDuration = 0;
    this.monsters = [];
    this.attackUsedThisStage = false; // 스테이지당 공격 여부를 추적
    this.cooldown = 10;
    this.remainingCooldown = 0; //남은 쿨타임
    const socekt = io();
  }

  startCooldown() {
    this.remainingCooldown = this.cooldown;

    // 타이머 HTML 업데이트
    const cooldownElement = document.getElementById('cooldown-timer');
    cooldownElement.textContent = `남은 시간: ${this.remainingCooldown}초`;

    const cooldownInterval = setInterval(() => {
      this.remainingCooldown--;

      // 남은 쿨타임을 타이머에 표시
      cooldownElement.textContent = `남은 시간: ${this.remainingCooldown}초`;

      if (this.remainingCooldown <= 0) {
        clearInterval(cooldownInterval);
        this.resetAttack(); // 쿨타임 종료 시 공격 가능 상태로 초기화

        // 타이머를 숨기고, 버튼 다시 표시
        cooldownElement.style.display = 'none';
        const attackMonstersButton = document.getElementById('attack-monsters-button');
        if (attackMonstersButton) {
          attackMonstersButton.style.display = 'block'; // 버튼 표시
        }
      }
    }, 1000); // 1초마다 갱신
  }

  resetAttack() {
    this.attackUsedThisStage = false;
  }

  draw(ctx, baseImage, monsterList, isOpponent = false) {
    ctx.drawImage(
      baseImage,
      this.x - this.width,
      this.y - this.height / 2,
      this.width,
      this.height,
    );
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(
      `HP: ${this.hp}/${this.maxHp}`,
      this.x - this.width,
      this.y - this.height / 2 - 10,
    );

    if (this.beamDuration > 0) {
      monsterList.forEach(monster => {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(monster.x, monster.y);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.closePath();
      });
      this.beamDuration--;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  updateHp(newHp) {
    this.hp = newHp;
  }

  attackMonsters(payload) {
    //쿨타임 가지고 공격

    //공격실행시 음원 재생
    const attackSound = new Audio('/sounds/baseattack.mp3');
    attackSound.volume = 0.1; //볼륨 10%
    attackSound.play();
    this.beamDuration = 40; // 예시로 20 프레임 동안 빔을 표시
    const { baseUuid, monsterIndices } = payload;  // payload에서 데이터 추출

    // 실제로 몬스터에게 데미지를 입히는 로직
    monsterIndices.forEach(index => {
      const monster = this.monsters.find(m => m.getMonsterIndex() === index);
      if (monster) {
        monster.receiveDamage(this.attackPower); // 몬스터에게 데미지를 입힘
        console.log(`Monster ${index} received ${this.attackPower} damage!`);
      }
    });

    // 공격 사용 상태로 설정하고 쿨타임 시작
    this.attackUsedThisStage = true;

    // 버튼 숨기고 타이머 표시
    const attackMonstersButton = document.getElementById('attack-monsters-button');
    if (attackMonstersButton) {
      attackMonstersButton.style.display = 'none';
    }

    const cooldownElement = document.getElementById('cooldown-timer');
    cooldownElement.style.display = 'block'; // 타이머 표시
    this.startCooldown(); // 쿨타임 시작



// 서버에 공격 요청을 전송
fetch('/api/base-attack-monster', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ baseUuid, monsterIndices })  // payload 전송
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json(); // 응답을 JSON으로 파싱
  })
  .then(data => {
    if (data.success) {
      console.log(`Base Successfully ATTACK ALL MONSTERS!,Send Chat Event!`);

      socket.emit('ultimateAttackUsed', {
        playerName: baseUuid
      });
      data.updatedMonsters.forEach(updatedMonster => {
        const monster = this.monsters.find(m => m.id === updatedMonster.id);
        if (monster) {
          monster.hp = updatedMonster.hp; // 몬스터의 HP 업데이트
          console.log(`Monster ${updatedMonster.id} HP updated to ${updatedMonster.hp}`);
        }
      });
    } else {
      console.error('Base attack failed:', data.error);
    }
  })
  .catch(error => {
    console.error('Error:', error); // 네트워크 또는 JSON 파싱 오류 처리
  });

  }
}

