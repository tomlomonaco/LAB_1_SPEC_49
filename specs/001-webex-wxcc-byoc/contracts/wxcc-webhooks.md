# Contract: WxCC Webhook Events

**Authority**: `webhooks-cc.md` (subscription events, CloudEvents) and `bring-your-own-custom-messaging-channel.md` (asset-level outbound partner webhook).

## Common CloudEvents envelope

`id`, `specversion` (`1.0`), `type`, `source`, `comciscoorgid`, `comciscotimestamp`, `datacontenttype`, `data`. (`webhooks-cc.md` spells one field `comciscocorgid` in the `task:ended` section; the BYOC examples and other sections use `comciscoorgid`. Neither is used for routing.)

## Events the middleware handles

| `type` | Delivered via | Direction fields | Middleware action |
|--------|---------------|------------------|-------------------|
| `task:new` | Subscription | `data.direction` | Mark pending task active; flush queued messages. |
| `task:failed` | Subscription | `data.direction`, `data.reason`, `data.errorMessage` | Discard queue, delivery-failed notice, clear association. |
| `task:ended` | Subscription | `data.direction`, `data.terminatingParty` | Chat-ended notice, clear association. |
| `task-message:appended` | Subscription (inbound echo) | `data.messageDirection` = `INBOUND` | Log; no Webex send; no WxCC call. |
| `task-message:appended` | Asset webhook (outbound) | `data.messageDirection` = `OUTBOUND`, `data.senderType` `system`/`agent`; header `X-WebexCC-Webhook-Version: task-message:1.0.0` | Post text to Webex conversation. Never echoed to WxCC. |
| `task-message:append-failed` | Subscription | `data.messageDirection` = `INBOUND`, `data.reason`, `data.errorMessage` | Delivery-failed notice; log. |
| all other types | — | — | Reject as unsupported, log `warn`. |

Relevant `data` fields: `taskId`, `direction` (`INBOUND`/`OUTBOUND` — who initiated the task), `messageDirection`, `origin`, `destination`, `channelType`, `channel`, `channelParams.type`, `channelParams.message.{aliasId,text,timestamp,attachments}`, `createdTime`, `reason`, `errorMessage`.

## Direction rules

- Lifecycle events (`task:*`): evaluate `data.direction`. Only `INBOUND` tasks (customer initiated) are managed; an `OUTBOUND`-initiated task is not ours (Create Task supports inbound only) and is skipped with `warn`.
- Task-message events: evaluate `data.messageDirection`. `INBOUND` never reaches Webex. `OUTBOUND` is delivered to Webex.
- The outbound partner webhook has no `data.direction`; only `messageDirection` is evaluated for it.
- Filter: `data.channelType` must equal `customMessaging`, else skip with `warn`.

## Idempotency identifiers

| Event | Primary key | Secondary key |
|-------|-------------|---------------|
| `task-message:appended` OUTBOUND | `wxcc:event:{id}` | `wxcc:msg:{taskId}:{channelParams.message.aliasId}` |
| `task:new` / `task:failed` | `wxcc:task:{type}:{taskId}` | — |
| `task:ended` | `wxcc:task:task:ended:{taskId}` | — |
| `task-message:append-failed` | `wxcc:event:{id}` | — |

A hit on either key marks the event as duplicate. (`webhooks-cc.md` documents `id` for `task:ended` as "the ID of the task" and for other events as "the ID of the event"; task-scoped keys are therefore used for lifecycle events.)
