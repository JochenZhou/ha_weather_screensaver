import React, { useState } from 'react';
import { Settings, X, Save, AlertTriangle, PlayCircle, Wifi, CheckCircle, XCircle, RotateCcw, RefreshCw, Home, Info, Github, Heart } from 'lucide-react';
import appLogo from '../assets/logo.png';

const SettingsModal = ({
    showSettings, setShowSettings, fetchError, demoMode, setDemoMode, demoState, setDemoState,
    demoFestival, setDemoFestival, displayMode, setDisplayMode, showSeconds, setShowSeconds,
    cardColor, setCardColor, cardOpacity, setCardOpacity, useDynamicColor, setUseDynamicColor,
    enableMqtt, setEnableMqtt, enableApi, setEnableApi,
    useRemoteConfig, setUseRemoteConfig, deviceIP,
    editConfig, setEditConfig, handleSaveConfig, setFetchError, mqttConnected,
    syncRemoteConfig = null
}) => {
    const [activeTab, setActiveTab] = useState('general');
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

    // Updated Navigation Items (Merged HA into Network)
    const navItems = [
        { id: 'general', icon: PlayCircle, label: '常规 / 演示', color: 'bg-indigo-500' },
        { id: 'display', icon: Settings, label: '显示与外观', color: 'bg-pink-500' },
        { id: 'network', icon: Wifi, label: '网络与远程', color: 'bg-blue-500' },
        { id: 'about', icon: Info, label: '关于 (About)', color: 'bg-gray-500' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
            {/* Backdrop - Transparent but clickable */}
            <div
                className="absolute inset-0 transition-opacity duration-300"
                onClick={() => setShowSettings(false)}
            />

            {/* Modal Window - Responsive Optimization */}
            <div className="relative w-[95%] h-[90%] md:w-auto md:h-auto md:min-w-[800px] md:min-h-[500px] max-w-5xl max-h-[85vh] bg-[#1c1c1e]/90 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden transition-all duration-300 md:aspect-[4/3] lg:aspect-video">

                {/* Sidebar */}
                <div className="w-[260px] bg-[#2c2c2e]/50 border-r border-white/5 flex flex-col shrink-0">
                    <div className="p-6 pb-4">
                        <h2 className="text-[22px] font-bold text-white tracking-tight">设置</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${activeTab === item.id
                                        ? 'bg-[#0a84ff] text-white'
                                        : 'text-[#8e8e93] hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${activeTab === item.id ? 'bg-white/20' : item.color}`}>
                                    <item.icon size={16} className="text-white" />
                                </div>
                                <span className="text-[15px] font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Footer removed as requested */}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
                    {/* Header */}
                    <div className="h-16 border-b border-white/5 flex justify-between items-center px-8 shrink-0 bg-white/5 backdrop-blur-md z-10">
                        <h2 className="text-[19px] font-semibold text-white">
                            {navItems.find(i => i.id === activeTab)?.label}
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-5 py-1.5 rounded-lg bg-[#3a3a3c] hover:bg-[#48484a] text-white text-[13px] font-medium transition-colors border border-white/5"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveConfig}
                                className="px-5 py-1.5 rounded-lg bg-[#0a84ff] hover:bg-[#0077d6] text-white text-[13px] font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                <Save size={14} />
                                保存
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                        <div className="max-w-3xl mx-auto space-y-8 pb-10">

                            {/* Error Alert */}
                            {fetchError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mb-6 animate-in slide-in-from-top-2">
                                    <AlertTriangle className="text-red-400 shrink-0" size={20} />
                                    <div className="text-[15px] space-y-1">
                                        <p className="font-semibold text-red-400">连接错误</p>
                                        <p className="text-red-200/80 leading-snug">{fetchError}</p>
                                    </div>
                                </div>
                            )}

                            {/* --- General / Demo --- */}
                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <h3 className="text-[13px] font-medium text-[#8e8e93] uppercase tracking-wide ml-4">演示模式</h3>
                                        <div className="bg-[#2c2c2e] rounded-xl overflow-hidden divide-y divide-white/5">
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                                                        <PlayCircle className="text-white" size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[17px] text-white leading-tight">启用演示</p>
                                                        <p className="text-[13px] text-gray-400 mt-0.5">预览天气特效与动画</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setDemoMode(!demoMode); if (!demoMode) setFetchError(null); }}
                                                    className={`w-[51px] h-[31px] rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1e] focus:ring-indigo-500 ${demoMode ? 'bg-[#34c759]' : 'bg-[#39393d]'}`}
                                                >
                                                    <div className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-300 ${demoMode ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                            {demoMode && (
                                                <>
                                                    <div className="p-4 flex items-center justify-between">
                                                        <span className="text-[17px] text-white">天气状态</span>
                                                        <select
                                                            value={demoState}
                                                            onChange={(e) => { setDemoState(e.target.value); localStorage.setItem('demo_state', e.target.value); }}
                                                            className="bg-transparent text-[#0a84ff] text-[17px] focus:outline-none text-right cursor-pointer dir-rtl pl-4 py-1"
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
                                                    </div>
                                                    <div className="p-4 flex items-center justify-between">
                                                        <span className="text-[17px] text-white">节日效果</span>
                                                        <select
                                                            value={demoFestival}
                                                            onChange={(e) => { setDemoFestival(e.target.value); localStorage.setItem('demo_festival', e.target.value); }}
                                                            className="bg-transparent text-[#0a84ff] text-[17px] focus:outline-none text-right cursor-pointer dir-rtl pl-4 py-1"
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
                                </div>
                            )}

                            {/* --- Display --- */}
                            {activeTab === 'display' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <h3 className="text-[13px] font-medium text-[#8e8e93] uppercase tracking-wide ml-4">主屏幕</h3>
                                        <div className="bg-[#2c2c2e] rounded-xl overflow-hidden divide-y divide-white/5">
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
                                                        <Settings className="text-white" size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[17px] text-white">显示模式</p>
                                                    </div>
                                                </div>
                                                <select
                                                    value={displayMode}
                                                    onChange={(e) => { setDisplayMode(e.target.value); localStorage.setItem('display_mode', e.target.value); }}
                                                    className="bg-transparent text-[#0a84ff] text-[17px] focus:outline-none text-right cursor-pointer dir-rtl"
                                                >
                                                    <option value="calendar">📅 日历模式</option>
                                                    <option value="flip_clock">⏰ 翻页时钟</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {displayMode === 'flip_clock' && (
                                        <div className="space-y-2">
                                            <h3 className="text-[13px] font-medium text-[#8e8e93] uppercase tracking-wide ml-4">时钟样式</h3>
                                            <div className="bg-[#2c2c2e] rounded-xl overflow-hidden divide-y divide-white/5">
                                                <div className="p-4 flex items-center justify-between">
                                                    <span className="text-[17px] text-white">显示秒数</span>
                                                    <button
                                                        onClick={() => { setShowSeconds(!showSeconds); localStorage.setItem('show_seconds', !showSeconds); }}
                                                        className={`w-[51px] h-[31px] rounded-full relative transition-colors duration-300 ${showSeconds ? 'bg-[#34c759]' : 'bg-[#39393d]'}`}
                                                    >
                                                        <div className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-300 ${showSeconds ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                <div className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[17px] text-white">动态跟随颜色</p>
                                                        <p className="text-[13px] text-gray-400 mt-0.5">从天气背景提取主色调</p>
                                                    </div>
                                                    <button
                                                        onClick={() => { setUseDynamicColor(!useDynamicColor); localStorage.setItem('use_dynamic_color', !useDynamicColor); }}
                                                        className={`w-[51px] h-[31px] rounded-full relative transition-colors duration-300 ${useDynamicColor ? 'bg-[#34c759]' : 'bg-[#39393d]'}`}
                                                    >
                                                        <div className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-300 ${useDynamicColor ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>

                                                {!useDynamicColor && (
                                                    <div className="p-4 flex items-center justify-between">
                                                        <span className="text-[17px] text-white">自定义颜色</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-gray-400 text-sm font-mono uppercase">{cardColor}</span>
                                                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                                                <input
                                                                    type="color"
                                                                    value={cardColor}
                                                                    onChange={(e) => { setCardColor(e.target.value); localStorage.setItem('card_color', e.target.value); }}
                                                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="p-4 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[17px] text-white">卡片透明度</span>
                                                        <span className="text-[#8e8e93] text-[15px]">{Math.round(cardOpacity * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.05"
                                                        value={cardOpacity}
                                                        onChange={(e) => { setCardOpacity(parseFloat(e.target.value)); localStorage.setItem('card_opacity', e.target.value); }}
                                                        className="w-full h-1.5 bg-[#48484a] rounded-lg appearance-none cursor-pointer accent-[#0a84ff]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- Network & Remote & Home Assistant (Merged) --- */}
                            {activeTab === 'network' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                    {/* Home Assistant API (Moved Here) */}
                                    {/* Use a clear visual separation or grouped properly */}
                                    <div className="space-y-2">
                                        <h3 className="text-[13px] font-medium text-[#8e8e93] uppercase tracking-wide ml-4">Home Assistant</h3>
                                        <div className="bg-[#2c2c2e] rounded-xl overflow-hidden divide-y divide-white/5">
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#03a9f4] flex items-center justify-center">
                                                        <Home className="text-white" size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[17px] text-white">API 连接</p>
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
                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-center justify-between bg-[#1c1c1e] p-3 rounded-lg border border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[13px] ${(!editConfig.ha_url || !editConfig.ha_token) ? 'text-orange-400' : 'text-green-400'}`}>
                                                                {(!editConfig.ha_url || !editConfig.ha_token) ? '⚠️ 缺少配置参数' : '✓ 配置已就绪'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={testApiConnection}
                                                            disabled={apiTestResult === 'testing'}
                                                            className="px-3 py-1.5 bg-[#3a3a3c] hover:bg-[#48484a] text-white text-[13px] rounded-md transition-colors disabled:opacity-50"
                                                        >
                                                            {apiTestResult === 'testing' ? '测试中...' : '测试连接'}
                                                        </button>
                                                    </div>

                                                    {apiTestMessage && (
                                                        <div className={`p-3 rounded-lg text-[13px] font-mono flex items-center gap-2 ${apiTestResult === 'success'
                                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                            : apiTestResult === 'error'
                                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            }`}>
                                                            {apiTestResult === 'success' ? <CheckCircle size={14} /> : apiTestResult === 'error' ? <XCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                                                            {apiTestMessage}
                                                        </div>
                                                    )}

                                                    <div className="space-y-1.5">
                                                        <label className="text-[13px] font-medium text-[#8e8e93] ml-1">服务器地址</label>
                                                        <input
                                                            type="text"
                                                            value={editConfig.ha_url}
                                                            onChange={(e) => setEditConfig({ ...editConfig, ha_url: e.target.value })}
                                                            placeholder="http://192.168.1.100:8123"
                                                            className="w-full h-10 bg-[#1c1c1e] text-white px-3 rounded-lg border border-white/5 focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] outline-none transition-all text-[15px] font-mono placeholder-[#48484a]"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[13px] font-medium text-[#8e8e93] ml-1">长期访问令牌 (Token)</label>
                                                        <textarea
                                                            value={editConfig.ha_token}
                                                            onChange={(e) => setEditConfig({ ...editConfig, ha_token: e.target.value })}
                                                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                                            className="w-full h-24 bg-[#1c1c1e] text-white p-3 rounded-lg border border-white/5 focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] outline-none transition-all font-mono text-[13px] resize-none leading-relaxed placeholder-[#48484a]"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[13px] font-medium text-[#8e8e93] ml-1">实体 ID</label>
                                                            <input
                                                                type="text"
                                                                value={editConfig.weather_entity}
                                                                onChange={(e) => setEditConfig({ ...editConfig, weather_entity: e.target.value })}
                                                                placeholder="weather.home"
                                                                className="w-full h-10 bg-[#1c1c1e] text-white px-3 rounded-lg border border-white/5 focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] outline-none transition-all text-[15px] font-mono placeholder-[#48484a]"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[13px] font-medium text-[#8e8e93] ml-1">位置名称</label>
                                                            <input
                                                                type="text"
                                                                value={editConfig.location_name}
                                                                onChange={(e) => setEditConfig({ ...editConfig, location_name: e.target.value })}
                                                                placeholder="客厅"
                                                                className="w-full h-10 bg-[#1c1c1e] text-white px-3 rounded-lg border border-white/5 focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] outline-none transition-all text-[15px] placeholder-[#48484a]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* MQTT */}
                                    <div className="space-y-2">
                                        <h3 className="text-[13px] font-medium text-[#8e8e93] uppercase tracking-wide ml-4">MQTT 服务</h3>
                                        <div className="bg-[#2c2c2e] rounded-xl overflow-hidden divide-y divide-white/5">
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                                                        <Wifi className="text-white" size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[17px] text-white">MQTT 连接</p>
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
                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-center justify-between bg-[#1c1c1e] p-3 rounded-lg border border-white/5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${mqttConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} />
                                                            <span className={`text-[15px] font-medium ${mqttConnected ? 'text-white' : 'text-[#8e8e93]'}`}>
                                                                {mqttConnected ? '已连接' : '未连接'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={testMqttConnection}
                                                            disabled={mqttTestResult === 'testing'}
                                                            className="px-3 py-1.5 bg-[#3a3a3c] hover:bg-[#48484a] text-white text-[13px] rounded-md transition-colors disabled:opacity-50"
                                                        >
                                                            {mqttTestResult === 'testing' ? '测试中...' : '测试连接'}
                                                        </button>
                                                    </div>

                                                    {mqttTestMessage && (
                                                        <div className={`p-3 rounded-lg text-[13px] font-mono flex items-center gap-2 ${mqttTestResult === 'success'
                                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                            : mqttTestResult === 'error'
                                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            }`}>
                                                            {mqttTestResult === 'success' ? <CheckCircle size={14} /> : mqttTestResult === 'error' ? <XCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                                                            {mqttTestMessage}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[13px] font-medium text-[#8e8e93] ml-1">主机地址</label>
                                                            <input
                                                                type="text"
                                                                value={editConfig.mqtt_host || ''}
                                                                onChange={(e) => setEditConfig({ ...editConfig, mqtt_host: e.target.value })}
                                                                placeholder="192.168.1.100"
                                                                className="w-full h-10 bg-[#1c1c1e] text-white px-3 rounded-lg border border-white/5 focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] outline-none transition-all text-[15px] font-mono placeholder-[#48484a]"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[13px] font-medium text-[#8e8e93] ml-1">端口</label>
                                                            <input
                                                                type="text"
                                                                value={editConfig.mqtt_port || ''}
                                                                onChange={(e) => setEditConfig({ ...editConfig, mqtt_port: e.target.value })}
                                                                placeholder="1884"
                                                                className="w-full h-10 bg-[#1c1c1e] text-white px-3 rounded-lg border border-white/5 focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] outline-none transition-all text-[15px] font-mono placeholder-[#48484a]"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[13px] font-medium text-[#8e8e93] ml-1">用户名</label>
                                                            <input
                                                                type="text"
                                                                value={editConfig.mqtt_username || ''}
                                                                onChange={(e) => setEditConfig({ ...editConfig, mqtt_username: e.target.value })}
                                                                placeholder="可选"
                                                                className="w-full h-10 bg-[#1c1c1e] text-white px-3 rounded-lg border border-white/5 focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] outline-none transition-all text-[15px] placeholder-[#48484a]"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[13px] font-medium text-[#8e8e93] ml-1">密码</label>
                                                            <input
                                                                type="password"
                                                                value={editConfig.mqtt_password || ''}
                                                                onChange={(e) => setEditConfig({ ...editConfig, mqtt_password: e.target.value })}
                                                                placeholder="可选"
                                                                className="w-full h-10 bg-[#1c1c1e] text-white px-3 rounded-lg border border-white/5 focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] outline-none transition-all text-[15px] placeholder-[#48484a]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Remote Config */}
                                    <div className="space-y-2">
                                        <h3 className="text-[13px] font-medium text-[#8e8e93] uppercase tracking-wide ml-4">远程配置</h3>
                                        <div className="bg-[#2c2c2e] rounded-xl overflow-hidden divide-y divide-white/5">
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                                        <Settings className="text-white" size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[17px] text-white">远程同步</p>
                                                        <p className="text-[13px] text-gray-400 mt-0.5">从局域网服务器同步配置</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setUseRemoteConfig(!useRemoteConfig); localStorage.setItem('use_remote_config', !useRemoteConfig); }}
                                                    className={`w-[51px] h-[31px] rounded-full relative transition-colors duration-300 ${useRemoteConfig ? 'bg-[#34c759]' : 'bg-[#39393d]'}`}
                                                >
                                                    <div className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-300 ${useRemoteConfig ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                                </button>
                                            </div>

                                            {useRemoteConfig && (
                                                <div className="p-6 bg-[#1c1c1e]/50">
                                                    <div className="bg-[#2c2c2e] rounded-xl p-6 flex flex-col items-center text-center border border-white/5">
                                                        <div className="w-40 h-40 bg-white rounded-xl mb-4 p-2 shadow-sm">
                                                            {deviceIP ? (
                                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`http://${deviceIP}:3001`)}`} alt="QR Code" className="w-full h-full" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center animate-pulse bg-gray-100 rounded">
                                                                    <span className="text-xs text-gray-400">加载中...</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1 mb-4">
                                                            <p className="text-[13px] text-[#8e8e93] uppercase tracking-wide">配置地址</p>
                                                            <p className="text-white font-mono text-[15px] select-all">
                                                                {deviceIP ? `http://${deviceIP}:3001` : '正在获取 IP...'}
                                                            </p>
                                                        </div>

                                                        <button
                                                            onClick={() => syncRemoteConfig && syncRemoteConfig()}
                                                            className="w-full py-2.5 bg-[#0a84ff] hover:bg-[#0071e3] text-white text-[15px] font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                        >
                                                            <RefreshCw size={16} />
                                                            立即同步
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- About --- */}
                            {activeTab === 'about' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="text-center py-8">
                                        <div className="w-24 h-24 bg-transparent rounded-[24px] mx-auto shadow-sm flex items-center justify-center mb-4 overflow-hidden">
                                            {/* Used actual appLogo */}
                                            <img src={appLogo} alt="SmartScreen Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                                        </div>
                                        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">HA 天气屏</h1>
                                    </div>

                                    <div className="bg-[#2c2c2e] rounded-xl overflow-hidden divide-y divide-white/5">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#24292e] flex items-center justify-center">
                                                    <Github className="text-white" size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[17px] text-white">项目源码</p>
                                                    <p className="text-[13px] text-gray-500 font-mono select-all">https://github.com/JochenZhou/SmartScreenUI</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                                    <CheckCircle className="text-white" size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[17px] text-white">当前版本</p>
                                                    <p className="text-[13px] text-gray-500">1.1.0</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
