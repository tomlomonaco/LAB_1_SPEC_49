# Feature Specification: Webex Messaging to WxCC BYOC Middleware

**Feature Branch**: `001-webex-wxcc-byoc`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "BYOC middleware that connects Webex Messaging (bot account) to Webex Contact Center (WxCC), text-only, with all webhooks delivered through the hosted hook-to-socket bridge."

## Authoritative Sources

Each of these MUST be reviewed and followed before design or implementation. Where this spec and a source disagree, the source wins unless the difference is recorded in `deviations.md`.

| Topic | Authoritative source |
|-------|----------------------|
| Webex Messaging webhooks | `webhooks.md` |
| Webex Messaging API endpoints | Official Webex OpenAPI specification |
| WxCC webhook events and payloads | `webhooks-cc.md` |
| WxCC BYOC behavior | `bring-your-own-custom-messaging-channel.md` |
| WxCC task API contracts | Official WxCC OpenAPI specification |
| WebSocket connection and message envelope | `hook-to-socket-spec.md` |

## Clarifications

### Session 2026-10-07

- Q: Which WxCC task event counts as task closed? → A: `task:ended` only.
- Q: What does the customer see if forwarding to WxCC fails? → A: A brief delivery-failed notice; no automatic retry.
- Q: How are messages handled while a task is still being created? → A: Queued in arrival order and appended after `task:new`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Webex user starts a contact-center chat (Priority: P1)

A customer sends a text message to the Webex bot. With no active WxCC task for that conversation, the middleware creates a new WxCC task carrying the message and remembers the conversation-to-task association.

**Why this priority**: Without task creation, no customer can reach an agent. This is the minimum viable product.

**Independent Test**: Deliver a valid Webex message-created event inside a bridge envelope for a conversation with no task. Verify one task is created, `Origin.id` equals the sender's `personEmail`, and the association is stored.

**Acceptance Scenarios**:

1. **Given** no active task for a Webex conversation, **When** a valid inbound text message arrives, **Then** exactly one WxCC task is created with the message text and `Origin.id` set to the sender's `personEmail`.
2. **Given** the task-creation call returns `202 Accepted` with a body valid against the authoritative schema, **When** the response is processed, **Then** it is accepted as success and the deviation is logged as the approved one.
3. **Given** task creation fails (including `task:failed`), **When** the failure occurs, **Then** a failure log is emitted, no association is stored, queued messages are discarded, and the Webex user receives a brief delivery-failed notice with no automatic retry.

---

### User Story 2 - Follow-up messages append to the active task (Priority: P1)

While a task is active, further inbound text messages from the same Webex conversation are appended to that same task.

**Why this priority**: Required for a usable multi-turn conversation.

**Independent Test**: With an active association, deliver a second valid message and verify it is appended to the existing task and no new task is created.

**Acceptance Scenarios**:

1. **Given** an active task for the conversation, **When** a valid inbound text message arrives, **Then** it is appended to that task and no new task is created.
2. **Given** the task is no longer active, **When** a new inbound message arrives, **Then** a new task is created instead.

---

### User Story 3 - Agent replies reach the Webex user (Priority: P1)

Outbound WxCC task-message events are delivered to the originating Webex conversation as bot messages, and never echoed back to the task.

**Why this priority**: Without it the conversation is one-way.

**Independent Test**: Deliver a WxCC outbound task-message event for a known task; verify one message is posted to the associated Webex conversation and nothing is sent to WxCC.

**Acceptance Scenarios**:

1. **Given** an active association, **When** a WxCC task-message event with `data.messageDirection` outbound arrives, **Then** its text is posted to the associated Webex conversation and not sent back to WxCC.
2. **Given** a WxCC task-message event with inbound `data.messageDirection`, **When** it arrives, **Then** no Webex message is sent.
3. **Given** an outbound event for an unknown task, **When** it arrives, **Then** it is not delivered, and the rejection is logged.

---

### User Story 4 - Customer is told when the chat ends (Priority: P2)

When a WxCC task closes, the Webex user is notified that the chat has ended, and the association is cleared.

**Why this priority**: Closes the conversation loop; less critical than message flow.

**Independent Test**: Deliver a WxCC task-closed lifecycle event for an associated task; verify one end-of-chat message is posted and the association is removed.

**Acceptance Scenarios**:

1. **Given** an active association, **When** a `task:ended` lifecycle event arrives, **Then** the Webex user receives a chat-ended message and the association is cleared.
2. **Given** a cleared association, **When** the customer messages again, **Then** a new task is created.

---

### User Story 5 - Safe handling of loops, duplicates, and bad input (Priority: P1)

The middleware ignores its own business-address messages, ignores replayed events, and rejects invalid payloads without creating or appending tasks.

**Why this priority**: Prevents message loops, duplicate tasks, and corrupt state.

**Independent Test**: Replay the same event twice; send a message from the business address; send empty, non-text, and malformed payloads. Verify no extra tasks, appends, or Webex messages, and that each outcome is logged.

