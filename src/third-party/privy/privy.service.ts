import { BadRequestException, Injectable } from '@nestjs/common';
import { PrivyClient } from '@privy-io/server-auth';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class PrivyService {
  private readonly client: PrivyClient;

  constructor(private readonly prisma: PrismaService) {
    this.client = new PrivyClient(
      process.env.PRIVY_APP_ID,
      process.env.PRIVY_APP_SECRET,
    );
  }

  async generateWallet(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user.emailVerifiedAt) {
      throw new BadRequestException(' User email is not verified ');
    }

    const privyUser = await this.client.importUser({
      linkedAccounts: [
        {
          type: 'email',
          address: user.email,
        },
      ],
      createSolanaWallet: true,
    });

    return privyUser;
  }
}
