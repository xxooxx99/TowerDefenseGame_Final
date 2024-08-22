import { Monster } from './monster.js';  // Import the Monster class
import { BossSkills } from './bossSkills.js';  // Import boss skills logic

// Extend the Boss class from Monster
class Boss extends Monster {
    constructor(path, hp, defense, speed, skills, towers, bgm = null, skillSounds = null, imagePath = null) {
        // Call the parent class (Monster) constructor with inherited parameters
        super(path, imagePath ? [imagePath] : [], 0, 1);  // Pass basic monster params

        // Additional properties specific to the boss
        this.hp = hp;
        this.maxHp = hp;
        this.defense = defense;
        this.speed = speed;
        this.skills = skills;
        this.towers = towers;
        this.bgm = bgm;
        this.skillSounds = skillSounds;
        this.bossSkills = new BossSkills(this, this.towers);  // Removed socket

        // Handle boss-specific attributes like monster index and UI
        this.monsterIndex = null;

        // Ensure valid path
        if (!path || !Array.isArray(path) || path.length === 0) {
            throw new Error('Boss requires a valid movement path.');
        }

        // Boss-specific positioning
        this.path = path;
        this.currentPathIndex = 0;
        this.x = this.path[0].x;
        this.y = this.path[0].y;
        this.width = 100;
        this.height = 100;

        // Load boss image
        if (imagePath) {
            this.image = new Image();
            this.image.src = imagePath;
        } else {
            console.error("Error: imagePath is not defined.");
        }

        // Preload UI elements for boss
        this.hpElement = document.getElementById(`${this.constructor.name}-hp`);
        this.skillElement = document.getElementById('boss-skill');
    }

    // Boss-specific skill logic
    startSkills() {
        setInterval(() => {
            const randomSkill = this.skills[Math.floor(Math.random() * this.skills.length)];
            this.bossSkills.useSkill(randomSkill);  // Use a random skill every 10 seconds
        }, 10000);
    }

    // Override the draw method if necessary
    draw(ctx) {
        if (!this.image) return;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    // Inherit the move method, and extend if needed
    move() {
        super.move();  // Call the move logic from Monster class
    }

    // Initialize boss (now without socket-related listeners)
    init() {
        this.playBGM();  // Start background music
    }

    // Boss-specific method to handle background music
    playBGM() {
        if (this.bgm) {
            this.bgmAudio = new Audio(this.bgm);
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.1;
            this.bgmAudio.preload = 'auto';
            this.bgmAudio.play();
        }
    }

    // Boss-specific method to stop the background music
    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }

    // Update boss UI (HP and current skill)
    updateUI(skill = null) {
        if (this.hpElement) {
            this.hpElement.textContent = `HP: ${this.hp}`;
        }

        if (this.skillElement && skill) {
            this.skillElement.textContent = `Current Skill: ${skill}`;
        }
    }

    // Boss death logic
    onDie() {
        this.isBossAlive = false;
        this.stopBGM();  // Stop background music on death
    }
}

// Extend other boss classes from the new Boss class
class MightyBoss extends Boss {
    constructor(path, towers, bgm, skillSounds) {
        super(path, 2000, 50, 0.6, ['healSkill', 'spawnClone', 'reduceDamage'], towers, bgm, skillSounds, './images/MightyBoss.png');
    }
}

class TowerControlBoss extends Boss {
    constructor(path, towers, bgm, skillSounds) {
        super(path, 1500, 30, 1.5, ['ignoreTowerDamage', 'changeTowerType', 'downgradeTower'], towers, bgm, skillSounds, './images/TowerControlBoss.png');
    }
}

class TimeRifter extends Boss {
    constructor(path, towers, bgm, skillSounds) {
        super(path, 1000, 20, 2.0, ['rewindHealth', 'accelerateTime', 'timeWave'], towers, bgm, skillSounds, './images/TimeRifter.png');
    }
}

class DoomsdayBoss extends Boss {
    constructor(path, towers, bgm, skillSounds) {
        super(path, 3000, 60, 0.8, ['placeMark', 'cryOfDoom', 'absorbDamage'], towers, bgm, skillSounds, './images/DoomsdayBoss.png');
    }
}

class FinaleBoss extends Boss {
    constructor(path, bgm) {
        super(path, 99999999, 0, 1, [], null, bgm, './images/Finaleboss.png');
    }
}

export { Boss, MightyBoss, TowerControlBoss, DoomsdayBoss, TimeRifter, FinaleBoss };
