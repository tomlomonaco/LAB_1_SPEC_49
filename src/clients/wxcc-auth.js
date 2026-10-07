// WxCC OAuth refresh-token workflow.
// Source: https://developer.webex.com/docs/authentication#using-the-refresh-token (referenced by the BYOC guide).
// The token URL is a complete endpoint and is used verbatim.
import { log } from '../log.js';
import { HttpError, send } from './http.js';

export function createWxccAuth({ tokenUrl, clientId, clientSecret, refreshToken, now = () => Date.now() }) {
  let accessToken = null;
  let expiresAt = 0;
  let currentRefresh = refreshToken;
  let inflight = null;

  async function refresh() {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: currentRefresh
    }).toString();
    try {
      // POST WXCC_TOKEN_URL (https://webexapis.com/v1/access_token)
      const res = await send(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body
      });
      if (res.status !== 200) throw new HttpError(`Token refresh failed with status ${res.status}`, { status: res.status, body: res.text });
      const j = res.json;
      if (!j || typeof j.access_token !== 'string' || typeof j.expires_in !== 'number') {
        throw new HttpError('Token refresh response missing access_token/expires_in', { status: res.status, reason: 'contract-violation' });
      }
      accessToken = j.access_token;
      expiresAt = now() + j.expires_in * 1000;
      const rotated = typeof j.refresh_token === 'string' && j.refresh_token !== currentRefresh;
      if (typeof j.refresh_token === 'string') currentRefresh = j.refresh_token;
      log('info', 'wxcc.token-refresh', 'success', { status: res.status, expiresInSeconds: j.expires_in, rotated });
    } catch (error) {
      log('error', 'wxcc.token-refresh', 'failure', {}, error);
      throw error;
    }
  }

  return {
    async getAccessToken() {
      if (accessToken && now() < expiresAt - 60_000) return accessToken;
      inflight ??= refresh().finally(() => {
        inflight = null;
      });
      await inflight;
      return accessToken;
    },
    invalidate() {
      accessToken = null;
      expiresAt = 0;
    }
  };
}

