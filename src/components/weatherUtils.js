// 天气映射表（彩云天气标准）
export const CONDITION_CN_MAP = {
    'CLEAR_DAY': '晴',
    'CLEAR_NIGHT': '晴',
    'PARTLY_CLOUDY_DAY': '多云',
    'PARTLY_CLOUDY_NIGHT': '多云',
    'CLOUDY': '阴',
    'LIGHT_HAZE': '轻度雾霾',
    'MODERATE_HAZE': '中度雾霾',
    'HEAVY_HAZE': '重度雾霾',
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
    'WIND': '大风'
};

// 和风天气图标代码映射
export const QWEATHER_ICON_MAP = {
    '100': 'CLEAR_DAY', '150': 'CLEAR_NIGHT',
    '101': 'PARTLY_CLOUDY_DAY', '102': 'PARTLY_CLOUDY_DAY', '103': 'PARTLY_CLOUDY_DAY',
    '151': 'PARTLY_CLOUDY_NIGHT', '152': 'PARTLY_CLOUDY_NIGHT', '153': 'PARTLY_CLOUDY_NIGHT',
    '104': 'CLOUDY',
    '300': 'LIGHT_RAIN', '350': 'LIGHT_RAIN', '301': 'MODERATE_RAIN', '351': 'MODERATE_RAIN',
    '302': 'THUNDER_SHOWER', '303': 'THUNDER_SHOWER', '304': 'HAIL',
    '305': 'LIGHT_RAIN', '309': 'LIGHT_RAIN', '314': 'LIGHT_RAIN',
    '306': 'MODERATE_RAIN', '315': 'MODERATE_RAIN', '307': 'HEAVY_RAIN', '316': 'HEAVY_RAIN',
    '308': 'STORM_RAIN', '310': 'STORM_RAIN', '311': 'STORM_RAIN', '312': 'STORM_RAIN',
    '317': 'STORM_RAIN', '318': 'STORM_RAIN', '313': 'SLEET', '399': 'RAIN',
    '400': 'LIGHT_SNOW', '408': 'LIGHT_SNOW', '401': 'MODERATE_SNOW', '409': 'MODERATE_SNOW',
    '402': 'HEAVY_SNOW', '410': 'HEAVY_SNOW', '403': 'STORM_SNOW',
    '404': 'SLEET', '405': 'SLEET', '406': 'SLEET', '456': 'SLEET',
    '407': 'LIGHT_SNOW', '457': 'LIGHT_SNOW', '499': 'SNOW',
    '500': 'LIGHT_HAZE', '501': 'FOG', '509': 'HEAVY_HAZE', '510': 'HEAVY_HAZE',
    '514': 'HEAVY_HAZE', '515': 'HEAVY_HAZE', '502': 'HAZE', '511': 'MODERATE_HAZE',
    '512': 'HEAVY_HAZE', '513': 'HEAVY_HAZE', '503': 'SAND', '504': 'DUST',
    '507': 'SAND', '508': 'SAND', '900': 'CLEAR_DAY', '901': 'CLEAR_DAY', '999': 'CLOUDY'
};

// 状态标准化
export const normalizeWeatherState = (haState) => {
    if (!haState) return 'CLEAR_DAY';
    const s = String(haState).toLowerCase().replace(/-/g, '_');

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
    if (s.includes('thunder') || s.includes('lightning')) return 'THUNDER_SHOWER';
    if (s.includes('hail')) return 'HAIL';
    if (s.includes('sleet') || (s.includes('snow') && s.includes('rain'))) return 'SLEET';
    if (s.includes('snow')) return 'SNOW';
    if (s.includes('rain') || s.includes('pouring')) return 'RAIN';
    if (s.includes('haze')) {
        if (s.includes('heavy')) return 'HEAVY_HAZE';
        if (s.includes('moderate')) return 'MODERATE_HAZE';
        if (s.includes('light')) return 'LIGHT_HAZE';
        return 'HAZE';
    }
    if (s.includes('fog')) {
        if (s.includes('heavy') || s.includes('dense')) return 'HEAVY_FOG';
        if (s.includes('moderate')) return 'MODERATE_FOG';
        if (s.includes('light')) return 'LIGHT_FOG';
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
