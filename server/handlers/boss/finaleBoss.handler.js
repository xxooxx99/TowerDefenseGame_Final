import EventEmitter from 'events';
import { PacketType } from '../../constants.js';

export default class FinaleBoss extends EventEmitter {
    constructor() {
        super();  // EventEmitter 생성자 호출
        this.hp = 99999999;
        this.armor = 0;
        this.speed = 1;
        this.playerDamage = {};  // 각 플레이어가 가한 데미지를 저장
    }

    // 보스에게 가한 데미지를 기록
    trackDamage(playerId, damage) {
        if (!this.playerDamage[playerId]) {
            this.playerDamage[playerId] = 0;
        }
        this.playerDamage[playerId] += damage;
        console.log(`Player ${playerId} dealt ${damage} damage to the boss. Total: ${this.playerDamage[playerId]}`);
    }

    // 60초 후 보스가 패배자를 결정
    startFinale(socket, players) {
        console.log("Finale Boss battle begins! Players must defeat the boss in 60 seconds.");

        // 60초 타이머
        setTimeout(() => {
            // 가장 적은 데미지를 가한 플레이어 찾기
            let losingPlayer = null;
            let minDamage = Infinity;

            for (const playerId in this.playerDamage) {
                if (this.playerDamage[playerId] < minDamage) {
                    minDamage = this.playerDamage[playerId];
                    losingPlayer = playerId;
                }
            }

            // 결과 발표
            console.log(`Player ${losingPlayer} dealt the least damage: ${minDamage}. They lose.`);

            // 'finaleComplete' 이벤트 발생 - 패배자 정보 포함
            this.emit('finaleComplete', {
                loser: losingPlayer,
                damage: this.playerDamage
            });

            // 패배자에게 게임 오버 메시지 전송
            socket.emit('gameOver', { loser: losingPlayer, damage: this.playerDamage });

        }, 60000);
    }
}
