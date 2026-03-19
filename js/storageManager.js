// 本地存储管理系统
class StorageManager {
    constructor() {
        this.storageKey = 'snakeGame';
        this.defaultSettings = {
            difficulty: 'medium',
            speed: 5,
            soundEnabled: true,
            obstaclesEnabled: true
        };
    }

    async init() {
        // 初始化存储系统
        try {
            // 检查localStorage是否可用
            if (!this.isLocalStorageAvailable()) {
                console.warn('localStorage不可用，使用内存存储');
            }
        } catch (error) {
            console.error('StorageManager初始化失败:', error);
        }
    }

    isLocalStorageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    getGameData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('读取游戏数据失败:', error);
            return {};
        }
    }

    saveGameData(data) {
        try {
            const existingData = this.getGameData();
            const mergedData = { ...existingData, ...data };
            localStorage.setItem(this.storageKey, JSON.stringify(mergedData));
        } catch (error) {
            console.error('保存游戏数据失败:', error);
        }
    }

    getHighScore() {
        const data = this.getGameData();
        return data.highScore || 0;
    }

    saveHighScore(score) {
        const currentHighScore = this.getHighScore();
        if (score > currentHighScore) {
            this.saveGameData({ highScore: score });
            return true; // 新纪录
        }
        return false; // 不是新纪录
    }

    getSettings() {
        const data = this.getGameData();
        return { ...this.defaultSettings, ...data.settings };
    }

    saveSettings(settings) {
        this.saveGameData({ settings });
    }

    getGameStats() {
        const data = this.getGameData();
        return {
            totalGames: data.totalGames || 0,
            totalScore: data.totalScore || 0,
            averageScore: data.averageScore || 0,
            bestLevel: data.bestLevel || 0,
            ...data.stats
        };
    }

    updateGameStats(score, level) {
        const stats = this.getGameStats();
        const totalGames = (stats.totalGames || 0) + 1;
        const totalScore = (stats.totalScore || 0) + score;
        const averageScore = Math.round(totalScore / totalGames);
        const bestLevel = Math.max(stats.bestLevel || 0, level);

        this.saveGameData({
            stats: {
                totalGames,
                totalScore,
                averageScore,
                bestLevel
            }
        });
    }

    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('所有游戏数据已清除');
        } catch (error) {
            console.error('清除游戏数据失败:', error);
        }
    }

    exportData() {
        const data = this.getGameData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `snake-game-data-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.saveGameData(data);
                    resolve(data);
                } catch (error) {
                    reject(new Error('无效的数据文件'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    // 获取游戏历史记录
    getGameHistory(limit = 10) {
        const data = this.getGameData();
        const history = data.gameHistory || [];
        return history.slice(0, limit);
    }

    // 添加游戏记录
    addGameRecord(score, level, duration) {
        const history = this.getGameHistory();
        const record = {
            score,
            level,
            duration,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString()
        };
        history.unshift(record);

        // 限制历史记录数量
        const maxRecords = 50;
        if (history.length > maxRecords) {
            history.splice(maxRecords);
        }

        this.saveGameData({ gameHistory: history });
    }

    // 获取成就数据
    getAchievements() {
        const data = this.getGameData();
        return {
            firstGame: data.firstGame || false,
            first100Points: data.first100Points || false,
            first500Points: data.first500Points || false,
            first1000Points: data.first1000Points || false,
            level5: data.level5 || false,
            level10: data.level10 || false,
            level20: data.level20 || false,
            speedMaster: data.speedMaster || false,
            obstacleMaster: data.obstacleMaster || false,
            ...data.achievements
        };
    }

    // 更新成就
    updateAchievements(score, level, speed, obstaclesCleared) {
        const achievements = this.getAchievements();
        const newAchievements = { ...achievements };

        // 首次游戏
        if (!newAchievements.firstGame) {
            newAchievements.firstGame = true;
        }

        // 分数成就
        if (score >= 100 && !newAchievements.first100Points) {
            newAchievements.first100Points = true;
        }
        if (score >= 500 && !newAchievements.first500Points) {
            newAchievements.first500Points = true;
        }
        if (score >= 1000 && !newAchievements.first1000Points) {
            newAchievements.first1000Points = true;
        }

        // 关卡成就
        if (level >= 5 && !newAchievements.level5) {
            newAchievements.level5 = true;
        }
        if (level >= 10 && !newAchievements.level10) {
            newAchievements.level10 = true;
        }
        if (level >= 20 && !newAchievements.level20) {
            newAchievements.level20 = true;
        }

        // 速度成就
        if (speed >= 10 && !newAchievements.speedMaster) {
            newAchievements.speedMaster = true;
        }

        // 障碍物成就
        if (obstaclesCleared >= 5 && !newAchievements.obstacleMaster) {
            newAchievements.obstacleMaster = true;
        }

        // 保存成就
        const changed = JSON.stringify(achievements) !== JSON.stringify(newAchievements);
        if (changed) {
            this.saveGameData({ achievements: newAchievements });
        }

        return {
            newAchievements: newAchievements,
            changed
        };
    }
}