import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReceiverBankingDetail, ReceiverQrDetails } from './dto/types';
import { isNull } from 'lodash';
import {
  constructDigitalTransferTransaction,
  getCurrencyValue,
  getUSDCAccount,
  getUSDCUiAmount,
} from '../utils/payments';
import {
  TransferParams,
  TransferWithVpaParams,
} from './dto/transfer-params.dto';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  getConnection,
  getIdentitySignature,
  getTreasuryPublicKey,
} from '../utils/connection';
import { PrismaService } from 'nestjs-prisma';
import { SphereService } from '../third-party/sphere/sphere.service';
import { generateCommitment, generateProtectedVpa } from '../utils/hash';
import {
  MIN_COMPUTE_PRICE_IX,
  UPI_VPA_PREFIX,
  USDC_ADDRESS,
} from '../constants';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  TokenInvalidMintError,
  TokenInvalidOwnerError,
} from '@solana/spl-token';

/*
  TODO: 
  1. Register
  2. KYC
  3. Send
  4. Receive Notification
  5. Offramp
*/

export class PaymentService {
  private readonly connection: Connection;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sphereService: SphereService,
  ) {
    this.connection = getConnection();
  }

  async getReceiver(encodedQr: string): Promise<ReceiverBankingDetail> {
    const receiver = this.decodeQr(encodedQr);
    const commitment = generateCommitment(receiver.vpa);
    const registry = await this.prisma.keyWalletRegistry.findUnique({
      where: { commitment },
    });

    return {
      ...receiver,
      vpa: generateProtectedVpa(receiver.vpa),
      walletAddress: registry.walletAddress,
    };
  }

  async transferDigitalWithVpa(query: TransferWithVpaParams, userId: number) {
    const { vpa, amount } = query;
    const commitment = generateCommitment(vpa);
    const receiverRegistry = await this.prisma.keyWalletRegistry.findUnique({
      where: { commitment, merchant: { verification: { isNot: null } } },
    });

    if (!receiverRegistry) {
      throw new BadRequestException(
        " Receiver either haven't got verified or registered. Get them register to earn rewards ",
      );
    }

    return this.transferDigital(
      { walletAddress: receiverRegistry.walletAddress, amount },
      userId,
    );
  }

  async transferDigital(query: TransferParams, userId: number) {
    const { walletAddress: receiverWalletAddress, amount } = query;
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { registry: { select: { walletAddress: true } } },
    });

    // Construct transaction
    const senderWalletAddress = sender.registry.walletAddress;
    const transaction = await constructDigitalTransferTransaction(
      this.connection,
      senderWalletAddress,
      receiverWalletAddress,
      amount,
    );

    return transaction;
  }

  async getWalletBalance(walletAddress: string) {
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(USDC_ADDRESS);
    try {
      const tokenAddress = await getUSDCAccount(owner);
      const account = await this.getOrCreateTokenAccount(
        tokenAddress,
        owner,
        mint,
      );

      const balance = getUSDCUiAmount(Number(account.amount));
      return balance;
    } catch (_) {
      throw new InternalServerErrorException(' Failed to get wallet balance ');
    }
  }

  private async getOrCreateTokenAccount(
    tokenAddress: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
  ) {
    try {
      const tokenAccount = await getAccount(this.connection, tokenAddress);
      return tokenAccount;
    } catch (error: unknown) {
      if (
        error instanceof TokenAccountNotFoundError ||
        error instanceof TokenInvalidAccountOwnerError
      ) {
        try {
          const payer = getTreasuryPublicKey();
          const instruction = createAssociatedTokenAccountInstruction(
            payer,
            tokenAddress,
            owner,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          );

          const latestBlockhash =
            await this.connection.getLatestBlockhash('confirmed');
          const transactionMessage = new TransactionMessage({
            payerKey: payer,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: [MIN_COMPUTE_PRICE_IX, instruction],
          }).compileToV0Message([]);

          const transaction = new VersionedTransaction(transactionMessage);
          const signedTransaction = getIdentitySignature(transaction);

          const rawTransaction = Buffer.from(signedTransaction.serialize());
          console.log(rawTransaction.toString('base64'));

          const signature = await this.connection.sendTransaction(
            signedTransaction,
            { skipPreflight: true },
          );
          await this.connection.confirmTransaction({
            ...latestBlockhash,
            signature,
          });
        } catch (error: unknown) {}

        const account = await getAccount(this.connection, tokenAddress);
        if (!account.mint.equals(mint)) throw new TokenInvalidMintError();
        if (!account.owner.equals(owner)) throw new TokenInvalidOwnerError();

        return account;
      } else {
        throw error;
      }
    }
  }

  /*
    OnReceiving funds give a notification/email to receiver and offramnp the funds.
  */

  async offramp(userId: number, amount: number) {
    /*
      - Figure out the offramp provider required
      - Offramp usdc to reciever's bank using that

      For automatic offramps, User smart accounts to transfer to offramp provider's intermediary wallet.
    */
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user.region == 'EU') {
      const offrampTransaction = await this.sphereService.offramp(
        userId,
        amount,
      );
      return offrampTransaction;
    } else {
      throw new BadRequestException('Region not supported');
    }
  }

  private decodeQr(encodedQr: string) {
    const qr = decodeURI(encodedQr);

    if (this.isUPIQr(qr)) {
      return this.parseUpiQr(qr);
    } else if (this.isSEPAQr(qr)) {
      return this.parseSEPAQr(qr);
    }

    throw new NotFoundException('Unsupported QR code');
  }

  /*
        Example:
        Uses EPC069-12 standard: 

        BCD
        001
        1
        SCT
        SWIFT/BIC
        <Receiver Name> 
        HR09*******01
        EUR1

    */

  private isSEPAQr(qr: string): boolean {
    const sepaPattern = /^BCD\s*001\s*1\s*SCT/i;
    return sepaPattern.test(qr);
  }

  private isUPIQr(qr: string): boolean {
    return qr.startsWith(UPI_VPA_PREFIX);
  }

  private parseSEPAQr(qr: string): ReceiverQrDetails {
    const sepaDetails = qr
      .trimEnd()
      .split('\n')
      .map((detail) => detail.trim());

    const iban = sepaDetails.at(6).trim();
    const name = sepaDetails.at(5).trim();
    const currency = sepaDetails.at(-1);

    if (isNull(iban) || isNull(name) || isNull(currency)) {
      throw new BadRequestException('Invalid Qr');
    }

    const cleanCurrency = getCurrencyValue(currency);
    return {
      vpa: iban,
      name: name,
      currency: cleanCurrency,
    };
  }

  /*
      Eg: upi://pay?pa=merchant@upi&pn=MerchantName&mc=1234&tid=123456&tr=123456789&tn=Payment&am=100.00&cu=INR
  */
  private parseUpiQr(qr: string): ReceiverQrDetails {
    const qrUrl = new URL(qr);
    const upiId = qrUrl.searchParams.get('pa');
    const name = qrUrl.searchParams.get('pn');
    const amount = qrUrl.searchParams.get('am');
    const currency = qrUrl.searchParams.get('cu');

    if (isNull(upiId) || isNull(name) || isNull(amount) || isNull(currency)) {
      throw new BadRequestException('Invalid Qr');
    }

    const cleanCurrency = getCurrencyValue(currency);
    return {
      vpa: upiId,
      name,
      currency: cleanCurrency,
    };
  }
}

/* 
PIX QR Data
- use pix-utils to parse encoded qr 
// {
//   type: 'STATIC',
//   merchantCategoryCode: '0000',
//   transactionCurrency: '986',
//   countryCode: 'BR',
//   merchantName: 'Thales Ogliari',
//   merchantCity: 'SAO MIGUEL DO O',
//   pixKey: 'nubank@thalesog.com',
//   transactionAmount: 1,
//   infoAdicional: 'Gerado por Pix-Utils',
//   txid: '***',
//   toBRCode: [Function: toBRCode],
//   toImage: [Function: toImage]
// }
*/
