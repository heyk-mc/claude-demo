// 障碍物系统类
class ObstacleSystem {
    constructor() {
        this.obstacles = [];
        this.gridCount = 30;
        this.maxObstacles = 5;
        this.obstacleIdCounter = 0;
        this.level = 1;
        this.obstacleConfigs = {
            1: { count: 3, patterns: ['random'] },
            2: { count: 5, patterns: ['random', 'line'] },
            3: { count: 7, patterns: ['random', 'line', 'corner'] },
            4: { count: 9, patterns: ['random', 'line', 'corner', 'wall'] },
            5: { count: 12, patterns: ['random', 'line', 'corner', 'wall', 'maze'] }
        };
        this.activePatterns = ['random'];
        this.spawnTimer = 0;
        this.spawnInterval = 5000; // 5秒
    }

    init(gridCount, enabled = true) {
        this.gridCount = gridCount;
        this.enabled = enabled;
        this.reset();
    }

    reset() {
        this.obstacles = [];
        this.obstacleIdCounter = 0;
        this.level = 1;
        this.spawnTimer = 0;
        this.activePatterns = ['random'];
    }

    update() {
        if (!this.enabled) return;

        const currentTime = Date.now();
        this.spawnTimer += currentTime - (this.lastSpawnTime || currentTime);
        this.lastSpawnTime = currentTime;

        // 检查是否需要生成新障碍物
        if (this.spawnTimer >= this.spawnInterval) {
            this.generateObstacles();
            this.spawnTimer = 0;
        }

        // 更新障碍物状态
        this.updateObstacles();
    }

    updateObstacles() {
        // 移除过期的障碍物
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.expirationTime) {
                const timeLeft = obstacle.expirationTime - Date.now();
                if (timeLeft <= 0) {
                    // 障碍物过期
                    return false;
                }
                obstacle.timeLeft = timeLeft;
            }

            // 更新障碍物特效
            if (obstacle.effects) {
                obstacle.effects = obstacle.effects.filter(effect => {
                    effect.life--;
                    return effect.life > 0;
                });
            }

