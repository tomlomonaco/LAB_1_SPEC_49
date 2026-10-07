# Deviations from Authoritative Sources

Per Constitution Principle I, every approved departure from a published contract is recorded here before merge.

| ID | Endpoint | Authoritative source says | Lab behavior | Reason | Approver | Date | Scope of validation |
|----|----------|---------------------------|--------------|--------|----------|------|---------------------|
| DEV-001 | `POST {WXCC_API_ROOT_URL}/v2/tasks` (Create Task, `createTaskRouteV2`) | Success status `201 Created` (WxCC OpenAPI `webex-contact-center.json`; BYOC guide "Create The Initial Inbound Task") | Lab environment returns `202 Accepted` | Observed lab environment behavior | Lab specification owner (feature brief, `/speckit-specify` input) | 2026-10-07 | Accept `202` as success for this endpoint only. The response body MUST still validate against `CreateTaskResponse` (`meta.orgId` uuid, `data.id` uuid). The documented `201` is also accepted; any other status follows the documented error handling. |

