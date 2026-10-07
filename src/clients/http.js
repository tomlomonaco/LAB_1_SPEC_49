import { redactString } from '../log.js';

export class HttpError extends Error {
  constructor(message, { status, body, reason } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.reason = reason;
    this.details = body === undefined ? undefined : redactString(String(body)).slice(0, 300);
  }
}

export class ContractError extends HttpError {
  constructor(message, { status, errors } = {}) {
    super(message, { status, reason: 'contract-violation' });
    this.name = 'ContractError';
    this.details = errors ? errors.slice(0, 5).join('; ') : undefined;
  }
}

export async function send(url, { method, headers, body, timeoutMs = 15000 }) {
  const res = await fetch(url, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: res.status, text, json };
}
