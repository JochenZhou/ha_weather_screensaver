import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Settings, X, Save, Moon, AlertTriangle, PlayCircle } from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';
import { Capacitor } from '@capacitor/core';

// =================================================================================
// 🎨 Pro级 样式与动画定义 (Premium Visuals)
// =================================================================================
const WeatherStyles = () => (
    <style>{`
    /* --- 基础动画 --- */
    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    @keyframes rotate-slow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes float-cloud-slow {
      0% { transform: translateX(-20px); }
      50% { transform: translateX(20px); }
      100% { transform: translateX(-20px); }
    }
    @keyframes float-cloud-fast {
      0% { transform: translateX(-40px) scale(0.9); }
      50% { transform: translateX(40px) scale(1); }
      100% { transform: translateX(-40px) scale(0.9); }
    }
    
    /* --- 粒子系统：雨 --- */
    @keyframes rain-drop-far {
      0% { transform: translateY(-20vh) translateX(10px); }
      100% { transform: translateY(120vh) translateX(-10px); }
    }
    @keyframes rain-drop-near {
      0% { transform: translateY(-20vh) translateX(20px); }
      100% { transform: translateY(120vh) translateX(-20px); }
    }
    
    /* --- 粒子系统：雪 (优化版) --- */
    @keyframes snow-fall {
      0% { 
        transform: translateY(-20vh) translateX(0) rotate(0deg); 
        opacity: 0; 
      }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { 
        /* 使用 CSS 变量实现随机漂移 */
        transform: translateY(120vh) translateX(var(--sway, 20px)) rotate(360deg); 
        opacity: 0; 
      }
    }
    
    /* --- 天象：星空与流星 --- */
    @keyframes twinkle {
      0%, 100% { opacity: 0.2; transform: scale(0.8); }
      50% { opacity: 0.9; transform: scale(1.2); }
    }
    @keyframes meteor {
      0% { transform: translateX(300%) translateY(-300%) rotate(45deg); opacity: 1; }
      20% { opacity: 1; }
      100% { transform: translateX(-200%) translateY(200%) rotate(45deg); opacity: 0; }
    }

    /* --- 天象：雷暴 --- */
    @keyframes lightning-flash-screen {
      0%, 95%, 100% { opacity: 0; }
      96% { opacity: 0.3; }
      97% { opacity: 0; }
      98% { opacity: 0.6; background-color: rgba(255,255,255,0.8); }
      99% { opacity: 0.2; }
    }
    @keyframes lightning-cloud-glow {
      0%, 90%, 100% { filter: brightness(1); }
      92% { filter: brightness(1.5) drop-shadow(0 0 30px rgba(100,100,255,0.8)); }
      94% { filter: brightness(1.2); }
      96% { filter: brightness(2.5) drop-shadow(0 0 50px rgba(200,200,255,1)); }
    }

    /* --- 光效：太阳 --- */
    @keyframes sun-ray-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* --- 类名工具 --- */
    .pro-gradient-layer {
      position: absolute;
      inset: 0;
      transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .particle-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    /* 性能优化类 */
    .will-change-transform {
      will-change: transform;
    }

    /* 玻璃拟态卡片增强 */
    .glass-panel {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }

    /* --- 节日氛围动画 --- */
    @keyframes float-up {
      0% { transform: translateY(100vh) scale(0.8); opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { transform: translateY(-20vh) scale(1); opacity: 0; }
    }
    
    @keyframes float-heart {
      0% { transform: translateY(100vh) scale(0.5) rotate(0deg); opacity: 0; }
      10% { opacity: 0.8; }
      50% { transform: translateY(50vh) scale(1) rotate(10deg); }
      100% { transform: translateY(-20vh) scale(0.8) rotate(-10deg); opacity: 0; }
    }
  `}</style>
);

// =================================================================================
// 🌦️ 天气映射表
// =================================================================================
const CONDITION_CN_MAP = {
    'CLEAR_DAY': '晴',
    'CLEAR_NIGHT': '晴',
    'PARTLY_CLOUDY_DAY': '多云',
    'PARTLY_CLOUDY_NIGHT': '多云',
    'CLOUDY': '阴',
    'LIGHT_HAZE': '轻雾',
    'MODERATE_HAZE': '中雾',
    'HEAVY_HAZE': '大雾',
    'LIGHT_RAIN': '小雨',
    'MODERATE_RAIN': '中雨',
    'HEAVY_RAIN': '大雨',
    'STORM_RAIN': '暴雨',
    'FOG': '雾',
    'LIGHT_SNOW': '小雪',
    'MODERATE_SNOW': '中雪',
    'HEAVY_SNOW': '大雪',
    'STORM_SNOW': '暴雪',
    'DUST': '浮尘',
    'SAND': '沙尘',
    'THUNDER_SHOWER': '雷阵雨',
    'HAIL': '冰雹',
    'SLEET': '雨夹雪',
    'WIND': '大风',
    'HAZE': '雾霾',
    'RAIN': '雨',
    'SNOW': '雪',
};

