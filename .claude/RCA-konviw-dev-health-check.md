# RCA: konviw dev ECS tasks in a crash loop (health check timeouts)

**Service:** `iadc-portal-integration-confluence-pv` (cluster `iadc-portal-integration`, eu-west-1)
**Duration:** from Sept 24, 2026 until Oct 22, 2026 06:16 UTC (about 4 weeks)
**Status:** resolved

## Summary
The dev tasks were repeatedly stopped by ECS with "Task failed ELB health checks" (container exit code 137). The application itself was healthy. Its `/health` endpoint ran a Confluence search that took 11-19 seconds, longer than the 10 second target group health check timeout. The load balancer marked each task unhealthy, ECS killed it and started a new one that did the same.

## Impact
The konviw dev service was repeatedly restarting, with tasks killed every few minutes. Dev availability was degraded for about four weeks.

## What failed
- Target group `cpv-target-group` checks `GET /cpv/health` every 30s with a **10s** timeout and 5 allowed failures.
- `/health` calls `ApiHealthService.apiCheck()`, which does a live search against Confluence.
- On the deployed image (3.57.1) that search asked for up to **999 results** and expanded `content.body.view`, so Confluence rendered the HTML body of every page in the `konviw` space (325 pages, ~3.5 MB per probe).
- The call took 11-19s in the task logs. The target state was `Target.Timeout` ("Request timed out").

## Evidence
- ECS stopped reason: "Task failed ELB health checks"; container exit code 137 (SIGKILL sent by ECS).
- Target health: `unhealthy`, reason `Target.Timeout`.
- Task logs: every probe logged `Health Status is Up` and `GET /wiki/rest/api/search 11-19s` with `999 maximum results`. No 401, connection or memory errors, so credentials, networking and memory were ruled out.
- Timing the exact query the app sends, from CloudShell:

| Query | Time | Response size |
|---|---|---|
| `limit=1` | 0.23s | 8 KB |
| `limit=999` | 10.8s | 3.5 MB |

- The same endpoint with a trivial call (`/space/konviw`) took 0.13s, so Atlassian and the network path were fast; the cost was the query.
- The image did not change when the failures started: `latest` was 3.57.1, pushed Sept 7, until the fix.

## Root cause
The health check depended on an expensive query whose cost grows with the amount of content in the `konviw` space. At some point around Sept 24 it crossed the 10s timeout. A health check should not render page bodies for hundreds of pages.

## Contributing factors
- **Probe cost scaled with content.** No result limit and a heavy `expand`.
- **Timeout margin was small.** The query was already close to 10s; any growth caused a failure.
- **Every probe hit Atlassian.** Multiple pm2 workers and load balancer nodes each ran their own search, with no caching and no sharing of concurrent checks.
- **The fix existed but was never deployed.** A `limit=1` fix was merged on Oct 4 (#704), but releases 3.57.2 and 3.57.3 were never pushed to ECR. CI creates the GitHub release but does not build or push the image, so dev kept running 3.57.1.

## What triggered it (not confirmed)
The exact trigger is unknown. Two correlations, neither verified:
- The e2e work around Sept 23-24 added test-copy pages to the Confluence space, which may have pushed the search over 10s. The page count was 325 when measured; I have no earlier count.
- The service's last ECS deployment was Sept 23 11:42 UTC, one day before the failures began. What it changed was not examined.

## Timeline (UTC)
- Sept 7: image 3.57.1 pushed to ECR as `latest`.
- Sept 23: last ECS deployment before the incident.
- Sept 24: failures begin.
- Oct 4: `limit=1` health fix merged (#704); not deployed.
- Oct 21: investigation starts; health check timeout raised from 10s to 29s, which stopped the loop.
- Oct 22: PR #705 merged and released as 3.57.5; CI Cypress step repaired by #706.
- Oct 22 06:16: image 3.57.5 pushed to ECR and the service redeployed by the existing pipeline (IAM user `iadc-portal`).
- Oct 22: rollout completed; 2 healthy targets; timeout restored to 10s.

## How it was fixed
1. **Mitigation:** raised the target group health check timeout from 10s to 29s (AWS change). This stopped the crash loop while the code fix was prepared.
2. **Code fix (#705, released as 3.57.5)**, in `ApiHealthService`:
   - the search uses `limit=1` (from #704);
   - a successful check is cached for 60s;
   - concurrent probes share one in-flight search;
   - each check is capped at 8s, below the load balancer timeout;
   - a timeout reports "up" only if the last success was under 5 minutes ago; real errors (e.g. 401) always report "down";
   - 13 unit tests cover caching, concurrency, errors, timeouts, recovery and late results.
3. **CI repair (#706):** the Cypress step had started failing with `Socket closed before the connection was established` on all PRs from Oct 21. Upgrading `cypress-io/github-action` from v2 to v7 fixed it.
4. **Deploy:** image 3.57.5 pushed to ECR as `latest` and the service redeployed on Oct 22.
5. **Restore:** timeout set back to 10s.

## Verification
- ECR `latest` = 3.57.5 (pushed Oct 22 06:16).
- ECS rollout `COMPLETED`, 2 of 2 tasks running.
- Logs show `with 1 maximum results` and search times of 345-480ms, down from 11-19s.
- Target group has exactly 2 targets, both `healthy`, with the timeout back at 10s.

## Follow-ups
- **Image release is not tied to GitHub releases.** The ECR push and ECS redeploy are done by a pipeline outside this repo (IAM user `iadc-portal`) that only runs when triggered. Decide how a new release reaches dev, so releases like 3.57.2 and 3.57.3 are not skipped.
- **Node 20 deprecation warning in CI:** PR #707 bumps `checkout`, `setup-node`, `cache`, `upload-artifact` and `actions-gh-pages` to Node 24 versions (checks pass; open).
- **Confirm the trigger.** Check what the Sept 23 deployment changed and when the space grew.
- **Consider a lighter probe.** The health check still expands page content for one result; a minimal Confluence call would avoid depending on page rendering at all.
- **Check the user-facing 999-result search.** It has the same ~11s cost per call outside the health check.
