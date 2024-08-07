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
    this.beamDuration = 20; // 예시로 20 프레임 동안 빔을 표시
    const { baseUuid, monsterIndices } = payload;  // payload에서 데이터 추출

    // 실제로 몬스터에게 데미지를 입히는 로직
    monsterIndices.forEach(index => {
      const monster = this.monsters.find(m => m.getMonsterIndex() === index);
      if (monster) {
        monster.receiveDamage(this.attackPower); // 몬스터에게 데미지를 입힘
        console.log(`Monster ${index} received ${this.attackPower} damage!`);
      }
    });

    // 서버에 공격 요청을 전송
    fetch('/api/base-attack-monster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUuid, monsterIndices })  // payload를 그대로 전송
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log(`Base Successfully ATTACK ALL MONSTERS!`);
        data.updatedMonsters.forEach(updatedMonster => {
          const monster = this.monsters.find(m => m.id === updatedMonster.id);
          if (monster) {
            monster.hp = updatedMonster.hp; // 몬스터의 HP를 업데이트
            console.log(`Monster ${updatedMonster.id} HP updated to ${updatedMonster.hp}`);
          }
        });
      } else {
        console.error('Base attack failed:', data.error);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
}
