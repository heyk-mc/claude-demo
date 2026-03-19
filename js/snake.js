// 贪吃蛇类
class Snake {
    constructor() {
        this.body = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.speed = 5;
        this.gridSize = 20;
        this.gridCount = 30;
        this.growthPending = 0;
        this.isAlive = true;
        this.effects = [];
        this.moveCooldown = 0;
        this.baseMoveDelay = 100; // 基础移动延迟（毫秒）
    }

    init(gridSize, gridCount) {
        this.gridSize = gridSize;
        this.gridCount = gridCount;
        this.reset();
    }

    reset() {
        // 初始化蛇身（3节）
        const startX = Math.floor(this.gridCount / 4);
        const startY = Math.floor(this.gridCount / 2);

        this.body = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.direction = 'right';
        this.nextDirection = 'right';
        this.growthPending = 0;
        this.isAlive = true;
        this.effects = [];
        this.moveCooldown = 0;
        this.updateMoveDelay();
    }

    setSpeed(speed) {
        this.speed = speed;
        this.updateMoveDelay();
    }

    updateMoveDelay() {
        // 根据速度计算移动延迟
        // 速度越大，延迟越小
        const minDelay = 50; // 最小延迟
        const maxDelay = 200; // 最大延迟
        const speedFactor = Math.max(1, Math.min(20, this.speed));
        this.baseMoveDelay = maxDelay - (speedFactor - 1) * ((maxDelay - minDelay) / 19);
    }

    update() {
        if (!this.isAlive) return;

        // 更新移动冷却时间
        this.moveCooldown += 16; // 假设60FPS，每帧16ms

        if (this.moveCooldown >= this.baseMoveDelay) {
            this.move();
            this.moveCooldown = 0;
        }

        // 更新特效
        this.updateEffects();
    }

    move() {
        // 应用下一个方向
        this.direction = this.nextDirection;

        // 获取蛇头位置
        const head = { ...this.body[0] };

        // 根据方向移动蛇头
        switch (this.direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }

        // 添加新蛇头
        this.body.unshift(head);

        // 如果需要增长，则不移除尾部
        if (this.growthPending > 0) {
            this.growthPending--;
        } else {
            // 移除尾部
            this.body.pop();
        }

        // 创建移动特效
        this.createMoveEffect();
    }

    setDirection(newDirection) {
        // 防止立即反向移动
        const opposite = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposite[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
            return true;
        }

        return false;
    }

    getHead() {
        return this.body[0];
    }

    grow(amount = 1) {
        this.growthPending += amount;
    }

    checkSelfCollision(head = null) {
        if (!head) {
            head = this.getHead();
        }

        // 检查蛇头是否与身体其他部分碰撞
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }

        return false;
    }

    checkCollision(point) {
        // 检查点是否与蛇身碰撞
        return this.body.some(segment => segment.x === point.x && segment.y === point.y);
    }

    getBounds() {
        // 获取蛇的边界框
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.body.forEach(segment => {
            minX = Math.min(minX, segment.x);
            minY = Math.min(minY, segment.y);
            maxX = Math.max(maxX, segment.x);
            maxY = Math.max(maxY, segment.y);
        });

        return {
            minX, minY, maxX, maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }

    createMoveEffect() {
        // 创建移动特效（尾迹效果）
        if (this.body.length > 3) {
            const tail = this.body[this.body.length - 1];
            this.effects.push({
                type: 'trail',
                x: tail.x,
                y: tail.y,
                life: 10,
                maxLife: 10
            });
        }
    }

    updateEffects() {
        // 更新特效
        this.effects = this.effects.filter(effect => {
            effect.life--;
            return effect.life > 0;
        });
    }

    die() {
        this.isAlive = false;
        this.createDeathEffect();
    }

    createDeathEffect() {
        // 创建死亡特效
        this.effects = [];
        this.body.forEach((segment, index) => {
            this.effects.push({
                type: 'explosion',
                x: segment.x,
                y: segment.y,
                life: 30,
                maxLife: 30,
                size: 0,
                maxSize: this.gridSize
            });
        });
    }

    // 获取蛇的渲染数据
    getRenderData() {
        return {
            body: this.body,
            direction: this.direction,
            speed: this.speed,
            length: this.body.length,
            effects: this.effects,
            gridSize: this.gridSize,
            isAlive: this.isAlive
        };
    }

    // 导出蛇的状态（用于调试）
    getState() {
        return {
            alive: this.isAlive,
            length: this.body.length,
            direction: this.direction,
            speed: this.speed,
            head: this.getHead(),
            bounds: this.getBounds(),
            effectsCount: this.effects.length
        };
    }
}

