import React, { useMemo, useState, useEffect } from 'react';
import { extractDominantColor } from '../utils/colorExtractor';

// 性能检测
const getDevicePerformance = () => {
    const ua = navigator.userAgent.toLowerCase();
    const match = ua.match(/android (\d+)/);
    const androidVersion = match ? parseInt(match[1]) : 999;
    const isOldDevice = androidVersion >= 4 && androidVersion <= 6;
    console.log('🔍 Performance detection:', { ua, androidVersion, isOldDevice, performance: isOldDevice ? 'low' : 'high' });
    return isOldDevice ? 'low' : 'high';
};

const PERFORMANCE = getDevicePerformance();

// 导出函数以便其他组件使用
export const getWeatherGradient = (key) => {
    switch (true) {
        case key === 'CLEAR_DAY': return 'bg-gradient-to-br from-blue-900 via-blue-700 to-blue-400';
        case key === 'CLEAR_NIGHT': return 'bg-gradient-to-br from-slate-900 via-blue-900 to-black';
        case key.includes('PARTLY'): return 'bg-gradient-to-br from-[#4B79A1] to-[#283E51]';
        case key === 'CLOUDY': return 'bg-gradient-to-br from-[#232526] to-[#414345]';
        case key === 'LIGHT_RAIN': return 'bg-gradient-to-b from-[#29323c] to-[#485563]';
        case key === 'MODERATE_RAIN': return 'bg-gradient-to-b from-[#141E30] to-[#243B55]';
        case key === 'HEAVY_RAIN': return 'bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364]';
        case key === 'STORM_RAIN' || key.includes('THUNDER'): return 'bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]';
        case key === 'LIGHT_SNOW': return 'bg-gradient-to-b from-[#607D8B] to-[#90A4AE]';
        case key === 'MODERATE_SNOW': return 'bg-gradient-to-b from-[#274060] to-[#1B2838]';
        case key === 'HEAVY_SNOW' || key === 'STORM_SNOW': return 'bg-gradient-to-b from-[#16222A] to-[#3A6073]';
        case key === 'HAIL': return 'bg-gradient-to-b from-[#1e3c72] to-[#2a5298]';
        case key === 'SLEET': return 'bg-gradient-to-b from-[#2c3e50] to-[#7f8c8d]';
        case key === 'LIGHT_FOG' || key === 'LIGHT_HAZE': return 'bg-gradient-to-t from-[#5a626e] to-[#8E9EAB]';
        case key === 'MODERATE_FOG' || key === 'MODERATE_HAZE' || key === 'FOG' || key === 'HAZE': return 'bg-gradient-to-t from-[#373B44] to-[#8E9EAB]';
        case key === 'HEAVY_FOG' || key === 'HEAVY_HAZE': return 'bg-gradient-to-t from-[#242424] to-[#5a626e]';
        case key === 'DUST' || key === 'SAND': return 'bg-gradient-to-br from-[#3E5151] to-[#DECBA4]';
        default: return 'bg-gradient-to-br from-blue-900 to-slate-200';
    }
};

// 导出函数获取天气主色调
export const getWeatherDominantColor = (weatherKey) => {
    const gradient = getWeatherGradient(weatherKey);
    const dominantColor = extractDominantColor(gradient);
    console.log('🌈 Color extraction:', {
        weatherKey,
        gradient,
        dominantColor
    });
    return dominantColor;
};

