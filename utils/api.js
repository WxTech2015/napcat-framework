// utils/api.js
// NapCat HTTP API 封装（发消息、禁言、踢人、撤回等常用操作）
import { fetchData, fetchDataPost } from '../src/bot.js';

class ApiManager {
  constructor(configManager) {
    this.configManager = configManager;
  }

  get baseUrl() {
    const cfg = this.configManager.getMainConfig();
    return `http://${cfg.frameworkHost}:${cfg.frameworkPort}`;
  }

  url(endpoint) { return `${this.baseUrl}${endpoint}`; }

// 消息

  sendGroupMsg(groupId, message) {
    return fetchDataPost(this.url('/send_group_msg'), {
      group_id: Number(groupId), message
    });
  }

  sendPrivateMsg(userId, message) {
    return fetchDataPost(this.url('/send_private_msg'), {
      user_id: Number(userId),
      message: [{ type: 'text', data: { text: String(message) } }]
    });
  }

  sendPrivateImage(userId, pngBuffer) {
    return fetchDataPost(this.url('/send_private_msg'), {
      user_id: Number(userId),
      message: [{ type: 'image', data: { file: `base64://${pngBuffer.toString('base64')}` } }]
    });
  }

  sendGroupImage(groupId, pngBuffer) {
    return fetchDataPost(this.url('/send_group_msg'), {
      group_id: Number(groupId),
      message: [{ type: 'image', data: { file: `base64://${pngBuffer.toString('base64')}` } }]
    });
  }

  sendForwardMsg(groupId, messages) {
    return fetchDataPost(this.url('/send_group_forward_msg'), {
      group_id: Number(groupId), messages
    });
  }

  recallMsg(messageId) {
    return fetchDataPost(this.url('/delete_msg'), { message_id: messageId });
  }

// 成员管理

  banUser(groupId, userId, duration) {
    return fetchDataPost(this.url('/set_group_ban'), {
      group_id: groupId, user_id: userId, duration
    });
  }

  kickUser(groupId, userId, rejectAddRequest = false) {
    return fetchDataPost(this.url('/set_group_kick'), {
      group_id: groupId, user_id: userId, reject_add_request: rejectAddRequest
    });
  }

  handleGroupRequest(flag, approve, reason = '') {
    const params = new URLSearchParams({ flag, approve: String(approve), reason });
    return fetchData(`${this.url('/set_group_add_request')}?${params}`);
  }

// 信息查询

  getLoginInfo() {
    return fetchData(this.url('/get_login_info'));
  }

  getGroupList() {
    return fetchData(this.url('/get_group_list'));
  }

  getGroupMemberInfo(groupId, userId, noCache = false) {
    return fetchData(`${this.url('/get_group_member_info')}?group_id=${groupId}&user_id=${userId}&no_cache=${noCache}`);
  }

  getStrangerInfo(userId, noCache = false) {
    return fetchData(`${this.url('/get_stranger_info')}?user_id=${Number(userId)}&no_cache=${noCache}`);
  }
}

export default ApiManager;
