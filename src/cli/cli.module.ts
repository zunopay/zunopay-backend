import { Module } from '@nestjs/common';
import { GenerateEnvironmentCommand } from './generate-environment-command';
import { GenerateEnvironmentQuestions } from './generate-environment-questions';

@Module({
  providers: [GenerateEnvironmentCommand, GenerateEnvironmentQuestions],
})
export class CLIModule {}
