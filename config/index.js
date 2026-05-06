// config/index.js
// 启动时一次性读取主配置，供 bot.js 等不依赖热重载的模块使用
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainConfig = {};

try {
  const raw = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  mainConfig = JSON.parse(raw);
} catch (err) {
  console.error('加载主配置失败:', err.message);
  process.exit(1);
}

export default mainConfig;
