import { Cluster } from '@solana/web3.js';
import { Command, CommandRunner, InquirerService } from 'nest-commander';
import { generateSecret, createWallet } from '../utils/wallet';

interface Options {
  cluster: Cluster;
  heliusApiKey: string;
}

@Command({
  name: 'generate-environment',
  description: 'Generate necessary environment variables and wallets',
})
export class GenerateEnvironmentCommand extends CommandRunner {
  constructor(private readonly inquirerService: InquirerService) {
    super();
  }

  async run(_: string[], options: Options): Promise<void> {
    options = await this.inquirerService.ask('generate-environment', options);
    this.generateEnvironment(options);
  }

  generateEnvironment = (options: Options) => {
    console.log('\n🏗️  Generating new .env values...\n');

    const treasury = createWallet();

    const treasurySecretKey = `[${treasury.keypair.secretKey.toString()}]`;
    const signMessagePrompt =
      'Sign this message for authenticating with your wallet: ';

    console.log('\n⚠️  Save these values in a text file or sticky notes');
    console.log('----------------------------------------------------');
    console.log('Treasury address:', treasury.address);
    console.log('Treasury secret key:', treasurySecretKey);

    console.log('\n⚠️  Replace .env placeholder values with these below');
    console.log('----------------------------------------------------');
    console.log('JWT_ACCESS_SECRET', generateSecret(42));
    console.log('JWT_REFRESH_SECRET', generateSecret(42));
    console.log('SOLANA_CLUSTER', options.cluster);
    console.log('TREASURY_PRIVATE_KEY', treasury.encryptedPrivateKey);
    console.log('TREASURY_SECRET', treasury.secret);
    console.log('SIGN_MESSAGE', signMessagePrompt);
    console.log('HELIUS_API_KEY', options.heliusApiKey);

    return;
  };
}
