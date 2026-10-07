# Phase 0 Research: Webex Messaging ↔ WxCC BYOC Middleware

## Authoritative source map

| Source | Governs | Implementation area | Contract doc |
|--------|---------|---------------------|--------------|
| `webhooks.md` | Webex webhook envelope and `messages.created` data | `src/events/classify`, `src/handlers/webex-inbound` | [webex-messaging.md](./contracts/webex-messaging.md) |
| Webex Messaging OpenAPI (`webex-messaging.json`) | `GET /v1/messages/{id}`, `POST /v1/messages` | `src/clients/webex` | [webex-messaging.md](./contracts/webex-messaging.md) |
| `webhooks-cc.md` | WxCC CloudEvents payloads and fields | `src/events/classify`, `src/handlers/wxcc-*` | [wxcc-webhooks.md](./contracts/wxcc-webhooks.md) |
| `bring-your-own-custom-messaging-channel.md` | BYOC flow, outbound partner webhook, auth model | `src/clients/wxcc`, handlers, token refresh | [wxcc-tasks.md](./contracts/wxcc-tasks.md) |
| WxCC OpenAPI (`webex-contact-center.json`) | `POST /v2/tasks`, `POST /v2/tasks/{taskId}/messages` | `src/clients/wxcc`, `src/contracts` | [wxcc-tasks.md](./contracts/wxcc-tasks.md) |
| `hook-to-socket-spec.md` | Socket URL, envelope, reconnect, readiness | `src/bridge` | [bridge-envelope.md](./contracts/bridge-envelope.md) |

Spec sources (pinned for contract tests): https://github.com/webex/webex-openapi-specs/blob/main/public-spec/webex-messaging.json and `.../webex-contact-center.json`. Both files declare no real server URL (only `https://example.com`), so API roots are configuration.

## Decisions

### R-01 Runtime and dependencies
- **Decision**: Node.js 26 (verified `v26.10.0` locally), ES modules, no web framework. Use built-ins: global `WebSocket` and `fetch`, `node:http` (readiness), `node:test` + `node:assert`, `process.loadEnvFile`, `node:crypto`. Runtime deps limited to `ajv` and `ajv-formats` (validate real payloads against the OpenAPI schemas). Set `"engines": {"node": ">=26"}`.
- **Rationale**: Constitution IV (YAGNI) and II (fewer audit surfaces); schema validation is mandated by the spec, and hand-written validators would be invented DTOs.
- **Test-only**: `ws` as devDependency for the fake bridge server.
- **Alternatives**: `dotenv` + `jest` (more deps, no benefit on Node 26); hand-rolled validators (drift risk).

### R-02 Schema source for contract tests
- **Decision**: Vendor a **verbatim extract** of the needed OpenAPI component schemas into `src/contracts/` (JSON, with a header recording source URL and retrieval date) plus a script to re-extract and diff against upstream. Tests validate real request/response bodies against these with Ajv. No simplified DTOs.
- **Rationale**: Offline-capable tests that still bind to the published schema.
- **Alternatives**: Fetch at test time (violates no-live-access rule).

### R-03 Webex webhook has no text; envelope `id` is not an event id
- **Decision**: Fetch the message with `GET /v1/messages/{data.id}`; idempotency key is `webex:message:{data.id}`. Never key on envelope `id` (webhook registration id).
- **Alternatives**: Key on bridge `eventId` — rejected, bridge assigns a new one per delivery and does not deduplicate.

### R-04 Event source and direction classification (shared path)
- **Decision**: Classify by structural markers (Webex: `resource`+`event`; WxCC: `specversion`+`type`), then by type, then evaluate `data.direction` (lifecycle) or `data.messageDirection` (messages). Table in [bridge-envelope.md](./contracts/bridge-envelope.md) and [wxcc-webhooks.md](./contracts/wxcc-webhooks.md).
- **Rationale**: Both services land on one pair path; an explicit tagged result (`{source, kind, direction}`) makes loops impossible by construction.

### R-05 Inbound `task-message:appended` echoes
- **Decision**: Subscription `task-message:appended` with `messageDirection=INBOUND` is the platform's confirmation of our own append. It is logged and ignored; it never reaches Webex and never calls WxCC. Only `OUTBOUND` messages go to Webex.

### R-06 Idempotency keys
- **Decision**: In-process `Map` of claimed keys (no eviction; lifetime of process per spec). Claim synchronously before any `await`, so concurrent duplicates cannot both pass. A claimed key stays claimed after a failure (no automatic retry per spec FR-011b; a customer resend has a new Webex message id).
  - Bridge delivery: `bridge:{pairId}:{eventId}` (redelivery of the identical frame only). Claimed in `src/app.js`; a repeat is logged `duplicate` and skipped. It does not replace payload-based keys, because the bridge assigns a new `eventId` per delivery.
  - Webex: `webex:message:{data.id}`.
  - WxCC: see key table in [wxcc-webhooks.md](./contracts/wxcc-webhooks.md).
- **Alternatives**: LRU/TTL (breaks "lifetime of process"); disk persistence (out of scope, YAGNI).

