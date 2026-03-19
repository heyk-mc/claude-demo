// 食物系统类
class FoodSystem {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.gridSize = 20;
        this.gridCount = 30;
        this.foods = [];
        this.maxFoods = 3; // 同时存在的最大食物数量
        this.foodIdCounter = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 3000; // 生成食物的间隔（毫秒）
        this.lastSpawnTime = 0;
        this.specialFoodChance = 0.2; // 特殊食物生成概率
    }

    init(gridSize, gridCount) {
        this.gridSize = gridSize;
        this.gridCount = gridCount;
        this.reset();
    }

    reset() {
        this.foods = [];
        this.spawnTimer = 0;
        this.lastSpawnTime = 0;
        this.foodIdCounter = 0;

        // 初始生成一些食物
        this.generateFood();
    }

    update() {
        const currentTime = Date.now();

        // 更新食物计时器
        this.spawnTimer += currentTime - (this.lastSpawnTime || currentTime);
        this.lastSpawnTime = currentTime;

        // 检查是否需要生成新食物
        if (this.foods.length < this.maxFoods && this.spawnTimer >= this.spawnInterval) {
            this.generateFood();
            this.spawnTimer = 0;
        }

        // 更新食物状态
        this.updateFoods();
    }

    updateFoods() {
        const currentTime = Date.now();

        this.foods = this.foods.filter(food => {
            // 更新食物计时器
            if (food.expirationTime) {
                const timeLeft = food.expirationTime - currentTime;
                if (timeLeft <= 0) {
                    // 食物过期
                    return false;
                }
                food.timeLeft = timeLeft;
            }

            // 更新食物特效
            if (food.effects) {
                food.effects = food.effects.filter(effect => {
                    effect.life--;
                    return effect.life > 0;
                });
            }

            return true;
        });
    }

    generateFood(snakeBody = null, obstacles = null) {
        // 确定食物类型
        const foodType = this.determineFoodType();

        // 生成食物位置
        const position = this.generateValidPosition(snakeBody, obstacles);

        if (!position) {
            console.warn('无法生成有效的食物位置');
            return;
        }

        // 创建食物
        const food = {
            id: this.foodIdCounter++,
            x: position.x,
            y: position.y,
            type: foodType,
            value: this.getFoodValue(foodType),
            color: this.getFoodColor(foodType),
            size: this.gridSize * 0.8,
            effects: [],
            creationTime: Date.now()
        };

        // 为特殊食物设置过期时间
        if (foodType !== 'normal') {
            food.expirationTime = Date.now() + this.getFoodDuration(foodType);
            food.timeLeft = food.expirationTime - Date.now();

            // 添加闪烁特效
            this.addFlickerEffect(food);
        }

        // 添加生成特效
        this.addSpawnEffect(food);

        this.foods.push(food);

        console.log(`生成了${foodType}食物在 (${food.x}, ${food.y})`);
    }

    determineFoodType() {
        const random = Math.random();

        // 根据概率确定食物类型
        if (random < this.specialFoodChance * 0.3) {
            return 'golden'; // 30% 金色食物
        } else if (random < this.specialFoodChance) {
            return 'blue'; // 70% 蓝色食物
        } else {
            return 'normal'; // 正常食物
        }
    }

    generateValidPosition(snakeBody = null, obstacles = null) {
        const maxAttempts = 100; // 最大尝试次数
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.gridCount);
            const y = Math.floor(Math.random() * this.gridCount);

            // 检查位置是否有效
            if (this.isValidPosition(x, y, snakeBody, obstacles)) {
                return { x, y };
            }

            attempts++;
        }

        // 如果无法找到有效位置，返回null
        return null;
    }

    isValidPosition(x, y, snakeBody = null, obstacles = null) {
        // 检查是否在现有食物上
        const onExistingFood = this.foods.some(food => food.x === x && food.y === y);
        if (onExistingFood) return false;

        // 检查是否在蛇身上
        if (snakeBody && this.checkCollisionWithSnake({ x, y }, snakeBody)) {
            return false;
        }

        // 检查是否在障碍物上
        if (obstacles && this.checkCollisionWithObstacles({ x, y }, obstacles)) {
            return false;
        }

        return true;
    }

    checkCollisionWithSnake(position, snakeBody) {
        return snakeBody.some(segment => segment.x === position.x && segment.y === position.y);
    }

    checkCollisionWithObstacles(position, obstacles) {
        return obstacles.some(obstacle => obstacle.x === position.x && obstacle.y === position.y);
    }

    getFoodValue(type) {
        const values = {
            normal: 10,
            golden: 30,
            blue: 20
        };
        return values[type] || 10;
    }

    getFoodColor(type) {
        const colors = {
            normal: '#ff6b6b',
            golden: '#ffd700',
            blue: '#4dabf7'
        };
        return colors[type] || '#ff6b6b';
    }

    getFoodDuration(type) {
        const durations = {
            normal: null, // 永不过期
            golden: 10000, // 10秒
            blue: 15000 // 15秒
        };
        return durations[type] || null;
    }

    addFlickerEffect(food) {
        if (!food.effects) food.effects = [];

        // 创建闪烁特效
        food.flickerInterval = setInterval(() => {
            if (food.timeLeft <= 3000) {
                // 最后3秒快速闪烁
                food.effects.push({
                    type: 'flicker',
                    life: 2,
                    maxLife: 2
                });
            } else {
                // 正常闪烁
                food.effects.push({
                    type: 'flicker',
                    life: 5,
                    maxLife: 5
                });
            }
        }, 500);

        // 保存定时器引用
        food.flickerTimer = food.flickerInterval;
    }

    addSpawnEffect(food) {
        // 创建生成特效
        food.effects.push({
            type: 'spawn',
            life: 20,
            maxLife: 20,
            size: 0,
            maxSize: this.gridSize
        });
    }

    checkFoodCollision(snakeHead) {
        return this.foods.find(food => food.x === snakeHead.x && food.y === snakeHead.y);
    }

    removeFood(foodId) {
        const index = this.foods.findIndex(food => food.id === foodId);
        if (index !== -1) {
            // 清理特效定时器
            const food = this.foods[index];
            if (food.flickerInterval) {
                clearInterval(food.flickerInterval);
            }

            // 移除食物
            this.foods.splice(index, 1);

            // 创建消失特效
            this.createFoodDisappearEffect(food);
        }
    }

    createFoodDisappearEffect(food) {
        // 在被吃掉的食物位置创建特效
        this.foods.push({
            id: this.foodIdCounter++,
            x: food.x,
            y: food.y,
            type: 'effect',
            isEffect: true,
            effects: [{
                type: 'disappear',
                life: 15,
                maxLife: 15,
                size: food.size,
                maxSize: food.size * 2
            }]
        });
    }

    getFoodAt(position) {
        return this.foods.find(food => food.x === position.x && food.y === position.y);
    }

    clearFoodAt(position) {
        const index = this.foods.findIndex(food => food.x === position.x && food.y === position.y);
        if (index !== -1) {
            this.foods.splice(index, 1);
            return true;
        }
        return false;
    }

    getAllFoods() {
        return [...this.foods];
    }

    setMaxFoods(max) {
        this.maxFoods = max;
    }

    setSpawnInterval(interval) {
        this.spawnInterval = interval;
    }

    setSpecialFoodChance(chance) {
        this.specialFoodChance = Math.max(0, Math.min(1, chance));
    }

    // 获取食物系统状态
    getState() {
        return {
            foodCount: this.foods.length,
            maxFoods: this.maxFoods,
            spawnTimer: this.spawnTimer,
            spawnInterval: this.spawnInterval,
            specialFoodChance: this.specialFoodChance,
            foods: this.foods.map(food => ({
                id: food.id,
                type: food.type,
                position: { x: food.x, y: food.y },
                timeLeft: food.timeLeft || null
            }))
        };
    }

    // 清理所有食物
    clearAllFoods() {
        this.foods = [];
        this.spawnTimer = 0;
        this.lastSpawnTime = 0;
    }

    // 生成大量食物（用于特殊事件）
    generateBonusFoods(count = 5, snakeBody = null, obstacles = null) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.generateFood(snakeBody, obstacles);
            }, i * 200); // 每隔200ms生成一个
        }
    }
}

// 导出FoodSystem供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodSystem;
}