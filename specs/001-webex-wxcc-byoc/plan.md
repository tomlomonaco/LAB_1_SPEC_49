# Implementation Plan: Webex Messaging to WxCC BYOC Middleware

**Branch**: `001-webex-wxcc-byoc` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-webex-wxcc-byoc/spec.md`

## Summary

A Node.js 26 middleware that consumes Webex Messaging and WxCC webhooks as the `payload` of hook-to-socket WebSocket envelopes, classifies each event (source → type → direction), and bridges text-only conversations: the first valid Webex message creates a WxCC task via `POST /v2/tasks` (`origin.id` = `personEmail`), later messages append via `POST /v2/tasks/{taskId}/messages`, and outbound WxCC messages are posted to the same Webex room via the Messages API. A bidirectional in-memory conversation↔task map, an in-process idempotency registry, and strict validation against the vendored OpenAPI schemas protect against duplicates, loops, and bad payloads. Every operation emits a redacted single-line JSON log. See [research.md](./research.md) for decisions and document conflicts.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node.js 26 (`engines >=26`)

**Primary Dependencies**: `ajv`, `ajv-formats` (OpenAPI schema validation); dev-only `ws` (fake bridge WebSocket server for integration tests; Node provides a WebSocket client but no server). Built-ins only otherwise: `fetch`, `WebSocket`, `node:http`, `node:test`, `node:crypto`, `process.loadEnvFile`

**Storage**: In-memory only (conversation map, idempotency registry, token cache); lost on restart (documented)

**Testing**: `node --test` with loopback mock HTTP servers and a fake bridge WebSocket server; production-shaped fixtures; live checks manual ([quickstart.md](./quickstart.md))

**Target Platform**: Windows and Linux/macOS, long-running Node process

**Project Type**: Single backend service (no inbound HTTP besides `/ready`)

**Performance Goals**: Lab/POC; events processed serially in arrival order; no throughput target beyond keeping up with a single bridge pair

**Constraints**: Text-only; one bridge pair, one instance; no hand-written DTOs outside published schemas; `/v2/tasks` only; no appended paths to endpoint URLs; secrets never logged

**Scale/Scope**: Handful of concurrent conversations in a lab; unbounded idempotency set acceptable for process lifetime

## Constitution Check

*GATE: pass before Phase 0; re-checked after Phase 1.*

| Principle | Status | How the plan complies |
|-----------|--------|-----------------------|
| I. API-First Specification | PASS | Contracts extracted before code ([contracts/](./contracts)); each client call carries endpoint URL + spec link comment; DEV-001 recorded in [deviations.md](../../deviations.md) |
| II. Zero Known Vulnerabilities | PASS | Two runtime deps plus dev-only `ws`; `npm audit --audit-level=moderate` in test workflow and every PR |
| III. Structured Observability | PASS | Single `log()` function; fixed levels; every call/transition/rejection/failure logged ([research R-12](./research.md)) |
| IV. POC Simplicity | PASS | No framework, logger lib, DB, or abstraction layers; `ajv` justified by schema-validation requirement, `ws` (dev) by the absence of a built-in WebSocket server for bridge tests; `WEBEX_BOT_EMAIL` and `PENDING_TASK_TIMEOUT_MS` justified by loop prevention and the spec's stuck-creation edge case |
| V. Secure Auth & Secret Hygiene | PASS | Env-only config, `.env.example` placeholders, redaction tests, refresh-token workflow |
| VI. Cross-Platform Paths | PASS | `node:path`/`node:url` only; no hardcoded separators; tests avoid OS assumptions |

Post-design re-check: PASS (no violations; Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/001-webex-wxcc-byoc/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── bridge-envelope.md
│   ├── configuration.md
│   ├── webex-messaging.md
│   ├── wxcc-tasks.md
│   └── wxcc-webhooks.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks (not created here)
```

Repository root also holds `deviations.md`, `.env.example`, and `.gitignore` (excludes `.env`).

### Source Code (repository root)

```text
src/
├── index.js                 # startup: config → clients → bridge → readiness
├── config.js                # loadEnvFile + validation (names only on failure)
├── log.js                   # log() + redaction
├── bridge/
│   ├── socket.js            # connect, backoff, takeover handling, serial queue
│   └── envelope.js          # envelope validation
├── events/
│   └── classify.js          # source → kind → direction
├── messages.js              # fixed notice texts
├── handlers/
│   ├── index.js             # dispatch(classified)
│   ├── rejection.js         # reject() helper
│   ├── webex-inbound.js     # validate, ignore rules, create/append/queue
│   └── wxcc-events.js       # task:new/failed/ended, outbound, append-failed
├── state/
│   ├── conversations.js     # roomId↔taskId store, queue, pending timer
│   └── idempotency.js       # claim(key)
├── clients/
│   ├── webex.js             # GET/POST /v1/messages
│   ├── wxcc.js              # POST /v2/tasks, /v2/tasks/{id}/messages
│   └── wxcc-auth.js         # refresh-token grant
├── contracts/               # vendored OpenAPI schema extracts + Ajv validators
└── readiness.js             # GET /ready

scripts/
└── extract-schemas.js       # vendors OpenAPI schema extracts

tests/
├── fixtures/                # production-shaped Webex, WxCC, bridge payloads (+ fake-bridge.js using ws)
├── contract/                # URL/method/header/body/status vs schemas
├── unit/
└── integration/             # fake bridge + mock services, full flows

deviations.md
.env.example
package.json
```

**Structure Decision**: Single project; modules map one-to-one to the authoritative sources (bridge → hook-to-socket, clients → OpenAPI specs, classify/handlers → webhook docs).

## Complexity Tracking

No constitution violations to justify.
