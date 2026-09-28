/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import { getConfig } from './config';
import { DEFAULT_USER_AGENT } from './user-agent';

// 获取代理 dispatcher（用于 fetch 走代理）
// 优先级：后台短剧配置的代理地址 > SHORTDRAMA_PROXY > HTTPS_PROXY > HTTP_PROXY
export async function getProxyDispatcher(): Promise<any | undefined> {
  try {
    const config = await getConfig();
    const proxyUrl = (config.ShortDramaConfig as any)?.proxyUrl
      || process.env.SHORTDRAMA_PROXY
      || process.env.HTTPS_PROXY
      || process.env.HTTP_PROXY;
    if (proxyUrl) {
      const { ProxyAgent } = await import('undici');
      return new ProxyAgent(proxyUrl);
    }
  } catch {
    // 忽略代理配置错误，降级为直连
  }
  return undefined;
}

// 带代理支持的 fetch（短剧源专用）
export async function shortDramaFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const dispatcher = await getProxyDispatcher();
  const fetchOpts: any = {
    headers: {
      'User-Agent': DEFAULT_USER_AGENT,
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
    ...options,
  };
  if (dispatcher) {
    fetchOpts.dispatcher = dispatcher;
  }
  return fetch(url, fetchOpts);
}