**Acceptance Scenarios**:

1. **Given** a Webex message from `WXCC_BUSINESS_ADDRESS`, **When** it arrives, **Then** it is ignored and no task is created or appended.
2. **Given** an inbound Webex event already processed, **When** it is replayed, **Then** no duplicate task is created and the message is not appended again.
3. **Given** an inbound WxCC task-message event already processed, **When** it is replayed, **Then** no duplicate Webex message is sent.
4. **Given** an empty, non-text, malformed, or unsupported payload, **When** it arrives, **Then** it is rejected before any WxCC call and the rejection is logged with its reason.
5. **Given** a bridge envelope that is malformed or has a `pairId` different from the configured one, **When** it arrives, **Then** it is treated as a processing error and logged.

---

### User Story 6 - Operator can trust configuration, auth, and logs (Priority: P2)

An operator configures the service via `.env`, and the service refuses to process messages if configuration is invalid. All activity is traceable in structured logs with no secrets.

**Why this priority**: Enables safe operation and troubleshooting.

**Independent Test**: Start with a missing required variable and verify the service refuses to process and logs the cause. Start with valid configuration and inspect logs for redaction.

**Acceptance Scenarios**:

1. **Given** a missing or invalid required variable, **When** the service starts, **Then** it reports which variables are invalid, without values, and does not process messages.
2. **Given** normal operation, **When** any API call, task transition, routing decision, rejection, or failure occurs, **Then** one structured JSON log entry is emitted with timestamp, operation name, outcome, identifiers, and error context.
3. **Given** any log, test fixture, or documentation example, **Then** no token, secret, or sensitive personal data appears.

### Edge Cases

- The bridge socket disconnects: the service reports not-ready, reconnects with bounded backoff, and does not assume replayed events.
- Webex and WxCC events share one webhook path: source and direction are classified before any processing.
- Bot messages from the bot's own account or the business address arrive: ignored, never looped.
- Task creation returns `202` but the later task-created or failed event never arrives or reports failure: failure is logged and no stale association remains.
- Messages arrive while the task is being created (before `task:new`): they are queued in arrival order and appended after `task:new`; only one task is created.
- Webex message text is empty, whitespace-only, attachment-only, or carries files: rejected.
- A WxCC event references a task with no conversation association: not delivered and logged.
- The process restarts: associations and idempotency records are lost (see Assumptions).
- Access token for WxCC expires: refreshed through the refresh-token workflow; failure to refresh is logged and the affected event is reported as failed.
- A WxCC lifecycle event other than `task:ended`: does not trigger a chat-ended notification.

## Requirements *(mandatory)*

### Functional Requirements

**Event intake**

- **FR-001**: The system MUST receive all Webex Messaging and WxCC webhook payloads exclusively as the `payload` of hook-to-socket WebSocket envelopes, per `hook-to-socket-spec.md`.
- **FR-002**: The system MUST validate each envelope (shape, `pairId` equal to the configured value) and preserve its `eventId` and `receivedAt` in logs.
- **FR-003**: The system MUST classify every event's source (Webex or WxCC) and direction before any processing, including when both share a path.
- **FR-004**: The system MUST report readiness only while the socket is connected, and reconnect with bounded backoff after disconnects.

**Inbound Webex handling**

- **FR-005**: The system MUST support text-only messaging; the system MUST retrieve the full message content from the Webex Messages API as required by the Webex webhook contract.
- **FR-006**: The system MUST reject empty, non-text, malformed, or unsupported payloads before creating or appending any task, and record the reason.
- **FR-007**: The system MUST ignore Webex messages originating from `WXCC_BUSINESS_ADDRESS` or from the bot's own address (`WEBEX_BOT_EMAIL`), and these MUST NOT create or append tasks.
- **FR-008**: The system MUST create a new WxCC task when no active task exists for the conversation, mapping `Origin.id` to the sender's `personEmail`.
- **FR-009**: The system MUST append valid inbound messages to the conversation's active task.
- **FR-010**: The system MUST maintain a conversation-to-task association so that appends and outbound routing use the same conversation and task.
- **FR-011**: Only inbound traffic may create or append tasks or trigger Webex message ingestion.
- **FR-011a**: Messages received while a task is being created MUST be queued in arrival order and appended after `task:new`; if `task:failed` arrives instead, queued messages are discarded.
- **FR-011c**: A task that stays pending without `task:new` for `PENDING_TASK_TIMEOUT_MS` (default 30000) MUST be treated as failed: queued messages are discarded, the delivery-failed notice is sent, and the association is cleared.`n- **FR-011d**: Failures to fetch a Webex message or to post a Webex notice MUST be logged with identifiers and MUST NOT be retried automatically or block later events.`n- **FR-011b**: If a message cannot be forwarded to WxCC (create or append failure), the system MUST send the Webex user a brief delivery-failed notice and MUST NOT retry automatically.

**Outbound WxCC handling**

