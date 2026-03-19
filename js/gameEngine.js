// 游戏引擎主类
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.storageManager = new StorageManager();
        this.inputHandler = new InputHandler();
        this.renderer = new Renderer(this.ctx, this.canvas);
        this.snake = null;
        this.foodSystem = null;
        this.obstacleSystem = null;
        this.audioManager = null;

        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;

        this.score = 0;
        this.level = 1;
        this.speed = 10;
        this.highScore = 0;

        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000 / 60; // 60 FPS

        this.settings = null;
        this.animationId = null;

        this.init();
    }

    init() {
        // 初始化各个系统
        this.snake = new Snake();
        this.foodSystem = new FoodSystem(this.canvas.width, this.canvas.height);
        this.obstacleSystem = new ObstacleSystem();
        this.audioManager = new AudioManager();

        // 绑定事件监听
        this.bindEvents();

        // 加载最高分
        this.highScore = this.storageManager.getHighScore();
        document.getElementById('highScore').textContent = this.highScore;
    }

    bindEvents() {
        // 监听游戏结束事件
        window.addEventListener('gameOver', (e) => {
            this.handleGameOver(e.detail.score, e.detail.level);
        });

        // 监听得分事件
        window.addEventListener('scoreUpdate', (e) => {
            this.updateScore(e.detail.score);
        });

        // 监听关卡更新事件
        window.addEventListener('levelUpdate', (e) => {
            this.updateLevel(e.detail.level);
        });
    }

    async start(settings) {
        // 应用游戏设置
        this.settings = settings;
        this.speed = settings.speed;

        // 重置游戏状态
        this.resetGameState();

        // 初始化游戏系统
        this.snake.init(this.getGridSize(), this.getGridCount());
        this.foodSystem.init(this.getGridSize(), this.getGridCount());
        this.obstacleSystem.init(this.getGridCount(), settings.obstaclesEnabled);

        // 开始游戏循环
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOver = false;

        // 更新UI
        this.updateUI();

        // 播放背景音乐
        if (this.settings.soundEnabled && this.audioManager) {
            this.audioManager.playBackgroundMusic();
        }

        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);

        console.log('游戏开始');
    }

    stop() {
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.audioManager) {
            this.audioManager.stopBackgroundMusic();
        }

        console.log('游戏停止');
    }

    togglePause() {
        if (!this.gameRunning || this.gameOver) return;

        this.gamePaused = !this.gamePaused;

        if (this.gamePaused) {
            this.stopAnimation();
            if (this.audioManager) {
                this.audioManager.pauseBackgroundMusic();
            }
        } else {
            this.resumeAnimation();
            if (this.audioManager) {
                this.audioManager.resumeBackgroundMusic();
            }
        }

        console.log(this.gamePaused ? '游戏暂停' : '游戏继续');
    }

    resume() {
        if (!this.gameRunning) return;
        this.gamePaused = false;
        this.resumeAnimation();
        if (this.audioManager) {
            this.audioManager.resumeBackgroundMusic();
        }
    }

    gameLoop(currentTime) {
        if (!this.gameRunning) {
            return;
        }

        // 计算时间差
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 累积时间，确保稳定的游戏逻辑更新
        this.accumulator += deltaTime;

        // 更新游戏逻辑（只有在非暂停状态）
        if (!this.gamePaused) {
            while (this.accumulator >= this.timestep) {
                this.update(this.timestep);
                this.accumulator -= this.timestep;
            }
        }

        // 渲染游戏画面
        this.render();

        // 继续游戏循环
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        if (!this.gameRunning || this.gamePaused) return;

        // 更新输入处理
        this.inputHandler.update();

        // 更新蛇的位置
        this.snake.update();

        // 获取蛇头位置
        const head = this.snake.getHead();

        // 检测碰撞
        this.checkCollisions(head);

        // 更新食物系统
        this.foodSystem.update();

        // 更新障碍物系统
        this.obstacleSystem.update();

        // 更新游戏速度
        this.updateSpeed();

        // 检查是否达到下一关条件
        this.checkLevelProgress();
    }

    render() {
        if (!this.gameRunning) return;

        // 清除画布
        this.renderer.clear();

        // 绘制背景
        this.renderer.drawBackground();

        // 绘制网格（可选）
        if (this.settings && this.settings.showGrid) {
            this.renderer.drawGrid();
        }

        // 绘制障碍物
        if (this.settings.obstaclesEnabled) {
            this.renderer.drawObstacles(this.obstacleSystem.obstacles);
        }

        // 绘制食物
        this.renderer.drawFood(this.foodSystem.foods);

        // 绘制蛇
        this.renderer.drawSnake(this.snake);

        // 绘制特殊效果
        this.renderer.drawEffects(this.getEffects());

        // 绘制UI
        this.renderer.drawUI(this.score, this.level, this.highScore);
    }

    checkCollisions(head) {
        if (!head) return;

        // 边界碰撞检测
        if (this.checkBoundaryCollision(head)) {
            this.handleCollision('boundary');
            return;
        }

        // 自碰撞检测
        if (this.checkSelfCollision(head)) {
            this.handleCollision('self');
            return;
        }

        // 障碍物碰撞检测
        if (this.settings.obstaclesEnabled && this.checkObstacleCollision(head)) {
            this.handleCollision('obstacle');
            return;
        }

        // 食物碰撞检测
        const food = this.foodSystem.checkFoodCollision(head);
        if (food) {
            this.handleFoodCollision(food);
        }
    }

    checkBoundaryCollision(head) {
        if (!head) return false;
        const gridCount = this.getGridCount();
        return head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount;
    }

    checkSelfCollision(head) {
        if (!this.snake) return false;
        return this.snake.checkSelfCollision(head);
    }

    checkObstacleCollision(head) {
        if (!this.obstacleSystem) return false;
        return this.obstacleSystem.checkCollision(head);
    }

    handleCollision(type) {
        // 播放音效
        if (this.settings.soundEnabled && this.audioManager) {
            this.audioManager.playSound('collision');
        }

        // 触发游戏结束事件
        const event = new CustomEvent('gameOver', {
            detail: {
                score: this.score,
                level: this.level,
                collisionType: type
            }
        });
        window.dispatchEvent(event);

        // 停止游戏
        this.stopGame();
    }

    handleFoodCollision(food) {
        // 根据食物类型计算得分
        let points = 0;
        switch (food.type) {
            case 'normal':
                points = 10;
                break;
            case 'golden':
                points = 30;
                break;
            case 'blue':
                points = 20;
                break;
        }

        // 增加分数
        this.score += points;

        // 触发得分更新事件
        const event = new CustomEvent('scoreUpdate', {
            detail: { score: this.score, points: points, foodType: food.type }
        });
        window.dispatchEvent(event);

        // 播放吃食物音效
        if (this.settings.soundEnabled && this.audioManager) {
            this.audioManager.playSound('eat');
        }

        // 让蛇增长
        this.snake.grow();

        // 移除被吃掉的食物
        this.foodSystem.removeFood(food.id);

        // 生成新的食物
        this.foodSystem.generateFood();
    }

    updateSpeed() {
        // 根据分数计算速度
        const baseSpeed = this.settings.speed;
        const speedIncrease = Math.floor(this.score / 100) * 0.5;
        const newSpeed = Math.min(baseSpeed + speedIncrease, 20);

        if (newSpeed !== this.speed) {
            this.speed = newSpeed;
            this.snake.setSpeed(this.speed);
        }
    }

    checkLevelProgress() {
        // 检查是否达到下一关条件（例如：每500分升一级）
        const requiredScore = this.level * 500;
        if (this.score >= requiredScore) {
            this.level++;

            // 触发关卡更新事件
            const event = new CustomEvent('levelUpdate', {
                detail: { level: this.level }
            });
            window.dispatchEvent(event);

            // 生成新的障碍物
            if (this.settings.obstaclesEnabled) {
                this.obstacleSystem.generateObstacles(this.level);
            }
        }
    }

    updateScore(newScore) {
        this.score = newScore;
        document.getElementById('score').textContent = this.score;

        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            document.getElementById('highScore').textContent = this.highScore;
            document.getElementById('menuHighScore').textContent = this.highScore;
        }
    }

    updateLevel(newLevel) {
        this.level = newLevel;
        document.getElementById('level').textContent = this.level;
    }

    getEffects() {
        // 返回当前游戏中的特效
        const effects = [];

        // 食物特效
        this.foodSystem.foods.forEach(food => {
            if (food.effect) {
                effects.push(food.effect);
            }
        });

        // 蛇的特效
        if (this.snake.effects) {
            effects.push(...this.snake.effects);
        }

        return effects;
    }

    resetGameState() {
        this.score = 0;
        this.level = 1;
        this.speed = this.settings ? this.settings.speed : 5;

        if (this.snake) {
            this.snake.reset();
        }

        if (this.foodSystem) {
            this.foodSystem.reset();
        }

        if (this.obstacleSystem) {
            this.obstacleSystem.reset();
        }
    }

    stopGame() {
        this.gameRunning = false;
        this.gameOver = true;

        this.stopAnimation();

        // 保存游戏统计
        if (this.storageManager) {
            const isNewRecord = this.storageManager.saveHighScore(this.score);
            this.storageManager.updateGameStats(this.score, this.level);
            this.storageManager.addGameRecord(this.score, this.level, this.getGameDuration());

            // 更新成就
            this.storageManager.updateAchievements(this.score, this.level, this.speed, 0);

            // 显示游戏结束界面
            if (window.game) {
                window.game.showGameOver(this.score, this.level, isNewRecord);
            }
        }
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resumeAnimation() {
        if (this.gameRunning && !this.animationId) {
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
        }
    }

    getGameDuration() {
        // 返回游戏时长（秒）
        return Math.floor((performance.now() - this.lastTime) / 1000);
    }

    getGridSize() {
        return this.canvas.width / this.getGridCount();
    }

    getGridCount() {
        // 根据画布大小和游戏难度确定网格数量
        const baseGridCount = 30; // 基础网格数量
        const difficultyMultiplier = {
            easy: 1,
            medium: 1.2,
            hard: 1.5,
            extreme: 2
        };

        const multiplier = difficultyMultiplier[this.settings.difficulty] || 1;
        return Math.floor(baseGridCount * multiplier);
    }

    updateUI() {
        // 更新游戏界面元素
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('highScore').textContent = this.highScore;
    }

    // 导出游戏状态（用于调试）
    getGameState() {
        return {
            running: this.gameRunning,
            paused: this.gamePaused,
            over: this.gameOver,
            score: this.score,
            level: this.level,
            speed: this.speed,
            highScore: this.highScore,
            snakeLength: this.snake ? this.snake.body.length : 0,
            foodCount: this.foodSystem ? this.foodSystem.foods.length : 0,
            obstacleCount: this.obstacleSystem ? this.obstacleSystem.obstacles.length : 0
        };
    }
}

// 导出GameEngine供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
}