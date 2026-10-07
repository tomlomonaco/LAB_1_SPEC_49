# Quickstart & Validation Guide

## Prerequisites

- Node.js 26 (`node -v` → `v26.x`).
- Copy `.env.example` to `.env`; fill every value (see [contracts/configuration.md](./contracts/configuration.md)). Never commit `.env`.
- Hosted hook-to-socket bridge reachable, with `PAIR_ID` configured; both Webex (`messages`/`created`, bot) and WxCC (subscriptions, plus the Custom Messaging asset webhook URL) deliver to `{bridge}/v1/pairs/{PAIR_ID}/webhook`.
- WxCC: Service App authorized with `cjp:task_write` and `cjp:task_read`; refresh token in hand; subscriptions for `task:new`, `task:failed`, `task:ended`, `task-message:appended`, `task-message:append-failed`.

## Automated validation (no live services)

```powershell
npm ci
npm test                      # unit + contract + in-process integration
npm audit --audit-level=moderate
```

Expected: all tests pass; audit has zero findings. Tests cover Webex message notifications, WxCC lifecycle and task-message events, task responses, failure responses, the approved `202` response, bridge envelopes, duplicates, loops, and rejections.

## Manual integration validation (live)

Run `npm start`, keep its stdout/stderr visible, and capture log lines as evidence. Replace identifiers with your own; redact emails and tokens before sharing.

| # | Step | Trigger | Expected outcome | Log evidence (`operation` → `outcome`) |
|---|------|---------|------------------|----------------------------------------|
| 1 | Start | `npm start` with valid `.env` | `GET http://localhost:{READINESS_PORT}/ready` → 200 | `config.validate` success; `bridge.connect` success; `ready` success |
| 1b | Bad config | Remove `WEBEX_BOT_TOKEN`, start | Process refuses to start | `config.validate` failure listing variable names only |
| 2 | Bridge connectivity | Stop/restart the bridge or drop network | `/ready` → 503, then recovers | `bridge.disconnect` warn; `bridge.reconnect` success |
| 3 | Task creation | DM the bot "hello" from a test Webex user | One WxCC task appears for `origin.id` = that user's email | `webex.get-message` success; `wxcc.create-task` success (status `202`, deviation DEV-001); `task.pending`; `task:new` → `task.active` |
| 4 | Append | Send a second DM | Same task shows the message; no new task | `wxcc.append-message` success; `task.append` success |
| 5 | Outbound | Reply from agent desktop (and a flow message) | Text arrives in the same Webex DM, once | `routing.outbound` success; `webex.create-message` success; no WxCC call |
| 6 | Closure | End the task in agent desktop | Webex user gets chat-ended message; next DM creates a new task | `task:ended` handled; `webex.create-message` success; `conversation.cleared` |
| 7 | Loop prevention | Make the business address post in the room (or inspect the bot's own reply arriving) | No task created or appended | `webex.ignore` rejected `business-address-sender` / `bot-sender` |
| 8 | Duplicates | Replay a captured Webex webhook and a captured WxCC outbound payload via the bridge `POST /v1/pairs/{PAIR_ID}/webhook` | No second task/append/Webex message | `duplicate` outcome (`warn`) with the original key |
| 9 | Rejections | Send an attachment-only message and an empty-text message | No WxCC call; user not charged a task | `validation.reject` rejected reason `non-text` / `empty` |
| 10 | Failure notice | Temporarily use an invalid `WXCC_CHANNEL_NAME` | Webex user receives a brief delivery-failed message; no retry | `wxcc.create-task` failure (or `task:failed` event) then `webex.create-message` success |

Pass criteria: every step's expected outcome observed and the matching structured log line captured; no secret or raw email appears in any log line.

## Evidence capture

```powershell
npm start 2>&1 | Tee-Object -FilePath manual-run.log   # keep out of git; contains no secrets by design
Select-String -Path manual-run.log -Pattern 'Bearer|refresh_token|@'   # must return nothing
```