- **FR-012**: The system MUST evaluate lifecycle events by `data.direction` and task-message events by `data.messageDirection`.
- **FR-013**: The system MUST deliver outbound task messages to the associated Webex conversation via the Webex Messages API and MUST NOT echo them back to the WxCC task.
- **FR-014**: On a `task:ended` event, the system MUST notify the Webex user that the chat has ended and clear the association.

**Idempotency**

- **FR-015**: Repeated inbound Webex events MUST NOT create duplicate tasks or append a message twice.
- **FR-016**: Repeated inbound WxCC task-message events MUST NOT send duplicate Webex messages.
- **FR-017**: Idempotency MUST use stable identifiers from the authoritative webhook payloads (not bridge `eventId`, which is unique per delivery) and remain effective for the life of the running process.

**API contracts**

- **FR-018**: All external request and response contracts MUST be defined and validated against the authoritative specifications before implementation; no invented payloads, simplified DTOs, or undocumented transformations.
- **FR-019**: All WxCC custom messaging task operations MUST use the v2/tasks API.
- **FR-020**: Task creation returning `202 Accepted` instead of the documented `201 Created` is an approved deviation only if recorded in `deviations.md`; the response body MUST still be validated against the authoritative schema.
- **FR-021**: Every external endpoint call MUST be traceable to its published spec source, and any other deviation MUST be recorded in `deviations.md`.

**Configuration, auth, and security**

- **FR-022**: The Webex bot MUST authenticate using a static bot token.
- **FR-023**: The WxCC service account MUST authenticate using the refresh-token workflow.
- **FR-024**: The system MUST load configuration from `.env` and validate all required values before processing any message.
- **FR-025**: The project MUST provide a service-organized `.env.example` with placeholder values only, where root URLs contain only the scheme and host (no path, query, or trailing slash; regional hosts with subdomains are allowed), and endpoint URLs are complete and used verbatim.
- **FR-026**: Credentials, tokens, secrets, and sensitive personal data MUST be redacted from logs, tests, documentation examples, build artifacts, and other project artifacts.

**Observability**

- **FR-027**: Every API call, task transition, routing decision, validation rejection, and failure MUST produce a structured single-line JSON log with timestamp, operation name, outcome, relevant identifiers, and error context. Silent failures are not acceptable.

### Key Entities

- **Bridge Envelope**: Delivery wrapper with `pairId`, `eventId`, `receivedAt`, `contentType`, and the original webhook `payload`.
- **Webex Message Event**: Inbound webhook describing a new message, with message ID, room ID, and sender.
- **WxCC Task Event**: Webhook describing a task lifecycle change or a task message, including direction fields.
- **Conversation Association**: In-memory link between a Webex conversation and its active WxCC task, including the customer's `personEmail`.
- **Processed Event Record**: In-memory record of stable identifiers already handled, for idempotency.
- **Rejection Record**: Log entry describing why an event was rejected.
- **Deviation**: Entry in `deviations.md` recording an approved departure from a published contract.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid first inbound messages for a conversation with no task result in exactly one new task.
- **SC-002**: 100% of valid follow-up messages for a conversation with an active task are appended to that task, with zero duplicate tasks.
- **SC-003**: 100% of outbound agent messages for associated tasks reach the correct Webex conversation exactly once, with zero echoed to WxCC.
- **SC-004**: 100% of replayed events during a process lifetime produce no duplicate task, append, or Webex message.
- **SC-005**: 100% of empty, non-text, malformed, unsupported, and business-address messages produce no WxCC task change and have a logged reason.
- **SC-006**: A closed task results in the customer being notified of chat end in 100% of cases where an association exists.
- **SC-007**: 100% of API calls, task transitions, routing decisions, rejections, and failures have a matching structured log entry, and a scan of logs and project artifacts finds zero secrets or tokens.
- **SC-008**: With invalid configuration, 0 messages are processed and the operator is told which settings are invalid.
- **SC-009**: Each documented external contract is verified against its authoritative source, with every deviation recorded in `deviations.md`.

## Assumptions

- Lab/proof-of-concept scope: single process, single bridge pair, one instance owning the pair.
- Associations and idempotency records are held in memory and lost on restart; durable storage is out of scope.
- Messaging is text-only; attachments, cards, and reactions are out of scope and rejected.
- The bridge neither authenticates nor deduplicates; the middleware handles both at the application level.
- Webex webhooks and WxCC webhooks are already registered to deliver to the bridge pair webhook URL.
- Notice texts are fixed constants: chat ended = "This chat has ended. Send a new message to start another."; delivery failed = "Sorry, your message could not be delivered. Please try again."
- Lifecycle direction filtering (`data.direction`) applies to `task:new` only; `task:ended` and `task:failed` are matched by known `taskId` regardless of direction.
- The exact stable identifiers for idempotency (for example Webex message ID and WxCC message ID) are taken from the authoritative payload definitions during planning.
- The customer's `personEmail` is used for `Origin.id` and is treated as sensitive: logged only in redacted form.
