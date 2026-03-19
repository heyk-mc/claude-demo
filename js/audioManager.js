// 音频管理系统类
class AudioManager {
    constructor() {
        this.enabled = true;
        this.sounds = {};
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.musicPlaying = false;
        this.currentMusic = null;
        this.audioContext = null;
        this.isInitialized = false;

        // 音效文件路径
        this.soundPaths = {
            eat: 'assets/sounds/eat.mp3',
            collision: 'assets/sounds/collision.mp3',
            gameover: 'assets/sounds/gameover.mp3',
            levelup: 'assets/sounds/levelup.mp3',
            pause: 'assets/sounds/pause.mp3',
            move: 'assets/sounds/move.mp3'
        };

        // 背景音乐路径
        this.musicPaths = {
            menu: 'assets/music/menu.mp3',
            game: 'assets/music/game.mp3'
        };

        this.init();
    }

    init() {
        // 创建音频上下文
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.isInitialized = true;
            console.log('音频系统初始化成功');
        } catch (error) {
            console.warn('音频系统初始化失败:', error);
            this.isInitialized = false;
        }

        // 检查Web Audio API支持
        if (!this.isInitialized) {
            console.warn('Web Audio API 不支持，音频功能将不可用');
            return;
        }

        // 创建增益节点
        this.masterGain = this.audioContext.createGain();
        this.musicGain = this.audioContext.createGain();
        this.sfxGain = this.audioContext.createGain();

