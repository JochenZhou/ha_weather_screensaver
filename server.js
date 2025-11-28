import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const CONFIG_FILE = join(__dirname, 'config.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

if (!existsSync(CONFIG_FILE)) {
  writeFileSync(CONFIG_FILE, JSON.stringify({
    ha_url: "",
    ha_token: "",
    weather_entity: "weather.forecast_home",
    location_name: "罗庄区",
    demo_mode: false,
    demo_state: "CLEAR_DAY"
  }, null, 2));
}

app.get('/api/config', (req, res) => {
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read config' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Config server running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Web UI: http://localhost:${PORT}`);
  console.log(`📱 App API: http://<your-ip>:${PORT}/api/config`);
});
