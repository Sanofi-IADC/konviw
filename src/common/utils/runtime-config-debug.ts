import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function secretPresence(value: string | undefined): string {
  if (value == null || value === '') return 'unset';
  return `set (len=${value.length})`;
}

function envSet(name: string | undefined): 'set' | 'unset' {
  return name != null && name !== '' ? 'set' : 'unset';
}

/**
 * Logs non-secret diagnostics for debugging preview/CI vs local env mismatches.
 * Does not print tokens, passwords, usernames, or full Confluence URLs (host only).
 * Set RUNTIME_DEBUG=false to disable (e.g. noisy production logs).
 */
export function logRuntimeConfigDebug(logger: Logger, config: ConfigService): void {
  if (process.env.RUNTIME_DEBUG === 'false') {
    return;
  }
  const baseUrl = config.get<string | undefined>('confluence.baseURL');
  let confluenceHost = '(unset)';
  try {
    if (baseUrl) confluenceHost = new URL(baseUrl).hostname;
  } catch {
    confluenceHost = '(invalid CPV_CONFLUENCE_BASE_URL)';
  }

  const apiUser = config.get<string | undefined>('confluence.apiUsername');
  const apiToken = config.get<string | undefined>('confluence.apiToken');
  const basePathResolved = JSON.stringify(config.get('web.basePath'));
  const baseHostResolved = JSON.stringify(config.get('web.baseHost') ?? '');
  const absoluteBase = JSON.stringify(config.get('web.absoluteBasePath') ?? '');
  const privateLabel = config.get('konviw.private');
  const privateSet = privateLabel != null && privateLabel !== '' ? 'set' : 'unset';
  const jiraUser = config.get('jiraIssues.apiReaderUsername') ? 'set' : 'unset';
  const jiraTok = config.get('jiraIssues.apiReaderToken') ? 'set' : 'unset';

  logger.log('[runtime-debug] --- effective config (sanitized) ---');
  logger.log(
    `[runtime-debug] NODE_ENV=${process.env.NODE_ENV ?? '(unset)'} `
    + `PORT=${process.env.PORT ?? '(unset)'}`,
  );
  logger.log(
    `[runtime-debug] VERCEL_URL=${process.env.VERCEL_URL ?? '(unset)'} `
    + `VERCEL_ENV=${process.env.VERCEL_ENV ?? '(unset)'}`,
  );
  logger.log(
    `[runtime-debug] CPV_BASEPATH(raw)=${envSet(process.env.CPV_BASEPATH)} `
    + `web.basePath(resolved)=${basePathResolved}`,
  );
  logger.log(
    `[runtime-debug] CPV_BASEHOST(raw)=${envSet(process.env.CPV_BASEHOST)} `
    + `web.baseHost(resolved)=${baseHostResolved}`,
  );
  logger.log(`[runtime-debug] web.absoluteBasePath(resolved)=${absoluteBase}`);
  logger.log(`[runtime-debug] confluence base URL hostname=${confluenceHost}`);
  logger.log(`[runtime-debug] confluence.apiUsername ${secretPresence(apiUser)}`);
  logger.log(`[runtime-debug] confluence.apiToken ${secretPresence(apiToken)}`);
  logger.log(`[runtime-debug] konviw.private label ${privateSet}`);
  logger.log(`[runtime-debug] jira reader user ${jiraUser} token ${jiraTok}`);
  logger.log('[runtime-debug] --- end ---');
}
