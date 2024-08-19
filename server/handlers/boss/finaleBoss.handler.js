import EventEmitter from 'events';
import { PacketType } from '../../constants.js';

export default class FinaleBoss extends EventEmitter {
    constructor(socket) {
        super();  // EventEmitter 생성자 호출
        this.hp = 99999999;
        this.armor = 0;
        this.speed = 1;
        this.playerDamage = {};  
        this.socket = socket;
    }

    trackDamage(playerId, damage) {
        if (!this.playerDamage[playerId]) {
            this.playerDamage[playerId] = 0;
        }
        this.playerDamage[playerId] += damage;
        console.log(`Player ${playerId} dealt ${damage} damage to the boss. Total: ${this.playerDamage[playerId]}`);
    }

    startFinale(players) {
        console.log("Finale Boss battle begins! Players must defeat the boss in 60 seconds.");

        setTimeout(() => {
            let losingPlayer = null;
            let minDamage = Infinity;

            for (const playerId in this.playerDamage) {
                if (this.playerDamage[playerId] < minDamage) {
                    minDamage = this.playerDamage[playerId];
                    losingPlayer = playerId;
                }
            }

            console.log(`Player ${losingPlayer} dealt the least damage: ${minDamage}. They lose.`);

            this.emit('finaleComplete', {
                loser: losingPlayer,
                damage: this.playerDamage
            });

            this.socket.emit('gameOver', { loser: losingPlayer, damage: this.playerDamage });

        }, 60000);
    }
}
