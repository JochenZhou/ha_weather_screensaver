import React, { useState } from 'react';
import { Settings, X, Save, AlertTriangle, PlayCircle, Wifi, CheckCircle, XCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const SettingsModal = ({
    showSettings, setShowSettings, fetchError, demoMode, setDemoMode, demoState, setDemoState,
    demoFestival, setDemoFestival, displayMode, setDisplayMode, showSeconds, setShowSeconds,
    cardColor, setCardColor, cardOpacity, setCardOpacity, useDynamicColor, setUseDynamicColor,
    useRemoteConfig, setUseRemoteConfig, deviceIP,
    editConfig, setEditConfig, handleSaveConfig, setFetchError, mqttConnected,
    syncRemoteConfig = null
}) => {
    const [enableMqtt, setEnableMqtt] = useState(localStorage.getItem('enable_mqtt') !== 'false');
    const [enableApi, setEnableApi] = useState(localStorage.getItem('enable_api') !== 'false');
    const [mqttTestResult, setMqttTestResult] = useState(null);
    const [mqttTestMessage, setMqttTestMessage] = useState('');
    const [apiTestResult, setApiTestResult] = useState(null);
    const [apiTestMessage, setApiTestMessage] = useState('');

    // 生成实时版本号
    const getBuildVersion = () => {
        const now = new Date();
        return now.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
    };

    const testMqttConnection = async () => {
        setMqttTestResult('testing');
        setMqttTestMessage('正在测试 MQTT 连接...');

        try {
            const mqttModule = await import('mqtt');
            const mqtt = mqttModule.default || mqttModule;
            const url = `ws://${editConfig.mqtt_host}:${editConfig.mqtt_port || 1884}/`;
            console.log('Testing MQTT connection to:', url);

            const client = mqtt.connect(url, {
                username: editConfig.mqtt_username || undefined,
                password: editConfig.mqtt_password || undefined,
                connectTimeout: 10000
            });

            const timeout = setTimeout(() => {
                client.end(true);
                setMqttTestResult('error');
                setMqttTestMessage('✗ 连接超时：无法连接到 MQTT 服务器');
                setTimeout(() => {
                    setMqttTestResult(null);
                    setMqttTestMessage('');
                }, 5000);
            }, 10000);

            client.on('connect', () => {
                clearTimeout(timeout);
                setMqttTestResult('success');
                setMqttTestMessage(`✓ MQTT 连接成功！ (${url})`);
                client.end();
                setTimeout(() => {
                    setMqttTestResult(null);
                    setMqttTestMessage('');
                }, 5000);
            });

            client.on('error', (err) => {
                clearTimeout(timeout);
                console.error('MQTT test error:', err);
                setMqttTestResult('error');
                setMqttTestMessage(`✗ MQTT 连接失败: ${err.message || '未知错误'}`);
                client.end(true);
                setTimeout(() => {
                    setMqttTestResult(null);
                    setMqttTestMessage('');
                }, 5000);
            });
        } catch (error) {
            console.error('MQTT test exception:', error);
            setMqttTestResult('error');
            setMqttTestMessage(`✗ MQTT 测试异常: ${error.message}`);
            setTimeout(() => {
                setMqttTestResult(null);
                setMqttTestMessage('');
            }, 5000);
        }
    };

    const testApiConnection = async () => {
        if (!editConfig.ha_url || !editConfig.ha_token) {
            setApiTestResult('error');
            setApiTestMessage('请填写服务器地址和令牌');
            setTimeout(() => {
                setApiTestResult(null);
                setApiTestMessage('');
            }, 5000);
            return;
        }
        setApiTestResult('testing');
        setApiTestMessage('正在连接...');
        try {
            const response = await fetch(`${editConfig.ha_url}/api/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${editConfig.ha_token}`,
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                cache: 'no-cache'
            });

            if (response.ok) {
                // 验证响应内容是否真的是 HA API
                const data = await response.json();

                if (data && data.message && data.message.includes('API running')) {
                    setApiTestResult('success');
                    setApiTestMessage('✓ 连接成功！API 正常运行');
                } else {
                    setApiTestResult('error');
                    setApiTestMessage(`✗ 响应异常: ${JSON.stringify(data)}`);
                }
                setTimeout(() => {
                    setApiTestResult(null);
                    setApiTestMessage('');
                }, 5000);
            } else {
                setApiTestResult('error');
                setApiTestMessage(`✗ 连接失败: HTTP ${response.status} ${response.statusText}`);
                setTimeout(() => {
                    setApiTestResult(null);
                    setApiTestMessage('');
                }, 5000);
            }
        } catch (error) {
            setApiTestResult('error');
            setApiTestMessage(`✗ 网络错误: ${error.message}`);
            setTimeout(() => {
                setApiTestResult(null);
                setApiTestMessage('');
            }, 5000);
        }
    };

    if (!showSettings) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 transition-opacity duration-300">
            <div className="bg-[#111] w-full h-full max-h-full rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10 shrink-0">
                    <h2 className="text-xl text-white font-semibold flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20"><Settings className="text-white" size={20} /></div>
                        系统设置
                    </h2>
                    <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto text-left custom-scrollbar flex-1">
                    {fetchError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-4 backdrop-blur-sm">
                            <div className="p-2 bg-red-500/20 rounded-full"><AlertTriangle className="text-red-400" size={18} /></div>
                            <div className="text-sm text-red-200/90">
                                <p className="font-semibold mb-1 text-red-100">连接错误</p>
                                <p>{fetchError}</p>
                            </div>
                        </div>
                    )}

                    {/* Demo Mode Section - iOS Grouped Style */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-4">演示模式</h3>
                        <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500 rounded-lg"><PlayCircle className="text-white" size={20} /></div>
                                    <div>
                                        <p className="text-white font-medium text-[17px]">启用演示</p>
                                        <p className="text-xs text-gray-400">预览所有高级天气特效</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setDemoMode(!demoMode); if (!demoMode) setFetchError(null); }}
                                    className={`w-[51px] h-[31px] rounded-full relative transition-colors duration-300 ${demoMode ? 'bg-[#34c759]' : 'bg-[#39393d]'}`}
                                >
                                    <div className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-300 ${demoMode ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {demoMode && (
                                <>
                                    <div className="p-4 flex items-center justify-between border-b border-white/5">
                                        <span className="text-white text-[17px]">天气状态</span>
                                        <select value={demoState} onChange={(e) => { setDemoState(e.target.value); localStorage.setItem('demo_state', e.target.value); }}
                                            className="bg-transparent text-blue-500 text-[17px] focus:outline-none text-right cursor-pointer dir-rtl">
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
                                    </div>
                                    <div className="p-4 flex items-center justify-between">
                                        <span className="text-white text-[17px]">节日效果</span>
                                        <select value={demoFestival} onChange={(e) => { setDemoFestival(e.target.value); localStorage.setItem('demo_festival', e.target.value); }}
                                            className="bg-transparent text-blue-500 text-[17px] focus:outline-none text-right cursor-pointer dir-rtl">
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
                                            <option value="元旦">🎉 元旦</option>
                                            <option value="腊八">🥣 腊八</option>
                                            <option value="重阳">🏔️ 重阳</option>
                                            <option value="母亲节">👩 母亲节</option>
                                            <option value="父亲节">👨 父亲节</option>
                                            <option value="儿童节">🎈 儿童节</option>
                                            <option value="劳动节">🛠️ 劳动节</option>
                                            <option value="万圣节">🎃 万圣节</option>
                                            <option value="520">💖 520</option>
                                            <option value="七夕">💑 七夕</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Display Mode Section */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-4">显示模式</h3>
                        <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-500 rounded-lg"><Settings className="text-white" size={20} /></div>
                                    <div>
                                        <p className="text-white font-medium text-[17px]">当前模式</p>
                                        <p className="text-xs text-gray-400">选择主屏幕显示样式</p>
                                    </div>
                                </div>
                                <select
                                    value={displayMode}
                                    onChange={(e) => { setDisplayMode(e.target.value); localStorage.setItem('display_mode', e.target.value); }}
                                    className="bg-transparent text-blue-500 text-[17px] focus:outline-none text-right cursor-pointer dir-rtl"
                                >
                                    <option value="calendar">📅 日历模式</option>
                                    <option value="flip_clock">⏰ 翻页时钟</option>
                                </select>
                            </div>

                            {displayMode === 'flip_clock' && (
                                <>
                                    <div className="p-4 flex items-center justify-between border-b border-white/5 last:border-0">
                                        <span className="text-white text-[17px]">显示秒针</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={showSeconds} onChange={(e) => { setShowSeconds(e.target.checked); localStorage.setItem('show_seconds', e.target.checked); }} className="sr-only peer" />
                                            <div className="w-[51px] h-[31px] bg-[#39393d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[27px] after:w-[27px] after:shadow-sm after:transition-all peer-checked:bg-[#34c759]"></div>
                                        </label>
                                    </div>
                                    <div className="p-4 flex items-center justify-between border-b border-white/5 last:border-0">
                                        <div>
                                            <p className="text-white text-[17px]">动态色模式</p>
                                            <p className="text-xs text-gray-400 mt-0.5">从天气背景提取主色调</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={useDynamicColor} onChange={(e) => { setUseDynamicColor(e.target.checked); localStorage.setItem('use_dynamic_color', e.target.checked); }} className="sr-only peer" />
                                            <div className="w-[51px] h-[31px] bg-[#39393d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[27px] after:w-[27px] after:shadow-sm after:transition-all peer-checked:bg-[#34c759]"></div>
                                        </label>
                                    </div>
                                    {!useDynamicColor && (
                                        <>
                                            <div className="p-4 flex items-center justify-between border-b border-white/5 last:border-0">
                                                <span className="text-white text-[17px]">卡片颜色</span>
                                                <div className="flex items-center gap-2">
                                                    <input type="color" value={cardColor} onChange={(e) => { setCardColor(e.target.value); localStorage.setItem('card_color', e.target.value); }}
                                                        className="w-8 h-8 rounded-full overflow-hidden border-0 p-0 cursor-pointer" />
                                                    <span className="text-gray-400 text-sm font-mono uppercase">{cardColor}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="p-4 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white text-[17px]">卡片透明度</span>
                                            <span className="text-gray-400 text-sm">{Math.round(cardOpacity * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={cardOpacity}
                                            onChange={(e) => { setCardOpacity(parseFloat(e.target.value)); localStorage.setItem('card_opacity', e.target.value); }}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Remote Config Section - iOS Grouped Style */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-4">远程配置</h3>
                        <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-500 rounded-lg"><Settings className="text-white" size={20} /></div>
                                    <div>
                                        <p className="text-white font-medium text-[17px]">启用远程配置</p>
                                        <p className="text-xs text-gray-400">从局域网服务器同步</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={useRemoteConfig} onChange={(e) => { setUseRemoteConfig(e.target.checked); localStorage.setItem('use_remote_config', e.target.checked); }} className="sr-only peer" />
                                    <div className="w-[51px] h-[31px] bg-[#39393d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[27px] after:w-[27px] after:shadow-sm after:transition-all peer-checked:bg-[#34c759]"></div>
                                </label>
                            </div>

                            {useRemoteConfig && (
                                <div className="p-4 bg-[#1c1c1e]/50">
                                    <div className="bg-[#3a3a3c] rounded-xl p-4 flex flex-col items-center text-center shadow-lg">
                                        <p className="text-[13px] text-gray-400 mb-3 font-medium uppercase tracking-wide">扫码配置</p>
                                        {deviceIP ? (
                                            <div className="bg-white p-2 rounded-xl mb-3 shadow-sm">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`http://${deviceIP}:3001`)}`} alt="QR Code" className="w-32 h-32" />
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 bg-white/10 rounded-xl mb-3 flex items-center justify-center animate-pulse">
                                                <span className="text-xs text-white/30">获取IP...</span>
                                            </div>
                                        )}
                                        <p className="text-white font-mono text-[15px] tracking-wide bg-black/30 px-3 py-1 rounded-lg mb-1">
                                            {deviceIP ? `http://${deviceIP}:3001` : '正在获取IP地址...'}
                                        </p>
                                        {Capacitor.isNativePlatform() && <p className="text-[11px] text-yellow-500/80 mt-1">状态: {localStorage.getItem('server_status') || '启动中...'}</p>}
                                        <button
                                            onClick={() => syncRemoteConfig && syncRemoteConfig()}
                                            className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
                                        >
                                            <RefreshCw size={12} />
                                            同步配置
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MQTT Config Section */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-4">MQTT 连接</h3>
                        <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-orange-500 rounded-lg"><Wifi className="text-white" size={20} /></div>
                                    <div>
                                        <p className="text-white font-medium text-[17px]">启用 MQTT</p>
                                        <p className="text-xs text-gray-400">连接到 MQTT 服务器</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setEnableMqtt(!enableMqtt); localStorage.setItem('enable_mqtt', !enableMqtt); }}
                                    className={`w-[51px] h-[31px] rounded-full relative transition-colors duration-300 ${enableMqtt ? 'bg-[#34c759]' : 'bg-[#39393d]'}`}
                                >
                                    <div className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-300 ${enableMqtt ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {enableMqtt && (
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wifi size={16} className={mqttConnected ? 'text-green-500' : 'text-gray-500'} />
                                            <span className={`text-sm ${mqttConnected ? 'text-green-500' : 'text-gray-500'}`}>
                                                {mqttConnected ? '已连接' : '未连接'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={testMqttConnection}
                                            disabled={mqttTestResult === 'testing'}
                                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {mqttTestResult === 'testing' && '测试中...'}
                                            {mqttTestResult === 'success' && <><CheckCircle size={16} /> 成功</>}
                                            {mqttTestResult === 'error' && <><XCircle size={16} /> 失败</>}
                                            {!mqttTestResult && '测试连接'}
                                        </button>
                                    </div>
                                    {mqttTestMessage && (
                                        <div className={`p-3 rounded-lg text-sm font-mono ${mqttTestResult === 'success'
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : mqttTestResult === 'error'
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                            {mqttTestMessage}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-gray-400 ml-1">MQTT 服务器</label>
                                            <input type="text" value={editConfig.mqtt_host || ''} onChange={(e) => setEditConfig({ ...editConfig, mqtt_host: e.target.value })} placeholder="192.168.1.100"
                                                className="w-full bg-[#1c1c1e] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 transition-all text-[15px] font-mono" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-gray-400 ml-1">WebSocket 端口</label>
                                            <input type="text" value={editConfig.mqtt_port || ''} onChange={(e) => setEditConfig({ ...editConfig, mqtt_port: e.target.value })} placeholder="1884"
                                                className="w-full bg-[#1c1c1e] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 transition-all text-[15px] font-mono" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-gray-400 ml-1">用户名</label>
                                            <input type="text" value={editConfig.mqtt_username || ''} onChange={(e) => setEditConfig({ ...editConfig, mqtt_username: e.target.value })} placeholder="可选"
                                                className="w-full bg-[#1c1c1e] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 transition-all text-[15px]" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-gray-400 ml-1">密码</label>
                                            <input type="password" value={editConfig.mqtt_password || ''} onChange={(e) => setEditConfig({ ...editConfig, mqtt_password: e.target.value })} placeholder="可选"
                                                className="w-full bg-[#1c1c1e] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 transition-all text-[15px]" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-1">连接后会自动在 HA 中创建演示模式和天气实体控制</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* HA Config Section - iOS Grouped Style */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-4">Home Assistant 连接</h3>
                        <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-500 rounded-lg"><Settings className="text-white" size={20} /></div>
                                    <div>
                                        <p className="text-white font-medium text-[17px]">启用 API</p>
                                        <p className="text-xs text-gray-400">连接到 Home Assistant</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setEnableApi(!enableApi); localStorage.setItem('enable_api', !enableApi); }}
                                    className={`w-[51px] h-[31px] rounded-full relative transition-colors duration-300 ${enableApi ? 'bg-[#34c759]' : 'bg-[#39393d]'}`}
                                >
                                    <div className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-300 ${enableApi ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {enableApi && (
                                <div className="p-4 space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-400">
                                                    {(!editConfig.ha_url || !editConfig.ha_token) ? '请填写配置参数' : '配置已填写'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={testApiConnection}
                                                disabled={apiTestResult === 'testing'}
                                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {apiTestResult === 'testing' && '测试中...'}
                                                {apiTestResult === 'success' && <><CheckCircle size={16} /> 成功</>}
                                                {apiTestResult === 'error' && <><XCircle size={16} /> 失败</>}
                                                {!apiTestResult && '测试连接'}
                                            </button>
                                        </div>
                                        {apiTestMessage && (
                                            <div className={`p-3 rounded-lg text-sm font-mono ${apiTestResult === 'success'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : apiTestResult === 'error'
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {apiTestMessage}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[13px] font-medium text-gray-400 ml-1">服务器地址</label>
                                        <input type="text" value={editConfig.ha_url} onChange={(e) => setEditConfig({ ...editConfig, ha_url: e.target.value })} placeholder="http://192.168.1.100:8123"
                                            className="w-full bg-[#1c1c1e] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 transition-all text-[17px]" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[13px] font-medium text-gray-400 ml-1">长期访问令牌</label>
                                        <textarea value={editConfig.ha_token} onChange={(e) => setEditConfig({ ...editConfig, ha_token: e.target.value })} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                            className="w-full h-24 bg-[#1c1c1e] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-[13px] resize-none leading-relaxed" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-gray-400 ml-1">实体 ID</label>
                                            <input type="text" value={editConfig.weather_entity} onChange={(e) => setEditConfig({ ...editConfig, weather_entity: e.target.value })} placeholder="weather.home"
                                                className="w-full bg-[#1c1c1e] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 transition-all text-[15px] font-mono" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-gray-400 ml-1">位置名称</label>
                                            <input type="text" value={editConfig.location_name} onChange={(e) => setEditConfig({ ...editConfig, location_name: e.target.value })} placeholder="客厅"
                                                className="w-full bg-[#1c1c1e] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 transition-all text-[15px]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center gap-4 shrink-0">
                    <div className="text-xs text-gray-500 font-mono">
                        v1.0.0 Build {getBuildVersion()}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowSettings(false)} className="px-6 py-2.5 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white/80 hover:text-white transition-all text-sm font-medium flex items-center gap-2">
                            <RotateCcw size={16} />取消
                        </button>
                        <button onClick={handleSaveConfig} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all transform hover:scale-[1.02]">
                            <Save size={18} />保存设置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
