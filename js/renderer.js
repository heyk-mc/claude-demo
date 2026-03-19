// 渲染系统类
class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.gridSize = 20;
        this.gridCount = 30;

        // 渲染配置
        this.config = {
            showGrid: false,
            showFPS: false,
            showStats: false,
            backgroundColor: '#000000',
            gridColor: '#333333',
            textColor: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        };

        // 动画和特效
        this.animations = [];
        this.particles = [];
        this.lastTime = 0;

        this.init();
    }

    init() {
        // 设置Canvas上下文属性
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 启用图像平滑
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        console.log('渲染器初始化完成');
    }

    clear() {
        // 清除整个画布
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 添加背景特效
        this.drawBackgroundEffects();
    }

    drawBackgroundEffects() {
        // 绘制星空效果
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;

        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % this.width;
            const y = (i * 37) % this.height;
            const size = (i % 3 + 1) * 1.5;
            const opacity = (i % 5 + 1) / 10;

            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.fillRect(x, y, size, size);
        }

        this.ctx.restore();
    }

    drawGrid() {
        if (!this.config.showGrid) return;

        this.ctx.strokeStyle = this.config.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;

        for (let i = 0; i <= this.gridCount; i++) {
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.height);
            this.ctx.stroke();

            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.width, i * this.gridSize);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1;
    }

    drawSnake(snake) {
        if (!snake) return;

        const renderData = snake.getRenderData();
        if (!renderData || !renderData.body) return;

        if (!renderData.isAlive) {
            this.drawDeadSnake(renderData);
            return;
        }

        // 绘制蛇身
        renderData.body.forEach((segment, index) => {
            const isHead = index === 0;

            // 绘制蛇节
            this.ctx.save();
            this.ctx.translate(segment.x * this.gridSize + this.gridSize / 2, segment.y * this.gridSize + this.gridSize / 2);

            if (isHead) {
                this.drawSnakeHead(segment, renderData);
            } else {
                this.drawSnakeSegment(segment, index, renderData);
            }

            this.ctx.restore();
        });

        // 绘制蛇特效
        this.drawSnakeEffects(renderData.effects);
    }

    drawSnakeSegment(segment, index, renderData) {
        // 计算蛇节大小（身体逐渐变小）
        const size = this.gridSize * (0.8 - index * 0.02);
        const halfSize = size / 2;

        // 创建渐变效果
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(1, '#009900');

        // 绘制蛇节主体
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-halfSize, -halfSize, size, size);

        // 添加边框
        this.ctx.strokeStyle = '#004d00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-halfSize, -halfSize, size, size);

        // 添加纹理效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(-halfSize + 2, -halfSize + 2, size - 4, size / 3);
    }

    drawSnakeHead(segment, renderData) {
        const size = this.gridSize * 0.9;
        const halfSize = size / 2;

        // 创建头部渐变
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.7, '#00cc00');
        gradient.addColorStop(1, '#006600');

        // 绘制头部
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-halfSize, -halfSize, size, size);

        // 添加头部边框
        this.ctx.strokeStyle = '#004d00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-halfSize, -halfSize, size, size);

        // 绘制眼睛
        this.drawSnakeEyes(segment, renderData);
    }

    drawSnakeEyes(segment, renderData) {
        const eyeSize = this.gridSize * 0.15;
        const eyeOffset = this.gridSize * 0.25;

        // 根据方向确定眼睛位置
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

        switch (renderData.direction) {
            case 'up':
                leftEyeX = -eyeOffset;
                leftEyeY = -eyeOffset;
                rightEyeX = eyeOffset;
                rightEyeY = -eyeOffset;
                break;
            case 'down':
                leftEyeX = -eyeOffset;
                leftEyeY = eyeOffset;
                rightEyeX = eyeOffset;
                rightEyeY = eyeOffset;
                break;
            case 'left':
                leftEyeX = -eyeOffset;
                leftEyeY = -eyeOffset;
                rightEyeX = -eyeOffset;
                rightEyeY = eyeOffset;
                break;
            case 'right':
            default:
                leftEyeX = eyeOffset;
                leftEyeY = -eyeOffset;
                rightEyeX = eyeOffset;
                rightEyeY = eyeOffset;
                break;
        }

        // 绘制眼睛
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(leftEyeX - eyeSize / 2, leftEyeY - eyeSize / 2, eyeSize, eyeSize);
        this.ctx.fillRect(rightEyeX - eyeSize / 2, rightEyeY - eyeSize / 2, eyeSize, eyeSize);

        // 添加高光
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(leftEyeX - eyeSize / 4, leftEyeY - eyeSize / 4, eyeSize / 4, eyeSize / 4);
        this.ctx.fillRect(rightEyeX - eyeSize / 4, rightEyeY - eyeSize / 4, eyeSize / 4, eyeSize / 4);
    }

    drawDeadSnake(renderData) {
        // 绘制死亡特效
        renderData.body.forEach((segment, index) => {
            const opacity = 1 - (index / renderData.body.length) * 0.5;
            const size = this.gridSize * 0.6;

            this.ctx.save();
            this.ctx.translate(segment.x * this.gridSize + this.gridSize / 2, segment.y * this.gridSize + this.gridSize / 2);
            this.ctx.globalAlpha = opacity;

            this.ctx.fillStyle = '#666666';
            this.ctx.fillRect(-size / 2, -size / 2, size, size);

            this.ctx.restore();
        });

        // 绘制爆炸特效
        this.drawSnakeEffects(renderData.effects);
    }

    drawSnakeEffects(effects) {
        if (!effects || effects.length === 0) return;

        effects.forEach(effect => {
            this.ctx.save();
            this.ctx.translate(effect.x * this.gridSize + this.gridSize / 2, effect.y * this.gridSize + this.gridSize / 2);

            switch (effect.type) {
                case 'trail':
                    this.drawTrailEffect(effect);
                    break;
                case 'explosion':
                    this.drawExplosionEffect(effect);
                    break;
            }

            this.ctx.restore();
        });
    }

    drawTrailEffect(effect) {
        const opacity = effect.life / effect.maxLife;
        const size = this.gridSize * 0.3 * opacity;

        this.ctx.globalAlpha = opacity * 0.5;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(-size / 2, -size / 2, size, size);
    }

    drawExplosionEffect(effect) {
        const progress = 1 - (effect.life / effect.maxLife);
        const size = effect.maxSize * progress;
        const opacity = effect.life / effect.maxLife;

        this.ctx.globalAlpha = opacity;
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-size / 2, -size / 2, size, size);

        // 绘制爆炸碎片
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const fragmentSize = size * 0.3;
            const fragmentX = Math.cos(angle) * size * 0.5;
            const fragmentY = Math.sin(angle) * size * 0.5;

            this.ctx.fillStyle = `rgba(255, 107, 107, ${opacity * 0.8})`;
            this.ctx.fillRect(fragmentX - fragmentSize / 2, fragmentY - fragmentSize / 2, fragmentSize, fragmentSize);
        }
    }

    drawFood(foods) {
        if (!foods || foods.length === 0) return;

        foods.forEach(food => {
            if (food.isEffect) return; // 跳过特效

            this.ctx.save();
            this.ctx.translate(food.x * this.gridSize + this.gridSize / 2, food.y * this.gridSize + this.gridSize / 2);

            // 绘制食物
            const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.9; // 呼吸效果
            const size = food.size * pulse;

            // 创建食物渐变
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
            gradient.addColorStop(0, food.color);
            gradient.addColorStop(1, this.adjustColor(food.color, -30));

            // 绘制食物主体
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(-size / 2, -size / 2, size, size);

            // 添加边框
            this.ctx.strokeStyle = this.adjustColor(food.color, 20);
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-size / 2, -size / 2, size, size);

            // 添加高光
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(-size / 2 + 2, -size / 2 + 2, size / 3, size / 3);

            this.ctx.restore();

            // 绘制食物特效
            this.drawFoodEffects(food);
        });
    }

    drawFoodEffects(food) {
        if (!food.effects || food.effects.length === 0) return;

        food.effects.forEach(effect => {
            this.ctx.save();
            this.ctx.translate(food.x * this.gridSize + this.gridSize / 2, food.y * this.gridSize + this.gridSize / 2);

            switch (effect.type) {
                case 'flicker':
                    this.drawFlickerEffect(effect);
                    break;
                case 'spawn':
                    this.drawSpawnEffect(effect);
                    break;
                case 'disappear':
                    this.drawFoodDisappearEffect(effect);
                    break;
            }

            this.ctx.restore();
        });
    }

    drawFlickerEffect(effect) {
        const opacity = effect.life / effect.maxLife;
        const size = this.gridSize * 1.2;

        this.ctx.globalAlpha = opacity * 0.5;
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-size / 2, -size / 2, size, size);
    }

    drawSpawnEffect(effect) {
        const progress = 1 - (effect.life / effect.maxLife);
        const size = effect.maxSize * progress;
        const opacity = 1 - progress;

        this.ctx.globalAlpha = opacity;
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-size / 2, -size / 2, size, size);
    }

    drawFoodDisappearEffect(effect) {
        const progress = 1 - (effect.life / effect.maxLife);
        const size = effect.maxSize * progress;
        const opacity = effect.life / effect.maxLife;

        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-size / 2, -size / 2, size, size);
    }

    drawObstacles(obstacles) {
        if (!obstacles || obstacles.length === 0) return;

        obstacles.forEach(obstacle => {
            if (obstacle.isEffect) return; // 跳过特效

            this.ctx.save();
            this.ctx.translate(obstacle.x * this.gridSize + this.gridSize / 2, obstacle.y * this.gridSize + this.gridSize / 2);

            const width = (obstacle.width || 1) * this.gridSize * 0.9;
            const height = (obstacle.height || 1) * this.gridSize * 0.9;

            // 创建障碍物渐变
            const gradient = this.ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, obstacle.color);
            gradient.addColorStop(1, this.adjustColor(obstacle.color, -20));

            // 绘制障碍物
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(-width / 2, -height / 2, width, height);

            // 添加边框
            this.ctx.strokeStyle = this.adjustColor(obstacle.color, 10);
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-width / 2, -height / 2, width, height);

            // 添加纹理
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(-width / 2 + 2, -height / 2 + 2, width - 4, height / 4);

            this.ctx.restore();

            // 绘制障碍物特效
            this.drawObstacleEffects(obstacle);
        });
    }

    drawObstacleEffects(obstacle) {
        if (!obstacle.effects || obstacle.effects.length === 0) return;

        obstacle.effects.forEach(effect => {
            this.ctx.save();
            this.ctx.translate(obstacle.x * this.gridSize + this.gridSize / 2, obstacle.y * this.gridSize + this.gridSize / 2);

            switch (effect.type) {
                case 'disappear':
                    this.drawObstacleDisappearEffect(effect);
                    break;
            }

            this.ctx.restore();
        });
    }

    drawObstacleDisappearEffect(effect) {
        const progress = 1 - (effect.life / effect.maxLife);
        const size = effect.maxSize * progress;
        const opacity = effect.life / effect.maxLife;

        this.ctx.globalAlpha = opacity;
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-size / 2, -size / 2, size, size);
    }

    drawEffects(effects) {
        if (!effects || effects.length === 0) return;

        effects.forEach(effect => {
            this.ctx.save();
            this.ctx.translate(effect.x * this.gridSize + this.gridSize / 2, effect.y * this.gridSize + this.gridSize / 2);

            switch (effect.type) {
                case 'score':
                    this.drawScoreEffect(effect);
                    break;
                case 'level':
                    this.drawLevelEffect(effect);
                    break;
            }

            this.ctx.restore();
        });
    }

    drawScoreEffect(effect) {
        const progress = 1 - (effect.life / effect.maxLife);
        const opacity = effect.life / effect.maxLife;
        const offsetY = -progress * 50;

        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`+${effect.points}`, 0, offsetY);
    }

    drawLevelEffect(effect) {
        const progress = 1 - (effect.life / effect.maxLife);
        const opacity = effect.life / effect.maxLife;
        const offsetY = -progress * 30;

        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`Level ${effect.level}`, 0, offsetY);
    }

    drawUI(score, level, highScore) {
        // 绘制UI元素
        this.drawScore(score, highScore);
        this.drawLevel(level);
        this.drawFPS();
    }

    drawScore(score, highScore) {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        const margin = 20;
        const lineHeight = 25;

        this.ctx.fillText(`分数: ${score}`, margin, margin);
        this.ctx.fillText(`最高分: ${highScore}`, margin, margin + lineHeight);

        this.ctx.restore();
    }

    drawLevel(level) {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';

        const margin = 20;
        const lineHeight = 25;

        this.ctx.fillText(`关卡: ${level}`, this.width - margin, margin);

        this.ctx.restore();
    }

    drawFPS() {
        if (!this.config.showFPS) return;

        const currentTime = performance.now();
        const fps = Math.round(1000 / (currentTime - (this.lastTime || currentTime)));
        this.lastTime = currentTime;

        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';

        this.ctx.fillText(`FPS: ${fps}`, this.width - 10, this.height - 10);

        this.ctx.restore();
    }

    // 工具方法
    adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255))
                .toString(16).slice(1)}`;
    }

    // 设置渲染配置
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }

    // 获取渲染器状态
    getState() {
        return {
            config: { ...this.config },
            animations: this.animations.length,
            particles: this.particles.length
        };
    }

    // 导出渲染器供其他模块使用
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Renderer;
    }
}