            return true;
        });
    }

    generateObstacles(level = null) {
        if (!this.enabled) return;

        if (level !== null) {
            this.level = level;
        }

        // 获取当前关卡的配置
        const config = this.getObstacleConfig(this.level);
        if (!config) return;

        // 确定要生成的障碍物数量
        const targetCount = Math.min(config.count, this.maxObstacles);
        const obstaclesToGenerate = targetCount - this.obstacles.length;

        if (obstaclesToGenerate <= 0) return;

        // 选择障碍物种模式
        const patterns = config.patterns;
        const obstacles = [];

        for (let i = 0; i < obstaclesToGenerate; i++) {
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            const obstacle = this.createObstacle(pattern);
            if (obstacle) {
                obstacles.push(obstacle);
            }
        }

        // 添加障碍物
        this.obstacles.push(...obstacles);

        console.log(`生成了${obstacles.length}个障碍物，当前关卡：${this.level}`);
    }

    getObstacleConfig(level) {
        // 获取关卡配置，如果没有精确匹配，返回最高可用配置
        const exactConfig = this.obstacleConfigs[level];
        if (exactConfig) return exactConfig;

        // 查找可用的配置
        const availableLevels = Object.keys(this.obstacleConfigs).map(Number).sort((a, b) => a - b);
        for (let i = availableLevels.length - 1; i >= 0; i--) {
            if (level >= availableLevels[i]) {
                return this.obstacleConfigs[availableLevels[i]];
            }
        }

        return this.obstacleConfigs[1]; // 默认返回第一关配置
    }

    createObstacle(pattern) {
        switch (pattern) {
            case 'random':
                return this.createRandomObstacle();
            case 'line':
                return this.createLineObstacle();
            case 'corner':
                return this.createCornerObstacle();
            case 'wall':
                return this.createWallObstacle();
            case 'maze':
                return this.createMazeObstacle();
            default:
                return this.createRandomObstacle();
        }
    }

    createRandomObstacle() {
        const position = this.getRandomValidPosition();
        if (!position) return null;

        return {
            id: this.obstacleIdCounter++,
            type: 'block',
            pattern: 'random',
            x: position.x,
            y: position.y,
            width: 1,
            height: 1,
            color: '#868e96',
            durability: 1,
            effects: [],
            creationTime: Date.now(),
            expirationTime: this.getObstacleDuration()
        };
    }

    createLineObstacle() {
        const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const length = Math.floor(Math.random() * 3) + 2; // 2-4个方块
        const obstacles = [];

        for (let i = 0; i < length; i++) {
            const position = this.getRandomValidPosition();
            if (!position) continue;

            obstacles.push({
                id: this.obstacleIdCounter++,
                type: 'line',
                pattern: 'line',
                x: orientation === 'horizontal' ? position.x + i : position.x,
                y: orientation === 'vertical' ? position.y + i : position.y,
                width: 1,
                height: 1,
                color: '#495057',
                durability: 2,
                effects: [],
                creationTime: Date.now(),
                expirationTime: this.getObstacleDuration()
            });
        }

        // 返回第一个障碍物，其他添加到列表中
        if (obstacles.length > 0) {
            const mainObstacle = obstacles[0];
            obstacles.splice(1).forEach(obs => this.obstacles.push(obs));
            return mainObstacle;
        }

        return null;
    }

    createCornerObstacle() {
        const position = this.getRandomValidPosition();
        if (!position) return null;

        const obstacles = [];
        const cornerSize = 2;

        // 创建角形障碍物
        for (let x = 0; x < cornerSize; x++) {
            for (let y = 0; y < cornerSize; y++) {
                if ((x === 0 && y === cornerSize - 1) || (x === cornerSize - 1 && y === 0)) {
                    continue; // 跳过两个对角
                }

                obstacles.push({
                    id: this.obstacleIdCounter++,
                    type: 'corner',
                    pattern: 'corner',
                    x: position.x + x,
                    y: position.y + y,
                    width: 1,
                    height: 1,
                    color: '#343a40',
                    durability: 2,
                    effects: [],
                    creationTime: Date.now(),
                    expirationTime: this.getObstacleDuration()
                });
            }
        }

        // 返回第一个障碍物
        if (obstacles.length > 0) {
            const mainObstacle = obstacles[0];
            obstacles.splice(1).forEach(obs => this.obstacles.push(obs));
            return mainObstacle;
        }

        return null;
    }

    createWallObstacle() {
        const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const wallLength = Math.floor(Math.random() * 4) + 3; // 3-6个方块
        const obstacles = [];

        for (let i = 0; i < wallLength; i++) {
            const position = this.getRandomValidPosition();
            if (!position) continue;

            // 确保墙的连续性
            const wallPos = orientation === 'horizontal' ?
                { x: position.x + i, y: position.y } :
                { x: position.x, y: position.y + i };

            obstacles.push({
                id: this.obstacleIdCounter++,
                type: 'wall',
                pattern: 'wall',
                x: wallPos.x,
                y: wallPos.y,
                width: 1,
                height: 1,
                color: '#212529',
                durability: 3,
                effects: [],
                creationTime: Date.now(),
                expirationTime: this.getObstacleDuration()
            });
        }

        // 返回第一个障碍物
        if (obstacles.length > 0) {
            const mainObstacle = obstacles[0];
            obstacles.splice(1).forEach(obs => this.obstacles.push(obs));
            return mainObstacle;
        }

        return null;
    }

    createMazeObstacle() {
        // 创建迷宫障碍物（更复杂的结构）
        const mazeSize = 3;
        const obstacles = [];
        const mazePattern = this.generateMazePattern(mazeSize);

        for (let x = 0; x < mazeSize; x++) {
            for (let y = 0; y < mazeSize; y++) {
                if (mazePattern[x][y]) {
                    const position = this.getRandomValidPosition();
                    if (!position) continue;

                    obstacles.push({
                        id: this.obstacleIdCounter++,
                        type: 'maze',
                        pattern: 'maze',
                        x: position.x + x,
                        y: position.y + y,
                        width: 1,
                        height: 1,
                        color: '#121416',
                        durability: 3,
                        effects: [],
                        creationTime: Date.now(),
                        expirationTime: this.getObstacleDuration()
                    });
                }
            }
        }

        // 返回第一个障碍物
        if (obstacles.length > 0) {
            const mainObstacle = obstacles[0];
            obstacles.splice(1).forEach(obs => this.obstacles.push(obs));
            return mainObstacle;
        }

        return null;
    }

    generateMazePattern(size) {
        // 简单的迷宫生成算法
        const pattern = Array(size).fill(null).map(() => Array(size).fill(false));
        const walls = Math.floor(size * size * 0.6); // 60% 的格子是墙

        // 随机放置墙
        let wallCount = 0;
        while (wallCount < walls) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            if (!pattern[x][y] && !(x === 0 && y === 0) && !(x === size - 1 && y === size - 1)) {
                pattern[x][y] = true;
                wallCount++;
            }
        }

        // 确保有通路
        pattern[0][0] = false;
        pattern[size - 1][size - 1] = false;

        return pattern;
    }

    getRandomValidPosition() {
        const maxAttempts = 100;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.gridCount);
            const y = Math.floor(Math.random() * this.gridCount);

            if (this.isValidObstaclePosition(x, y)) {
                return { x, y };
            }

            attempts++;
        }

        return null;
    }

    isValidObstaclePosition(x, y) {
        // 检查是否在现有障碍物上
        const onExistingObstacle = this.obstacles.some(obs => {
            if (obs.width && obs.height) {
                // 检查矩形区域
                return x >= obs.x && x < obs.x + obs.width &&
                       y >= obs.y && y < obs.y + obs.height;
            }
            return obs.x === x && obs.y === y;
        });

        if (onExistingObstacle) return false;

        // 检查边界
        const margin = 3; // 边缘留白
        if (x < margin || x >= this.gridCount - margin ||
            y < margin || y >= this.gridCount - margin) {
            return false;
        }

        return true;
    }

    getObstacleDuration() {
        // 障碍物持续时间（5-10秒）
        return Date.now() + (5000 + Math.random() * 5000);
    }

    checkCollision(position) {
        return this.obstacles.some(obstacle => {
            if (obstacle.width && obstacle.height) {
                // 检查矩形区域碰撞
                return position.x >= obstacle.x && position.x < obstacle.x + obstacle.width &&
                       position.y >= obstacle.y && position.y < obstacle.y + obstacle.height;
            }
            return obstacle.x === position.x && obstacle.y === position.y;
        });
    }

    checkCollisionWithRect(rect) {
        // 检查矩形与障碍物的碰撞
        for (const obstacle of this.obstacles) {
            if (this.checkRectCollision(rect, obstacle)) {
                return true;
            }
        }
        return false;
    }

    checkRectCollision(rect1, rect2) {
        // AABB碰撞检测
        return rect1.x < rect2.x + (rect2.width || 1) &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + (rect2.height || 1) &&
               rect1.y + rect1.height > rect2.y;
    }

    removeObstacle(obstacleId) {
        const index = this.obstacles.findIndex(obs => obs.id === obstacleId);
        if (index !== -1) {
            const obstacle = this.obstacles[index];
            this.obstacles.splice(index, 1);

            // 创建消失特效
            this.createObstacleDisappearEffect(obstacle);
            return true;
        }
        return false;
    }

    createObstacleDisappearEffect(obstacle) {
        // 创建障碍物消失特效
        this.obstacles.push({
            id: this.obstacleIdCounter++,
            type: 'effect',
            isEffect: true,
            x: obstacle.x,
            y: obstacle.y,
            width: obstacle.width || 1,
            height: obstacle.height || 1,
            effects: [{
                type: 'disappear',
                life: 20,
                maxLife: 20,
                size: this.gridSize * 0.8,
                maxSize: this.gridSize * 1.5
            }]
        });
    }

    setLevel(level) {
        this.level = level;
        this.generateObstacles();
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.obstacles = [];
        }
    }

    setMaxObstacles(max) {
        this.maxObstacles = max;
    }

    setSpawnInterval(interval) {
        this.spawnInterval = interval;
    }

    getAllObstacles() {
        return [...this.obstacles];
    }

    // 获取障碍物系统状态
    getState() {
        return {
            enabled: this.enabled,
            level: this.level,
            obstacleCount: this.obstacles.length,
            maxObstacles: this.maxObstacles,
            activePatterns: [...this.activePatterns],
            obstacles: this.obstacles.map(obs => ({
                id: obs.id,
                type: obs.type,
                pattern: obs.pattern,
                position: { x: obs.x, y: obs.y },
                durability: obs.durability,
                timeLeft: obs.timeLeft || null
            }))
        };
    }

    // 清理所有障碍物
    clearAllObstacles() {
        this.obstacles = [];
        this.obstacleIdCounter = 0;
        this.spawnTimer = 0;
    }
}

// 导出ObstacleSystem供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObstacleSystem;
}