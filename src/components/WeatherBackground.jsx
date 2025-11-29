import React, { useMemo } from 'react';

const WeatherBackground = ({ weatherKey, festival }) => {
    const getGradient = (key) => {
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

    const stars = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
        id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 80}%`,
        size: Math.random() * 2 + 1, delay: Math.random() * 5, duration: Math.random() * 3 + 3
    })), []);

    const renderStars = (key) => {
        if (!key.includes('NIGHT')) return null;
        return (
            <div className="particle-container z-0">
                {stars.map((star) => (
                    <div key={`star-${star.id}`} className="absolute rounded-full bg-white shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                        style={{ top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`,
                            animation: `twinkle ${star.duration}s infinite ease-in-out ${star.delay}s` }} />
                ))}
                <div className="absolute top-[20%] right-[-10%] w-[150px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent animate-[meteor_12s_infinite_ease-in] opacity-0" />
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
        far: Array.from({ length: 200 }).map((_, i) => ({ id: i, left: Math.random() * 100, top: Math.random() * -100, duration: Math.random() * 0.5 + 0.5 })),
        near: Array.from({ length: 100 }).map((_, i) => ({ id: i, left: Math.random() * 100, top: Math.random() * -100, duration: Math.random() * 0.3 + 0.3 }))
    }), []);

    const snowParticles = useMemo(() => Array.from({ length: 150 }).map((_, i) => ({
        id: i, left: Math.random() * 100, size: Math.random() * 4 + 2, blur: Math.random() * 1.5,
        opacity: Math.random() * 0.5 + 0.5, duration: Math.random() * 5 + 5, delay: -(Math.random() * 10), sway: Math.random() * 60 - 30
    })), []);

    const renderPrecipitation = (key) => {
        let rainCount = 0, snowCount = 0, rainDuration = 1.0, rainAngle = 10;
        if (key.includes('RAIN') || key === 'SLEET' || key.includes('THUNDER') || key === 'HAIL' || key.includes('SNOW')) {
            if (key === 'LIGHT_RAIN') { rainCount = 30; rainDuration = 1.5; }
            else if (key === 'MODERATE_RAIN') { rainCount = 80; rainDuration = 1.0; }
            else if (key === 'HEAVY_RAIN') { rainCount = 150; rainDuration = 0.7; }
            else if (key === 'STORM_RAIN' || key.includes('THUNDER')) { rainCount = 200; rainDuration = 0.5; rainAngle = 25; }
            else if (key === 'HAIL') { rainCount = 80; rainDuration = 1.5; }
            else if (key === 'SLEET') { rainCount = 40; rainDuration = 1.0; }

            if (key.includes('SNOW') || key === 'SLEET') {
                if (key === 'LIGHT_SNOW') snowCount = 20;
                else if (key === 'MODERATE_SNOW') snowCount = 60;
                else if (key === 'HEAVY_SNOW' || key === 'STORM_SNOW') snowCount = 120;
                else if (key === 'SLEET') snowCount = 30;
                else snowCount = 50;
            }

            const elements = [];
            if (rainCount > 0) {
                elements.push(
                    <div key="rain" className="particle-container z-20">
                        {rainParticles.far.slice(0, rainCount).map((p) => (
                            <div key={`rain-far-${p.id}`} className={`absolute will-change-transform ${key === 'HAIL' ? 'bg-white/90 rounded-full' : 'bg-white/10'}`}
                                style={{ width: key === 'HAIL' ? '5px' : '1px', height: key === 'HAIL' ? '5px' : '30px', left: `${p.left}%`, top: `${p.top}%`,
                                    animation: `rain-drop-far ${p.duration * rainDuration}s linear infinite`, transform: `rotate(${rainAngle}deg)` }} />
                        ))}
                        {rainParticles.near.slice(0, Math.floor(rainCount / 2)).map((p) => (
                            <div key={`rain-near-${p.id}`} className={`absolute will-change-transform ${key === 'HAIL' ? 'bg-white/95 rounded-full' : 'bg-white/20'}`}
                                style={{ width: key === 'HAIL' ? '7px' : '2px', height: key === 'HAIL' ? '7px' : '50px', left: `${p.left}%`, top: `${p.top}%`,
                                    animation: `rain-drop-near ${p.duration * rainDuration}s linear infinite`, transform: `rotate(${rainAngle + 5}deg)` }} />
                        ))}
                    </div>
                );
            }
            if (snowCount > 0) {
                elements.push(
                    <div key="snow" className="particle-container z-20">
                        {snowParticles.slice(0, snowCount).map((p) => (
                            <div key={`snow-${p.id}`} className="absolute bg-white/80 rounded-full will-change-transform"
                                style={{ width: `${p.size}px`, height: `${p.size}px`, left: `${p.left}%`, filter: `blur(${p.blur}px)`,
                                    opacity: p.opacity, '--sway': `${p.sway}px`, animation: `snow-fall ${p.duration}s linear infinite`, animationDelay: `${p.delay}s` }} />
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
            let opacity = 'opacity-30';
            if (key.includes('HEAVY')) opacity = 'opacity-80';
            else if (key.includes('MODERATE') || key === 'FOG' || key === 'HAZE') opacity = 'opacity-50';
            return (
                <div className="particle-container z-20 pointer-events-none">
                    <div className={`absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-white/40 to-transparent ${opacity}`}></div>
                    <div className={`absolute bottom-[-20%] left-[-20%] w-[140%] h-[50%] bg-white/30 blur-[60px] rounded-full ${opacity}`}></div>
                </div>
            );
        }
        return null;
    };

    const festivalParticles = useMemo(() => ({
        lanterns: Array.from({ length: 8 }).map((_, i) => ({ id: i, left: Math.random() * 80, size: Math.random() * 25 + 20, duration: Math.random() * 10 + 20, delay: Math.random() * 10, opacity: Math.random() * 0.3 + 0.6 })),
        hearts: Array.from({ length: 10 }).map((_, i) => ({ id: i, left: Math.random() * 80, size: Math.random() * 15 + 10, duration: Math.random() * 8 + 12, delay: Math.random() * 10 })),
        sparkles: Array.from({ length: 15 }).map((_, i) => ({ id: i, left: Math.random() * 80, top: Math.random() * 40 + 60, size: Math.random() * 3 + 1, duration: Math.random() * 3 + 2 }))
    }), []);

    const renderFestivalAtmosphere = (fest) => {
        if (!fest) return null;
        const containerClass = "absolute bottom-0 left-0 w-[45%] h-[60%] z-20 pointer-events-none overflow-hidden";
        const maskStyle = { maskImage: 'radial-gradient(circle at bottom left, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle at bottom left, black 40%, transparent 100%)' };

        if (['春节', '元宵', '除夕', '国庆'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[60%] bg-gradient-to-tr from-red-900/40 via-red-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.lanterns.map(l => (
                        <div key={`lantern-${l.id}`} className="absolute rounded-full bg-gradient-to-t from-orange-500 to-red-600 blur-[0.5px] will-change-transform"
                            style={{ left: `${l.left}%`, width: `${l.size}px`, height: `${l.size * 1.2}px`, opacity: l.opacity, animation: `float-up ${l.duration}s linear infinite`, animationDelay: `-${l.delay}s` }} />
                    ))}
                </div>
            );
        }
        if (['情人', '520', '七夕'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-pink-900/30 via-pink-800/10 to-transparent blur-[50px]"></div>
                    {festivalParticles.hearts.map(h => (
                        <div key={`heart-${h.id}`} className="absolute text-pink-400/60 will-change-transform"
                            style={{ left: `${h.left}%`, fontSize: `${h.size}px`, animation: `float-heart ${h.duration}s linear infinite`, animationDelay: `-${h.delay}s` }}>♥</div>
                    ))}
                </div>
            );
        }
        if (['圣诞', '平安'].some(k => fest.includes(k))) {
            return (
                <div className={containerClass} style={maskStyle}>
                    <div className="absolute bottom-0 left-0 w-[80%] h-[50%] bg-gradient-to-tr from-red-900/20 via-yellow-900/10 to-transparent blur-[40px]"></div>
                    {festivalParticles.sparkles.map(s => (
                        <div key={`gold-${s.id}`} className="absolute bg-yellow-200/40 rounded-full blur-[0.5px] will-change-transform"
                            style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.size}px`, height: `${s.size}px`, animation: `twinkle ${s.duration}s infinite ease-in-out` }} />
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

export default WeatherBackground;
