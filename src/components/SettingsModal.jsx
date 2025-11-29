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
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-xl text-white font-semibold flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20"><Settings className="text-white" size={20} /></div>
                        系统设置
                    </h2>
                    <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto text-left custom-scrollbar">
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
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* HA Config Section - iOS Grouped Style */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-4">Home Assistant 连接</h3>
                        <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden p-4 space-y-4">
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