        // 连接音频节点
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);

        // 设置音量
        this.musicGain.gain.value = this.musicVolume;
        this.sfxGain.gain.value = this.sfxVolume;

        // 加载音效
        this.loadSounds();
    }

    async loadSounds() {
        if (!this.isInitialized) return;

        // 使用Howler.js作为备用方案
        if (typeof Howl !== 'undefined') {
            this.loadSoundsWithHowler();
        } else {
            this.loadSoundsWithWebAudio();
        }
    }

    loadSoundsWithHowler() {
        // 使用Howler.js加载音效
        for (const [name, path] of Object.entries(this.soundPaths)) {
            this.sounds[name] = new Howl({
                src: [path],
                volume: this.sfxVolume,
                onloaderror: (id, error) => {
                    console.warn(`音效 ${name} 加载失败:`, error);
                }
            });
        }

        console.log('使用Howler.js加载音效');
    }

    async loadSoundsWithWebAudio() {
        // 使用Web Audio API加载音效
        for (const [name, path] of Object.entries(this.soundPaths)) {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.sounds[name] = audioBuffer;
                console.log(`音效 ${name} 加载成功`);
            } catch (error) {
                console.warn(`音效 ${name} 加载失败:`, error);
                // 创建占位音效
                this.sounds[name] = this.createPlaceholderSound();
            }
        }
    }

    createPlaceholderSound() {
        // 创建占位音效（简单的振荡）
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / sampleRate;
            channelData[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 10);
        }

        return buffer;
    }

    playSound(soundName, volume = null) {
        if (!this.enabled || !this.isInitialized) return;

        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`音效 ${soundName} 不存在`);
            return;
        }

        // 使用Howler.js播放
        if (sound instanceof Howl) {
            sound.volume(volume !== null ? volume : this.sfxVolume);
            sound.play();
            return;
        }

        // 使用Web Audio API播放
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = sound;

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = volume !== null ? volume : this.sfxVolume;

            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            source.start();

            // 清理
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.error(`播放音效 ${soundName} 失败:`, error);
        }
    }

    playBackgroundMusic(musicName = 'game') {
        if (!this.enabled || !this.isInitialized) return;

        // 停止当前音乐
        this.stopBackgroundMusic();

        // 检查Howler.js
        if (typeof Howl !== 'undefined' && this.musicPaths[musicName]) {
            this.currentMusic = new Howl({
                src: [this.musicPaths[musicName]],
                volume: this.musicVolume,
                loop: true,
                onloaderror: (id, error) => {
                    console.warn(`背景音乐 ${musicName} 加载失败:`, error);
                }
            });
            this.currentMusic.play();
            this.musicPlaying = true;
            return;
        }

        // 创建简单的背景音乐（占位）
        this.createAndPlaySimpleMusic(musicName);
    }

    createAndPlaySimpleMusic(musicName) {
        // 创建简单的占位背景音乐
        const tempo = musicName === 'menu' ? 120 : 140;
        const beatDuration = 60 / tempo;
        const measureDuration = beatDuration * 4;

        // 创建音乐序列
        this.musicSequence = {
            tempo: tempo,
            measureDuration: measureDuration,
            startTime: this.audioContext.currentTime,
            playing: true
        };

        this.playSimpleMelody();
    }

    playSimpleMelody() {
        if (!this.musicSequence || !this.musicSequence.playing) return;

        const now = this.audioContext.currentTime;
        const elapsed = now - this.musicSequence.startTime;
        const measurePosition = (elapsed % this.musicSequence.measureDuration) / this.musicSequence.measureDuration;

        // 简单的旋律模式
        const notes = [
            { frequency: 440, duration: 0.2 }, // A4
            { frequency: 494, duration: 0.2 }, // B4
            { frequency: 523, duration: 0.2 }, // C5
            { frequency: 494, duration: 0.2 }  // B4
        ];

        const noteIndex = Math.floor(measurePosition * notes.length);
        const note = notes[noteIndex];

        if (note && Math.random() > 0.5) {
            this.playSimpleNote(note.frequency, note.duration);
        }

        // 继续播放
        setTimeout(() => this.playSimpleMelody(), note.duration * 1000);
    }

    playSimpleNote(frequency, duration) {
        if (!this.isInitialized) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.value = this.musicVolume * 0.1;

        oscillator.connect(gainNode);
        gainNode.connect(this.musicGain);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);

        // 清理
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, duration * 1000);
    }

    stopBackgroundMusic() {
        if (this.currentMusic && typeof this.currentMusic.stop === 'function') {
            this.currentMusic.stop();
        }

        if (this.musicSequence) {
            this.musicSequence.playing = false;
        }

        this.musicPlaying = false;
        this.currentMusic = null;
    }

    pauseBackgroundMusic() {
        if (this.currentMusic && typeof this.currentMusic.pause === 'function') {
            this.currentMusic.pause();
            this.musicPlaying = false;
        }

        if (this.musicSequence) {
            this.musicSequence.playing = false;
        }
    }

    resumeBackgroundMusic() {
        if (this.currentMusic && typeof this.currentMusic.play === 'function') {
            this.currentMusic.play();
            this.musicPlaying = true;
        }

        if (this.musicSequence) {
            this.musicSequence.playing = true;
            this.playSimpleMelody();
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.musicGain.gain.value = this.musicVolume;

        if (this.currentMusic && typeof this.currentMusic.volume === 'function') {
            this.currentMusic.volume(this.musicVolume);
        }
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sfxGain.gain.value = this.sfxVolume;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopBackgroundMusic();
        }
    }

    // 创建音效
    createSound(frequency, duration, type = 'sine', volume = 0.5) {
        if (!this.isInitialized) return null;

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.audioContext.sampleRate;
            channelData[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 10) * volume;
        }

        return buffer;
    }

    // 播放创建音效
    playCreatedSound(frequency, duration = 0.1, type = 'sine', volume = 0.5) {
        if (!this.isInitialized) return;

        const sound = this.createSound(frequency, duration, type, volume);
        if (sound) {
            const source = this.audioContext.createBufferSource();
            source.buffer = sound;
            source.connect(this.sfxGain);
            source.start();

            setTimeout(() => {
                source.disconnect();
            }, duration * 1000);
        }
    }

    // 获取音频系统状态
    getState() {
        return {
            enabled: this.enabled,
            initialized: this.isInitialized,
            musicPlaying: this.musicPlaying,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            soundsLoaded: Object.keys(this.sounds).length
        };
    }
}

// 导出AudioManager供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}