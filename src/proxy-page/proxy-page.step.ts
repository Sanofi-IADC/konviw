import { ContextService } from '../context/context.service';

export interface Step {
  (context: ContextService): void | Promise<void>;
}
