# Contract: Hook-to-Socket Bridge Boundary

**Authority**: `hook-to-socket-spec.md`. The bridge is hosted externally and is **not** designed or implemented here. This service is a **socket consumer only** (it never produces webhooks to the bridge).

## Connection

- URL: `{BRIDGE_WS_BASE_URL}/v1/pairs/{encodeURIComponent(PAIR_ID)}/socket`
- `PAIR_ID` must match `[a-zA-Z0-9_-]{1,64}`, validated at startup.
- Open the socket before reporting ready; reconnect with bounded exponential backoff (`RECONNECT_DELAY_MS` initial, `RECONNECT_MAX_DELAY_MS` cap); on takeover close, do not reconnect fight-loop (log `error`, stay not-ready unless the operator restarts).
- No replay after reconnect is assumed. Only one instance owns the pair.
- Readiness: local HTTP `GET /ready` → `200` only while the socket is open, else `503`.

## Envelope

```json
{ "pairId": "...", "eventId": "evt_...", "receivedAt": "2026-07-15T12:00:00Z", "contentType": "application/json", "payload": { } }
```

Validation: JSON parses; object; `pairId` equals configured value; `eventId` and `receivedAt` strings; `contentType` is `application/json`; `payload` is an object. Unknown fields are tolerated. Failures are logged `error` as malformed envelope (no silent accept). `payload` is passed on unchanged.

## Ordering and acknowledgement

Events are processed strictly in arrival order (single async queue). Local processing completion is logged with the bridge `eventId`; no wire-level ack message is defined by the spec, so none is sent.

## Source classification (shared path)

| Test on `payload` | Source |
|-------------------|--------|
| string `resource` and string `event` and object `data` | `webex` |
| string `specversion` and string `type` and object `data` | `wxcc` |
| neither or both | `unknown` → reject, log `warn` |

Classification happens before direction or lifecycle logic. Webex events then require `resource=messages`, `event=created`.
