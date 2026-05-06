// src/bot.js
import axios  from 'axios';
import config from '../config/index.js';

//请求头 

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (config.frameworkToken) {
    headers.Authorization = `Bearer ${config.frameworkToken}`;
  }
  return headers;
}

//底层请求（失败会抛出异常） 

async function httpGet(url) {
  try {
    const res = await axios.get(url, { headers: buildHeaders() });
    return res.data;
  } catch (err) {
    console.error(`[GET] ${url} 失败:`, err.message);
    throw err;
  }
}

async function httpPost(url, data = {}) {
  try {
    const res = await axios.post(url, data, { headers: buildHeaders() });
    return res.data;
  } catch (err) {
    console.error(`[POST] ${url} 失败:`, err.message);
    throw err;
  }
}

//对外封装（失败静默返回 undefined） 

export async function fetchData(apiUrl) {
  try {
    return await httpGet(apiUrl);
  } catch (err) {
    console.error('GET 请求失败:', err.message);
  }
}

export async function fetchDataPost(apiUrl, payload = {}) {
  try {
    return await httpPost(apiUrl, payload);
  } catch (err) {
    console.error('POST 请求失败:', err.message);
  }
}

//rev_token 鉴权 

export function validateRevToken(requestToken) {
  if (!config.rev_token) return true;
  return requestToken === config.rev_token;
}

export function extractTokenFromRequest(req) {
  const auth = req.headers?.authorization;
  if (auth) return auth.startsWith('Bearer ') ? auth.slice(7) : auth;

  const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
  return url.searchParams.get('access_token') ?? url.searchParams.get('token') ?? null;
}
