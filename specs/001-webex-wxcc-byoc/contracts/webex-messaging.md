# Contract: Webex Messaging

**Authority**: Official Webex Messaging OpenAPI (`public-spec/webex-messaging.json` in https://github.com/webex/webex-openapi-specs) for endpoints; `webhooks.md` for webhook payloads.
**Base**: `WEBEX_API_ROOT_URL` (root only; the OpenAPI file declares only the placeholder server `https://example.com`). Paths below are appended in code.
**Auth**: `Authorization: Bearer <WEBEX_BOT_TOKEN>` (static bot token).

## Inbound webhook (delivered as bridge `payload`) — `webhooks.md` "Handling Requests from Webex"

```json
{
  "id": "<webhook registration id>", "name": "...", "resource": "messages", "event": "created",
  "filter": "...", "orgId": "...", "createdBy": "...", "appId": "...", "ownedBy": "creator",
  "status": "active", "actorId": "...",
  "data": { "id": "<message id>", "roomId": "...", "personId": "...", "personEmail": "user@example.com", "created": "2015-10-18T14:26:16.000Z" }
}
```

| Field | Use |
|-------|-----|
| `resource` = `messages`, `event` = `created` | Required to accept as a Webex inbound message. Any other value is rejected as unsupported. |
| `data.id` | Message ID; **idempotency key** and input to Get Message Details. |
| `data.roomId` | Conversation identifier; reply target. |
| `data.personEmail` | Sender; mapped to WxCC `origin.id`; compared to `WXCC_BUSINESS_ADDRESS` / `WEBEX_BOT_EMAIL`. |
| envelope `id` | Webhook **registration** ID, identical for every delivery; MUST NOT be used for idempotency. |

The webhook carries **no message text**; text must be fetched. `X-Spark-Signature` headers are not available through the bridge (payload only), so signature verification is not possible in this lab (see research R-08).

## Get Message Details — `GET /v1/messages/{messageId}`

- Path param `messageId` = `data.id`. Success: `200`. Errors documented: 400, 401, 403, 404, 405, 409, 410, 415, 423, 428, 429, 500, 502, 503, 504.
- Response `Message` fields used: `id`, `roomId`, `roomType`, `text`, `files`, `personId`, `personEmail`, `created`. (Also present: `parentId`, `markdown`, `html`, `mentionedPeople`, `mentionedGroups`, `attachments`, `updated`, `isVoiceClip`.)
- Text-only acceptance: `text` is a non-empty string after trim, `files` absent or empty, `attachments` absent or empty. Otherwise reject.

## Create a Message — `POST /v1/messages`

- Request body (`application/json`) fields used: `roomId` (required for reply to existing room), `text`. No other fields are sent.
- Success: `200` with a `Message` body, validated against the schema.
- Used for: outbound agent/system text, chat-ended notice, delivery-failed notice.
