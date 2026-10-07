<!--
Sync Impact Report
Version change: (unfilled template) → 1.0.0
Modified principles: none (initial adoption)
Added principles: I. API-First Specification; II. Zero Known Vulnerabilities;
  III. Structured Observability by Default; IV. POC Simplicity (YAGNI);
  V. Secure Auth & Secret Hygiene; VI. Cross-Platform File Paths
Added sections: Technical Constraints; Development Workflow; Governance
Removed sections: none
Deferred TODOs: none
-->
# BYOC Middleware Constitution

The BYOC Middleware is a Node.js backend service that bridges Webex Messaging to Webex Contact
Center (WxCC). It MUST be production-ready, observable, and maintainable.

## Core Principles

### I. API-First Specification (NON-NEGOTIABLE)
Every integration with an external service (Webex, WxCC) MUST be validated against the official
published OpenAPI specification at https://github.com/webex/webex-openapi-specs BEFORE any code
is written.
- Each endpoint call MUST carry a code comment with the endpoint URL and a link to its spec source.
- Any deviation from the published spec MUST be explicitly approved and recorded in
  `deviations.md` (endpoint, reason, approver, date) before merge.

Rationale: unvalidated endpoints cause silent integration drift and hard-to-diagnose failures.

### II. Zero Known Vulnerabilities (NON-NEGOTIABLE)
All npm dependencies MUST pass `npm audit --audit-level=moderate` with zero findings before a
change is merged.
- Transitive vulnerabilities rated Medium or higher MUST be resolved, or the feature that
  introduces them MUST be deferred.
- Suppressing or ignoring audit findings is prohibited.

Rationale: the service handles customer conversations and credentials.

### III. Structured Observability by Default
Every API call, state transition, error, and significant decision MUST emit a JSON log entry
containing: timestamp, operation name, outcome (success/failure), relevant identifiers, and
error context (on failure).
- Silent failures are prohibited; every caught error MUST be logged or re-thrown.
- Logs MUST be single-line JSON written to stdout/stderr.

Rationale: production support depends on traceable, machine-parseable events.

### IV. POC Simplicity (YAGNI)
The middleware is a proof of concept. Complexity MUST be justified by a concrete current
requirement.
- Premature abstraction, plugin architectures, and speculative generalization are prohibited.
- Any added layer, dependency, or pattern MUST cite the requirement it serves in the PR.

Rationale: simple code is faster to validate, secure, and maintain.

### V. Secure Auth & Secret Hygiene (NON-NEGOTIABLE)
Authentication MUST follow official Webex OAuth/token guidance.
- Credentials and secrets MUST be injected via environment-based configuration; they MUST NOT
  be committed to source control.
- Secrets and tokens MUST be strictly redacted in logs, error output, and generated artifacts
  (specs, docs, test fixtures).
- An `.env.example` with placeholder values only MUST document required variables.

Rationale: leaked tokens grant access to customer messaging and contact-center resources.

### VI. Cross-Platform File Paths
The service MUST run on Windows and Linux/macOS.
- Slash characters (`/` or `\`) MUST NOT be hardcoded in file paths or script checks; use the
  built-in `path` and `url` modules (e.g., `path.join`, `path.resolve`, `fileURLToPath`).
- Scripts and tests MUST NOT assume a specific OS path separator.

Rationale: contributors and deployments span operating systems.

## Technical Constraints

- Runtime: Node.js (current LTS); dependencies declared in `package.json` with a lockfile
  committed.
- Configuration: environment variables only; no secrets in code or config files in the repo.
- External calls: only to endpoints documented in the published Webex/WxCC OpenAPI specs.

## Development Workflow

- Before coding an integration: validate endpoints against the OpenAPI spec (Principle I).
- Every PR MUST include evidence of a clean `npm audit --audit-level=moderate` run.
- Every PR MUST be reviewed against all six principles; reviewers MUST block on violations.
- New behavior MUST include structured logging per Principle III.
- Changes MUST be verified on at least one non-conflicting path style (no hardcoded separators)
  and, where feasible, on both Windows and Linux/macOS.
- Deviations from the spec go in `deviations.md`; complexity exceptions are justified in the PR.

## Governance

This constitution supersedes all other practices.
- **Amendments**: proposed via PR that updates this file, states rationale and impact, and is
  approved by a maintainer. Dependent specs, plans, and tasks MUST be reviewed for consistency.
- **Versioning**: semantic versioning. MAJOR for backward-incompatible principle removals or
  redefinitions; MINOR for new principles/sections or materially expanded guidance; PATCH for
  clarifications and wording fixes.
- **Compliance review**: every PR/review MUST verify compliance; the constitution MUST be
  reviewed at each release and any unresolved violations tracked as issues.

**Version**: 1.0.0 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-07
