import { Module } from '@nestjs/common';
import { GenerateEnvironmentCommand } from './generate-environment-command';
import { GenerateEnvironmentQuestions } from './generate-environment-questions';
import { GenerateReferralCodeCommand } from './generate-referral-code-command';
import { GenerateReferralCodeQuestions } from './generate-referral-code-questions';
import { loggingMiddleware, PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,

      prismaServiceOptions: {
        middlewares: [loggingMiddleware()],
        prismaOptions: { errorFormat: 'pretty' },
      },
    }),
  ],
  providers: [
    GenerateEnvironmentCommand,
    GenerateEnvironmentQuestions,
    GenerateReferralCodeCommand,
    GenerateReferralCodeQuestions,
  ],
})
export class CLIModule {}
