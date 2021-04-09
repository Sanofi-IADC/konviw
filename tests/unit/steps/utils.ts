import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../../../src/config/configuration.test';
import { ContextService } from '../../../src/context/context.service';

export const createModuleRefForStep = async () =>
  Test.createTestingModule({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ContextService],
  }).compile();
