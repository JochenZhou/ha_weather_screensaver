import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Settings, Moon, CloudFog, CloudHail, CloudDrizzle, Clock, Calendar } from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';
import { Capacitor } from '@capacitor/core';
import WeatherStyles from './WeatherStyles';
import WeatherBackground, { getWeatherDominantColor } from './WeatherBackground';
import SettingsModal from './SettingsModal';
import FlipClock from './FlipClock';
import { CONDITION_CN_MAP, QWEATHER_ICON_MAP, normalizeWeatherState } from './weatherUtils';
import { mqttService } from '../services/mqttService';



// =================================================================================
// 📱 主组件
// =================================================================================
const SmartDisplay = () => {
    // --- 状态管理 ---
    const [now, setNow] = useState(new Date());

    const [config, setConfig] = useState(() => {
        const saved = localStorage.getItem('smart_screen_config');
        const defaults = {
            ha_url: "",
            ha_token: "",
            weather_entity: "weather.wo_de_jia_2",
            location_name: "",
            mqtt_host: "",
            mqtt_port: "1884",
            mqtt_username: "",
            mqtt_password: ""
        };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    });

    const [editConfig, setEditConfig] = useState(config);
    const [showSettings, setShowSettings] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [demoMode, setDemoMode] = useState(() => localStorage.getItem('demo_mode') === 'true');
    const [demoState, setDemoState] = useState(() => localStorage.getItem('demo_state') || 'CLEAR_DAY');
    const [demoFestival, setDemoFestival] = useState(() => localStorage.getItem('demo_festival') || '');
    const [displayMode, setDisplayMode] = useState(() => localStorage.getItem('display_mode') || 'calendar');
    const [showSeconds, setShowSeconds] = useState(() => localStorage.getItem('show_seconds') !== 'false');
    const [cardColor, setCardColor] = useState(() => localStorage.getItem('card_color') || '#1c1c1e');
    const [cardOpacity, setCardOpacity] = useState(() => parseFloat(localStorage.getItem('card_opacity') || '1'));
    const [useDynamicColor, setUseDynamicColor] = useState(() => localStorage.getItem('use_dynamic_color') === 'true');
    const [enableMqtt, setEnableMqtt] = useState(() => localStorage.getItem('enable_mqtt') !== 'false');
    const [enableApi, setEnableApi] = useState(() => localStorage.getItem('enable_api') !== 'false');
    const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('config_server_url') || '');
    const [useRemoteConfig, setUseRemoteConfig] = useState(() => localStorage.getItem('use_remote_config') === 'true');
    const [deviceIP, setDeviceIP] = useState('');
    const [serverStatus, setServerStatus] = useState('');
    const [mqttConnected, setMqttConnected] = useState(false);
    const lastSyncTriggerRef = useRef(0);
    const isSyncingRef = useRef(false);

    const [weather, setWeather] = useState({
        state: "sunny",
        mappedKey: "CLEAR_DAY",
        temperature: 6,
        attributes: {},
        friendlyName: ""
    });

    const isLunarReady = true;

    // --- 动态颜色模式 - 从天气背景提取主色调 ---
    useEffect(() => {
        if (useDynamicColor && weather.mappedKey) {
            const dominantColor = getWeatherDominantColor(weather.mappedKey);
            console.log('🎨 Dynamic color mode:', {
                enabled: useDynamicColor,
                weatherKey: weather.mappedKey,
                extractedColor: dominantColor,
                weatherState: weather.state
            });
            setCardColor(dominantColor);
            // 同时更新 localStorage，防止被覆盖
            localStorage.setItem('card_color', dominantColor);
        } else if (!useDynamicColor) {
            console.log('🎨 Dynamic color mode disabled, using manual color:', cardColor);
        }
    }, [useDynamicColor, weather.mappedKey, weather.state]);

    // --- 1. 时间更新 ---
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- MQTT 连接 ---
    useEffect(() => {
        if (enableMqtt && config.mqtt_host) {
            mqttService.onConnectionChange = (connected) => {
                setMqttConnected(connected);
                // 当 MQTT 连接成功时，清除之前的错误提示
                if (connected) {
                    setFetchError(null);
                }
            };
            mqttService.onDemoModeUpdate = (update) => {
                if (update.demo_mode !== undefined) {
                    setDemoMode(update.demo_mode);
                    localStorage.setItem('demo_mode', update.demo_mode);
                }
                if (update.demo_state) {
                    setDemoState(update.demo_state);
                    localStorage.setItem('demo_state', update.demo_state);
                }
                if (update.demo_festival !== undefined) {
                    setDemoFestival(update.demo_festival);
                    localStorage.setItem('demo_festival', update.demo_festival);
                }
                if (update.display_mode) {
                    setDisplayMode(update.display_mode);
                    localStorage.setItem('display_mode', update.display_mode);
                }
                if (update.show_seconds !== undefined) {
                    setShowSeconds(update.show_seconds);
                    localStorage.setItem('show_seconds', update.show_seconds);
                }
                if (update.card_color && !useDynamicColor) {
                    // 只有在非动态色模式下才接受颜色更新
                    setCardColor(update.card_color);
                    localStorage.setItem('card_color', update.card_color);
                }
                if (update.card_opacity !== undefined) {
                    setCardOpacity(update.card_opacity);
                    localStorage.setItem('card_opacity', update.card_opacity);
                }
                if (update.use_dynamic_color !== undefined) {
                    setUseDynamicColor(update.use_dynamic_color);
                    localStorage.setItem('use_dynamic_color', update.use_dynamic_color);
                }
                if (update.enable_mqtt !== undefined) {
                    setEnableMqtt(update.enable_mqtt);
                    localStorage.setItem('enable_mqtt', update.enable_mqtt);
                }
                if (update.enable_api !== undefined) {
                    setEnableApi(update.enable_api);
                    localStorage.setItem('enable_api', update.enable_api);
                }
            };
            mqttService.onWeatherUpdate = (update) => {
                if (update.weather_entity) {
                    setConfig(prev => ({ ...prev, weather_entity: update.weather_entity }));
                    setEditConfig(prev => ({ ...prev, weather_entity: update.weather_entity }));
                }
            };
            mqttService.onWeatherDataUpdate = (data) => {
                // 接收 HA 通过 MQTT 推送的天气数据
                if (data.state) {
                    const mappedKey = normalizeWeatherState(data.state);
                    setWeather({
                        state: data.state,
                        mappedKey,
                        temperature: data.temperature ?? weather.temperature,
                        attributes: data.attributes || {},
                        friendlyName: data.friendly_name || ''
                    });
                }
            };
            mqttService.connect(config);
        } else {
            mqttService.disconnect();
        }
        return () => mqttService.disconnect();
    }, [enableMqtt, config.mqtt_host, config.mqtt_port, config.mqtt_username, config.mqtt_password]);

    // --- 同步状态到 MQTT ---
    useEffect(() => {
        if (mqttConnected) {
            mqttService.publishState({
                demo_mode: demoMode,
                demo_state: demoState,
                demo_festival: demoFestival,
                display_mode: displayMode,
                show_seconds: showSeconds,
                card_color: cardColor,
                card_opacity: cardOpacity,
                use_dynamic_color: useDynamicColor,
                enable_mqtt: enableMqtt,
                enable_api: enableApi,
                weather_entity: config.weather_entity
            });
        }
    }, [mqttConnected, demoMode, demoState, demoFestival, displayMode, showSeconds, cardColor, cardOpacity, useDynamicColor, enableMqtt, enableApi, config.weather_entity]);

    // --- 1.5. 获取局域网 IP 地址 ---
    useEffect(() => {
        const startTime = Date.now();
        console.log('⏱️ 开始获取 IP 地址...');

        const getIP = async () => {
            // 在 APP 中直接从 Android 获取 IP
            if (Capacitor.isNativePlatform()) {
                try {
                    const HttpServer = (await import('@capacitor/core')).registerPlugin('HttpServer');
                    const result = await HttpServer.getIpAddress();
                    if (result.ip) {
                        const elapsed = Date.now() - startTime;
                        setDeviceIP(result.ip);
                        console.log(`✅ 从 Android 获取 IP: ${result.ip} (耗时: ${elapsed}ms)`);
                        return;
                    }
                } catch (error) {
                    console.error('❌ 从 Android 获取 IP 失败:', error);
                }
            }

            // 浏览器环境：直接使用 hostname
            const hostname = window.location.hostname;
            if (hostname && hostname !== 'localhost') {
                const elapsed = Date.now() - startTime;
                setDeviceIP(hostname);
                console.log(`✅ 使用 hostname: ${hostname} (耗时: ${elapsed}ms)`);
            } else {
                // 如果是 localhost，尝试通过 WebRTC 获取
                console.log('⏱️ 使用 WebRTC 获取 IP...');
                const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
                pc.createDataChannel('');

                pc.onicecandidate = (ice) => {
                    if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                    const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                    const match = ipRegex.exec(ice.candidate.candidate);
                    if (match && match[1] !== '0.0.0.0') {
                        const elapsed = Date.now() - startTime;
                        console.log(`✅ WebRTC 获取 IP: ${match[1]} (耗时: ${elapsed}ms)`);
                        setDeviceIP(match[1]);
                        pc.close();
                    }
                };

                pc.createOffer().then(offer => pc.setLocalDescription(offer));
            }
        };
        getIP();
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
        if (demoMode || !enableApi) return;

        const fetchWeather = async () => {
            if (!config.ha_url || !config.ha_token) {
                // 如果 MQTT 已连接，就不显示错误提示
                if (!mqttConnected) {
                    setFetchError("请先配置 HA 地址和 Token 或 MQTT");
                }
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
    }, [config, demoMode, enableApi]);

    // --- 4. 远程配置同步 ---
    useEffect(() => {
        if (!useRemoteConfig) return;

        const loadRemoteConfig = async (isInitial = false) => {
            if (isSyncingRef.current) {
                console.log('⚠️ 同步进行中，跳过本次请求');
                return;
            }
            isSyncingRef.current = true;
            try {
                let apiUrl;
                if (serverUrl) {
                    // 优先使用用户配置的服务器地址
                    apiUrl = `${serverUrl.trim().replace(/\/$/, '')}/api/config`;
                } else if (deviceIP) {
                    // 使用自动检测的设备IP（支持 APP 和浏览器）
                    apiUrl = `http://${deviceIP}:3001/api/config`;
                } else {
                    console.log('⚠️ 跳过远程配置加载：正在获取设备IP...');
                    return;
                }

                const startTime = Date.now();
                console.log(`📥 ${isInitial ? '同步' : '检查'}远程配置:`, apiUrl);
                const fetchOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Accept': 'application/json; charset=utf-8'
                    }
                };
                // 在 Android APP 中访问 localhost，不需要设置 CORS mode
                if (!Capacitor.isNativePlatform()) {
                    fetchOptions.mode = 'cors';
                }
                const response = await fetch(apiUrl, fetchOptions);
                const fetchTime = Date.now() - startTime;
                console.log(`⏱️ loadRemoteConfig fetch 耗时: ${fetchTime}ms`);

                if (response.ok) {
                    const textStartTime = Date.now();
                    const text = await response.text();
                    const textTime = Date.now() - textStartTime;
                    console.log(`⏱️ response.text() 耗时: ${textTime}ms`);
                    const remoteConfig = JSON.parse(text);

                    // 只有在初始加载时才自动应用远程配置
                    // 后续的同步只检查是否有更新，但不自动覆盖本地修改
                    if (isInitial) {
                        console.log('✅ 应用远程配置到本地:', remoteConfig);
                        // 保存主配置到 localStorage
                        const mainConfig = {
                            ha_url: remoteConfig.ha_url,
                            ha_token: remoteConfig.ha_token,
                            weather_entity: remoteConfig.weather_entity,
                            location_name: remoteConfig.location_name,
                            mqtt_host: remoteConfig.mqtt_host,
                            mqtt_port: remoteConfig.mqtt_port,
                            mqtt_username: remoteConfig.mqtt_username,
                            mqtt_password: remoteConfig.mqtt_password
                        };
                        localStorage.setItem('smart_screen_config', JSON.stringify(mainConfig));
                        setConfig(mainConfig);
                        setEditConfig(mainConfig);

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
                        if (remoteConfig.display_mode) {
                            setDisplayMode(remoteConfig.display_mode);
                            localStorage.setItem('display_mode', remoteConfig.display_mode);
                        }
                        if (remoteConfig.show_seconds !== undefined) {
                            setShowSeconds(remoteConfig.show_seconds);
                            localStorage.setItem('show_seconds', remoteConfig.show_seconds);
                        }
                        if (remoteConfig.card_color) {
                            setCardColor(remoteConfig.card_color);
                            localStorage.setItem('card_color', remoteConfig.card_color);
                        }
                        if (remoteConfig.card_opacity !== undefined) {
                            setCardOpacity(remoteConfig.card_opacity);
                            localStorage.setItem('card_opacity', remoteConfig.card_opacity);
                        }
                        if (remoteConfig.use_dynamic_color !== undefined) {
                            setUseDynamicColor(remoteConfig.use_dynamic_color);
                            localStorage.setItem('use_dynamic_color', remoteConfig.use_dynamic_color);
                        }
                        if (remoteConfig.enable_mqtt !== undefined) {
                            setEnableMqtt(remoteConfig.enable_mqtt);
                            localStorage.setItem('enable_mqtt', remoteConfig.enable_mqtt);
                        }
                        if (remoteConfig.enable_api !== undefined) {
                            setEnableApi(remoteConfig.enable_api);
                            localStorage.setItem('enable_api', remoteConfig.enable_api);
                        }
                        setFetchError(null);
                        console.log('✅ 远程配置同步完成');
                    } else {
                        // 非初始加载时，只检查连接状态，不自动应用配置
                        console.log('✅ 远程配置连接正常（未应用配置）');
                    }
                } else {
                    console.error('❌ 远程配置请求失败:', response.status);
                }
            } catch (error) {
                console.error('❌ 远程配置同步失败:', error);
            } finally {
                isSyncingRef.current = false;
            }
        };

        // 初始加载远程配置
        loadRemoteConfig(true);

        // 检查同步触发器
        const checkSyncTrigger = async () => {
            try {
                let apiUrl;
                if (serverUrl) {
                    // 优先使用用户配置的服务器地址
                    apiUrl = `${serverUrl.trim().replace(/\/$/, '')}/api/sync-trigger`;
                } else if (deviceIP) {
                    // 使用自动检测的设备IP（支持 APP 和浏览器）
                    apiUrl = `http://${deviceIP}:3001/api/sync-trigger`;
                } else {
                    console.log('⚠️ 跳过同步检查：正在获取设备IP...');
                    return;
                }

                const startTime = Date.now();
                console.log('🔍 检查同步触发器:', apiUrl);
                const fetchOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Accept': 'application/json; charset=utf-8'
                    }
                };
                // 在 Android APP 中访问 localhost，不需要设置 CORS mode
                if (!Capacitor.isNativePlatform()) {
                    fetchOptions.mode = 'cors';
                }
                const response = await fetch(apiUrl, fetchOptions);
                const fetchTime = Date.now() - startTime;
                console.log(`⏱️ checkSyncTrigger fetch 耗时: ${fetchTime}ms`);

                if (response.ok) {
                    const data = await response.json();
                    console.log(`📊 服务器时间戳: ${data.timestamp}, 本地时间戳: ${lastSyncTriggerRef.current}`);

                    // 如果是第一次检查（lastSyncTrigger为0），记录时间戳但也触发一次同步确保配置最新
                    if (lastSyncTriggerRef.current === 0) {
                        console.log('📌 首次初始化，记录时间戳并同步配置');
                        lastSyncTriggerRef.current = data.timestamp;
                        await loadRemoteConfig(true);
                        return;
                    }

                    // 检查是否有新的配置更新
                    if (data.timestamp > lastSyncTriggerRef.current) {
                        console.log('🔄 检测到远程配置更新，自动同步...', {
                            oldTimestamp: lastSyncTriggerRef.current,
                            newTimestamp: data.timestamp,
                            timeDiff: data.timestamp - lastSyncTriggerRef.current
                        });
                        lastSyncTriggerRef.current = data.timestamp;
                        await loadRemoteConfig(true);
                    } else {
                        console.log('✅ 配置已是最新，无需同步');
                    }
                } else {
                    console.error('❌ 同步触发器请求失败:', response.status);
                }
            } catch (error) {
                console.error('❌ 检查同步触发器失败:', error);
            }
        };

        // 每3秒检查一次是否需要同步
        const syncCheckTimer = setInterval(checkSyncTrigger, 3000);

        return () => {
            clearInterval(syncCheckTimer);
        };
    }, [useRemoteConfig, serverUrl, deviceIP]);

    // --- 事件处理 ---
    const handleSaveConfig = () => {
        localStorage.setItem('smart_screen_config', JSON.stringify(editConfig));
        setConfig(editConfig);
        localStorage.setItem('demo_mode', demoMode);
        localStorage.setItem('display_mode', displayMode);
        localStorage.setItem('show_seconds', showSeconds);
        localStorage.setItem('card_color', cardColor);
        localStorage.setItem('card_opacity', cardOpacity);
        localStorage.setItem('use_dynamic_color', useDynamicColor);

        // 立即关闭设置界面
        setShowSettings(false);

        // 后台异步保存到服务器
        if (useRemoteConfig) {
            let apiUrl;
            if (serverUrl) {
                // 优先使用用户配置的服务器地址
                apiUrl = `${serverUrl.trim().replace(/\/$/, '')}/api/config`;
            } else if (deviceIP) {
                // 使用自动检测的设备IP（支持 APP 和浏览器）
                apiUrl = `http://${deviceIP}:3001/api/config`;
            } else {
                console.log('⚠️ 无法保存到服务器：正在获取设备IP...');
                return;
            }

            const configToSave = {
                ...editConfig,
                demo_mode: demoMode,
                demo_state: demoState,
                demo_festival: demoFestival,
                display_mode: displayMode,
                show_seconds: showSeconds,
                card_color: cardColor,
                card_opacity: cardOpacity,
                use_dynamic_color: useDynamicColor
            };

            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(configToSave)
            };
            // 在 Android APP 中访问 localhost，不需要设置 CORS mode
            if (!Capacitor.isNativePlatform()) {
                fetchOptions.mode = 'cors';
            }

            fetch(apiUrl, fetchOptions).then(() => {
                console.log('✅ 配置已保存到服务器');
            }).catch(error => {
                console.error('保存到服务器失败:', error);
            });
        }
    };

    // --- 切换显示模式 ---
    const handleToggleDisplayMode = () => {
        const newMode = displayMode === 'flip_clock' ? 'calendar' : 'flip_clock';
        setDisplayMode(newMode);
        localStorage.setItem('display_mode', newMode);

        // 同步到 MQTT
        if (mqttConnected) {
            mqttService.publishState({
                demo_mode: demoMode,
                demo_state: demoState,
                demo_festival: demoFestival,
                display_mode: newMode,
                show_seconds: showSeconds,
                card_color: cardColor,
                card_opacity: cardOpacity,
                use_dynamic_color: useDynamicColor,
                weather_entity: config.weather_entity
            });
        }
    };

    // --- 手动同步远程配置 ---
    const handleSyncRemoteConfig = async () => {
        if (!useRemoteConfig) return;

        try {
            // 在 Capacitor/Android APP 中使用 localhost，在浏览器中使用 deviceIP
            let apiUrl;
            if (Capacitor.isNativePlatform()) {
                // Android APP 环境：连接本地服务器
                apiUrl = 'http://localhost:3001/api/config';
            } else if (serverUrl) {
                // 浏览器环境且设置了服务器地址
                apiUrl = `${serverUrl.trim().replace(/\/$/, '')}/api/config`;
            } else if (deviceIP) {
                // 浏览器环境且有设备IP
                apiUrl = `http://${deviceIP}:3001/api/config`;
            } else {
                console.log('No valid remote server address');
                return;
            }

            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json; charset=utf-8'
                }
            };
            // 在 Android APP 中访问 localhost，不需要设置 CORS mode
            if (!Capacitor.isNativePlatform()) {
                fetchOptions.mode = 'cors';
            }
            const response = await fetch(apiUrl, fetchOptions);

            if (response.ok) {
                const text = await response.text();
                const remoteConfig = JSON.parse(text);

                // 保存主配置到 localStorage
                const mainConfig = {
                    ha_url: remoteConfig.ha_url,
                    ha_token: remoteConfig.ha_token,
                    weather_entity: remoteConfig.weather_entity,
                    location_name: remoteConfig.location_name,
                    mqtt_host: remoteConfig.mqtt_host,
                    mqtt_port: remoteConfig.mqtt_port,
                    mqtt_username: remoteConfig.mqtt_username,
                    mqtt_password: remoteConfig.mqtt_password
                };
                localStorage.setItem('smart_screen_config', JSON.stringify(mainConfig));
                setConfig(mainConfig);
                setEditConfig(mainConfig);

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
                if (remoteConfig.display_mode) {
                    setDisplayMode(remoteConfig.display_mode);
                    localStorage.setItem('display_mode', remoteConfig.display_mode);
                }
                if (remoteConfig.show_seconds !== undefined) {
                    setShowSeconds(remoteConfig.show_seconds);
                    localStorage.setItem('show_seconds', remoteConfig.show_seconds);
                }
                if (remoteConfig.card_color) {
                    setCardColor(remoteConfig.card_color);
                    localStorage.setItem('card_color', remoteConfig.card_color);
                }
                if (remoteConfig.card_opacity !== undefined) {
                    setCardOpacity(remoteConfig.card_opacity);
                    localStorage.setItem('card_opacity', remoteConfig.card_opacity);
                }
                if (remoteConfig.use_dynamic_color !== undefined) {
                    setUseDynamicColor(remoteConfig.use_dynamic_color);
                    localStorage.setItem('use_dynamic_color', remoteConfig.use_dynamic_color);
                }

                setFetchError(null);
                console.log('Remote config manually synced successfully');
            } else {
                console.log('Failed to sync remote config:', response.status);
            }
        } catch (error) {
            console.error('Manual remote config sync failed:', error);
        }
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
        if (key.includes('HAIL')) return <CloudHail {...props} />;
        if (key.includes('THUNDER')) return <CloudLightning {...props} />;
        if (key === 'SLEET') return <CloudDrizzle {...props} />;
        if (key.includes('RAIN')) return <CloudRain {...props} />;
        if (key.includes('SNOW')) return <CloudSnow {...props} />;
        if (key.includes('HAZE') || key.includes('FOG')) return <CloudFog {...props} />;
        if (key.includes('DUST') || key.includes('SAND') || key.includes('WIND')) return <Wind {...props} />;
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
                            <button
                                onClick={handleToggleDisplayMode}
                                className="transition-all hover:scale-110 focus:outline-none text-white/90 hover:text-white"
                                title={`切换到${displayMode === 'flip_clock' ? '日历' : '翻页时钟'}模式`}
                            >
                                {displayMode === 'flip_clock' ? <Calendar size={24} /> : <Clock size={24} />}
                            </button>
                            <button onClick={handleOpenSettings} className={`transition-all hover:scale-110 focus:outline-none relative ${fetchError ? 'text-red-400 animate-pulse' : 'text-white/90 hover:text-white'}`}>
                                <Settings size={24} />
                                {fetchError && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black box-content"></span>}
                            </button>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="flex-1 z-10 flex flex-col justify-center">
                        {displayMode === 'flip_clock' ? (
                            <div className="flex flex-col items-center justify-center h-full w-full animate-in fade-in duration-700">
                                <FlipClock time={now} showSeconds={showSeconds} cardColor={cardColor} cardOpacity={cardOpacity} />
                                <div className="mt-12 flex items-center justify-center flex-wrap gap-x-8 gap-y-4 text-xl text-white font-medium drop-shadow-lg bg-black/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-xl">
                                    <div className="flex items-center space-x-4 text-2xl">
                                        {getWeatherIcon(weather.mappedKey)}
                                        <span className="text-3xl">{getWeatherText(weather.mappedKey)}</span>
                                        <span className="text-4xl font-light ml-2">{weather.temperature}℃</span>
                                        {demoMode && <span className="bg-blue-500/80 text-[10px] px-1.5 py-0.5 rounded text-white font-bold tracking-wider uppercase ml-2 shadow-sm">DEMO</span>}
                                    </div>
                                    <div className="h-6 w-px bg-white/20"></div>
                                    <div className="text-xl text-white/80 tracking-widest font-light uppercase whitespace-nowrap">
                                        {formatDate(now)} · <span style={{ fontFamily: 'KaiTi, STKaiti, SimKai, serif' }}>{lunarData.dayStr}</span>
                                    </div>
                                    {((demoMode && demoFestival) || lunarData.festivalStr) && (
                                        <>
                                            <div className="h-6 w-px bg-white/20"></div>
                                            <div className="text-xl text-yellow-300 font-medium tracking-wider" style={{ fontFamily: 'KaiTi, STKaiti, SimKai, serif' }}>
                                                {(demoMode && demoFestival) ? demoFestival : lunarData.festivalStr}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-12 h-full">
                                {/* Left Info Column */}
                                <div className="col-span-5 flex flex-col justify-between pt-8 pb-4 pl-2">
                                    <div>
                                        <div className="flex items-center justify-start text-white leading-none tracking-tighter drop-shadow-2xl" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif' }}>
                                            {/* Hours */}
                                            <span className="text-[140px] font-bold tabular-nums">
                                                {formatTime(now).split(':')[0]}
                                            </span>

                                            {/* Styled Colon */}
                                            <span className="text-[120px] font-medium mx-1 pb-4 opacity-90">
                                                :
                                            </span>

                                            {/* Minutes */}
                                            <span className="text-[140px] font-bold tabular-nums">
                                                {formatTime(now).split(':')[1]}
                                            </span>
                                        </div>

                                        <div className="mt-4 text-3xl font-light text-white/95 tracking-widest drop-shadow-lg uppercase">
                                            {formatDate(now)}
                                        </div>

                                        <div className="mt-6 flex items-center space-x-4 text-2xl text-white font-medium drop-shadow-lg bg-black/20 backdrop-blur-md w-fit px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                                            {getWeatherIcon(weather.mappedKey)}
                                            <span>{getWeatherText(weather.mappedKey)}</span>
                                            <span className="text-3xl font-light">{weather.temperature}℃</span>
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
                                <div className="col-span-7 pt-4 pl-8 pr-0 flex items-center">
                                    <div className="grid grid-cols-7 gap-y-1 text-center w-full">
                                        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                                            <div key={day} className="text-white/80 font-medium text-xl mb-4 uppercase tracking-widest drop-shadow-md">
                                                {day}
                                            </div>
                                        ))}
                                        {renderCalendar()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings Modal */}
                    <SettingsModal
                        showSettings={showSettings} setShowSettings={setShowSettings}
                        fetchError={fetchError} setFetchError={setFetchError}
                        demoMode={demoMode} setDemoMode={setDemoMode}
                        demoState={demoState} setDemoState={setDemoState}
                        demoFestival={demoFestival} setDemoFestival={setDemoFestival}
                        displayMode={displayMode} setDisplayMode={setDisplayMode}
                        showSeconds={showSeconds} setShowSeconds={setShowSeconds}
                        cardColor={cardColor} setCardColor={setCardColor}
                        cardOpacity={cardOpacity} setCardOpacity={setCardOpacity}
                        useDynamicColor={useDynamicColor} setUseDynamicColor={setUseDynamicColor}
                        enableMqtt={enableMqtt} setEnableMqtt={setEnableMqtt}
                        enableApi={enableApi} setEnableApi={setEnableApi}
                        useRemoteConfig={useRemoteConfig} setUseRemoteConfig={setUseRemoteConfig}
                        deviceIP={deviceIP} editConfig={editConfig} setEditConfig={setEditConfig}
                        handleSaveConfig={handleSaveConfig} mqttConnected={mqttConnected}
                        syncRemoteConfig={handleSyncRemoteConfig}
                    />

                </div>
            </div>
        </div>
    );
};

export default SmartDisplay;
