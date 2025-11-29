import React from 'react';
import { Settings, X, Save, AlertTriangle, PlayCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const SettingsModal = ({
    showSettings, setShowSettings, fetchError, demoMode, setDemoMode, demoState, setDemoState,
    demoFestival, setDemoFestival, useRemoteConfig, setUseRemoteConfig, deviceIP,
    editConfig, setEditConfig, handleSaveConfig, setFetchError
}) => {
    if (!showSettings) return null;

    return (
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
                                <select value={demoState} onChange={(e) => { setDemoState(e.target.value); localStorage.setItem('demo_state', e.target.value); }}
                                    className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors">
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
                                <select value={demoFestival} onChange={(e) => { setDemoFestival(e.target.value); localStorage.setItem('demo_festival', e.target.value); }}
                                    className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors">
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
                            <button onClick={() => { setDemoMode(!demoMode); if (!demoMode) setFetchError(null); }}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${demoMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}>
                                {demoMode ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl"><Settings className="text-purple-400" size={24} /></div>
                                <div>
                                    <p className="text-white font-medium text-lg">远程配置</p>
                                    <p className="text-xs text-white/40 mt-1">从局域网服务器同步配置</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={useRemoteConfig} onChange={(e) => { setUseRemoteConfig(e.target.checked); localStorage.setItem('use_remote_config', e.target.checked); }} className="sr-only peer" />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                            </label>
                        </div>
                        {useRemoteConfig && (
                            <div className="space-y-3">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-xs text-white/60 mb-2">📱 远程配置地址</p>
                                    {Capacitor.isNativePlatform() && <p className="text-xs text-yellow-400 mb-2">服务器状态: {localStorage.getItem('server_status') || '启动中...'}</p>}
                                    <p className="text-white font-mono text-sm mb-3 break-all">{deviceIP ? `http://${deviceIP}:3001` : '正在获取IP地址...'}</p>
                                    {deviceIP && (
                                        <div className="bg-white p-2 rounded-lg w-32 mx-auto">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`http://${deviceIP}:3001`)}`} alt="QR Code" className="w-full h-auto" />
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
                            <input type="text" value={editConfig.ha_url} onChange={(e) => setEditConfig({ ...editConfig, ha_url: e.target.value })} placeholder="http://192.168.1.100:8123"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-mono" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">长期访问令牌</label>
                            <textarea value={editConfig.ha_token} onChange={(e) => setEditConfig({ ...editConfig, ha_token: e.target.value })} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                className="w-full h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-xs resize-none leading-relaxed" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">实体 ID</label>
                                <input type="text" value={editConfig.weather_entity} onChange={(e) => setEditConfig({ ...editConfig, weather_entity: e.target.value })} placeholder="weather.home"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all text-sm font-mono" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">位置名称</label>
                                <input type="text" value={editConfig.location_name} onChange={(e) => setEditConfig({ ...editConfig, location_name: e.target.value })} placeholder="客厅"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-4">
                    <button onClick={() => setShowSettings(false)} className="px-6 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">取消</button>
                    <button onClick={handleSaveConfig} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all transform hover:scale-[1.02]">
                        <Save size={18} />保存设置
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