### R-07 Correlation and task-creation state
- **Decision**: Two maps kept consistent by one `ConversationStore`: `roomId → {taskId, state, personEmail, queue}` and `taskId → roomId`. On create, `data.id` is stored immediately with state `pending`; `task:new` → `active`; `task:failed`/timeout → removed; `task:ended` → removed. Messages arriving during `pending` are queued in order and flushed sequentially after `task:new`. Appends per conversation are serialized through a per-room promise chain to preserve order.
- **Pending timeout**: `PENDING_TASK_TIMEOUT_MS` (default 30000) treats a missing `task:new` as failure (closes the "stuck before task:new" edge case; uses the delivery-failed notice).
- **`task:new` before create response**: the response and event can race. If an event for an unknown task arrives within the creation window, it is matched through the room holding a pending creation whose task id is not yet stored; implementation holds the room's creation lock until the response is processed and then re-evaluates buffered lifecycle events. (Task-level detail for `/speckit-tasks`.)
- **Restart**: state is lost; a customer with a still-open WxCC conversation then gets `task:failed` / `CONVERSATION_ALREADY_OPEN`, which yields the delivery-failed notice (documented limitation).

### R-08 Webhook signature verification
- **Decision**: Not performed. The bridge forwards payloads only (no `X-Spark-Signature` / WxCC signature headers); trust is the bridge network boundary plus pair-id check, as `hook-to-socket-spec.md` states. Recorded as a known limitation, not a contract deviation.

### R-09 Auth
- **Webex**: static `WEBEX_BOT_TOKEN` as bearer.
- **WxCC**: refresh-token grant against `WXCC_TOKEN_URL` (complete endpoint). Cache access token in memory; refresh when within 60 s of expiry and once on `401`. If the response rotates `refresh_token`, keep it in memory and log the rotation (no secret in log); persisting to `.env` is out of scope.

### R-10 Loop prevention
- **Decision**: Ignore Webex messages where `personEmail` equals `WXCC_BUSINESS_ADDRESS` (required) or `WEBEX_BOT_EMAIL` (added defensive guard against the bot's own replies; comparison is case-insensitive). Outbound messages are posted by the bot and never written to WxCC.

### R-11 Outbound attachments
- **Decision**: Text-only lab. For an outbound message with attachments: post `text` if non-empty, log `warn` that attachments were dropped; if text is empty, reject as unsupported. No attachment download/decrypt.

### R-12 Logging and redaction
- **Decision**: One single-line JSON object per event via a tiny `log(level, operation, outcome, ids, error)` function. Levels fixed: `info` (success/transition) → stdout; `warn` (reject/duplicate/skip/recoverable) and `error` (failures/recovery needed) → stderr. Fields: `timestamp`, `level`, `operation`, `outcome`, identifiers (`bridgeEventId`, `roomId`, `messageId`, `taskId`, `webexEventKey`, `wxccEventId`, `correlationId`), `error{name,message,status,reason}`. Redaction: key-based (`token`, `secret`, `authorization`, `refresh`, `password`), `personEmail`/`origin` masked, message text never logged (length only), and value patterns (`Bearer …`, JWT-like, email) scrubbed. HTTP error bodies are logged only after redaction and truncation.
- **Alternatives**: pino/winston — rejected (no configurable infra required).

### R-13 URL conventions
- **Decision**: "Scheme plus top-level domain" is amended (analysis F3, approved): FR-025 reads "scheme and host, no path". WxCC regional hosts such as `api.wxcc-us1.cisco.com` carry a subdomain and are allowed. Endpoint variables (`WXCC_TOKEN_URL`) are used verbatim.

### R-14 Test strategy
- **Contract tests** (`tests/contract`): mock HTTP server on loopback asserting exact URL, method, headers, body, status; request and response bodies validated with Ajv against vendored OpenAPI schemas; includes `201`, approved `202`, and bad bodies.
- **Unit tests**: classification, envelope validation, idempotency, store/queue, redaction, config.
- **Integration (in-process)**: fake bridge WebSocket server + mock Webex/WxCC servers drive full flows (create, append, queue, outbound, ended, duplicates, loops, rejections).
- Live validation is manual only ([quickstart.md](./quickstart.md)).
- Fixtures in `tests/fixtures/` are production-shaped (taken from the authoritative docs) with placeholder IDs and `example.com` emails.

### R-15 Conflicts found between documents
| # | Conflict | Resolution |
|---|----------|------------|
| C-1 | OpenAPI/BYOC say Create Task → `201`; lab returns `202` | DEV-001 in [deviations.md](../../deviations.md); body still validated |
| C-2 | Webex webhook envelope `id` is registration id, not unique per event | Key on `data.id` |
| C-3 | `webhooks-cc.md`: `task:ended` `id` = task id; other events `id` = event id; BYOC examples show event ids | Task-scoped keys for lifecycle events; event-id keys for messages |
| C-4 | `comciscocorgid` (task:ended section) vs `comciscoorgid` elsewhere | Field not used; tolerate both |
| C-5 | Outbound partner webhook has `messageDirection` but no `direction` | Evaluate only `messageDirection` for messages |
| C-6 | Bridge dedup absent; bridge `eventId` unique per delivery | Bridge key informational only |
| C-7 | OpenAPI files omit server URLs | Roots come from `.env` |