// 输入处理类
class InputHandler {
    constructor() {
        this.keys = {};
        this.keyDownCallbacks = {};
        this.keyUpCallbacks = {};
        this.preventDefaultKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
        this.inputBuffer = [];
        this.maxBufferSize = 10;

        this.init();
    }

    init() {
        // 绑定键盘事件
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // 移动端触摸事件
        this.initTouchControls();
    }

    handleKeyDown(e) {
        const key = e.key;
        this.keys[key] = true;

        // 阻止默认行为（如页面滚动）
        if (this.preventDefaultKeys.includes(key)) {
            e.preventDefault();
        }

        // 执行按键回调
        if (this.keyDownCallbacks[key]) {
            this.keyDownCallbacks[key].forEach(callback => callback(e));
        }

        // 添加输入到缓冲区
        this.addToBuffer({
            type: 'keydown',
            key: key,
            timestamp: Date.now()
        });
    }

    handleKeyUp(e) {
        const key = e.key;
        this.keys[key] = false;

        // 执行按键回调
        if (this.keyUpCallbacks[key]) {
            this.keyUpCallbacks[key].forEach(callback => callback(e));
        }

        // 添加输入到缓冲区
        this.addToBuffer({
            type: 'keyup',
            key: key,
            timestamp: Date.now()
        });
    }

    addToBuffer(input) {
        this.inputBuffer.push(input);
        if (this.inputBuffer.length > this.maxBufferSize) {
            this.inputBuffer.shift();
        }
    }

    isKeyDown(key) {
        return this.keys[key] || false;
    }

    isKeyUp(key) {
        return !this.keys[key];
    }

    onKeyDown(key, callback) {
        if (!this.keyDownCallbacks[key]) {
            this.keyDownCallbacks[key] = [];
        }
        this.keyDownCallbacks[key].push(callback);
    }

    onKeyUp(key, callback) {
        if (!this.keyUpCallbacks[key]) {
            this.keyUpCallbacks[key] = [];
        }
        this.keyUpCallbacks[key].push(callback);
    }

    update() {
        // 处理输入缓冲区
        while (this.inputBuffer.length > 0) {
            const input = this.inputBuffer.shift();
            this.processInput(input);
        }
    }

    processInput(input) {
        // 处理输入逻辑
        switch (input.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.emitDirectionChange('up');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.emitDirectionChange('down');
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.emitDirectionChange('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.emitDirectionChange('right');
                break;
            case ' ':
                if (input.type === 'keydown') {
                    this.emitPauseToggle();
                }
                break;
        }
    }

    emitDirectionChange(direction) {
        const event = new CustomEvent('directionChange', {
            detail: { direction: direction }
        });
        window.dispatchEvent(event);
    }

    emitPauseToggle() {
        const event = new CustomEvent('pauseToggle');
        window.dispatchEvent(event);
    }

    initTouchControls() {
        // 移动端控制
        const mobileControls = document.getElementById('mobileControls');
        if (!mobileControls) return;

        const dirButtons = mobileControls.querySelectorAll('.dir-btn');
        dirButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const direction = btn.dataset.dir;
                if (direction) {
                    this.emitDirectionChange(direction);
                }
            });
        });
    }

    // 获取当前输入状态
    getInputState() {
        return {
            keys: { ...this.keys },
            bufferSize: this.inputBuffer.length
        };
    }

    // 清除所有按键状态
    clear() {
        this.keys = {};
        this.inputBuffer = [];
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Snake, InputHandler };
}