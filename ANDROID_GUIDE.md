# Smart Screen UI - Android App 使用说明

## ✨ 新功能

### 1. 横屏全屏显示
- Android app 默认横屏显示
- 全屏模式，隐藏状态栏
- 屏幕常亮，适合作为智能显示屏

### 2. 远程配置服务器
- 局域网内远程控制显示参数
- 实时同步配置（每30秒）
- 支持演示模式远程切换

## 🚀 快速开始

### 构建 Android APK

```powershell
# 1. 构建 Web 应用
npm run build

# 2. 同步到 Android
npm run cap:sync

# 3. 打开 Android Studio 构建 APK
npm run cap:open
```

在 Android Studio 中: **Build > Build Bundle(s) / APK(s) > Build APK(s)**

### 使用 GitHub Actions 自动构建

推送代码到 GitHub 后，在 **Actions** 标签页下载构建好的 APK。

## 📱 远程配置使用

### 在显示设备上启动服务器

```powershell
npm run server
```

服务器将在 `http://0.0.0.0:3001` 启动，记下设备的 IP 地址（如 `192.168.1.100`）。

**访问 Web 管理界面:**
- 本地访问: `http://localhost:3001`
- 局域网访问: `http://192.168.1.100:3001`

### 在 App 中配置

1. 打开 App 设置（点击右上角齿轮图标）
2. 找到"远程配置"部分
3. 开启远程配置开关
4. 输入服务器地址：`http://192.168.1.100:3001`
5. 保存设置

### 远程控制

#### 使用 Web 管理界面 (推荐)

打开浏览器访问 `http://192.168.1.100:3001`，你将看到一个美观的配置管理界面：

**功能特性:**
- 🎨 玻璃拟态设计，美观易用
- 🏠 Home Assistant 连接配置
- 🎬 演示模式快速切换
- ⚡ 快速操作按钮（晴天/大雨/大雪/雷雨）
- 🔄 自动刷新（每30秒）
- 📱 响应式设计，支持手机访问

#### 使用 API
访问 `http://192.168.1.100:3001/api/config` 查看当前配置

#### 使用 curl 更新配置

```bash
# 切换到演示模式 - 雨天
curl -X POST http://192.168.1.100:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "demo_mode": true,
    "demo_state": "HEAVY_RAIN"
  }'

# 切换到晴天
curl -X POST http://192.168.1.100:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "demo_mode": true,
    "demo_state": "CLEAR_DAY"
  }'

# 更新 Home Assistant 配置
curl -X POST http://192.168.1.100:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "ha_url": "http://192.168.1.50:8123",
    "ha_token": "your_token_here",
    "weather_entity": "weather.forecast_home",
    "location_name": "我的家",
    "demo_mode": false
  }'
```

#### 使用 PowerShell

```powershell
# 切换演示模式
$body = @{
    demo_mode = $true
    demo_state = "THUNDER_SHOWER"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.1.100:3001/api/config" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## 🎨 可用的天气状态

- `CLEAR_DAY` - ☀️ 晴天
- `CLEAR_NIGHT` - 🌙 晴夜
- `PARTLY_CLOUDY_DAY` - 🌤️ 多云(日)
- `PARTLY_CLOUDY_NIGHT` - ☁️ 多云(夜)
- `CLOUDY` - ☁️ 阴天
- `LIGHT_RAIN` - 🌦️ 小雨
- `MODERATE_RAIN` - 🌧️ 中雨
- `HEAVY_RAIN` - 🌧️ 大雨
- `STORM_RAIN` - ⛈️ 暴雨
- `LIGHT_SNOW` - 🌨️ 小雪
- `MODERATE_SNOW` - ❄️ 中雪
- `HEAVY_SNOW` - ❄️ 大雪
- `STORM_SNOW` - ❄️ 暴雪
- `THUNDER_SHOWER` - ⛈️ 雷阵雨
- `HAIL` - 🧊 冰雹
- `SLEET` - 🌨️ 雨夹雪
- `WIND` - 💨 大风
- `LIGHT_HAZE` - 🌫️ 轻雾
- `MODERATE_HAZE` - 🌫️ 中雾
- `HEAVY_HAZE` - 🌫️ 大雾
- `FOG` - 🌫️ 雾
- `DUST` - 💨 浮尘
- `SAND` - 💨 沙尘

## 🔧 配置文件

服务器配置保存在 `config.json`，包含以下字段：

```json
{
  "ha_url": "http://192.168.1.50:8123",
  "ha_token": "your_long_lived_access_token",
  "weather_entity": "weather.forecast_home",
  "location_name": "罗庄区",
  "demo_mode": false,
  "demo_state": "CLEAR_DAY"
}
```

## 📝 注意事项

1. **网络要求**: 显示设备和控制设备需在同一局域网
2. **端口**: 默认使用 3001 端口，确保防火墙允许
3. **同步频率**: App 每 30 秒自动同步一次配置
4. **安全性**: 仅用于局域网，不建议暴露到公网

## 🎯 使用场景

- 智能家居显示屏
- 会议室天气展示
- 商店橱窗展示
- 远程演示和展示