// 和风天气图标代码映射到动画
const QWEATHER_ICON_MAP = {
    // 晴天
    '100': 'CLEAR_DAY', '150': 'CLEAR_NIGHT',
    // 多云/少云/晴间多云
    '101': 'PARTLY_CLOUDY_DAY', '102': 'PARTLY_CLOUDY_DAY', '103': 'PARTLY_CLOUDY_DAY',
    '151': 'PARTLY_CLOUDY_NIGHT', '152': 'PARTLY_CLOUDY_NIGHT', '153': 'PARTLY_CLOUDY_NIGHT',
    // 阴
    '104': 'CLOUDY',
    // 阵雨
    '300': 'LIGHT_RAIN', '350': 'LIGHT_RAIN',
    '301': 'MODERATE_RAIN', '351': 'MODERATE_RAIN',
    // 雷阵雨
    '302': 'THUNDER_SHOWER', '303': 'THUNDER_SHOWER', '304': 'HAIL',
    // 小雨
    '305': 'LIGHT_RAIN', '309': 'LIGHT_RAIN', '314': 'LIGHT_RAIN',
    // 中雨
    '306': 'MODERATE_RAIN', '315': 'MODERATE_RAIN',
    // 大雨
    '307': 'HEAVY_RAIN', '316': 'HEAVY_RAIN',
    // 暴雨
    '308': 'STORM_RAIN', '310': 'STORM_RAIN', '311': 'STORM_RAIN', '312': 'STORM_RAIN',
    '317': 'STORM_RAIN', '318': 'STORM_RAIN',
    // 冻雨/雨
    '313': 'SLEET', '399': 'RAIN',
    // 雪
    '400': 'LIGHT_SNOW', '408': 'LIGHT_SNOW',
    '401': 'MODERATE_SNOW', '409': 'MODERATE_SNOW',
    '402': 'HEAVY_SNOW', '410': 'HEAVY_SNOW',
    '403': 'STORM_SNOW',
    '404': 'SLEET', '405': 'SLEET', '406': 'SLEET', '456': 'SLEET',
    '407': 'LIGHT_SNOW', '457': 'LIGHT_SNOW',
    '499': 'SNOW',
    // 雾/霾
    '500': 'LIGHT_HAZE', '501': 'FOG', '509': 'HEAVY_HAZE', '510': 'HEAVY_HAZE', '514': 'HEAVY_HAZE', '515': 'HEAVY_HAZE',
    '502': 'HAZE', '511': 'MODERATE_HAZE', '512': 'HEAVY_HAZE', '513': 'HEAVY_HAZE',
    // 沙尘
    '503': 'SAND', '504': 'DUST', '507': 'SAND', '508': 'SAND',
    // 其他
    '900': 'CLEAR_DAY', '901': 'CLEAR_DAY', '999': 'CLOUDY'
};

// 状态标准化
// 状态标准化 - 保留强度前缀
const normalizeWeatherState = (haState) => {
    if (!haState) return 'CLEAR_DAY';
    const s = String(haState).toLowerCase().replace(/-/g, '_');

    // 优先匹配具体的强度
    if (s.includes('storm')) {
        if (s.includes('rain')) return 'STORM_RAIN';
        if (s.includes('snow')) return 'STORM_SNOW';
        return 'THUNDER_SHOWER';
    }
    if (s.includes('heavy')) {
        if (s.includes('rain')) return 'HEAVY_RAIN';
        if (s.includes('snow')) return 'HEAVY_SNOW';
    }
    if (s.includes('moderate')) {
        if (s.includes('rain')) return 'MODERATE_RAIN';
        if (s.includes('snow')) return 'MODERATE_SNOW';
    }
    if (s.includes('light')) {
        if (s.includes('rain')) return 'LIGHT_RAIN';
        if (s.includes('snow')) return 'LIGHT_SNOW';
    }

    // 通用匹配
    if (s.includes('thunder') || s.includes('lightning')) return 'THUNDER_SHOWER';
    if (s.includes('hail')) return 'HAIL';
    if (s.includes('sleet') || (s.includes('snow') && s.includes('rain'))) return 'SLEET';
    if (s.includes('snow')) return 'SNOW';
    if (s.includes('rain') || s.includes('pouring')) return 'RAIN';

    // 雾/霾分级
    if (s.includes('haze')) {
        if (s.includes('heavy')) return 'HEAVY_HAZE';
        if (s.includes('moderate')) return 'MODERATE_HAZE';
        if (s.includes('light')) return 'LIGHT_HAZE';
        return 'HAZE';
    }
    if (s.includes('fog')) {
        if (s.includes('heavy') || s.includes('dense')) return 'HEAVY_FOG'; // 大雾
        if (s.includes('moderate')) return 'MODERATE_FOG'; // 中雾
        if (s.includes('light')) return 'LIGHT_FOG'; // 轻雾
        return 'FOG';
    }

    if (s.includes('dust')) return 'DUST';
    if (s.includes('sand')) return 'SAND';
    if (s.includes('wind')) return 'WIND';
    if (s.includes('partly')) return s.includes('night') ? 'PARTLY_CLOUDY_NIGHT' : 'PARTLY_CLOUDY_DAY';
    if (s.includes('cloud') || s.includes('overcast')) return 'CLOUDY';
    if (s.includes('night') && s.includes('clear')) return 'CLEAR_NIGHT';
    if (s.includes('sunny') || s.includes('clear')) return 'CLEAR_DAY';

    return 'CLEAR_DAY';
};

