import { JiraService } from 'src/http/jira.service';
import { ContextService } from '../context/context.service';

export interface Step {
  (context: ContextService, jira?: JiraService): void | Promise<void>;
}
