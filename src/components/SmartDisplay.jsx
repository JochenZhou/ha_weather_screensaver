import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Settings, Moon } from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';
import { Capacitor } from '@capacitor/core';
import WeatherStyles from './WeatherStyles';
import WeatherBackground from './WeatherBackground';
import SettingsModal from './SettingsModal';
import { CONDITION_CN_MAP, QWEATHER_ICON_MAP, normalizeWeatherState } from './weatherUtils';



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
            weather_entity: "weather.wo_de_jia_2",
            location_name: ""
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
                if (!serverUrl && !deviceIP) return; // 没有有效地址时跳过
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

                    {/* Settings Modal */}
                    <SettingsModal
                        showSettings={showSettings} setShowSettings={setShowSettings}
                        fetchError={fetchError} setFetchError={setFetchError}
                        demoMode={demoMode} setDemoMode={setDemoMode}
                        demoState={demoState} setDemoState={setDemoState}
                        demoFestival={demoFestival} setDemoFestival={setDemoFestival}
                        useRemoteConfig={useRemoteConfig} setUseRemoteConfig={setUseRemoteConfig}
                        deviceIP={deviceIP} editConfig={editConfig} setEditConfig={setEditConfig}
                        handleSaveConfig={handleSaveConfig}
                    />

                </div>
            </div>
        </div>
    );
};

export default SmartDisplay;
