// src/server.js
import http from 'http';
import url  from 'url';
import config from '../config/index.js';
import ConfigManager from './configManager.js';
import ApiManager    from '../utils/api.js';
import { validateRevToken, extractTokenFromRequest } from './bot.js';

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB

class BotServer {
  constructor() {
    this.configManager = new ConfigManager();
    this.api           = new ApiManager(this.configManager);
    this.server        = null;
  }

//启动

  start() {
    this.server = http.createServer((req, res) => this._handleRequest(req, res));
    this.server.listen(config.rev_port, config.rev_host, () => {
      console.log(`服务已启动：http://${config.rev_host}:${config.rev_port}`);
      if (config.rev_token) {
        console.log('Token 验证已启用');
      } else {
        console.warn('Token 验证未启用，请勿暴露在公网！');
      }
    });
  }

//请求入口：CORS → Token → 路由─

  async _handleRequest(req, res) {
    try {
      res.setHeader('Access-Control-Allow-Origin',  '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204); res.end(); return;
      }

      if (!validateRevToken(extractTokenFromRequest(req))) {
        console.warn(`[Server] Token 验证失败，拒绝：${req.url}`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' })); return;
      }

      const { pathname } = url.parse(req.url, true);

      if      (req.method === 'POST' && pathname === '/')       await this._onWebhook(req, res);
      else if (req.method === 'GET'  && pathname === '/status') await this._onStatus(req, res);
      else if (req.method === 'POST' && pathname === '/reload') await this._onReload(req, res);
      else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (err) {
      console.error('[Server] 内部错误:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

//读取请求体（带大小限制）─

  _readBody(req) {
    return new Promise((resolve, reject) => {
      let body = '', size = 0;
      req.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_BODY_SIZE) { req.destroy(); reject(new Error('请求体过大')); return; }
        body += chunk.toString();
      });
      req.on('end',   () => resolve(body));
      req.on('error', reject);
    });
  }

//路由处理
  async _onWebhook(req, res) {
    try {
      const body     = await this._readBody(req);
      const rev_data = JSON.parse(body);
      console.log(`[Webhook] post_type=${rev_data.post_type} sub_type=${rev_data.sub_type ?? '-'}`);

      await this._dispatch(rev_data);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } catch (err) {
      console.error('[Webhook] 处理失败:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  }

//GET /status 运行状态
  async _onStatus(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'running', timestamp: new Date().toISOString() }));
  }

//POST /reload 热重载配置
  async _onReload(req, res) {
    try {
      this.configManager.reload();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', message: '已重载主配置' }));
    } catch (err) {
      console.error('[Reload] 失败:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  }

//事件分发（在此扩展业务逻辑）

  async _dispatch(rev_data) {
    const { post_type, message_type, sub_type, group_id, user_id } = rev_data;

    // 群消息
    if (post_type === 'message' && message_type === 'group') {
      await this._onGroupMessage(rev_data);
      return;
    }

    // 通知事件（戳一戳等）
    if (post_type === 'notice') {
      if (sub_type === 'poke' && String(rev_data.target_id) === String(rev_data.self_id)) {
        await this._onPoke(group_id, user_id);
      }
      return;
    }

    // 加群请求
    if (post_type === 'request' && sub_type === 'add') {
      await this._onGroupRequest(rev_data);
    }
  }

  async _onGroupMessage(rev_data) {
    const { group_id, user_id, raw_message } = rev_data;
    console.log(`[Msg] 群 ${group_id} 用户 ${user_id}：${String(raw_message).slice(0, 60)}`);
    // 在此添加消息处理逻辑
  }

  async _onPoke(groupId, userId) {
    console.log(`[Poke] 群 ${groupId} 用户 ${userId}`);
    // 在此添加戳一戳处理逻辑
  }

  async _onGroupRequest(rev_data) {
    console.log(`[GroupReq] 用户 ${rev_data.user_id} 申请加入群 ${rev_data.group_id}`);
    // 在此添加入群请求处理逻辑
  }
}

export default BotServer;
