import { Command, CommandRunner, InquirerService } from 'nest-commander';
import { PrismaService } from 'nestjs-prisma';
import { v4 as uuidv4 } from 'uuid';

interface Options {
  numberOfCodes: number;
  username?: string;
}

@Command({
  name: 'generate-referral-code',
  description: 'Generate referral codes for users',
})
export class GenerateReferralCodeCommand extends CommandRunner {
  constructor(
    private readonly inquirerService: InquirerService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async run(_: string[], options: Options): Promise<void> {
    options = await this.inquirerService.ask('generate-referral-code', options);
    await this.generateReferralCode(options);
  }

  generateReferralCode = async (options: Options) => {
    console.log('\n🏗️  Generating referral codes ...\n');
    const { numberOfCodes, username } = options;
    const codes: string[] = [];

    let n = numberOfCodes;
    while (n) {
      const uuid = uuidv4();
      const base36 = parseInt(uuid.replace(/-/g, '').slice(0, 12), 16).toString(
        36,
      );
      const code = base36.slice(0, 6).toUpperCase();
      codes.push(code);
      n -= 1;
    }

    if (username) {
      for (const refCode of codes) {
        const isCodeExists = await this.prismaService.referralCode.findUnique({
          where: { code: refCode },
        });
        if (isCodeExists) continue;

        await this.prismaService.referralCode.create({
          data: { code: refCode, referrer: { connect: { username } } },
        });
      }
    } else {
      const users = await this.prismaService.user.findMany({
        where: { emailVerifiedAt: { not: null } },
      });

      const len = Math.min(users.length, codes.length);
      await Promise.all(
        users.slice(0, len).map((user, i) =>
          this.prismaService.referralCode.create({
            data: {
              code: codes[i],
              referrer: { connect: { id: user.id } },
            },
          }),
        ),
      );
    }

    return;
  };
}
