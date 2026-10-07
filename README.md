# Webex Messaging ↔ WxCC BYOC Middleware

Middleware that connects a Webex Messaging bot to Webex Contact Center (WxCC) through the Bring Your Own Custom Messaging Channel. Webex and WxCC webhooks arrive as payloads inside hook-to-socket WebSocket envelopes; the service creates and appends WxCC tasks (`/v2/tasks`) for inbound Webex text messages and posts outbound WxCC messages back to the same Webex conversation.

Design documents: [specs/001-webex-wxcc-byoc/](specs/001-webex-wxcc-byoc/) (spec, plan, contracts, quickstart). Approved deviations: [deviations.md](deviations.md).

## Requirements

- Node.js 26 or later

## Setup

```powershell
npm ci
Copy-Item .env.example .env   # then fill in the values; never commit .env
npm start
```

`GET http://localhost:<READINESS_PORT>/ready` returns `200` only while the bridge socket is connected.

## Tests

```powershell
npm test                      # unit, contract and in-process integration tests (no live services)
npm run audit                 # npm audit --audit-level=moderate
npm run extract-schemas       # re-vendor the OpenAPI schema extracts in src/contracts/
```

Live confirmation (bridge, task creation, appends, outbound, closure, loop prevention) is manual: see the workflow in [quickstart.md](specs/001-webex-wxcc-byoc/quickstart.md).

## Behavior notes and limitations

- Text-only. Empty, non-text, malformed, or unsupported payloads are rejected and logged.
- Conversation↔task associations and idempotency keys are in memory; they are lost on restart (a customer with a still-open WxCC conversation then receives a delivery-failed notice from `task:failed`).
- Logs are single-line JSON (`info` to stdout; `warn`/`error` to stderr). Tokens, secrets, emails and message text are redacted.
- Webhook signatures cannot be verified because the bridge forwards only the payload.
