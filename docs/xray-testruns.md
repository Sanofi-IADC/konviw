# WEB-2475 — Xray API for Test Executions in Jira Snapshots (Spike Outcome)

- **Ticket:** [WEB-2475](https://sanofi.atlassian.net/browse/WEB-2475) (Spike) — *Implement XRAY API on Konviw to handle Test executions on Jira Snapshot*
- **Feeds:** [JPDST-58](https://sanofi.atlassian.net/browse/JPDST-58) — *Support of "jira snapshot" in konviw*
- **Status:** Feasibility confirmed and validated **live** against production Xray.

## Question

A Jira Snapshot's last level does **not** use the Jira API to fetch data — it uses the **Xray API**. Can konviw implement the Xray API to render that level (test executions / test runs)?

## Answer

**Yes.** Implemented, unit-tested, and validated end-to-end through the real konviw server against production Xray Cloud.

## Background

The `jira-jql-snapshot` macro defines a list of `levels`. Each level has a `levelType`:

- `JIRA_ISSUES` — data comes from the Jira REST API (already supported by konviw).
- `XRAY_TESTRUNS` — data comes from the **Xray Cloud GraphQL API**, not Jira. This is the level that was previously unsupported (rendered a "not supported" placeholder).

Real level structure observed on the TRACK4 release report (page `64358745517`):

```json
{
  "title": "Test execution",
  "jql": "mode = all AND fixVersions = Track4 2.0.1 AND environments = Test",
  "fieldsPosition": [
    { "label": "Test Execution Key", "value": { "id": "testexeckey" } },
    { "label": "Status",             "value": { "id": "status" } },
    { "label": "Fix versions",       "value": { "id": "fixversions" } },
    { "label": "Defects",            "value": { "id": "defects" } }
  ],
  "levelType": "XRAY_TESTRUNS"
}
```

Hierarchy: **Requirements → Test Cases (`issuetype = Test`) → Test execution (Xray)**.

## Approach

- **`src/xray/xray.service.ts`** — Xray Cloud client:
  - Authenticates with `client_id` / `client_secret` → bearer token (`POST /authenticate`), cached ~23h.
  - `getTestRunsByTestIds(testIds)` runs a GraphQL `getTestRuns(testIssueIds: [...])` query with pagination (Xray caps `limit` at 100).
- **`src/xray/xray.module.ts`** — module with its own `HttpModule` (avoids the Jira basic-auth interceptor).
- **`src/proxy-page/steps/addJiraSnapshot.ts`** — for an `XRAY_TESTRUNS` level:
  1. Take the parent Tests' Jira issue ids from the previous level.
  2. Fetch their test runs via `XrayService`.
  3. Apply a best-effort **fix-version filter** parsed from the level's query.
  4. Group runs by `run.test.issueId` (nesting under the parent Test).
  5. Map each run onto the macro's configured column ids (`testexeckey`, `status`, `fixversions`, `defects`, and a supported superset) and render through the existing Grid.js pipeline.
- **Config** (`src/config/configuration.ts`):
  - `CPV_XRAY_BASE_URL` (default `https://xray.cloud.getxray.app/api/v2`)
  - `CPV_XRAY_CLIENT_ID`
  - `CPV_XRAY_CLIENT_SECRET`

## When it runs (gating)

The Xray API is called **only** for pages that contain a `jira-jql-snapshot` macro **with an `XRAY_TESTRUNS` level**. It runs on-demand during a page render — not as a background scan.

| Page | Xray API called? |
| --- | --- |
| No Jira Snapshot macro | No — snapshot processing skipped entirely |
| Snapshot with only `JIRA_ISSUES` levels | No — Jira API only, unchanged behaviour |
| Snapshot with an `XRAY_TESTRUNS` level | Yes — that level triggers the Xray query |

Safety: if credentials are not configured or the call fails, the service returns an empty list and the page still renders (graceful degradation).

## Validation

- **Unit tests:** `tests/unit/xray/xray.service.spec.ts`, `tests/unit/steps/addJiraSnapshot.spec.ts` (auth, batching/pagination, grouping, filtering, graceful degradation, rendering).
- **Live, end-to-end** through the real konviw server against the TRACK4 release report (`/cpv/wiki/spaces/TRACK4/pages/64358745517`):
  - `Retrieved 247 Xray test runs for 86 test(s)` from production Xray Cloud.
  - Rendered **Requirements (21) → Test Cases (86) → Test execution (224 after fix-version filter)** with correct execution keys, colored status lozenges, fix versions, and defect links.

## Key findings / corrections

- The level's **columns are macro-defined** (`testexeckey`, `status`, `fixversions`, `defects`) — not a fixed set. The implementation honours whatever the macro configures.
- The Xray level **nests under the parent Test** (`run.test`), not under a Test Execution.
- The level carries its **own Xray query** (`mode / fixVersions / environments`), not a `$key` reference to the parent.
- Xray's GraphQL `TestRun` type has **no `testEnvironments` field** (test environments live on the Test Execution). Querying it returns HTTP 400; it was removed from the query.

## Open items (not blocking feasibility)

- **`environments = Test` filter** is not applied — would require fetching the Test Execution's `testEnvironments`. Currently only `fixVersions` is filtered.
- **`mode = all`** semantics — appears to mean "all runs" (consistent with the page's own note that TODO executions cannot be removed); to confirm with Xray/Kevin.
- **Production rollout:** set `CPV_XRAY_*` env vars in the deployment environment. A dedicated **service account** is recommended (see Kevin's page below); today it uses a personal Jira API token for the Jira side.

## References

- Kevin Paugam — *Jira and Xray* connection guide: `MSPROD/66101249623`
- TRACK4 release report (real macroParams + live validation): `TRACK4/64358745517`
- Xray Cloud GraphQL API: https://docs.getxray.app/display/XRAYCLOUD/GraphQL+API

## Recommendation

Feasibility is confirmed with a working, live-validated implementation. To productionize: merge the branch, set the prod Xray credentials, and optionally add environment-based filtering if required for these reports.
