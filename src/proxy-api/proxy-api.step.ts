import { ContextService } from '../context/context.service';
import { RadarContent } from './proxy-api.interface';

export interface Step {
  (context: ContextService): void | Promise<void>;
}
export interface StepRadar {
  (context: ContextService): RadarContent | Promise<RadarContent>;
}
