import { Injectable } from '@nestjs/common';
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

  async authenticateUser(email: string) {
    const user = await this.client.getUserByEmail(email);
    return { isAuthenticated: !!user.createdAt, wallet: user.wallet?.address };
  }

  async generateWallet(email: string) {
    const privyUser = await this.client.importUser({
      linkedAccounts: [
        {
          type: 'email',
          address: email,
        },
      ],
      createSolanaWallet: true,
    });

    return privyUser;
  }
}
