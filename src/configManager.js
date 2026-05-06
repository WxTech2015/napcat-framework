// src/configManager.js
// 热重载配置管理器（修复双重打印问题：constructor 只调用 _load，由 _load 内部启动定时器）
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ConfigManager {
  constructor() {
    this.configPath      = path.join(__dirname, '../config/config.json');
    this.config          = {};
    this.lastMtime       = null;
    this.autoReloadTimer = null;

    this._load(); // 内部已启动定时器，无需再单独调用
  }

//加载

  _load() {
    const isFirstLoad = Object.keys(this.config).length === 0;
    try {
      const raw      = fs.readFileSync(this.configPath, 'utf8');
      this.config    = JSON.parse(raw);
      this.lastMtime = fs.statSync(this.configPath).mtime;
      console.log(`配置文件${isFirstLoad ? '初始化' : '热重载'}成功`);
      this._restartAutoReload(); // 间隔可能已变更，重启定时器
    } catch (err) {
      console.error('加载配置文件失败:', err.message);
      if (isFirstLoad) {
        console.error('首次加载失败，进程退出');
        process.exit(1);
      } else {
        console.warn('热重载失败，继续使用旧配置');
      }
    }
  }

//热重载定时器

  _checkUpdate() {
    try {
      const mtime = fs.statSync(this.configPath).mtime;
      if (!this.lastMtime || mtime > this.lastMtime) {
        console.log(`检测到配置变更（${mtime.toLocaleString()}），正在热重载…`);
        this._load();
      }
    } catch (err) {
      console.error('检查配置更新时出错:', err.message);
    }
  }

  _restartAutoReload() {
    if (this.autoReloadTimer) {
      clearInterval(this.autoReloadTimer);
      this.autoReloadTimer = null;
    }
    const interval       = Math.max(this.config.refresh_config_interval || 60, 30);
    this.autoReloadTimer = setInterval(() => this._checkUpdate(), interval * 1000);
    console.log(`配置自动重载：每 ${interval} 秒检查一次`);
  }

//公共 API

  getMainConfig() { return { ...this.config }; }
  get(key)        { return this.config[key];   }

  reload() {
    console.log('手动触发配置重载…');
    this._load();
  }
}

export default ConfigManager;