const WeatherBackground = ({ weatherKey, festival }) => {
    const [displayFestival, setDisplayFestival] = useState(festival);
    const [festivalOpacity, setFestivalOpacity] = useState(festival ? 1 : 0);

    useEffect(() => {
        if (festival) {
            setDisplayFestival(festival);
            setFestivalOpacity(1);
        } else if (displayFestival) {
            // 淡出后再清除
            setFestivalOpacity(0);
            const timer = setTimeout(() => setDisplayFestival(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [festival]);

    const getGradient = getWeatherGradient;

    const renderCelestialBody = (key) => {
        if (key === 'CLEAR_DAY' || key === 'PARTLY_CLOUDY_DAY') {
            return null;
        }
        if (key === 'CLEAR_NIGHT' || key === 'PARTLY_CLOUDY_NIGHT') {
            return (
                <div className="absolute top-[10%] right-[15%] w-32 h-32 z-0 animate-[float-cloud-slow_20s_infinite_ease-in-out]">
                    <div className="absolute inset-0 rounded-full" style={{
                        background: 'transparent',
                        boxShadow: 'inset -20px 10px 0 0 #fbbf24',
                        transform: 'rotate(-15deg) scale(0.8)',
                        filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))'
                    }}></div>
                    <div className="absolute top-2 right-4 w-full h-full rounded-full bg-yellow-400/5 blur-[40px]"></div>
                </div>
            );
        }
        return null;
    };

    const stars = useMemo(() => Array.from({ length: PERFORMANCE === 'low' ? 30 : 60 }).map((_, i) => ({
        id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 80}%`,
        size: Math.random() * 2 + 1, delay: Math.random() * 5, duration: Math.random() * 3 + 3
    })), []);


    const renderStars = (key) => {
        if (!key.includes('NIGHT')) return null;
        return (
            <div className="particle-container z-0">
                {/* 星星 */}
                {stars.map((star) => (
                    <div key={`star-${star.id}`} className="absolute rounded-full bg-white shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                        style={{
                            top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`,
                            animation: `twinkle ${star.duration}s infinite ease-in-out ${star.delay}s`
                        }} />
                ))}
            </div>
        );
    };

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

    const rainParticles = useMemo(() => ({
        far: Array.from({ length: PERFORMANCE === 'low' ? 50 : 200 }).map((_, i) => ({ id: i, left: Math.random() * 100, top: Math.random() * -100, duration: Math.random() * 0.5 + 0.5 })),
        near: Array.from({ length: PERFORMANCE === 'low' ? 25 : 100 }).map((_, i) => ({ id: i, left: Math.random() * 100, top: Math.random() * -100, duration: Math.random() * 0.3 + 0.3 }))
    }), []);

    const snowParticles = useMemo(() => Array.from({ length: PERFORMANCE === 'low' ? 40 : 150 }).map((_, i) => ({
        id: i, left: Math.random() * 100, size: Math.random() * 4 + 2, blur: Math.random() * 1.5,
        opacity: Math.random() * 0.5 + 0.5, duration: Math.random() * 5 + 5, delay: -(Math.random() * 10), sway: Math.random() * 60 - 30
    })), []);

    const renderPrecipitation = (key) => {
        let rainCount = 0, snowCount = 0, rainDuration = 1.0, rainAngle = 10;
        if (key.includes('RAIN') || key === 'SLEET' || key.includes('THUNDER') || key === 'HAIL' || key.includes('SNOW')) {
            const multiplier = PERFORMANCE === 'low' ? 0.3 : 1;
            if (key === 'LIGHT_RAIN') { rainCount = Math.floor(30 * multiplier); rainDuration = 1.5; }
            else if (key === 'MODERATE_RAIN') { rainCount = Math.floor(80 * multiplier); rainDuration = 1.0; }
            else if (key === 'HEAVY_RAIN') { rainCount = Math.floor(150 * multiplier); rainDuration = 0.7; }
            else if (key === 'STORM_RAIN' || key.includes('THUNDER')) { rainCount = Math.floor(200 * multiplier); rainDuration = 0.5; rainAngle = 25; }
            else if (key === 'HAIL') { rainCount = Math.floor(80 * multiplier); rainDuration = 1.5; }
            else if (key === 'SLEET') { rainCount = Math.floor(40 * multiplier); rainDuration = 1.0; }

            if (key.includes('SNOW') || key === 'SLEET') {
                if (key === 'LIGHT_SNOW') snowCount = Math.floor(20 * multiplier);
                else if (key === 'MODERATE_SNOW') snowCount = Math.floor(60 * multiplier);
                else if (key === 'HEAVY_SNOW' || key === 'STORM_SNOW') snowCount = Math.floor(120 * multiplier);
                else if (key === 'SLEET') snowCount = Math.floor(30 * multiplier);
                else snowCount = Math.floor(50 * multiplier);
            }

            const elements = [];
            if (rainCount > 0) {
                elements.push(
                    <div key="rain" className="particle-container z-20">
                        {rainParticles.far.slice(0, rainCount).map((p) => (
                            <div key={`rain-far-${p.id}`} className={`absolute will-change-transform ${key === 'HAIL' ? 'bg-white/90 rounded-full' : 'bg-white/10'}`}
                                style={{
                                    width: key === 'HAIL' ? '5px' : '1px', height: key === 'HAIL' ? '5px' : '30px', left: `${p.left}%`, top: `${p.top}%`,
                                    animation: `rain-drop-far ${p.duration * rainDuration}s linear infinite`, transform: `rotate(${rainAngle}deg)`
                                }} />
                        ))}
                        {rainParticles.near.slice(0, Math.floor(rainCount / 2)).map((p) => (
                            <div key={`rain-near-${p.id}`} className={`absolute will-change-transform ${key === 'HAIL' ? 'bg-white/95 rounded-full' : 'bg-white/20'}`}
                                style={{
                                    width: key === 'HAIL' ? '7px' : '2px', height: key === 'HAIL' ? '7px' : '50px', left: `${p.left}%`, top: `${p.top}%`,
                                    animation: `rain-drop-near ${p.duration * rainDuration}s linear infinite`, transform: `rotate(${rainAngle + 5}deg)`
                                }} />
                        ))}
                    </div>
                );
            }
            if (snowCount > 0) {
                elements.push(
                    <div key="snow" className="particle-container z-20">
                        {snowParticles.slice(0, snowCount).map((p) => (
                            <div key={`snow-${p.id}`} className="absolute bg-white/80 rounded-full will-change-transform"
                                style={{
                                    width: `${p.size}px`, height: `${p.size}px`, left: `${p.left}%`, filter: `blur(${p.blur}px)`,
                                    opacity: p.opacity, '--sway': `${p.sway}px`, animation: `snow-fall ${p.duration}s linear infinite`, animationDelay: `${p.delay}s`
                                }} />
                        ))}
                    </div>
                );
            }
            return elements.length > 0 ? <>{elements}</> : null;
        }
        return null;
    };

    const renderLightning = (key) => key.includes('THUNDER') ? <div className="absolute inset-0 bg-white/0 z-30 pointer-events-none animate-[lightning-flash-screen_8s_infinite_ease-out]"></div> : null;

    const renderFog = (key) => {
        if (key.includes('FOG') || key.includes('HAZE')) {
            const isHaze = key.includes('HAZE');
            const hazeColor = isHaze ? 'from-amber-100/40' : 'from-white/40';
            const hazeTint = isHaze ? 'bg-yellow-200/20' : 'bg-white/30';

            let opacity = 'opacity-30', height = 'h-[60%]', blur = 'blur-[60px]';
            if (key.includes('HEAVY')) {
                opacity = 'opacity-80';
                height = 'h-[80%]';
                blur = 'blur-[80px]';
            } else if (key.includes('MODERATE') || key === 'FOG' || key === 'HAZE') {
                opacity = 'opacity-50';
                height = 'h-[70%]';
                blur = 'blur-[70px]';
            }

            return (
                <div className="particle-container z-20 pointer-events-none">
                    <div className={`absolute bottom-0 left-0 w-full ${height} bg-gradient-to-t ${hazeColor} to-transparent ${opacity}`}></div>
                    <div className={`absolute bottom-[-20%] left-[-20%] w-[140%] h-[50%] ${hazeTint} ${blur} rounded-full ${opacity}`}></div>
                    {isHaze && <div className={`absolute bottom-[10%] right-[-10%] w-[100%] h-[40%] bg-amber-200/15 blur-[50px] rounded-full ${opacity} animate-breathe`}></div>}
                </div>
            );
        }
        return null;
    };

    const festivalParticles = useMemo(() => ({
        lanterns: Array.from({ length: PERFORMANCE === 'low' ? 4 : 8 }).map((_, i) => ({
            id: i, left: Math.random() * 80, size: Math.random() * 25 + 20, duration: Math.random() * 10 + 20, delay: Math.random() * 10, opacity: Math.random() * 0.3 + 0.6,
            icon: ['🏮', '🧧', '🧨'][Math.floor(Math.random() * 3)]
        })),
        hearts: Array.from({ length: PERFORMANCE === 'low' ? 5 : 10 }).map((_, i) => ({
            id: i, left: Math.random() * 80, size: Math.random() * 15 + 15, duration: Math.random() * 8 + 12, delay: Math.random() * 10,
            icon: ['❤️', '🌹', '💐'][Math.floor(Math.random() * 3)]
        })),
        christmas: Array.from({ length: PERFORMANCE === 'low' ? 8 : 15 }).map((_, i) => ({
            id: i, left: Math.random() * 80, top: Math.random() * 40 + 60, size: Math.random() * 20 + 10, duration: Math.random() * 5 + 5,
            icon: ['🎄', '🌟', '❄️', '🎁'][Math.floor(Math.random() * 4)]
        })),
        willowLeaves: Array.from({ length: PERFORMANCE === 'low' ? 6 : 12 }).map((_, i) => ({ id: i, left: Math.random() * 80, delay: Math.random() * 5, duration: Math.random() * 4 + 4, size: Math.random() * 10 + 5 })),
        dragonBoat: Array.from({ length: PERFORMANCE === 'low' ? 5 : 10 }).map((_, i) => ({
            id: i, left: Math.random() * 80, top: Math.random() * 80, rotate: Math.random() * 360, duration: Math.random() * 10 + 10,
            icon: ['🎋', '🍙', '🐉'][Math.floor(Math.random() * 3)]
        })),
        midAutumn: Array.from({ length: PERFORMANCE === 'low' ? 4 : 8 }).map((_, i) => ({
            id: i, left: Math.random() * 80, size: Math.random() * 20 + 15, duration: Math.random() * 15 + 20, delay: Math.random() * 10,
            icon: ['🥮', '🐇', '🏮'][Math.floor(Math.random() * 3)]
        })),
        balloons: Array.from({ length: PERFORMANCE === 'low' ? 5 : 10 }).map((_, i) => ({
            id: i, left: Math.random() * 80, size: Math.random() * 20 + 20, duration: Math.random() * 8 + 10, delay: Math.random() * 5,
            icon: ['🎈', '🍭', '🧸'][Math.floor(Math.random() * 3)]
        })),
        halloween: Array.from({ length: PERFORMANCE === 'low' ? 4 : 8 }).map((_, i) => ({
            id: i, left: Math.random() * 80, size: Math.random() * 20 + 20, duration: Math.random() * 10 + 15, delay: Math.random() * 10,
            icon: ['🎃', '👻', '🕸️'][Math.floor(Math.random() * 3)]
        }))
    }), []);

    const renderFestivalAtmosphere = (fest, opacity) => {
        if (!fest) return null;
        const containerClass = "absolute bottom-0 left-0 w-[45%] h-[60%] z-20 pointer-events-none overflow-hidden transition-opacity duration-1000";
        const maskGradient = 'linear-gradient(to top, black 0%, black 60%, transparent 100%), linear-gradient(to right, black 0%, black 60%, transparent 100%)';
        const maskStyle = { opacity, maskImage: maskGradient, WebkitMaskImage: maskGradient, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' };

        // 春节/元宵/除夕/国庆/元旦/腊八/重阳 - 红灯笼/红包/鞭炮
        if (['春节', '元宵', '除夕', '国庆', '元旦', '腊八', '重阳'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[60%] bg-gradient-to-tr from-red-900/40 via-red-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.lanterns.map(l => (
                        <div key={`lantern-${l.id}`} className="absolute will-change-transform flex items-center justify-center"
                            style={{
                                left: `${l.left}%`, fontSize: `${l.size}px`, opacity: l.opacity,
                                animation: `float-up ${l.duration}s linear infinite`, animationDelay: `-${l.delay}s`,
                                filter: 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.5))'
                            }}>
                            {l.icon}
                        </div>
                    ))}
                </div>
            );
        }
        // 情人节/520/七夕/母亲节 - 粉色爱心/玫瑰
        if (['情人', '520', '七夕', '母亲'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-pink-900/30 via-pink-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.hearts.map(h => (
                        <div key={`heart-${h.id}`} className="absolute will-change-transform"
                            style={{
                                left: `${h.left}%`, fontSize: `${h.size}px`,
                                animation: `float-heart ${h.duration}s linear infinite`, animationDelay: `-${h.delay}s`,
                                filter: 'drop-shadow(0 0 5px rgba(244, 114, 182, 0.5))'
                            }}>
                            {h.icon}
                        </div>
                    ))}
                </div>
            );
        }
        // 父亲节 - 蓝色爱心 (保持蓝色主题，图标可以是通用的)
        if (fest.includes('父亲')) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-blue-900/30 via-blue-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.hearts.map(h => (
                        <div key={`heart-blue-${h.id}`} className="absolute will-change-transform"
                            style={{
                                left: `${h.left}%`, fontSize: `${h.size}px`,
                                animation: `float-heart ${h.duration}s linear infinite`, animationDelay: `-${h.delay}s`,
                                filter: 'hue-rotate(200deg) drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))' // 简单变色处理
                            }}>
                            {h.icon === '🌹' ? '👔' : '💙'}
                        </div>
                    ))}
                </div>
            );
        }
        // 圣诞/平安夜 - 圣诞树/星星/礼物
        if (['圣诞', '平安'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-red-900/20 via-green-900/10 to-transparent blur-[40px]"></div>
                    {festivalParticles.christmas.map(s => (
                        <div key={`xmas-${s.id}`} className="absolute will-change-transform"
                            style={{
                                left: `${s.left}%`, top: `${s.top}%`, fontSize: `${s.size}px`,
                                animation: `twinkle ${s.duration}s infinite ease-in-out`,
                                filter: 'drop-shadow(0 0 5px rgba(253, 224, 71, 0.5))'
                            }}>
                            {s.icon}
                        </div>
                    ))}
                </div>
            );
        }
        // 清明 - 柳枝/雨丝 (保持原有，比较有意境)
        if (fest.includes('清明')) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-emerald-900/30 via-emerald-800/10 to-transparent blur-[50px]"></div>
                    {/* 模拟柳条 */}
                    <div className="absolute top-10 left-10 w-[2px] h-[200px] bg-emerald-800/40 origin-top animate-[sway_4s_ease-in-out_infinite]"></div>
                    <div className="absolute top-5 left-20 w-[2px] h-[150px] bg-emerald-800/30 origin-top animate-[sway_5s_ease-in-out_infinite_1s]"></div>
                    {/* 飘落柳叶 */}
                    {festivalParticles.willowLeaves.map(l => (
                        <div key={`leaf-${l.id}`} className="absolute bg-emerald-500/60 rounded-full will-change-transform"
                            style={{ left: `${l.left}%`, width: `${l.size}px`, height: `${l.size / 2}px`, animation: `rain-drop-far ${l.duration}s linear infinite`, animationDelay: `-${l.delay}s` }} />
                    ))}
                </div>
            );
        }
        // 端午 - 竹子/粽子/龙
        if (fest.includes('端午')) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-green-900/30 via-green-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.dragonBoat.map(l => (
                        <div key={`dragon-${l.id}`} className="absolute will-change-transform"
                            style={{
                                left: `${l.left}%`, top: `${l.top}%`, fontSize: '20px',
                                animation: `float-cloud-slow ${l.duration}s infinite ease-in-out`
                            }}>
                            {l.icon}
                        </div>
                    ))}
                </div>
            );
        }
        // 中秋 - 月饼/兔子/灯笼
        if (fest.includes('中秋')) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-amber-900/40 via-orange-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.midAutumn.map(l => (
                        <div key={`midautumn-${l.id}`} className="absolute will-change-transform"
                            style={{
                                left: `${l.left}%`, fontSize: `${l.size}px`, opacity: 0.9,
                                animation: `float-slow ${l.duration}s linear infinite`, animationDelay: `-${l.delay}s`,
                                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))'
                            }}>
                            {l.icon}
                        </div>
                    ))}
                </div>
            );
        }
        // 儿童节/劳动节 - 气球/糖果
        if (['儿童', '六一', '劳动', '五一'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-blue-900/20 via-pink-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.balloons.map(b => (
                        <div key={`balloon-${b.id}`} className="absolute will-change-transform"
                            style={{
                                left: `${b.left}%`, fontSize: `${b.size}px`, opacity: 0.8,
                                animation: `balloon-rise ${b.duration}s linear infinite`, animationDelay: `-${b.delay}s`
                            }}>
                            {b.icon}
                        </div>
                    ))}
                </div>
            );
        }
        // 万圣节 - 幽灵/南瓜/网
        if (fest.includes('万圣')) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-purple-900/40 via-orange-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.halloween.map(g => (
                        <div key={`ghost-${g.id}`} className="absolute will-change-transform"
                            style={{
                                left: `${g.left}%`, fontSize: `${g.size}px`,
                                animation: `float-ghost ${g.duration}s linear infinite`, animationDelay: `-${g.delay}s`,
                                filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))'
                            }}>
                            {g.icon}
                        </div>
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
            {renderFestivalAtmosphere(displayFestival, festivalOpacity)}
        </div>
    );
};

export default WeatherBackground;