// =================================================================================
// 1. 高级渐变背景 (Cinema Gradients) - 调暗版，适配白色文字
const WeatherBackground = ({ weatherKey, festival }) => {
    const getGradient = (key) => {
        switch (true) {
            case key === 'CLEAR_DAY':
                return 'bg-gradient-to-br from-blue-900 via-blue-700 to-blue-400';
            case key === 'CLEAR_NIGHT':
                return 'bg-gradient-to-br from-slate-900 via-blue-900 to-black';

            // 多云/阴天
            // 多云/阴天
            case key.includes('PARTLY'):
                return 'bg-gradient-to-br from-[#4B79A1] to-[#283E51]'; // 多云：深蓝到灰蓝，透出天空的感觉
            case key === 'CLOUDY':
                return 'bg-gradient-to-br from-[#232526] to-[#414345]';

            // 雨天分级
            case key === 'LIGHT_RAIN':
                return 'bg-gradient-to-b from-[#29323c] to-[#485563]';
            case key === 'MODERATE_RAIN':
                return 'bg-gradient-to-b from-[#141E30] to-[#243B55]';
            case key === 'HEAVY_RAIN':
                return 'bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364]';
            case key === 'STORM_RAIN' || key.includes('THUNDER'):
                return 'bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]';

            // 雪天分级
            case key === 'LIGHT_SNOW':
                return 'bg-gradient-to-b from-[#607D8B] to-[#90A4AE]'; // 较暗的蓝灰，提升文字对比度
            case key === 'MODERATE_SNOW':
                return 'bg-gradient-to-b from-[#274060] to-[#1B2838]';
            case key === 'HEAVY_SNOW' || key === 'STORM_SNOW':
                return 'bg-gradient-to-b from-[#16222A] to-[#3A6073]';
            case key === 'HAIL':
                return 'bg-gradient-to-b from-[#1e3c72] to-[#2a5298]'; // 冰雹冷色调
            case key === 'SLEET':
                return 'bg-gradient-to-b from-[#2c3e50] to-[#7f8c8d]'; // 雨夹雪：冷灰 (调暗底部以突显雪花)

            // 雾霾沙尘
            // 雾霾沙尘 - 细分
            case key === 'LIGHT_FOG' || key === 'LIGHT_HAZE':
                return 'bg-gradient-to-t from-[#5a626e] to-[#8E9EAB]'; // 较轻，偏亮
            case key === 'MODERATE_FOG' || key === 'MODERATE_HAZE' || key === 'FOG' || key === 'HAZE':
                return 'bg-gradient-to-t from-[#373B44] to-[#8E9EAB]'; // 标准雾色 - 去除绿色，改为蓝灰
            case key === 'HEAVY_FOG' || key === 'HEAVY_HAZE':
                return 'bg-gradient-to-t from-[#242424] to-[#5a626e]'; // 浓雾，深灰

            case key === 'DUST' || key === 'SAND':
                return 'bg-gradient-to-br from-[#3E5151] to-[#DECBA4]'; // 沙尘黄

            default:
                return 'bg-gradient-to-br from-blue-900 to-slate-200';
        }
    };

    // 2. 太阳/月亮与光效
    const renderCelestialBody = (key) => {
        if (key === 'CLEAR_DAY' || key === 'PARTLY_CLOUDY_DAY') {
            return (
                <div className="absolute top-[-15%] left-[-15%] w-[70%] h-[70%] z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-blue-300/20 blur-[80px] rounded-full animate-breathe"></div>
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.05)_360deg)] animate-[sun-ray-rotate_60s_linear_infinite] opacity-40"></div>
                </div>
            );
        }
        if (key === 'CLEAR_NIGHT' || key === 'PARTLY_CLOUDY_NIGHT') {
            return (
                <div className="absolute top-[10%] right-[15%] w-32 h-32 z-0 animate-[float-cloud-slow_20s_infinite_ease-in-out]">
                    {/* 黄色弯月：使用 radial-gradient 遮罩实现 */}
                    <div className="absolute inset-0 rounded-full" style={{
                        background: 'transparent',
                        boxShadow: 'inset -20px 10px 0 0 #fbbf24', // 内阴影形成弯月
                        transform: 'rotate(-15deg) scale(0.8)',
                        filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))'
                    }}></div>
                    {/* 额外的光晕 */}
                    <div className="absolute top-2 right-4 w-full h-full rounded-full bg-yellow-400/5 blur-[40px]"></div>
                </div>
            );
        }
        return null;
    };

    // 3. 星空系统 (Memoized)
    const stars = useMemo(() => {
        return Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 80}%`,
            size: Math.random() * 2 + 1,
            delay: Math.random() * 5,
            duration: Math.random() * 3 + 3
        }));
    }, []);

    const renderStars = (key) => {
        if (!key.includes('NIGHT')) return null;
        return (
            <div className="particle-container z-0">
                {stars.map((star) => (
                    <div
                        key={`star-${star.id}`}
                        className="absolute rounded-full bg-white shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                        style={{
                            top: star.top,
                            left: star.left,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animation: `twinkle ${star.duration}s infinite ease-in-out ${star.delay}s`
                        }}
                    />
                ))}
                <div className="absolute top-[20%] right-[-10%] w-[150px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent animate-[meteor_12s_infinite_ease-in] opacity-0" />
            </div>
        );
    };

    // 4. 云层系统 (Layered Clouds)
    const renderClouds = (key) => {
        if (key.includes('CLOUDY') || key.includes('PARTLY') || key.includes('THUNDER') || key.includes('RAIN') || key.includes('SNOW')) {
            const isStorm = key.includes('THUNDER');
            const cloudColor = isStorm ? 'bg-slate-800' : 'bg-white';
            const cloudOpacity = isStorm ? 'opacity-80' : 'opacity-20';
            const animationClass = isStorm ? 'lightning-cloud-glow' : '';

            return (
                <div className="particle-container z-10">
                    <div className={`absolute top-[10%] left-[-10%] w-[60%] h-[40%] ${cloudColor} ${cloudOpacity} rounded-full blur-[90px] animate-[float-cloud-slow_15s_infinite_ease-in-out] ${animationClass}`}></div>
                    <div className={`absolute top-[40%] right-[-20%] w-[70%] h-[50%] ${cloudColor} ${cloudOpacity} rounded-full blur-[70px] animate-[float-cloud-fast_12s_infinite_ease-in-out_reverse] ${animationClass}`}></div>
                    <div className={`absolute bottom-[-20%] left-[20%] w-[80%] h-[40%] ${cloudColor} ${cloudOpacity} rounded-full blur-[80px] animate-breathe ${animationClass}`}></div>
                </div>
            );
        }
        return null;
    };

    // 5. 降水系统 (Memoized Rain & Snow) - 支持强度
    const rainParticles = useMemo(() => {
        // 生成足够多的粒子，根据强度显示部分
        const far = Array.from({ length: 200 }).map((_, i) => ({ id: i, left: Math.random() * 100, top: Math.random() * -100, duration: Math.random() * 0.5 + 0.5 }));
        const near = Array.from({ length: 100 }).map((_, i) => ({ id: i, left: Math.random() * 100, top: Math.random() * -100, duration: Math.random() * 0.3 + 0.3 }));
        return { far, near };
    }, []);

    const snowParticles = useMemo(() => {
        return Array.from({ length: 150 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: Math.random() * 4 + 2,
            blur: Math.random() * 1.5,
            opacity: Math.random() * 0.5 + 0.5,
            duration: Math.random() * 5 + 5,
            delay: -(Math.random() * 10),
            sway: Math.random() * 60 - 30
        }));
    }, []);

    const renderPrecipitation = (key) => {
        // 确定降雨强度
        let rainCount = 0;
        let snowCount = 0;
        let rainDuration = 1.0; // 基础动画时长系数
        let rainAngle = 10;

        // 修复：包含 SNOW，确保雪天也能进入逻辑
        if (key.includes('RAIN') || key === 'SLEET' || key.includes('THUNDER') || key === 'HAIL' || key.includes('SNOW')) {
            if (key === 'LIGHT_RAIN') { rainCount = 30; rainDuration = 1.5; }
            else if (key === 'MODERATE_RAIN') { rainCount = 80; rainDuration = 1.0; }
            else if (key === 'HEAVY_RAIN') { rainCount = 150; rainDuration = 0.7; }
            else if (key === 'STORM_RAIN' || key.includes('THUNDER')) { rainCount = 200; rainDuration = 0.5; rainAngle = 25; }
            else if (key === 'HAIL') { rainCount = 80; rainDuration = 1.5; } // 冰雹：减慢速度(1.5x)，减少数量以提升流畅度
            else if (key === 'SLEET') { rainCount = 40; rainDuration = 1.0; } // 雨夹雪：雨部分

            if (key.includes('SNOW') || key === 'SLEET') {
                if (key === 'LIGHT_SNOW') snowCount = 20;
                else if (key === 'MODERATE_SNOW') snowCount = 60;
                else if (key === 'HEAVY_SNOW' || key === 'STORM_SNOW') snowCount = 120;
                else if (key === 'SLEET') snowCount = 30; // 雨夹雪：雪部分
                else snowCount = 50;
            }

            const elements = [];

            if (rainCount > 0) {
                elements.push(
                    <div key="rain" className="particle-container z-20">
                        {rainParticles.far.slice(0, rainCount).map((p) => (
                            <div
                                key={`rain-far-${p.id}`}
                                className={`absolute will-change-transform ${key === 'HAIL' ? 'bg-white/90 rounded-full' : 'bg-white/10'}`}
                                style={{
                                    width: key === 'HAIL' ? '5px' : '1px',
                                    height: key === 'HAIL' ? '5px' : '30px',
                                    left: `${p.left}%`,
                                    top: `${p.top}%`,
                                    animation: `rain-drop-far ${p.duration * rainDuration}s linear infinite`,
                                    transform: `rotate(${rainAngle}deg)`
                                }}
                            />
                        ))}
                        {rainParticles.near.slice(0, Math.floor(rainCount / 2)).map((p) => (
                            <div
                                key={`rain-near-${p.id}`}
                                className={`absolute will-change-transform ${key === 'HAIL' ? 'bg-white/95 rounded-full' : 'bg-white/20'}`}
                                style={{
                                    width: key === 'HAIL' ? '7px' : '2px',
                                    height: key === 'HAIL' ? '7px' : '50px',
                                    left: `${p.left}%`,
                                    top: `${p.top}%`,
                                    animation: `rain-drop-near ${p.duration * rainDuration}s linear infinite`,
                                    transform: `rotate(${rainAngle + 5}deg)`
                                }}
                            />
                        ))}
                    </div>
                );
            }

            if (snowCount > 0) {
                elements.push(
                    <div key="snow" className="particle-container z-20">
                        {snowParticles.slice(0, snowCount).map((p) => (
                            <div
                                key={`snow-${p.id}`}
                                className="absolute bg-white/80 rounded-full will-change-transform"
                                style={{
                                    width: `${p.size}px`,
                                    height: `${p.size}px`,
                                    left: `${p.left}%`,
                                    filter: `blur(${p.blur}px)`,
                                    opacity: p.opacity,
                                    '--sway': `${p.sway}px`,
                                    animation: `snow-fall ${p.duration}s linear infinite`,
                                    animationDelay: `${p.delay}s`
                                }}
                            />
                        ))}
                    </div>
                );
            }

            return elements.length > 0 ? <>{elements}</> : null;
        }
        return null;
    };

    // 6. 全屏雷电闪光
    const renderLightning = (key) => {
        if (key.includes('THUNDER')) {
            return (
                <div className="absolute inset-0 bg-white/0 z-30 pointer-events-none animate-[lightning-flash-screen_8s_infinite_ease-out]"></div>
            );
        }
        return null;
    };

    // 7. 雾气层 (新增)
    const renderFog = (key) => {
        if (key.includes('FOG') || key.includes('HAZE')) {
            let opacity = 'opacity-30';
            let animation = ''; // 禁用动画

            if (key.includes('HEAVY')) { opacity = 'opacity-80'; }
            else if (key.includes('MODERATE') || key === 'FOG' || key === 'HAZE') { opacity = 'opacity-50'; }

            return (
                <div className="particle-container z-20 pointer-events-none">
                    <div className={`absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-white/40 to-transparent ${opacity} ${animation}`}></div>
                    <div className={`absolute bottom-[-20%] left-[-20%] w-[140%] h-[50%] bg-white/30 blur-[60px] rounded-full ${opacity}`}></div>
                </div>
            );
        }
        return null;
    };

    // 8. 节日氛围系统 (新增 - 性能优化版)
    // 使用 useMemo 预生成粒子数据，避免每帧重计算
    const festivalParticles = useMemo(() => {
        const lanterns = Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            left: Math.random() * 80,
            size: Math.random() * 25 + 20, // 稍微缩小
            duration: Math.random() * 10 + 20,
            delay: Math.random() * 10,
            opacity: Math.random() * 0.3 + 0.6
        }));

        const hearts = Array.from({ length: 10 }).map((_, i) => ({
            id: i,
            left: Math.random() * 80,
            size: Math.random() * 15 + 10,
            duration: Math.random() * 8 + 12,
            delay: Math.random() * 10,
        }));

        const sparkles = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            left: Math.random() * 80,
            top: Math.random() * 40 + 60,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 3 + 2
        }));

        return { lanterns, hearts, sparkles };
    }, []);

    const renderFestivalAtmosphere = (fest) => {
        if (!fest) return null;

        // 容器样式：限制在左下角，并添加边缘羽化
        // 移除 overflow-hidden 以减少裁剪开销，如果不需要的话。这里保留以防粒子飞出。
        const containerClass = "absolute bottom-0 left-0 w-[45%] h-[60%] z-20 pointer-events-none overflow-hidden";

        // 优化 mask-image，使用更简单的渐变
        const maskStyle = {
            maskImage: 'radial-gradient(circle at bottom left, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at bottom left, black 40%, transparent 100%)'
        };

        // 春节/元宵/除夕/国庆 - 红灯笼/红光
        if (['春节', '元宵', '除夕', '国庆'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    {/* 底部暖红光晕 - 静态背景 */}
                    <div className="absolute bottom-0 left-0 w-[80%] h-[60%] bg-gradient-to-tr from-red-900/40 via-red-800/10 to-transparent blur-[50px]"></div>

                    {/* 漂浮灯笼 - 移除 expensive box-shadow */}
                    {festivalParticles.lanterns.map(l => (
                        <div
                            key={`lantern-${l.id}`}
                            className="absolute rounded-full bg-gradient-to-t from-orange-500 to-red-600 blur-[0.5px] will-change-transform"
                            style={{
                                left: `${l.left}%`,
                                width: `${l.size}px`,
                                height: `${l.size * 1.2}px`,
                                opacity: l.opacity,
                                animation: `float-up ${l.duration}s linear infinite`,
                                animationDelay: `-${l.delay}s`
                            }}
                        />
                    ))}
                </div>
            );
        }

        // 情人节/520 - 爱心
        if (['情人', '520', '七夕'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-pink-900/30 via-pink-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.hearts.map(h => (
                        <div
                            key={`heart-${h.id}`}
                            className="absolute text-pink-400/60 will-change-transform"
                            style={{
                                left: `${h.left}%`,
                                fontSize: `${h.size}px`,
                                animation: `float-heart ${h.duration}s linear infinite`,
                                animationDelay: `-${h.delay}s`
                            }}
                        >
                            ♥
                        </div>
                    ))}
                </div>
            );
        }

        // 圣诞/平安夜 - 金色/红色微光
        if (['圣诞', '平安'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-red-900/20 via-yellow-900/10 to-transparent blur-[40px]"></div>
                    {/* 底部金色光尘 */}
                    {festivalParticles.sparkles.map((s, i) => (
                        <div
                            key={`gold-${s.id}`}
                            className="absolute bg-yellow-200/40 rounded-full blur-[0.5px] will-change-transform"
                            style={{
                                left: `${s.left}%`,
                                top: `${s.top}%`,
                                width: `${s.size}px`,
                                height: `${s.size}px`,
                                animation: `twinkle ${s.duration}s infinite ease-in-out`
                            }}
                        />
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <div className={`pro-gradient-layer w-full h-full ${getGradient(weatherKey)}`}>
            {renderCelestialBody(weatherKey)}
            {renderStars(weatherKey)}
            {renderClouds(weatherKey)}
            {renderPrecipitation(weatherKey)}
            {renderLightning(weatherKey)}
            {renderFog(weatherKey)}
            {renderFestivalAtmosphere(festival)}
        </div>
    );
};

// =================================================================================
// 📱 主组件
// =================================================================================
const SmartDisplay = () => {
    // --- 状态管理 ---
    const [now, setNow] = useState(new Date());

    const [config, setConfig] = useState(() => {
        const saved = localStorage.getItem('smart_screen_config');
        return saved ? JSON.parse(saved) : {
            ha_url: "",
            ha_token: "",
            weather_entity: "weather.forecast_home",
            location_name: "北京市"
        };
    });

    const [editConfig, setEditConfig] = useState(config);
    const [showSettings, setShowSettings] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [demoMode, setDemoMode] = useState(() => localStorage.getItem('demo_mode') === 'true');
    const [demoState, setDemoState] = useState(() => localStorage.getItem('demo_state') || 'CLEAR_DAY');
    const [demoFestival, setDemoFestival] = useState(() => localStorage.getItem('demo_festival') || '');
    const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('config_server_url') || '');
    const [useRemoteConfig, setUseRemoteConfig] = useState(() => localStorage.getItem('use_remote_config') === 'true');
    const [deviceIP, setDeviceIP] = useState('');
    const [serverStatus, setServerStatus] = useState('');

    const [weather, setWeather] = useState({
        state: "sunny",
        mappedKey: "CLEAR_DAY",
        temperature: 6,
        attributes: {},
        friendlyName: ""
    });

    const isLunarReady = true;

    // --- 1. 时间更新 ---
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- 1.5. 获取局域网 IP 地址 ---
    useEffect(() => {
        // 直接使用 hostname，在 Vite 开发环境和 Android 应用中都可用
        const hostname = window.location.hostname;
        if (hostname && hostname !== 'localhost') {
            setDeviceIP(hostname);
            console.log('Using IP:', hostname);
        } else {
            // 如果是 localhost，尝试通过 WebRTC 获取
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            pc.createDataChannel('');

            pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                const match = ipRegex.exec(ice.candidate.candidate);
                if (match && match[1] !== '0.0.0.0') {
                    console.log('Detected IP:', match[1]);
                    setDeviceIP(match[1]);
                    pc.close();
                }
            };

            pc.createOffer().then(offer => pc.setLocalDescription(offer));
        }
    }, []);

    // --- 2. 演示模式天气更新 ---
    useEffect(() => {
        if (demoMode) {
            setWeather({
                state: demoState,
                mappedKey: normalizeWeatherState(demoState),
                temperature: 25,
                attributes: {}
            });
            setFetchError(null);
        }
    }, [demoMode, demoState]);

    // --- 3. 获取 Home Assistant 天气数据 ---
    useEffect(() => {
        if (demoMode) return;

        const fetchWeather = async () => {
            if (!config.ha_url || !config.ha_token) {
                setFetchError("请先配置 HA 地址和 Token");
                return;
            }

            const cleanUrl = config.ha_url.replace(/\/$/, '');

            if (window.location.protocol === 'https:' && cleanUrl.startsWith('http:')) {
                setFetchError("混合内容错误：无法在 HTTPS 页面中请求 HTTP 地址。");
                return;
            }

            try {
                const response = await fetch(`${cleanUrl}/api/states/${config.weather_entity}`, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${config.ha_token}`,
                        "Content-Type": "application/json",
                    },
                    mode: 'cors',
                });

                if (response.ok) {
                    const data = await response.json();
                    const attrs = data.attributes;
                    let weatherState, mappedKey, weatherText;

                    if (attrs.skycon) {
                        // 彩云天气
                        weatherState = attrs.skycon;
                        mappedKey = normalizeWeatherState(weatherState);
                    } else if (attrs.condition_cn && attrs.qweather_icon) {
                        // 和风天气
                        weatherState = attrs.condition_cn;
                        mappedKey = QWEATHER_ICON_MAP[String(attrs.qweather_icon)] || normalizeWeatherState(data.state);
                        weatherText = attrs.condition_cn;
                    } else {
                        // 默认
                        weatherState = data.state;
                        mappedKey = normalizeWeatherState(weatherState);
                    }

                    setWeather({
                        state: weatherState,
                        mappedKey: mappedKey,
                        temperature: attrs.temperature,
                        attributes: attrs,
                        friendlyName: attrs.friendly_name || "",
                        weatherText: weatherText
                    });
                    setFetchError(null);
                } else {
                    setFetchError(`请求失败: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                setFetchError("连接失败。请检查配置或尝试开启演示模式。");
            }
        };

        fetchWeather();
        const weatherTimer = setInterval(fetchWeather, 600000);
        return () => clearInterval(weatherTimer);
    }, [config, demoMode]);

    // --- 4. 远程配置同步 ---
    useEffect(() => {
        if (!useRemoteConfig) return;

        const loadRemoteConfig = async () => {
            try {
                const apiUrl = serverUrl ? `${serverUrl.trim().replace(/\/$/, '')}/api/config` : `http://${deviceIP}:3001/api/config`;

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    mode: 'cors'
                });

                if (response.ok) {
                    const remoteConfig = await response.json();
                    setConfig(remoteConfig);
                    setEditConfig(remoteConfig);
                    if (remoteConfig.demo_mode !== undefined) {
                        setDemoMode(remoteConfig.demo_mode);
                        localStorage.setItem('demo_mode', remoteConfig.demo_mode);
                    }
                    if (remoteConfig.demo_state) {
                        setDemoState(remoteConfig.demo_state);
                        localStorage.setItem('demo_state', remoteConfig.demo_state);
                    }
                    if (remoteConfig.demo_festival !== undefined) {
                        setDemoFestival(remoteConfig.demo_festival);
                        localStorage.setItem('demo_festival', remoteConfig.demo_festival);
                    }
                    setFetchError(null);
                }
            } catch (error) {
                console.error('Remote config sync failed:', error);
            }
        };

        loadRemoteConfig();
        const interval = setInterval(loadRemoteConfig, 3000);
        return () => clearInterval(interval);
    }, [useRemoteConfig, serverUrl, deviceIP]);

    // --- 事件处理 ---
    const handleSaveConfig = () => {
        localStorage.setItem('smart_screen_config', JSON.stringify(editConfig));
        setConfig(editConfig);
        localStorage.setItem('demo_mode', demoMode);
        setShowSettings(false);
    };

    const handleOpenSettings = () => {
        setEditConfig(config);
        setShowSettings(true);
    };

    // --- 格式化函数 ---
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (date) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
        return `${month}月${day}日 ${weekDay}`;
    };

    // 农历数据
    const getLunarData = (date) => {
        if (!Solar) {
            return { dayStr: '加载中...', yearStr: '', festivalStr: '' };
        }

        const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const lunar = solar.getLunar();
        const jieQi = lunar.getJieQi();

        // 获取节日信息
        let festivals = [];

        // 1. 二十四节气
        if (jieQi) festivals.push(jieQi);

        // 2. 农历节日 (如春节、中秋)
        const lunarFestivals = lunar.getFestivals();
        if (lunarFestivals && lunarFestivals.length > 0) {
            festivals.push(...lunarFestivals);
        }

        // 3. 公历节日 (如元旦、国庆)
        const solarFestivals = solar.getFestivals();
        if (solarFestivals && solarFestivals.length > 0) {
            festivals.push(...solarFestivals);
        }

        // 4. 其他流行节日 (如情人节、圣诞节) - 库中可能在 "OtherFestivals"
        const solarOther = solar.getOtherFestivals();
        if (solarOther && solarOther.length > 0) {
            // 过滤掉一些不常用的，只保留主要的
            const popular = ['情人节', '平安夜', '圣诞节', '父亲节', '母亲节', '万圣节'];
            const found = solarOther.filter(f => popular.some(p => f.includes(p)));
            festivals.push(...found);
        }

        // 5. 农历其他节日 (如除夕)
        const lunarOther = lunar.getOtherFestivals();
        if (lunarOther && lunarOther.length > 0) {
            const popularLunar = ['除夕', '元宵']; // 元宵通常在 festivals 里，但检查一下
            const found = lunarOther.filter(f => popularLunar.some(p => f.includes(p)));
            festivals.push(...found);
        }

        // 去重并拼接
        const festivalStr = [...new Set(festivals)].join(' · ');

        const yearGanZhi = lunar.getYearInGanZhi() + lunar.getYearShengXiao() + '年';
        const monthGanZhi = lunar.getMonthInGanZhi() + '月';
        const dayGanZhi = lunar.getDayInGanZhi() + '日';
        const fullGanZhi = `${yearGanZhi} ${monthGanZhi} ${dayGanZhi}`;

        return {
            dayStr: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
            dayNum: lunar.getDay(),
            jieQi: jieQi,
            yearStr: fullGanZhi,
            festivalStr: festivalStr
        };
    };

    // 渲染日历
    const renderCalendar = () => {
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-16"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const isActive = d === now.getDate();
            let lunarText = '';
            if (Solar) {
                const solar = Solar.fromYmd(year, month + 1, d);
                const lunar = solar.getLunar();
                const jieQi = lunar.getJieQi();
                if (jieQi) {
                    lunarText = jieQi;
                } else if (lunar.getDay() === 1) {
                    lunarText = lunar.getMonthInChinese() + '月';
                } else {
                    lunarText = lunar.getDayInChinese();
                }
            }

            const isPast = d < now.getDate();
            days.push(
                <div key={d} className="flex flex-col items-center justify-center py-2 relative group h-16">
                    {isActive && (
                        <div className="absolute inset-0 m-auto w-14 h-14 bg-white/20 border border-white/40 rounded-2xl backdrop-blur-md shadow-lg transition-all duration-300"></div>
                    )}
                    <span className={`text-2xl z-10 font-medium transition-colors ${isActive ? 'text-white' : isPast ? 'text-white/40' : 'text-white/80'}`}>
                        {d}
                    </span>
                    <span className={`text-[10px] mt-0.5 z-10 font-light transition-colors ${isActive ? 'text-white' : isPast ? 'text-white/30' : 'text-white/60'} ${lunarText.length > 2 ? 'scale-90' : ''}`}>
                        {lunarText || '-'}
                    </span>
                </div>
            );
        }
        return days;
    };

    const getWeatherIcon = (key) => {
        const props = { size: 28, className: "text-white drop-shadow-md" };
        if (key.includes('CLEAR_NIGHT')) return <Moon {...props} />;
        if (key.includes('CLEAR')) return <Sun {...props} fill="#fcd34d" className="text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" />;
        if (key.includes('PARTLY') || key.includes('CLOUDY')) return <Cloud {...props} />;
        if (key.includes('RAIN') || key === 'SLEET') return <CloudRain {...props} />;
        if (key.includes('SNOW')) return <CloudSnow {...props} />;
        if (key.includes('THUNDER')) return <CloudLightning {...props} />;
        if (key.includes('WIND')) return <Wind {...props} />;
        return <Sun {...props} fill="#fcd34d" className="text-yellow-300" />;
    };

    const getWeatherText = (key) => {
        // 和风天气直接使用 condition_cn
        if (weather.weatherText) {
            return weather.weatherText;
        }
        // 彩云天气使用 skycon 映射
        if (weather.attributes.skycon) {
            return CONDITION_CN_MAP[weather.attributes.skycon] || CONDITION_CN_MAP[key] || "晴";
        }
        return CONDITION_CN_MAP[key] || "晴";
    };

    const lunarData = getLunarData(now);

    // 计算缩放比例 - 保持比例适配屏幕
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const updateScale = () => {
            const scaleX = window.innerWidth / 1024;
            const scaleY = window.innerHeight / 600;
            setScale(Math.min(scaleX, scaleY));
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    return (
        <div className="w-screen h-screen font-sans select-none overflow-hidden relative">
            <WeatherStyles />

            {/* 背景层 - 铺满整个屏幕 */}
            <div className="absolute inset-0 z-0">
                <WeatherBackground
                    weatherKey={weather.mappedKey}
                    festival={(demoMode && demoFestival) ? demoFestival : lunarData.festivalStr}
                />
            </div>



            {/* Device Frame */}
            <div className="absolute z-10" style={{
                width: '1024px',
                height: '600px',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: 'center'
            }}>

                {/* Screen Content */}
                <div className="w-full h-full relative flex flex-col p-8 overflow-hidden">

                    {/* Top Bar */}
                    <div className="flex justify-between items-start mb-4 z-10">
                        {/* Location */}
                        <div className="flex items-center space-x-2 text-white/90 text-lg font-medium tracking-wide cursor-pointer hover:text-white transition-colors drop-shadow-lg" onClick={handleOpenSettings}>
                            <MapPin size={20} className="text-white/90" />
                            <span className="font-medium tracking-wider">{weather.friendlyName || config.location_name || "请配置位置"}</span>
                        </div>

                        {/* Status Icons - Glassmorphism */}
                        <div className="flex items-center space-x-5">
                            <button onClick={handleOpenSettings} className={`transition-all hover:scale-110 focus:outline-none drop-shadow-md relative ${fetchError ? 'text-red-400 animate-pulse' : 'text-white/90 hover:text-white'}`}>
                                <Settings size={24} />
                                {fetchError && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black box-content"></span>}
                            </button>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="flex-1 grid grid-cols-12 z-10">

                        {/* Left Info Column */}
                        <div className="col-span-5 flex flex-col justify-between pt-8 pb-4 pl-2">
                            <div>
                                <h1 className="text-[140px] leading-none font-bold tracking-tighter text-white w-full drop-shadow-2xl font-[Helvetica Neue,Arial,sans-serif]">
                                    {formatTime(now)}
                                </h1>

                                <div className="mt-4 text-3xl font-light text-white/95 tracking-widest drop-shadow-lg uppercase">
                                    {formatDate(now)}
                                </div>

                                <div className="mt-6 flex items-center space-x-4 text-2xl text-white font-medium drop-shadow-lg bg-black/20 backdrop-blur-md w-fit px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                                    {getWeatherIcon(weather.mappedKey)}
                                    <span>{getWeatherText(weather.mappedKey)}</span>
                                    <span className="text-3xl font-light">{weather.temperature}°</span>
                                    {demoMode && <span className="bg-blue-500/80 text-[10px] px-1.5 py-0.5 rounded text-white font-bold tracking-wider uppercase ml-2 shadow-sm">DEMO</span>}
                                </div>
                            </div>

                            {/* Lunar Info - Elegant Typography */}
                            <div className="space-y-1 mb-6 drop-shadow-md border-l-2 border-white/30 pl-4">
                                {/* 节日/节气显示区域 */}
                                {((demoMode && demoFestival) || lunarData.festivalStr) ? (
                                    <div className="text-xl text-yellow-300 font-medium tracking-wider mb-1 drop-shadow-md" style={{ fontFamily: 'KaiTi, STKaiti, SimKai, serif' }}>
                                        {(demoMode && demoFestival) ? demoFestival : lunarData.festivalStr}
                                    </div>
                                ) : null}
                                <div className="text-2xl font-light text-white tracking-[0.2em] min-h-[2rem] drop-shadow-md" style={{ fontFamily: 'KaiTi, STKaiti, SimKai, serif' }}>
                                    {lunarData.dayStr}
                                </div>
                                <div className="text-sm text-white/70 tracking-widest uppercase min-h-[1.75rem] drop-shadow-md" style={{ fontFamily: 'KaiTi, STKaiti, SimKai, serif' }}>
                                    {lunarData.yearStr}
                                </div>
                            </div>
                        </div>

                        {/* Right Calendar Column */}
                        <div className="col-span-7 pt-4 pl-8 pr-2">
                            <div className="grid grid-cols-7 gap-y-1 text-center">
                                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                                    <div key={day} className="text-white/80 font-medium text-sm mb-4 uppercase tracking-widest drop-shadow-md">
                                        {day}
                                    </div>
                                ))}
                                {renderCalendar()}
                            </div>
                        </div>
                    </div>

                    {/* Settings Modal (保持不变) */}
                    {showSettings && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-8 transition-opacity duration-300">
                            <div className="bg-[#111] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-full">

                                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                                    <h2 className="text-xl text-white font-semibold flex items-center gap-3 tracking-wide">
                                        <div className="p-2 bg-blue-500/20 rounded-lg"><Settings className="text-blue-400" size={20} /></div>
                                        系统设置
                                    </h2>
                                    <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-8 overflow-y-auto text-left">
                                    {fetchError && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
                                            <div className="p-2 bg-red-500/20 rounded-full"><AlertTriangle className="text-red-400" size={18} /></div>
                                            <div className="text-sm text-red-200/90">
                                                <p className="font-semibold mb-1 text-red-100">连接错误</p>
                                                <p>{fetchError}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="glass-panel rounded-2xl p-5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                                                <PlayCircle className="text-blue-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-lg">演示模式 (Demo)</p>
                                                <p className="text-xs text-white/40 mt-1">无需连接 HA 即可预览所有高级天气特效</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {demoMode && (
                                                <select
                                                    value={demoState}
                                                    onChange={(e) => {
                                                        setDemoState(e.target.value);
                                                        localStorage.setItem('demo_state', e.target.value);
                                                    }}
                                                    className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="CLEAR_DAY">☀️ 晴天</option>
                                                    <option value="CLEAR_NIGHT">🌙 晴夜</option>
                                                    <option value="PARTLY_CLOUDY_DAY">🌤️ 多云(日)</option>
                                                    <option value="PARTLY_CLOUDY_NIGHT">☁️ 多云(夜)</option>
                                                    <option value="CLOUDY">☁️ 阴天</option>
                                                    <option value="LIGHT_HAZE">🌫️ 轻雾</option>
                                                    <option value="MODERATE_HAZE">🌫️ 中雾</option>
                                                    <option value="HEAVY_HAZE">🌫️ 大雾</option>
                                                    <option value="LIGHT_RAIN">🌦️ 小雨</option>
                                                    <option value="MODERATE_RAIN">🌧️ 中雨</option>
                                                    <option value="HEAVY_RAIN">🌧️ 大雨</option>
                                                    <option value="STORM_RAIN">⛈️ 暴雨</option>
                                                    <option value="LIGHT_SNOW">🌨️ 小雪</option>
                                                    <option value="MODERATE_SNOW">❄️ 中雪</option>
                                                    <option value="HEAVY_SNOW">❄️ 大雪</option>
                                                    <option value="STORM_SNOW">❄️ 暴雪</option>
                                                    <option value="DUST">💨 浮尘</option>
                                                    <option value="SAND">💨 沙尘</option>
                                                    <option value="THUNDER_SHOWER">⛈️ 雷阵雨</option>
                                                    <option value="HAIL">🧊 冰雹</option>
                                                    <option value="SLEET">🌨️ 雨夹雪</option>
                                                    <option value="WIND">💨 大风</option>
                                                    <option value="HAZE">🌫️ 雾霾</option>
                                                </select>
                                            )}
                                            {demoMode && (
                                                <select
                                                    value={demoFestival}
                                                    onChange={(e) => {
                                                        setDemoFestival(e.target.value);
                                                        localStorage.setItem('demo_festival', e.target.value);
                                                    }}
                                                    className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="">无节日</option>
                                                    <option value="春节">🧨 春节</option>
                                                    <option value="元宵节">🏮 元宵节</option>
                                                    <option value="清明">🌿 清明</option>
                                                    <option value="端午节">🐉 端午节</option>
                                                    <option value="中秋节">🥮 中秋节</option>
                                                    <option value="国庆节">🇨🇳 国庆节</option>
                                                    <option value="圣诞节">🎄 圣诞节</option>
                                                    <option value="平安夜">🍎 平安夜</option>
                                                    <option value="情人节">🌹 情人节</option>
                                                    <option value="除夕">🧧 除夕</option>
                                                </select>
                                            )}
                                            <button
                                                onClick={() => { setDemoMode(!demoMode); if (!demoMode) setFetchError(null); }}
                                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${demoMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
                                            >
                                                {demoMode ? 'ON' : 'OFF'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="glass-panel rounded-2xl p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                                    <Settings className="text-purple-400" size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-lg">远程配置</p>
                                                    <p className="text-xs text-white/40 mt-1">从局域网服务器同步配置</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={useRemoteConfig}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setUseRemoteConfig(checked);
                                                        localStorage.setItem('use_remote_config', checked);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                            </label>
                                        </div>

                                        {useRemoteConfig && (
                                            <div className="space-y-3">
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                    <p className="text-xs text-white/60 mb-2">📱 远程配置地址</p>
                                                    {Capacitor.isNativePlatform() && (
                                                        <p className="text-xs text-yellow-400 mb-2">
                                                            服务器状态: {localStorage.getItem('server_status') || '启动中...'}
                                                        </p>
                                                    )}
                                                    <p className="text-white font-mono text-sm mb-3 break-all">
                                                        {deviceIP ? `http://${deviceIP}:3001` : '正在获取IP地址...'}
                                                    </p>
                                                    {deviceIP && (
                                                        <div className="bg-white p-2 rounded-lg w-32 mx-auto">
                                                            <img
                                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`http://${deviceIP}:3001`)}`}
                                                                alt="QR Code"
                                                                className="w-full h-auto"
                                                            />
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-white/40 mt-2">💡 其他设备扫码或访问上述地址即可配置</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">Home Assistant 地址</label>
                                            <input
                                                type="text"
                                                value={editConfig.ha_url}
                                                onChange={(e) => setEditConfig({ ...editConfig, ha_url: e.target.value })}
                                                placeholder="http://192.168.1.100:8123"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-mono"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">长期访问令牌</label>
                                            <textarea
                                                value={editConfig.ha_token}
                                                onChange={(e) => setEditConfig({ ...editConfig, ha_token: e.target.value })}
                                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                                className="w-full h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-xs resize-none leading-relaxed"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">实体 ID</label>
                                                <input
                                                    type="text"
                                                    value={editConfig.weather_entity}
                                                    onChange={(e) => setEditConfig({ ...editConfig, weather_entity: e.target.value })}
                                                    placeholder="weather.home"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all text-sm font-mono"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">位置名称</label>
                                                <input
                                                    type="text"
                                                    value={editConfig.location_name}
                                                    onChange={(e) => setEditConfig({ ...editConfig, location_name: e.target.value })}
                                                    placeholder="客厅"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-4">
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="px-6 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleSaveConfig}
                                        className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all transform hover:scale-[1.02]"
                                    >
                                        <Save size={18} />
                                        保存设置
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SmartDisplay;
