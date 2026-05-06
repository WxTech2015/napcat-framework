# napcat-framework

napcat-framework 是一个基于 Node.js 的 NapCat 机器人开发框架，用于接收 NapCat 上报事件，并封装常用 HTTP API，方便快速编写 QQ 机器人业务逻辑。

## 环境要求

- Node.js 18 或更高版本
- 已运行并配置好的 NapCat 服务

## 安装

在项目目录下安装依赖：

```bash
npm i
```

## 启动

```bash
node index.js
```

也可以使用 npm 脚本启动：

```bash
npm start
```

开发时可以使用监听模式：

```bash
npm run dev
```

## 配置修改

主要配置文件在：

```text
config/config.json
```

配置示例：

```json
{
  "frameworkHost": "127.0.0.1",
  "frameworkPort": 4000,
  "frameworkToken": "",
  "rev_host": "0.0.0.0",
  "rev_port": 3000,
  "rev_token": "",
  "refresh_config_interval": 60
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `frameworkHost` | NapCat HTTP API 地址，通常为 `127.0.0.1` |
| `frameworkPort` | NapCat HTTP API 端口，默认示例为 `4000` |
| `frameworkToken` | NapCat HTTP API 鉴权 token；如果 NapCat 未设置 token，可留空 |
| `rev_host` | 本框架监听的反向 WebSocket/HTTP 上报地址，默认 `0.0.0.0` |
| `rev_port` | 本框架监听端口，默认 `3000` |
| `rev_token` | 上报接口鉴权 token；留空表示不启用鉴权，不建议公网环境留空 |
| `refresh_config_interval` | 配置热重载检查间隔，单位秒，最低 30 秒 |

修改配置后，框架会按 `refresh_config_interval` 自动检查并热重载。也可以请求：

```text
POST /reload
```

手动触发配置重载。

## 业务逻辑修改

常用修改位置：

- `src/server.js`：处理 NapCat 上报事件，例如群消息、通知事件、加群请求等。
- `utils/api.js`：封装 NapCat HTTP API，例如发送群消息、私聊消息、禁言、踢人、撤回等。
- `src/bot.js`：底层 HTTP 请求与上报 token 校验逻辑。

例如要处理群消息，可以修改 `src/server.js` 中的 `_onGroupMessage` 方法：

```js
async _onGroupMessage(rev_data) {
  const { group_id, user_id, raw_message } = rev_data;

  if (raw_message === 'ping') {
    await this.api.sendGroupMsg(group_id, 'pong');
  }
}
```

## 接口

默认提供以下接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/` | 接收 NapCat 上报事件 |
| `GET` | `/status` | 查看运行状态 |
| `POST` | `/reload` | 手动重载配置 |

如果配置了 `rev_token`，请求需要在 `Authorization` 请求头中携带：

```text
Authorization: Bearer your_token
```

也可以通过查询参数传入：

```text
?token=your_token
```

## License

The napcat-framework is open-source software licensed under the AGPL-3.0 license.

本项目最终解释权归重庆交通大学吧所有，由青州正寰电子科技有限公司协助开发。
