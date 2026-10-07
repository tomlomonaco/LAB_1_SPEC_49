# Contract: WxCC Task API (v2)

**Authority**: Official WxCC OpenAPI (`public-spec/webex-contact-center.json`, https://github.com/webex/webex-openapi-specs); behavior from `bring-your-own-custom-messaging-channel.md`.
**Base**: `WXCC_API_ROOT_URL` (root only; spec declares no real server). **Auth**: `Authorization: Bearer <access token>` obtained through the refresh-token workflow. Scopes: `cjp:task_write`, `cjp:task_read`.
All custom messaging task operations use `/v2/tasks` only. The `/v1/tasks` family is not used.

## Create Task — `POST /v2/tasks` (`createTaskRouteV2`)

Request: `CreateTaskRequestV2` → `CustomMessaging` variant (all `*` required):

```json
{
  "origin": { "id": "<personEmail>" },
  "destination": { "id": "<WXCC_BUSINESS_ADDRESS>", "type": "businessAddress" },
  "channelType": "customMessaging",
  "channel": "<WXCC_CHANNEL_NAME>",
  "channelParams": { "type": "text", "message": { "aliasId": "<uuid>", "text": "<text>", "timestamp": 1732786800000 } }
}
```

- `origin.id` = Webex `personEmail` (spec FR-008). `origin.name`, `flowSettings`, `globalVariables` are optional and omitted.
- `channelParams.type` = `text`; `TextMessage` has `additionalProperties: false`, text 1..20000 chars, `attachments` forbidden with `text` (400).
- `aliasId`: UUID generated per message; the platform reuses a valid UUID as the event ID.
- `timestamp`: epoch ms from the Webex message `created`.

Response: documented `201`; **lab returns `202` (DEV-001 in `deviations.md`)**. Body `CreateTaskResponse`:

```json
{ "meta": { "orgId": "<uuid>" }, "data": { "id": "<task uuid>" } }
```

`data.id` is the task ID stored with the Webex conversation. Errors documented: 400, 401, 403, 500, 503. Per BYOC guide, a success status only acknowledges receipt: `task:new` confirms, `task:failed` denies.

## Append Task Message — `POST /v2/tasks/{taskId}/messages` (`appendTaskMessageV2`)

Request: `TaskMessageRequest` → `CustomMessageAppendTaskRequest`:

```json
{ "mediaType": "customMessaging", "channelParams": { "type": "text", "message": { "aliasId": "<uuid>", "text": "<text>", "timestamp": 1732786800000 } } }
```

Response `202` body `TaskMessageResponse`: `{ "meta": { "orgId": "<uuid>" }, "data": { "id": "<uuid>" } }`. Errors documented: 400, 401, 403, 429, 500. Success is confirmed asynchronously by `task-message:appended` and refuted by `task-message:append-failed`.

## Token refresh — Webex OAuth refresh-token workflow

Endpoint: `WXCC_TOKEN_URL` (complete endpoint, expected `https://webexapis.com/v1/access_token`; never extended in code). `POST`, `Content-Type: application/x-www-form-urlencoded`, fields `grant_type=refresh_token`, `client_id`, `client_secret`, `refresh_token`. Source: https://developer.webex.com/docs/authentication#using-the-refresh-token (referenced by the BYOC guide). Response fields used: `access_token`, `expires_in`, and `refresh_token` if rotated. Refresh proactively before expiry and once on a `401`.
