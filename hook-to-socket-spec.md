# Service Consumer Specification: Webhook Socket Bridge

**Status**: Draft

## Purpose

This specification describes how an external service uses the webhook-to-websocket bridge as a pair-scoped event channel.

A consuming service may perform either or both roles:

- **Socket consumer**: maintains one websocket connection and processes events for a `pairId`.
- **Webhook producer**: sends HTTP webhook requests to the same `pairId` when it has an event to deliver.

The bridge does not transform the payload or provide durable storage. The consuming service owns connection management, application-level validation, and recovery after a rejected or interrupted delivery.

## Configuration

The consuming service MUST configure:

| Setting                | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `BRIDGE_HTTP_BASE_URL` | Base HTTP URL, for example `https://bridge.internal.example`     |
| `BRIDGE_WS_BASE_URL`   | Base websocket URL, for example `wss://bridge.internal.example`  |
| `PAIR_ID`              | Stable identifier matching `[a-zA-Z0-9_-]{1,64}`                 |
| `WEBHOOK_TIMEOUT_MS`   | HTTP timeout for webhook requests                                |
| `RECONNECT_DELAY_MS`   | Initial websocket reconnect delay, with a bounded backoff policy |

The service MUST use TLS URLs in environments where TLS termination is available. The bridge has no application-level authentication in this release, so deployment network controls and TLS boundaries are part of the integration security model.

## Endpoint Construction

For `PAIR_ID=orders_prod`, construct:

```text
WebSocket: {BRIDGE_WS_BASE_URL}/v1/pairs/orders_prod/socket
Webhook:   {BRIDGE_HTTP_BASE_URL}/v1/pairs/orders_prod/webhook
```

The service MUST URL-encode the path segment when constructing requests, and MUST reject its own configuration if the resulting pair ID does not match the bridge pair ID rule.

## Socket Consumer Lifecycle

1. Validate `PAIR_ID` before starting the connection.
2. Open the websocket before advertising the service as ready to receive bridge events.
3. Keep the connection open while the service is active.
4. Parse each server message as the documented event envelope.
5. Verify that the envelope `pairId` equals the configured `PAIR_ID`.
6. Process events in arrival order. The bridge guarantees FIFO ordering per pair.
7. Acknowledge completion in the consuming service only after its local processing succeeds.
8. On disconnect, mark the pair unavailable and reconnect using bounded backoff.
9. On a takeover close, stop using the old connection and allow the replacement owner to receive future events.

The service MUST NOT assume that events are replayed after a disconnect. Events rejected while no socket is active are not queued, and events already in transit may be lost if the connection fails.

## Webhook Producer Contract

Send each event as an HTTP `POST`:

```http
POST /v1/pairs/{pairId}/webhook
Content-Type: application/json
```

The request body is the application payload. The producer SHOULD include an application-level event or correlation ID in the payload when tracing or deduplication is required; the bridge assigns its own `eventId` and processes duplicate requests independently.

Example:

```bash
curl -i -X POST "$BRIDGE_HTTP_BASE_URL/v1/pairs/$PAIR_ID/webhook" \
  -H "content-type: application/json" \
  -d '{"orderId":"ord_123","status":"ready"}'
```

A successful request returns `202 Accepted`:

```json
{
  "result": "accepted",
  "pairId": "orders_prod",
  "eventId": "evt_01J...",
  "reasonCode": null
}
```

The producer MUST verify both the HTTP status and `result` before treating the event as accepted. It SHOULD log the returned `eventId` with its own correlation ID.

## Websocket Event Contract

The socket consumer receives:

```json
{
  "pairId": "orders_prod",
  "eventId": "evt_01J...",
  "receivedAt": "2026-07-15T12:00:00Z",
  "contentType": "application/json",
  "payload": {
    "orderId": "ord_123",
    "status": "ready"
  }
}
```

The consumer MUST:

- Treat `payload` as the original webhook content.
- Route the envelope only through the configured pair handler.
- Preserve the bridge `eventId` and `receivedAt` in local logs or processing records.
- Handle unknown fields for forward compatibility.
- Treat malformed envelopes as processing errors and alert rather than silently accepting them.

## Rejection and Recovery Rules

The producer MUST handle the following outcomes:

| Status | Reason code                           | Consumer behavior                                                                                              |
| ------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `202`  | none                                  | Record acceptance and continue.                                                                                |
| `400`  | `INVALID_PAIR_ID`                     | Configuration or route bug; do not retry unchanged.                                                            |
| `403`  | `FORBIDDEN_NETWORK`                   | Check ingress policy and deployment network; do not retry rapidly.                                             |
| `404`  | `PAIR_NOT_CONNECTED`                  | Wait for the socket consumer to reconnect, then apply the producer's retry policy if the event is still valid. |
| `413`  | `PAYLOAD_TOO_LARGE`                   | Reduce or externalize the payload; do not retry unchanged.                                                     |
| `415`  | `UNSUPPORTED_CONTENT_TYPE`            | Send a configured supported content type, normally `application/json`.                                         |
| `500`  | `FORWARDING_FAILED` or no stable code | Log the response and retry only when the producer's event semantics permit it.                                 |

Retries are owned by the consuming service. Because the bridge does not deduplicate, retrying a request can deliver the same application event more than once. Event handlers SHOULD therefore be idempotent when retries are enabled.

## Connection Ownership

Only one websocket is active for a pair at a time. If the service starts a second connection for the same `PAIR_ID`, the bridge closes the previous connection and makes the new connection active. A service deployment MUST ensure that only one intended instance owns a pair, or explicitly accept last-connection-wins behavior during failover.

## Security and Operations

The consuming service MUST:

- Keep pair IDs out of untrusted user-controlled input unless validated and authorized by the service.
- Use private ingress controls and TLS as required by the deployment environment.
- Avoid treating a pair ID as a secret.
- Record connection state, bridge response status, bridge `eventId`, local correlation ID, and processing outcome.
- Alert on repeated `PAIR_NOT_CONNECTED`, takeover, malformed envelope, and reconnect failures.
- Expose a local readiness signal that is false while the required websocket is disconnected.

## Acceptance Checklist

An integration is complete when the consuming service demonstrates:

- A valid pair websocket connects before event production begins.
- A webhook for the matching pair produces exactly one locally handled envelope.
- The envelope payload is preserved without an unintended schema transformation.
- A webhook for another pair cannot reach the service's socket.
- The service handles socket disconnect and reconnect without assuming replay.
- A missing socket produces `PAIR_NOT_CONNECTED` and follows the documented retry policy.
- Duplicate webhook requests do not corrupt local state when idempotent handling is required.
- The service records bridge event IDs and local correlation IDs for troubleshooting.

