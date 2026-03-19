// 游戏主入口文件
class Game {
    constructor() {
        this.gameEngine = null;
        this.storageManager = new StorageManager();
        this.loadingScreen = document.getElementById('loadingScreen');
        this.menuScreen = document.getElementById('menuScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.settingsScreen = document.getElementById('settingsScreen');
        this.instructionsScreen = document.getElementById('instructionsScreen');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.gameOverScreen = document.getElementById('gameOver');

        this.init();
    }

    async init() {
        // 显示加载界面
        this.showLoading();

        // 初始化存储系统
        await this.storageManager.init();

        // 加载资源
        await this.loadResources();

        // 隐藏加载界面，显示主菜单
        this.hideLoading();
        this.showMenu();

        // 绑定事件监听器
        this.bindEvents();
    }

    showLoading() {
        this.loadingScreen.style.display = 'flex';
    }

    hideLoading() {
        this.loadingScreen.style.display = 'none';
    }

    showMenu() {
        this.menuScreen.style.display = 'flex';
        this.updateHighScoreDisplay();
    }

    hideMenu() {
        this.menuScreen.style.display = 'none';
    }

    showGame() {
        this.gameScreen.style.display = 'block';
    }

    hideGame() {
        this.gameScreen.style.display = 'none';
    }

    showSettings() {
        this.menuScreen.style.display = 'none';
        this.settingsScreen.style.display = 'flex';
        this.setupSettings();
    }

    hideSettings() {
        this.settingsScreen.style.display = 'none';
    }

    showInstructions() {
        this.menuScreen.style.display = 'none';
        this.instructionsScreen.style.display = 'flex';
    }

    hideInstructions() {
        this.instructionsScreen.style.display = 'none';
    }

    showPause() {
        this.pauseOverlay.style.display = 'flex';
    }

    hidePause() {
        this.pauseOverlay.style.display = 'none';
    }

    showGameOver() {
        this.gameOverScreen.style.display = 'flex';
    }

    hideGameOver() {
        this.gameOverScreen.style.display = 'none';
    }

    updateHighScoreDisplay() {
        const highScore = this.storageManager.getHighScore();
        document.getElementById('menuHighScore').textContent = highScore;
        document.getElementById('highScore').textContent = highScore;
    }

    setupSettings() {
        const settings = this.storageManager.getSettings();
        document.getElementById('difficultySelect').value = settings.difficulty;
        document.getElementById('speedSlider').value = settings.speed;
        document.getElementById('speedValue').textContent = settings.speed;
        document.getElementById('soundToggle').checked = settings.soundEnabled;
        document.getElementById('obstacleToggle').checked = settings.obstaclesEnabled;

        // 绑定设置事件
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            document.getElementById('speedValue').textContent = e.target.value;
        });
    }

    saveSettings() {
        const settings = {
            difficulty: document.getElementById('difficultySelect').value,
            speed: parseInt(document.getElementById('speedSlider').value),
            soundEnabled: document.getElementById('soundToggle').checked,
            obstaclesEnabled: document.getElementById('obstacleToggle').checked
        };
        this.storageManager.saveSettings(settings);
    }

    bindEvents() {
        // 菜单按钮事件
        window.startGame = () => this.startGame();
        window.showSettings = () => this.showSettings();
        window.showInstructions = () => this.showInstructions();
        window.backToMenu = () => this.backToMenu();

        // 游戏控制事件
        window.togglePause = () => this.togglePause();
        window.resumeGame = () => this.resumeGame();
        window.restartGame = () => this.restartGame();
    }

    async startGame() {
        this.hideMenu();
        this.showGame();

        // 保存设置
        this.saveSettings();

        // 初始化游戏引擎
        if (!this.gameEngine) {
            this.gameEngine = new GameEngine();
        }

        // 开始游戏
        const settings = this.storageManager.getSettings();
        await this.gameEngine.start(settings);
    }

    backToMenu() {
        // 停止当前游戏
        if (this.gameEngine) {
            this.gameEngine.stop();
        }

        // 隐藏所有游戏界面
        this.hideGame();
        this.hideSettings();
        this.hideInstructions();
        this.hidePause();
        this.hideGameOver();

        // 显示主菜单
        this.showMenu();
    }

    togglePause() {
        if (this.gameEngine) {
            this.gameEngine.togglePause();
            if (this.gameEngine.isPaused) {
                this.showPause();
            } else {
                this.hidePause();
            }
        }
    }

    resumeGame() {
        this.hidePause();
        if (this.gameEngine) {
            this.gameEngine.resume();
        }
    }

    restartGame() {
        this.hideGameOver();
        this.startGame();
    }

    showGameOver(finalScore, level, isNewRecord) {
        this.showGameOver();
        document.getElementById('finalScore').textContent = finalScore;
        document.getElementById('finalLevel').textContent = level;

        const newRecordElement = document.getElementById('newRecord');
        if (isNewRecord) {
            newRecordElement.style.display = 'block';
        } else {
            newRecordElement.style.display = 'none';
        }
    }

    async loadResources() {
        // 模拟资源加载
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('资源加载完成');
                resolve();
            }, 1000);
        });
    }
}

// 当DOM加载完成时初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});